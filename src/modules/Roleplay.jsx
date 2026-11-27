// MODULE 3: Nhập vai phản xạ có áp lực thời gian (Timed Roleplay Simulator)
import { today } from '../lib/date'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSituations, findSituation, TIERS, TIER_IDS } from '../data'
import { EndlessCard } from '../components/Endless'
import { scheduleReview, nextDueLabel } from '../lib/review'
import { getState, update, useStore, logHistory } from '../lib/store'
import { speak, stopSpeaking } from '../lib/speech'
import { chunkUsed, similarity } from '../lib/text'
import { addReactivate, recordSpoken, vocabId } from '../lib/srs'
import { aiEnabled, roleplayTurn, roleplayFeedback } from '../lib/ai'
import { useHotkeys } from '../lib/hotkeys'
import { useMic, MicButton, LiveTranscript, TypeFallback } from '../components/Mic'
import { Elapsed } from '../components/Elapsed'
import { quickFix } from '../components/SentenceReview'
import { FreqGroups, PageHeader, SessionTimer, TierChip, Shortcuts } from '../components/ui'

export default function Roleplay({ id }) {
  const [mode, setMode] = useState(null)
  const sit = id && findSituation(id)
  if (sit && mode) return <Session sit={sit} mode={mode} onExit={() => setMode(null)} />
  if (sit) return <Intro sit={sit} onStart={setMode} />
  return <RoleplayList />
}

function RoleplayList() {
  const progress = useStore((s) => s.roleplay)
  const reviews = useStore((s) => s.reviews)
  const situations = useSituations()
  const t = today()
  return (
    <div>
      <PageHeader title="⏱️ Nhập vai phản xạ" subtitle="AI nói xong → đồng hồ đếm ngược buộc bạn BẮT ĐẦU nói. Bí từ thì bấm Gợi ý (chỉ 2–3 từ khoá)." right={<a className="btn-ghost" href="#/library">✨ Thêm tình huống</a>} />
      {TIER_IDS.map((tier) => (
        <div key={tier} className="mb-8">
          <div className="label mb-3">{TIERS[tier].label}</div>
          <FreqGroups items={situations.filter((s) => s.tier === tier)} render={(s) => (
              <a key={s.id} href={`#/roleplay/${s.id}`} className="card hover:border-indigo-300 hover:shadow transition flex items-center gap-4">
                <div className="text-3xl">{s.emoji}</div>
                <div className="flex-1">
                  <div className="font-semibold">{s.titleVi}</div>
                  <div className="text-xs text-slate-500">Vai AI: {s.roleplay.roleVi} ({s.roleplay.aiName}){s.cat ? ` · ${s.cat}` : ''}</div>
                </div>
                {reviews[`roleplay:${s.id}`]?.due <= t ? <span className="chip bg-rose-100 text-rose-700">📅 Cần ôn</span> : progress[s.id]?.count > 0 && <span className="chip bg-emerald-100 text-emerald-700">✓ {nextDueLabel(reviews[`roleplay:${s.id}`])}</span>}
              </a>
            )} />
          <EndlessCard kind="situation" tier={tier} label="nhập vai" total={situations.filter((s) => s.tier === tier).length} done={situations.filter((s) => s.tier === tier && progress[s.id]?.count > 0).length} hrefFor={(it) => `#/roleplay/${it.id}`} />
        </div>
      ))}
    </div>
  )
}

function Intro({ sit, onStart }) {
  const R = sit.roleplay
  const countdown = useStore((s) => s.settings.countdownSec)
  const ai = aiEnabled()
  return (
    <div>
      <PageHeader title={`${sit.emoji} ${sit.titleVi}`} right={<a className="btn-ghost" href="#/roleplay">← Danh sách</a>} />
      <div className="card space-y-4">
        <div className="flex items-center gap-2"><TierChip tier={sit.tier} /><span className="text-sm text-slate-500">AI đóng vai: <b>{R.aiName}</b> – {R.roleVi}</span></div>
        <div className="text-lg"><b>Mục tiêu:</b> {R.goalVi}</div>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Sau khi AI nói xong, bạn có <b>{countdown} giây</b> để BẮT ĐẦU nói (giữ nút 🎙️ hoặc phím <span className="kbd">Space</span>). Đừng dịch trong đầu – nói ý đơn giản trước, sửa sau.</li>
          <li>Chữ của AI bị ẩn mặc định (luyện tai). Bấm <span className="kbd">T</span> nếu thật sự cần xem.</li>
          <li>Bí từ: bấm <span className="kbd">H</span> để xem 2–3 từ khoá. Từ đã xem gợi ý sẽ vào danh sách “Từ cần kích hoạt lại”.</li>
          <li>Cuối buổi: chỉ sửa 3 lỗi diễn đạt quan trọng nhất.</li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary text-base px-6 py-3" onClick={() => onStart('script')}>▶ Kịch bản có sẵn ({R.turns.length} lượt)</button>
          <button className="btn-ghost text-base px-6 py-3" disabled={!ai} onClick={() => onStart('ai')} title={ai ? '' : 'Cần nhập API key trong Cài đặt'}>
            🤖 Hội thoại động với AI {ai ? '' : '(cần API key)'}
          </button>
        </div>
      </div>
    </div>
  )
}

