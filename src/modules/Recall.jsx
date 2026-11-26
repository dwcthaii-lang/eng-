// MODULE 1: Từ vựng kích hoạt chủ động (Active Recall & Chunking)
import { useCallback, useMemo, useState } from 'react'
import { getRecallPrompts, TIERS } from '../data'
import { scheduleReview, isLessonDue, newStartedToday } from '../lib/review'
import { ChunkCluster } from '../components/ChunkCluster'
import { getState, update, useStore, logHistory } from '../lib/store'
import { isDue, recordSpoken, markHeard, vocabId } from '../lib/srs'
import { localScore, chunkUsed } from '../lib/text'
import { speak } from '../lib/speech'
import { SentenceReview } from '../components/SentenceReview'
import { SentenceVi } from '../components/SentenceVi'
import { useHotkeys } from '../lib/hotkeys'
import { useMic, MicButton, LiveTranscript, TypeFallback } from '../components/Mic'
import { PageHeader, SessionTimer, TierChip, Shortcuts, Progress } from '../components/ui'
import { today } from '../lib/date'

function buildQueue({ tier, mode, size }) {
  const s = getState()
  const t = today()
  if (mode === 'reactivate') {
    return Object.values(s.vocab)
      .filter((v) => v.reactivate && v.stage !== 'mastered')
      .slice(0, size)
      .map((v) => ({ type: 'word', id: 'w-' + v.id, word: v }))
  }
  const prompts = getRecallPrompts(s).filter((p) => tier === 'all' || String(p.tier) === String(tier))
  const seen = (p) => (s.recall[p.id]?.attempts || 0) > 0
  // Đến hạn ôn: theo lịch của thẻ HOẶC có cụm từ đến hạn
  const due = prompts.filter((p) => seen(p) && (isLessonDue('recall', p.id, s) || p.chunks.some((c) => { const v = s.vocab[vocabId(c.en)]; return v && isDue(v, t) })))
  // Giới hạn thẻ MỚI mỗi ngày để không học dồn mà quên ôn
  const newLeft = mode === 'review' ? 0 : Math.max(0, s.settings.newRecallPerDay - newStartedToday('recall', s))
  const fresh = prompts.filter((p) => !seen(p)).slice(0, newLeft)
  // Ưu tiên ôn bài đến hạn, sau đó thêm tình huống mới (Tầng 1 trước)
  fresh.sort((a, b) => a.tier - b.tier)
  const reactivateWords = Object.values(s.vocab).filter((v) => v.reactivate && v.stage !== 'mastered').slice(0, 2)
  const q = [
    ...due.map((p) => ({ type: 'prompt', id: p.id, prompt: p, review: true })),
    ...reactivateWords.map((v) => ({ type: 'word', id: 'w-' + v.id, word: v })),
    ...fresh.map((p) => ({ type: 'prompt', id: p.id, prompt: p, review: false })),
  ]
  // nếu không có gì đến hạn và hết lượt học mới: luyện thêm tình huống điểm thấp (không bắt buộc)
  if (!q.length && mode !== 'review') {
    prompts
      .slice()
      .sort((a, b) => (s.recall[a.id]?.lastScore ?? 0) - (s.recall[b.id]?.lastScore ?? 0))
      .forEach((p) => q.push({ type: 'prompt', id: p.id, prompt: p, review: true }))
  }
  return q.slice(0, size)
}

function maskWord(en) {
  return en.split(' ').map((w) => w[0] + w.slice(1).replace(/[a-zA-Z]/g, '_')).join(' ')
}