const MAX_AI_TURNS = 6

function Session({ sit, mode, onExit }) {
  const R = sit.roleplay
  const settings = useStore((s) => s.settings)
  const [history, setHistory] = useState([]) // {who:'ai'|'me', text, turn, hint, hintUsed, late, reaction, used}
  const [turnIdx, setTurnIdx] = useState(0)
  const [phase, setPhase] = useState('ai') // ai | wait | recording | thinking | done
  const [showText, setShowText] = useState(false)
  const [hintShown, setHintShown] = useState(false)
  const [left, setLeft] = useState(settings.countdownSec)
  const [late, setLate] = useState(false)
  const [currentAi, setCurrentAi] = useState({ text: R.turns[0].ai, hint: R.turns[0].hint, model: R.turns[0].model })
  const [error, setError] = useState('')
  const waitStart = useRef(0)
  const reactionRef = useRef(null)
  const historyRef = useRef([])
  historyRef.current = history

  // AI nói
  const speakToken = useRef(0)
  const sayAi = useCallback(
    async (text) => {
      const token = ++speakToken.current
      stopSpeaking()
      setPhase('ai')
      await speak(text, { voiceName: settings.voiceA, voiceIndex: 0, rate: settings.speechRate })
      if (token !== speakToken.current) return // đã bị thay bằng lần phát khác
      setPhase((p) => (p === 'ai' ? 'wait' : p))
    },
    [settings]
  )

  useEffect(() => {
    setHistory([{ who: 'ai', text: currentAi.text }])
    sayAi(currentAi.text)
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Đếm ngược ép phản xạ
  useEffect(() => {
    if (phase !== 'wait') return
    setLeft(settings.countdownSec)
    setLate(false)
    waitStart.current = Date.now()
    const t = setInterval(() => {
      const remain = settings.countdownSec - Math.floor((Date.now() - waitStart.current) / 1000)
      setLeft(remain)
      if (remain <= 0) { setLate(true); clearInterval(t) }
    }, 200)
    return () => clearInterval(t)
  }, [phase, settings.countdownSec])

  const advance = async (userText) => {
    const used = (currentAi.hint || []).filter((h) => chunkUsed(h, userText))
    const me = { who: 'me', text: userText, hint: currentAi.hint, hintUsed: hintShown, late, reaction: reactionRef.current, used, model: currentAi.model }
    const h = [...historyRef.current, me]
    setHistory(h)
    setHintShown(false)
    setShowText(false)
    reactionRef.current = null

    // SRS: cụm từ có trong kho từ vựng
    const vocab = getState().vocab
    ;(currentAi.hint || []).forEach((k) => {
      if (vocab[vocabId(k)]) recordSpoken(k, { correct: chunkUsed(k, userText), aided: me.hintUsed })
    })

    const userTurns = h.filter((x) => x.who === 'me').length
    if (mode === 'script') {
      const next = turnIdx + 1
      if (next >= R.turns.length) return finish(h)
      setTurnIdx(next)
      const t = R.turns[next]
      setCurrentAi({ text: t.ai, hint: t.hint, model: t.model })
      setHistory([...h, { who: 'ai', text: t.ai }])
      sayAi(t.ai)
    } else {
      if (userTurns >= MAX_AI_TURNS) return finish(h)
      setPhase('thinking')
      try {
        const scenario = { ...R, titleVi: sit.titleVi }
        const r = await roleplayTurn({ scenario, history: h })
        if (r.end && userTurns >= 3) return finish([...h, { who: 'ai', text: r.reply }])
        setCurrentAi({ text: r.reply, hint: (r.hint || []).slice(0, 3), model: '' })
        setHistory([...h, { who: 'ai', text: r.reply }])
        sayAi(r.reply)
      } catch (e) {
        setError(String(e.message || e))
        finish(h)
      }
    }
  }

  const mic = useMic({
    enabled: phase === 'wait' || phase === 'recording',
    onStart: () => {
      if (reactionRef.current == null) reactionRef.current = (Date.now() - waitStart.current) / 1000
      setPhase('recording')
    },
    onFinal: (t) => advance(t),
  })
  // nếu thả phím mà không nhận được câu nào -> quay lại chờ
  useEffect(() => {
    if (phase === 'recording' && !mic.listening) {
      const t = setTimeout(() => setPhase((p) => (p === 'recording' ? 'wait' : p)), 1500)
      return () => clearTimeout(t)
    }
  }, [phase, mic.listening])

  const [feedback, setFeedback] = useState(null)
  const finish = async (h) => {
    setPhase('done')
    stopSpeaking()
    const mine = h.filter((x) => x.who === 'me')
    const stuck = [...new Set(mine.filter((m) => m.hintUsed).flatMap((m) => m.hint || []))]
    stuck.forEach((w) => addReactivate(w, { source: sit.id, example: mine.find((m) => m.hint?.includes(w))?.model || '' }))
    // Chấm từng câu bạn nói (không cần mạng): lỗi phổ biến + sửa theo ý bạn + câu mẫu
    const prevAi = (m) => { const i = h.indexOf(m); for (let k = i - 1; k >= 0; k--) if (h[k].who === 'ai') return h[k].text; return '' }
    const local = mine.map((m) => {
      const q = quickFix(m.text)
      return { said: m.text, prev: prevAi(m), errors: q.errors, fixed: q.corrected !== m.text ? q.corrected : '', better: m.model || '', why_vi: m.hint?.length && m.used.length < m.hint.length ? `Thử dùng: ${m.hint.filter((k) => !m.used.includes(k)).join(', ')}` : '' }
    })
    const reactions = mine.map((m) => m.reaction).filter((x) => x != null)
    const stats = {
      avgReaction: reactions.length ? (reactions.reduce((a, b) => a + b, 0) / reactions.length).toFixed(1) : '—',
      late: mine.filter((m) => m.late).length,
      hints: mine.filter((m) => m.hintUsed).length,
      turns: mine.length,
    }
    setFeedback({ corrections: local, stuck, stats, source: 'local' })
    update((s) => {
      const p = s.roleplay[sit.id] || (s.roleplay[sit.id] = { count: 0 })
      p.count += 1
      p.lastAt = Date.now()
    })
    logHistory('roleplay', `${sit.titleVi} · ${stats.turns} lượt, ${stats.late} lần chậm`)
    // Lịch ôn nhập vai: trừ điểm khi chậm phản xạ / phải xem gợi ý
    if (mine.length) {
      const grade = 5 - (stats.late / mine.length) * 2.5 - (stats.hints / mine.length) * 2.5
      scheduleReview('roleplay', sit.id, Math.max(1, grade), `${sit.emoji} ${sit.titleVi}`)
    }
    if (aiEnabled() && mine.length) {
      try {
        setFeedback((f) => ({ ...f, loading: true }))
        const r = await roleplayFeedback({ scenario: { ...R, titleVi: sit.titleVi }, history: h, stuckWords: stuck })
        ;(r.reactivate || []).forEach((w) => w?.en && addReactivate(w.en, { vi: w.vi, source: sit.id }))
        const turns = (r.turns || []).map((t, i) => ({ ...t, said: t.said || mine[i]?.text, prev: mine[i] ? prevAi(mine[i]) : '', errors: t.errors || [] }))
        setFeedback((f) => ({ ...f, loading: false, corrections: turns.length ? turns : f.corrections, extra: r.reactivate || [], summary: r.summary_vi, source: 'ai' }))
      } catch (e) {
        setFeedback((f) => ({ ...f, loading: false, aiError: String(e.message || e) }))
      }
    }
  }

  useHotkeys({
    r: () => phase !== 'done' && sayAi(currentAi.text),
    h: () => setHintShown(true),
    t: () => setShowText((x) => !x),
  })

  if (phase === 'done') return <Feedback sit={sit} fb={feedback} history={history} error={error} onExit={onExit} />

  const pct = Math.max(0, left / settings.countdownSec)
  return (
    <div>
      <PageHeader
        title={`${sit.emoji} ${sit.titleVi}`}
        subtitle={`Đang nói chuyện với ${R.aiName} (${R.roleVi}) · ${mode === 'ai' ? 'AI động' : `Lượt ${turnIdx + 1}/${R.turns.length}`}`}
        right={<div className="flex gap-2"><SessionTimer targetMin={30} /><button className="btn-ghost" onClick={() => finish(history)}>Kết thúc</button></div>}
      />
      <div className="card mb-4 space-y-3">
        {history.slice(0, -1).map((m, i) => (
          <div key={i} className={`flex ${m.who === 'me' ? 'justify-end' : ''}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.who === 'me' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
              {m.text}
              {m.who === 'me' && (m.late || m.hintUsed) && <div className="mt-1 text-[11px] opacity-80">{m.late && '⏰ chậm'} {m.hintUsed && '💡 có gợi ý'}</div>}
            </div>
          </div>
        ))}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{phase === 'ai' ? '🔊' : phase === 'thinking' ? '🤔' : '👤'}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{R.aiName}</div>
              {showText ? <div>{currentAi.text}</div> : <button onClick={() => setShowText(true)} className="text-left text-slate-400 text-sm italic">(Chữ đang ẩn – nghe bằng tai. Chạm vào đây hoặc <span className="kbd">T</span> để hiện, <span className="kbd">Ctrl</span> nghe lại)</button>}
            </div>
            <button className="btn-ghost" onClick={() => sayAi(currentAi.text)}>🔁</button>
          </div>
        </div>
      </div>

      <div className="card flex flex-col items-center gap-4">
        {phase === 'wait' && (
          <div className="w-full">
            <div className={`text-center text-4xl font-bold tabular-nums ${late ? 'text-rose-600 animate-pulse' : left <= 2 ? 'text-amber-600' : 'text-slate-800'}`}>
              {late ? 'Nói ngay!' : `${left}s`}
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div className={`h-2 rounded-full transition-all ${late ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${pct * 100}%` }} />
            </div>
            <div className="mt-1 text-center text-xs text-slate-500">Bắt đầu nói trước khi hết giờ – một câu đơn giản là đủ!</div>
          </div>
        )}
        {phase === 'ai' && <div className="text-sm text-slate-500">🔊 {R.aiName} đang nói… hãy nghe kỹ</div>}
        {phase === 'thinking' && <div className="text-sm text-slate-500">🤖 {R.aiName} đang nghĩ…<Elapsed /></div>}
        <MicButton mic={mic} />
        <div className="w-full"><LiveTranscript mic={mic} /></div>
        <div className="flex w-full flex-wrap items-center gap-3">
          {hintShown ? (
            <div className="flex flex-wrap gap-2">
              {(currentAi.hint || []).slice(0, 3).map((k) => <span key={k} className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">{k}</span>)}
            </div>
          ) : (
            <button className="btn-ghost" disabled={phase === 'ai' || phase === 'thinking'} onClick={() => setHintShown(true)}>💡 Gợi ý nhanh <span className="kbd">H</span></button>
          )}
          <div className="flex-1 min-w-[200px]">{(phase === 'wait' || phase === 'recording') && <TypeFallback onSubmit={(t) => { if (reactionRef.current == null) reactionRef.current = (Date.now() - waitStart.current) / 1000; advance(t) }} placeholder="Không dùng được mic? Gõ câu trả lời…" />}</div>
        </div>
      </div>
      {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
      <div className="mt-4"><Shortcuts items={[['Space (giữ)', 'nói'], ['H', 'gợi ý'], ['Ctrl', 'nghe lại'], ['T', 'hiện/ẩn chữ']]} /></div>
    </div>
  )
}

function Feedback({ sit, fb, history, error, onExit }) {
  if (!fb) return null
  return (
    <div>
      <PageHeader title="📋 Nhận xét sau hội thoại" subtitle={sit.titleVi} right={<div className="flex gap-2"><button className="btn-ghost" onClick={onExit}>Luyện lại</button><a className="btn-primary" href="#/roleplay">Tình huống khác</a></div>} />
      <div className="grid gap-3 sm:grid-cols-4 mb-4">
        {[
          ['Lượt nói', fb.stats.turns],
          ['Phản xạ TB', `${fb.stats.avgReaction}s`],
          ['Lần chậm', fb.stats.late],
          ['Lần dùng gợi ý', fb.stats.hints],
        ].map(([k, v]) => (
          <div key={k} className="card !p-4"><div className="label">{k}</div><div className="text-2xl font-bold">{v}</div></div>
        ))}
      </div>
      {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}
      <div className="card mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="label">Chấm từng câu bạn nói {fb.source === 'ai' ? '(AI chấm kỹ)' : '(chấm nhanh – AI sẽ thay khi xong)'}</div>
          {fb.loading && <span className="text-xs text-slate-500">🤖 AI đang phân tích…<Elapsed /></span>}
        </div>
        {fb.summary && <div className="text-sm text-indigo-700">{fb.summary}</div>}
        {fb.aiError && <div className="text-sm text-rose-600">AI lỗi: {fb.aiError}</div>}
        {fb.corrections.length === 0 && <div className="text-sm text-slate-500">Không có lượt nói nào để nhận xét.</div>}
        {fb.corrections.map((c, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2 text-sm">
            {c.prev && <div className="text-xs text-slate-500">💬 {sit.roleplay.aiName}: “{c.prev}”</div>}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex-1"><span className="label !text-rose-500">Câu bạn nói: </span><MarkedLine text={c.said} errors={c.errors || []} /></div>
              {c.score != null && <span className={`chip ${c.score >= 8 ? 'bg-emerald-100 text-emerald-800' : c.score >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}`}>{c.score}/10</span>}
            </div>
            {c.verdict_vi && <div className="text-slate-700">🧑‍🏫 {c.verdict_vi}</div>}
            {(c.errors || []).length > 0 && (
              <div className="space-y-1">
                {c.errors.map((e, j) => (
                  <div key={j} className="rounded-lg bg-rose-50 p-2">
                    <span className="text-rose-700 line-through decoration-rose-300">{e.wrong}</span> → <b className="text-emerald-700">{e.fix}</b>
                    <div className="text-slate-600">💡 {e.why_vi || e.why}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-amber-50 p-3">
                <div className="label !text-amber-700 mb-1">✏️ Sửa theo ý bạn</div>
                {c.fixed ? <>{c.fixed} <button className="text-slate-400 hover:text-indigo-600" onClick={() => speak(c.fixed)}>🔈</button></> : <span className="text-slate-500">{fb.source === 'ai' ? 'Câu của bạn đã đúng ngữ pháp.' : 'Máy không thấy lỗi phổ biến (AI sẽ chấm kỹ hơn).'}</span>}
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <div className="label !text-emerald-600 mb-1">🗣️ Tự nhiên hơn</div>
                {c.better ? <>{c.better} <button className="text-slate-400 hover:text-indigo-600" onClick={() => speak(c.better)}>🔈</button></> : '—'}
                {c.why_vi && <div className="mt-1 text-xs text-slate-500">{c.why_vi}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card mb-4">
        <div className="label mb-2">Đã thêm vào “Từ cần kích hoạt lại”</div>
        <div className="flex flex-wrap gap-2">
          {[...fb.stuck, ...(fb.extra || []).map((w) => w.en)].length === 0 ? (
            <span className="text-sm text-slate-500">Không bí từ nào – tuyệt vời! 🎉</span>
          ) : (
            [...new Set([...fb.stuck, ...(fb.extra || []).map((w) => w.en)])].map((w) => <span key={w} className="chip bg-rose-100 text-rose-700">{w}</span>)
          )}
        </div>
        <a href="#/recall" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">→ Luyện ngay ở Module 1 (Từ cần kích hoạt lại)</a>
      </div>
      <details className="card">
        <summary className="cursor-pointer text-sm font-semibold">Xem lại toàn bộ hội thoại</summary>
        <div className="mt-3 space-y-1 text-sm">
          {history.map((m, i) => <div key={i}><b>{m.who === 'ai' ? sit.roleplay.aiName : 'Bạn'}:</b> {m.text}</div>)}
        </div>
      </details>
    </div>
  )
}

function MarkedLine({ text, errors }) {
  const spans = errors.map((e) => { const i = e.offset ?? text.toLowerCase().indexOf(String(e.wrong || '').toLowerCase()); return { ...e, i, len: (e.wrong || '').length } }).filter((e) => e.i >= 0 && e.len).sort((a, b) => a.i - b.i)
  const out = []
  let pos = 0
  spans.forEach((e, k) => {
    if (e.i < pos) return
    out.push(<span key={'t' + k}>{text.slice(pos, e.i)}</span>)
    out.push(<span key={'e' + k} className="rounded bg-rose-100 px-0.5 text-rose-700 underline decoration-wavy decoration-rose-400">{text.slice(e.i, e.i + e.len)}</span>)
    pos = e.i + e.len
  })
  out.push(<span key="end">{text.slice(pos)}</span>)
  return <span>“{out}”</span>
}