export default function Recall({ mode: routeMode }) {
  const settings = useStore((s) => s.settings)
  const reactivateCount = useStore((s) => Object.values(s.vocab).filter((v) => v.reactivate && v.stage !== 'mastered').length)
  const [tier, setTier] = useState('all')
  const [queue, setQueue] = useState(() => (routeMode === 'review' ? buildQueue({ tier: 'all', mode: 'review', size: 50 }) : null))
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState([])

  const start = (mode) => {
    setQueue(buildQueue({ tier, mode, size: settings.recallSessionSize }))
    setIdx(0)
    setResults([])
  }

  if (!queue) {
    return (
      <div>
        <PageHeader title="🗣️ Từ vựng kích hoạt chủ động" subtitle="Đọc tình huống tiếng Việt → BẤM MIC và nói thành câu hoàn chỉnh với các cụm từ (chunks). Không có flashcard Anh–Việt." />
        <div className="card space-y-5">
          <div>
            <div className="label mb-2">Chủ đề</div>
            <div className="flex flex-wrap gap-2">
              {[['all', 'Cả hai tầng'], ['1', TIERS[1].label], ['2', TIERS[2].label]].map(([k, l]) => (
                <button key={k} onClick={() => setTier(k)} className={tier === k ? 'btn-primary' : 'btn-ghost'}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary text-base px-6 py-3" onClick={() => start('session')}>▶ Bắt đầu phiên 20 phút</button>
            <button className="btn-ghost text-base px-6 py-3" onClick={() => start('review')}>📅 Chỉ ôn thẻ đến hạn</button>
            <button className="btn-ghost text-base px-6 py-3" disabled={!reactivateCount} onClick={() => start('reactivate')}>
              🔁 Từ cần kích hoạt lại ({reactivateCount})
            </button>
          </div>
          <p className="text-sm text-slate-500">
            Mỗi phiên: thẻ đến hạn ôn được xếp trước, sau đó tối đa {settings.newRecallPerDay} thẻ mới/ngày (đổi trong Cài đặt). Lần đầu gặp tình huống bạn được xem gợi ý cụm từ. Ở các lần ôn sau, gợi ý bị ẩn – tự nói đúng mà không bấm gợi ý ở 3 ngày khác nhau thì cụm từ được tính là <b>Thành thạo</b>.
          </p>
        </div>
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div>
        <PageHeader title="🗣️ Từ vựng kích hoạt chủ động" />
        <div className="card space-y-3">
          <div className="text-lg font-semibold">✅ Không còn thẻ nào đến hạn ôn.</div>
          <p className="text-sm text-slate-500">Bạn đã ôn xong hoặc đã học đủ số thẻ mới hôm nay. Hãy chuyển sang bài nghe hay nhập vai.</p>
          <div className="flex gap-2"><button className="btn-ghost" onClick={() => setQueue(null)}>← Quay lại</button><a className="btn-primary" href="#/review">Xem mục Ôn tập</a></div>
        </div>
      </div>
    )
  }

  if (idx >= queue.length) {
    const avg = results.length ? (results.reduce((a, r) => a + r.score, 0) / results.length).toFixed(1) : 0
    return (
      <div>
        <PageHeader title="🎉 Xong phiên luyện!" subtitle={`${results.length} thẻ · điểm trung bình ${avg}/10`} />
        <div className="card space-y-2">
          {results.map((r, i) => (
            <div key={i} className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
              <span className="text-slate-600">{r.title}</span>
              <span className={r.score >= 7 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{r.score}/10</span>
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <button className="btn-primary" onClick={() => start('session')}>Phiên mới</button>
            <a className="btn-ghost" href="#/listening">Sang Module 2: Nghe →</a>
          </div>
        </div>
      </div>
    )
  }

  const item = queue[idx]
  return (
    <div>
      <PageHeader
        title="🗣️ Từ vựng kích hoạt chủ động"
        right={<SessionTimer targetMin={20} />}
      />
      <div className="mb-4 flex items-center gap-3 text-sm text-slate-500">
        <span>Thẻ {idx + 1}/{queue.length}</span>
        <div className="flex-1"><Progress value={idx} max={queue.length} /></div>
        <button className="btn-ghost" onClick={() => setQueue(null)}>Thoát</button>
      </div>
      <RecallCard
        key={item.id}
        item={item}
        settings={settings}
        onDone={(r) => {
          setResults((x) => [...x, r])
          setIdx((i) => i + 1)
        }}
      />
    </div>
  )
}

function RecallCard({ item, settings, onDone }) {
  const isWord = item.type === 'word'
  const p = item.prompt
  const firstTime = !isWord && !item.review
  const chunks = isWord ? [item.word.en] : p.chunks.map((c) => c.en)
  const [hintShown, setHintShown] = useState(firstTime)
  const [answer, setAnswer] = useState(null) // { transcript, local, ai, aiError, loading }
  const [recorded, setRecorded] = useState(false)

  const evaluate = useCallback(
    async (transcript) => {
      const local = localScore({ transcript, chunks, model: isWord ? '' : p.model })
      setAnswer({ transcript, local, review: undefined })
      if (!recorded) {
        setRecorded(true)
        chunks.forEach((c) => recordSpoken(c, { correct: chunkUsed(c, transcript), aided: hintShown }))
        if (!isWord) {
          update((s) => {
            const r = s.recall[p.id] || (s.recall[p.id] = { attempts: 0 })
            r.attempts += 1
            r.lastScore = local.score
            r.bestScore = Math.max(r.bestScore || 0, local.score)
            r.lastAt = Date.now()
          })
          // Lịch ôn của thẻ: điểm 0–10 -> mức 0–5; ôn mà phải xem gợi ý thì tối đa mức 3
          let grade = Math.round(local.score / 2)
          if (item.review && hintShown) grade = Math.min(grade, 3)
          scheduleReview('recall', p.id, grade, `${p.emoji} ${p.titleVi}`)
        }
      }
    },
    [chunks, hintShown, isWord, p, recorded]
  )

  const mic = useMic({ onFinal: evaluate })

  const playModel = () => {
    const text = isWord ? item.word.example || item.word.en : p.model
    if (!isWord) markHeard(chunks)
    speak(text, { voiceName: settings.voiceA, rate: settings.speechRate })
  }
  const next = () => {
    if (!answer) return
    const score = answer.review ?? answer.local.score
    logHistory('recall', `${isWord ? item.word.en : p.titleVi}: ${score}/10`)
    onDone({ title: isWord ? item.word.en : `${p.emoji} ${p.titleVi}`, score })
  }

  useHotkeys({ h: () => setHintShown(true), r: () => answer && playModel(), Enter: next })

  return (
    <div className="space-y-4">
      <div className="card">
        {isWord ? (
          <>
            <div className="mb-2 flex items-center gap-2"><span className="chip bg-rose-100 text-rose-700">Từ cần kích hoạt lại</span></div>
            <div className="text-xl font-semibold">Nói một câu hoàn chỉnh dùng cụm từ có nghĩa: “{item.word.vi || '…'}”</div>
            <div className="mt-2 text-slate-500">Gợi ý chữ cái: <span className="font-mono text-lg tracking-wider">{maskWord(item.word.en)}</span></div>
          </>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <TierChip tier={p.tier} />
              <span className="text-sm text-slate-500">{p.emoji} {p.titleVi}</span>
              {item.review ? <span className="chip bg-amber-100 text-amber-800">Ôn tập · gợi ý ẩn</span> : <span className="chip bg-slate-100 text-slate-600">Tình huống mới</span>}
            </div>
            <div className="text-xl font-semibold leading-relaxed">{p.vi}</div>
            <div className="mt-2 text-sm text-slate-500">📍 {p.context}</div>
          </>
        )}

        <div className="mt-4">
          {hintShown ? (
            <div className="flex flex-wrap gap-2">
              {(isWord ? [{ en: item.word.en, vi: item.word.vi }] : p.chunks).map((c) => {
                const used = answer && chunkUsed(c.en, answer.transcript)
                return (
                  <span key={c.en} className={`rounded-lg border px-3 py-1.5 text-sm ${used ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : answer ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-indigo-200 bg-indigo-50 text-indigo-800'}`}>
                    <b>{c.en}</b> <span className="text-slate-500">· {c.vi}</span>
                  </span>
                )
              })}
            </div>
          ) : (
            <button className="btn-ghost" onClick={() => setHintShown(true)}>💡 Xem cụm từ gợi ý <span className="kbd">H</span> <span className="text-xs text-slate-400">(lần này sẽ không tính “tự nói”)</span></button>
          )}
        </div>
      </div>

      <div className="card flex flex-col items-center gap-4">
        <MicButton mic={mic} label={answer ? 'Giữ để nói lại' : 'Giữ để nói'} />
        <div className="w-full"><LiveTranscript mic={mic} /></div>
        <div className="w-full"><TypeFallback onSubmit={evaluate} /></div>
      </div>

      {answer && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="label">Kết quả</div>
            <div className="text-2xl font-bold" title="Điểm cả câu: cụm từ + ngữ pháp + độ tự nhiên">{answer.review === null ? <span className="text-base text-indigo-500 animate-pulse">AI đang chấm…</span> : answer.review ?? answer.local.score}<span className="text-base text-slate-400">/10</span></div>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">Bạn nói: </span>“{answer.transcript}”
          </div>
          <div className="text-sm">
            ✅ Đã dùng: {answer.local.used.length ? answer.local.used.join(', ') : '—'}
            {answer.local.missing.length > 0 && <span className="ml-3 text-rose-600">✗ Chưa dùng: {answer.local.missing.join(', ')}</span>}
          </div>
          <SentenceReview
            key={answer.transcript}
            transcript={answer.transcript}
            chunks={chunks}
            model={isWord ? '' : p.model}
            situationVi={isWord ? `Dùng cụm “${item.word.en}” (${item.word.vi || ''}) trong một câu` : p.vi}
            context={isWord ? '' : p.context}
            onScore={(sc) => setAnswer((a) => (a && a.transcript === answer.transcript ? { ...a, review: sc } : a))}
          />
          {!isWord && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <span className="text-slate-500">Câu mẫu: </span>
              <b>{p.model}</b> <button onClick={playModel} className="text-slate-400 hover:text-indigo-600">🔈</button>
              <SentenceVi en={p.model} vi={p.modelVi} className="mt-1 !text-sm" />
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button className="btn-ghost" onClick={playModel}>🔊 Nghe câu mẫu <span className="kbd">R</span></button>
            <button className="btn-primary" onClick={next}>Tiếp theo <span className="kbd !bg-indigo-500 !text-white !border-indigo-400">Enter</span></button>
          </div>
          <details className="rounded-xl bg-slate-50 p-3" open={!item.review}>
            <summary className="cursor-pointer text-sm font-semibold">📚 Học theo cụm: đồng nghĩa · trái nghĩa · ví dụ văn nói</summary>
            <div className="mt-3 grid gap-2">
              {(isWord ? [{ en: item.word.en, vi: item.word.vi }] : p.chunks).map((c) => <ChunkCluster key={c.en} en={c.en} vi={c.vi} compact />)}
            </div>
          </details>
          <p className="text-xs text-slate-400">Mẹo: nghe câu mẫu rồi nhại lại 1–2 lần (giữ Space) trước khi qua thẻ mới. Chỉ lần nói đầu tiên được tính vào SRS.</p>
        </div>
      )}
      <Shortcuts items={[['Space (giữ)', 'nói'], ['H', 'gợi ý'], ['R', 'nghe câu mẫu'], ['Enter', 'thẻ tiếp']]} />
    </div>
  )
}
