// LỘ TRÌNH TỪ VỰNG đời sống → IELTS 6.5
// Cấp 1–4, mỗi cấp nhiều chủ đề. Học: nghe → nhại câu ví dụ → nói lại trong câu (che từ).
// MỌI từ đều vào lịch ôn lặp lại ngắt quãng (kho từ) + mỗi chủ đề có lịch ôn riêng.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { LEVELS, useUnits, getUnits } from '../data/course'
import { getState, update, useStore, logHistory } from '../lib/store'
import { seedVocab, markHeard, recordSpoken, isDue, vocabId, STAGES } from '../lib/srs'
import { scheduleReview, nextDueLabel } from '../lib/review'
import { chunkUsed, normalize, stem, similarity } from '../lib/text'
import { speak, stopSpeaking } from '../lib/speech'
import { aiEnabled, generateUnitItems, generateUnit } from '../lib/ai'
import { capDueVocab } from '../lib/srs'
import { useHotkeys } from '../lib/hotkeys'
import { today } from '../lib/date'
import { useMic, MicButton, LiveTranscript, TypeFallback } from '../components/Mic'
import { ChunkCluster } from '../components/ChunkCluster'
import { SentenceVi } from '../components/SentenceVi'
import { SentenceReview } from '../components/SentenceReview'
import { translateText, translateNatural } from '../lib/dict'
const exCtx = (i) => `Independent everyday spoken example sentences for learning vocabulary (topic: ${i.unitId}). Translate each sentence on its own; casual friendly tone.`
import { Elapsed } from '../components/Elapsed'
import { PageHeader, Progress, Shortcuts, SessionTimer, StageChip } from '../components/ui'

const src = (unitId) => `course:${unitId}`
const BATCH = 5

function unitStats(unit, vocab) {
  const c = { total: unit.items.length, seen: 0, spoken: 0, mastered: 0, due: 0 }
  unit.items.forEach((it) => {
    const v = vocab[vocabId(it.en)]
    if (!v || !v.sources.includes(src(unit.id))) return
    c.seen++
    if (v.stage === 'spoken' || v.stage === 'mastered') c.spoken++
    if (v.stage === 'mastered') c.mastered++
    if (isDue(v)) c.due++
  })
  return c
}

export function courseDueItems(state = getState(), { all = false } = {}) {
  const units = getUnits(state)
  const out = []
  units.forEach((u) => u.items.forEach((it) => {
    const v = state.vocab[vocabId(it.en)]
    if (v && v.sources.includes(src(u.id)) && isDue(v)) out.push({ ...it, unitId: u.id })
  }))
  const uniq = [...new Map(out.map((x) => [x.en, x])).values()]
  return all ? uniq : capDueVocab(uniq) // chế độ trả nợ: mỗi ngày tối đa N từ, phần còn lại để dành
}

function levelUnlocked(level, units, vocab, manual) {
  if (level <= 1 || level <= manual) return true
  const prev = units.filter((u) => u.level === level - 1)
  const tot = prev.reduce((a, u) => a + u.items.length, 0)
  const spoken = prev.reduce((a, u) => a + unitStats(u, vocab).spoken, 0)
  return tot > 0 && spoken / tot >= 0.7
}

export default function Course({ unitId, mode }) {
  const units = useUnits()
  if (unitId === 'review') return <Practice key="review" title="🔁 Ôn từ vựng đến hạn" items={courseDueItems()} reviewMode />
  const unit = units.find((u) => u.id === unitId)
  if (unit && mode === 'review') {
    const vocab = getState().vocab
    const learned = unit.items.filter((i) => vocab[vocabId(i.en)]?.sources.includes(src(unit.id)))
    return <Practice key={unit.id + 'r'} title={`🔁 Ôn chủ đề: ${unit.emoji} ${unit.titleVi}`} unit={unit} items={learned.map((i) => ({ ...i, unitId: unit.id }))} reviewMode />
  }
  if (unit) return <UnitPlayer key={unit.id} unit={unit} />
  return <Overview units={units} />
}

function Overview({ units }) {
  const vocab = useStore((s) => s.vocab)
  const reviews = useStore((s) => s.reviews)
  const settings = useStore((s) => s.settings)
  const due = courseDueItems()
  const learnedToday = Object.values(vocab).filter((v) => v.learnedAt === today()).length
  const t = today()

  return (
    <div>
      <PageHeader title="🧭 Lộ trình từ vựng: Đời sống → IELTS 6.5" subtitle="Từ và cụm từ người bản xứ dùng hằng ngày, chia theo chủ đề và cấp độ. Học xong một cấp thì mở cấp khó hơn. Mọi từ đều được nhắc ôn tự động." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <a href="#/course/review" className={`card !p-4 ${due.length ? 'border-rose-300 bg-rose-50 hover:bg-rose-100' : ''}`}>
          <div className="text-sm text-slate-500">Cần ôn hôm nay</div>
          <div className={`text-3xl font-bold ${due.length ? 'text-rose-600' : 'text-emerald-600'}`}>{due.length} từ</div>
          {due.length > 0 && <div className="text-sm text-rose-700">Ôn trước khi học từ mới →</div>}
        </a>
        <div className="card !p-4">
          <div className="text-sm text-slate-500">Từ mới hôm nay</div>
          <div className="text-3xl font-bold">{learnedToday}<span className="text-base text-slate-400">/{settings.newWordsPerDay}</span></div>
          <Progress value={learnedToday} max={settings.newWordsPerDay} />
        </div>
        <div className="card !p-4">
          <div className="text-sm text-slate-500">Tổng từ đã học / thành thạo</div>
          <div className="text-3xl font-bold">
            {units.reduce((a, u) => a + unitStats(u, vocab).seen, 0)}
            <span className="text-base text-slate-400"> / {units.reduce((a, u) => a + unitStats(u, vocab).mastered, 0)} thành thạo</span>
          </div>
          <div className="text-xs text-slate-500">trên {units.reduce((a, u) => a + u.items.length, 0)} từ trong lộ trình</div>
        </div>
      </div>

      {[1, 2, 3, 4].map((lv) => {
        const L = LEVELS[lv]
        const list = units.filter((u) => u.level === lv)
        const open = levelUnlocked(lv, units, vocab, settings.courseUnlocked)
        const tot = list.reduce((a, u) => a + u.items.length, 0)
        const spoken = list.reduce((a, u) => a + unitStats(u, vocab).spoken, 0)
        return (
          <div key={lv} className={`mb-6 ${open ? '' : 'opacity-70'}`}>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="font-bold">{open ? '' : '🔒 '}{L.name} <span className="chip bg-indigo-50 text-indigo-700 ml-1">{L.cefr} · {L.band}</span></div>
                <div className="text-sm text-slate-500">{L.desc}</div>
              </div>
              <div className="w-48 text-right text-xs text-slate-500">
                Đã nói được {spoken}/{tot}
                <Progress value={spoken} max={tot} color="bg-emerald-500" />
              </div>
            </div>
            {!open && (
              <div className="mb-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
                Mở khoá khi bạn nói được 70% từ của cấp trước.{' '}
                <button className="text-indigo-600 underline" onClick={() => update((s) => { s.settings.courseUnlocked = Math.max(s.settings.courseUnlocked, lv) })}>Mở khoá sớm (đã biết phần trước)</button>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((u) => {
                const st = unitStats(u, vocab)
                const rv = reviews[`unit:${u.id}`]
                const unitDue = rv && rv.due <= t
                const body = (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{u.emoji}</span>
                      <div className="flex-1">
                        <div className="font-semibold leading-tight">{u.titleVi}</div>
                        <div className="text-xs text-slate-500">{u.title} · {u.items.length} từ</div>
                      </div>
                      {unitDue ? <span className="chip bg-rose-100 text-rose-700">📅 Ôn</span> : rv ? <span className="chip bg-emerald-100 text-emerald-700">{nextDueLabel(rv).replace('Ôn lại ', '')}</span> : null}
                    </div>
                    <div className="mt-2"><Progress value={st.spoken} max={st.total} color="bg-emerald-500" /></div>
                    <div className="mt-1 text-[11px] text-slate-500">{st.seen}/{st.total} đã học · {st.mastered} thành thạo{st.due ? ` · ${st.due} cần ôn` : ''}</div>
                  </>
                )
                return open ? (
                  <a key={u.id} href={unitDue ? `#/course/${u.id}/review` : `#/course/${u.id}`} className="card !p-4 hover:border-indigo-300 hover:shadow transition">{body}</a>
                ) : (
                  <div key={u.id} className="card !p-4">{body}</div>
                )
              })}
            </div>
            {open && <NewUnit level={lv} units={units} />}
          </div>
        )
      })}
    </div>
  )
}

// Tạo chủ đề từ vựng mới bằng AI – lộ trình không bao giờ hết
function NewUnit({ level, units }) {
  const [topic, setTopic] = useState('')
  const [st, setSt] = useState(null)
  if (!aiEnabled()) return null
  const create = async () => {
    setSt({ busy: true })
    try {
      const r = await generateUnit({ level, levelName: `${LEVELS[level].cefr} / ${LEVELS[level].band}`, topicVi: topic, avoid: units.map((u) => `${u.titleVi} (${u.title})`) })
      const items = (r.items || []).filter((i) => i.en && i.vi && i.ex).map((i) => ({ en: String(i.en), vi: String(i.vi), ex: String(i.ex) }))
      if (items.length < 5) throw new Error('AI trả về quá ít từ, thử lại nhé.')
      const unit = { id: `cu-${Date.now().toString(36)}`, level, custom: true, emoji: String(r.emoji || '✨').slice(0, 4), title: String(r.title || 'New topic'), titleVi: String(r.titleVi || topic || 'Chủ đề mới'), items }
      update((s) => { (s.customUnits ||= []).push(unit) })
      setSt({ ok: unit })
      setTopic('')
    } catch (e) { setSt({ err: String(e.message || e) }) }
  }
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl border-2 border-dashed border-slate-200 p-3 sm:flex-row sm:items-center">
      <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="✨ Tạo chủ đề từ vựng mới cho cấp này (vd: phỏng vấn xin việc, nấu ăn, cảm xúc…) – để trống: AI tự chọn" />
      <button className="btn-ghost shrink-0" disabled={st?.busy} onClick={create}>{st?.busy ? <>⏳ AI đang soạn 15 từ…<Elapsed /></> : '✨ Tạo chủ đề'}</button>
      {st?.ok && <a className="text-sm font-semibold text-emerald-700 underline shrink-0" href={`#/course/${st.ok.id}`}>Học “{st.ok.titleVi}” →</a>}
      {st?.err && <span className="text-sm text-rose-600">{st.err}</span>}
    </div>
  )
}

// Học chủ đề: chia lô 5 từ: HỌC (nghe, nhại) → LUYỆN (nói lại trong câu bị che)
function UnitPlayer({ unit }) {
  const vocab = useStore((s) => s.vocab)
  const settings = useStore((s) => s.settings)
  const [adding, setAdding] = useState('')
  const learned = unit.items.filter((it) => vocab[vocabId(it.en)]?.sources.includes(src(unit.id)))
  const fresh = unit.items.filter((it) => !learned.includes(it))
  const learnedToday = Object.values(vocab).filter((v) => v.learnedAt === today()).length
  const [session, setSession] = useState(null) // { items, phase:'learn'|'practice'|'done', results }

  const startNew = () => setSession({ items: fresh.slice(0, BATCH).map((i) => ({ ...i, unitId: unit.id })) })

  const addMore = async () => {
    setAdding('loading')
    try {
      const r = await generateUnitItems({ title: `${unit.title} (${unit.titleVi})`, levelName: `${LEVELS[unit.level].cefr} / ${LEVELS[unit.level].band}`, existing: unit.items.map((i) => i.en) })
      const have = new Set(unit.items.map((i) => i.en.toLowerCase()))
      const items = (r.items || []).filter((i) => i.en && i.vi && i.ex && !have.has(i.en.toLowerCase())).map((i) => ({ en: String(i.en), vi: String(i.vi), ex: String(i.ex) }))
      update((s) => { s.courseExtra[unit.id] = [...(s.courseExtra[unit.id] || []), ...items] })
      setAdding(`✅ Đã thêm ${items.length} từ mới.`)
    } catch (e) {
      setAdding('❌ ' + (e.message || e))
    }
  }

  if (session) {
    return <Practice title={`${unit.emoji} ${unit.titleVi}`} unit={unit} items={session.items} learnFirst onExit={() => setSession(null)} />
  }

  return (
    <div>
      <PageHeader title={`${unit.emoji} ${unit.titleVi}`} subtitle={`${LEVELS[unit.level].name} · ${unit.title}`} right={<a className="btn-ghost" href="#/course">← Lộ trình</a>} />
      <div className="card mb-4 space-y-3">
        <div className="text-sm text-slate-600">Đã học {learned.length}/{unit.items.length} từ. Mỗi lượt học 5 từ: <b>nghe & nhại câu ví dụ</b> → <b>nói lại cả câu khi từ bị che</b>. Từ đã học sẽ tự quay lại theo lịch ôn.</div>
        {learnedToday >= settings.newWordsPerDay && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Hôm nay bạn đã học {learnedToday} từ mới (mục tiêu {settings.newWordsPerDay}). Nên dừng học mới và ôn lại để nhớ lâu. Bạn vẫn có thể học tiếp nếu muốn.</div>}
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={!fresh.length} onClick={startNew}>▶ Học {Math.min(BATCH, fresh.length)} từ mới</button>
          <a className={`btn-ghost ${learned.length ? '' : 'pointer-events-none opacity-40'}`} href={`#/course/${unit.id}/review`}>🔁 Ôn cả chủ đề ({learned.length})</a>
          {aiEnabled() && <button className="btn-ghost" onClick={addMore} disabled={adding === 'loading'}>{adding === 'loading' ? <>⏳ AI đang soạn…<Elapsed /></> : '✨ Thêm 15 từ bằng AI'}</button>}
        </div>
        {adding && adding !== 'loading' && <div className="text-sm">{adding}</div>}
        {!fresh.length && <div className="text-sm text-emerald-700">🎉 Bạn đã học hết chủ đề này. {aiEnabled() ? 'Bấm “Thêm 15 từ bằng AI” để mở rộng.' : 'Nhập API key Gemini trong Cài đặt để AI thêm từ mới cho chủ đề.'}</div>}
      </div>
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {unit.items.map((it) => {
              const v = vocab[vocabId(it.en)]
              const has = v?.sources.includes(src(unit.id))
              return (
                <tr key={it.en} className="border-t border-slate-100 first:border-0">
                  <td className="p-3 font-medium"><button onClick={() => speak(it.en)} className="mr-1 text-slate-400 hover:text-indigo-600">🔈</button>{has ? it.en : <span className="text-slate-300">{it.en.replace(/[a-zA-Z]/g, '•')}</span>}</td>
                  <td className="p-3 text-slate-600">{it.vi}</td>
                  <td className="p-3">{has ? <StageChip stage={v.stage} /> : <span className="chip bg-slate-100 text-slate-500">Chưa học</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Che từ khoá trong câu ví dụ
function cloze(ex, en) {
  const target = new Set(normalize(en).map(stem))
  const words = ex.split(/(\s+)/)
  let hidden = 0
  const out = words.map((w) => {
    const n = normalize(w).map(stem)
    if (n.length && n.every((x) => target.has(x)) && !['a', 'the', 'to', 'i', 'you', 'it'].includes(n[0])) { hidden++; return '_'.repeat(Math.max(3, w.replace(/[^\w']/g, '').length)) + w.replace(/[\w']/g, '') }
    return w
  })
  return hidden ? out.join('') : ex.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '_____')
}

// Phiên luyện: learnFirst = có bước học trước; reviewMode = ôn (không gợi ý sẵn)
function Practice({ title, unit, items, learnFirst = false, reviewMode = false, onExit }) {
  const settings = useStore((s) => s.settings)
  const [queue] = useState(() => (reviewMode ? [...items].sort(() => Math.random() - 0.5).slice(0, 30) : items))
  const [phase, setPhase] = useState(learnFirst ? 'learn' : 'practice')
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState([])

  // Dịch trước các câu ví dụ để hiện nghĩa ngay khi mở thẻ
  useEffect(() => { if (getState().settings.showSentenceVi) queue.forEach((i) => { if (!i.exVi) { translateText(i.ex); translateNatural(i.ex, exCtx(i)) } }) }, [queue])

  // Khi bắt đầu học: đưa từ vào kho từ để có lịch ôn
  useEffect(() => {
    if (learnFirst) seedVocab(queue.map((i) => ({ en: i.en, vi: i.vi, source: src(i.unitId), example: i.ex })))
  }, [learnFirst, queue])

  const finish = (res) => {
    const acc = res.filter((r) => r.ok).length / Math.max(1, res.length)
    if (unit) scheduleReview('unit', unit.id, acc * 5, `${unit.emoji} ${unit.titleVi}`)
    logHistory('course', `${title}: ${res.filter((r) => r.ok).length}/${res.length} câu đúng`)
    setPhase('done')
  }

  if (!queue.length) {
    return (
      <div>
        <PageHeader title={title} right={<a className="btn-ghost" href="#/course">← Lộ trình</a>} />
        <div className="card">✅ Không có từ nào cần ôn lúc này. <a className="text-indigo-600 underline" href="#/course">Học chủ đề mới →</a></div>
      </div>
    )
  }

  if (phase === 'done') {
    const ok = results.filter((r) => r.ok).length
    return (
      <div>
        <PageHeader title="🎉 Xong lượt học!" subtitle={`${ok}/${results.length} câu nói đúng từ khoá`} />
        <div className="card space-y-2">
          {results.map((r, i) => (
            <div key={i} className="flex justify-between gap-3 border-b border-slate-100 py-1 text-sm last:border-0">
              <span><b>{r.en}</b> <span className="text-slate-500">– {r.said}</span></span>
              <span>{r.ok ? '✅' : '❌'}</span>
            </div>
          ))}
          <p className="pt-2 text-xs text-slate-500">Các từ đã được xếp lịch ôn: sai → ôn lại ngày mai; đúng không gợi ý → giãn dần 1 → 2 → 4 → 7 ngày, đủ 3 ngày khác nhau thì “Thành thạo”.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {onExit ? <button className="btn-primary" onClick={onExit}>Tiếp tục chủ đề</button> : <a className="btn-primary" href="#/course">Về lộ trình</a>}
            <a className="btn-ghost" href="#/review">📅 Ôn tập hôm nay</a>
          </div>
        </div>
      </div>
    )
  }

  const item = queue[idx]
  const total = phase === 'learn' ? queue.length : queue.length
  return (
    <div>
      <PageHeader title={title} right={<div className="flex gap-2"><SessionTimer targetMin={15} /><a className="btn-ghost" href="#/course">Thoát</a></div>} />
      <div className="mb-4 flex items-center gap-3 text-sm text-slate-500">
        <span className={`chip ${phase === 'learn' ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'}`}>{phase === 'learn' ? '① Học: nghe & nhại' : reviewMode ? '🔁 Ôn: nói lại trong câu' : '② Luyện: nói lại trong câu'}</span>
        <span>{idx + 1}/{total}</span>
        <div className="flex-1"><Progress value={idx} max={total} /></div>
      </div>
      {phase === 'learn' ? (
        <LearnCard
          key={'l' + idx}
          item={item}
          settings={settings}
          onNext={() => {
            markHeard([item.en])
            if (idx + 1 < queue.length) setIdx(idx + 1)
            else { setIdx(0); setPhase('practice') }
          }}
        />
      ) : (
        <SayCard
          key={'p' + idx}
          item={item}
          settings={settings}
          aidedByDefault={!reviewMode}
          onDone={(r) => {
            const res = [...results, r]
            setResults(res)
            if (idx + 1 < queue.length) setIdx(idx + 1)
            else finish(res)
          }}
        />
      )}
    </div>
  )
}

function LearnCard({ item, settings, onNext }) {
  const [said, setSaid] = useState(null)
  const play = () => speak(item.en, { voiceName: settings.voiceA, rate: settings.speechRate * 0.9 }).then(() => new Promise((r) => setTimeout(r, 400))).then(() => speak(item.ex, { voiceName: settings.voiceA, rate: settings.speechRate }))
  useEffect(() => { const t = setTimeout(play, 300); return () => { clearTimeout(t); stopSpeaking() } }, []) // tự đọc khi mở thẻ
  const mic = useMic({ onFinal: (t) => setSaid({ t, sc: Math.round(similarity(t, item.ex) * 100) }) })
  useHotkeys({ r: play, Enter: onNext })
  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <div className="text-3xl font-bold text-indigo-700">{item.en}</div>
          <div className="text-lg text-slate-600">{item.vi}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-lg">
          <div>“{item.ex}” <button onClick={play} className="ml-1 text-slate-400 hover:text-indigo-600">🔈</button></div>
          <SentenceVi en={item.ex} vi={item.exVi} ctx={exCtx(item)} className="mt-1" />
        </div>
        <ChunkCluster en={item.en} vi={item.vi} compact />
      </div>
      <div className="card flex flex-col items-center gap-3">
        <div className="text-sm text-slate-600">Nghe rồi <b>nhại lại cả câu ví dụ</b> 1–2 lần</div>
        <MicButton mic={mic} label="Giữ để nhại câu" />
        <div className="w-full"><LiveTranscript mic={mic} /></div>
        {said && <div className="text-sm">Khớp <b className={said.sc >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{said.sc}%</b> {said.sc >= 75 ? '👏' : '– nghe lại (R) và thử lần nữa'}</div>}
        <button className="btn-primary" onClick={onNext}>Tiếp <span className="kbd !bg-indigo-500 !text-white !border-indigo-400">Enter</span></button>
      </div>
      <Shortcuts items={[['Space (giữ)', 'nhại lại'], ['Ctrl', 'nghe lại'], ['Enter', 'từ tiếp']]} />
    </div>
  )
}

function SayCard({ item, settings, aidedByDefault, onDone }) {
  const [hint, setHint] = useState(false)
  const [ans, setAns] = useState(null)
  const masked = useMemo(() => cloze(item.ex, item.en), [item])
  const evaluate = useCallback((t) => {
    if (ans) return setAns((a) => ({ ...a, retry: t, retryOk: chunkUsed(item.en, t) }))
    const ok = chunkUsed(item.en, t)
    recordSpoken(item.en, { correct: ok, aided: aidedByDefault || hint })
    update((s) => { const v = s.vocab[vocabId(item.en)]; if (v && !v.learnedAt) v.learnedAt = today() })
    setAns({ t, ok })
  }, [ans, item, aidedByDefault, hint])
  const mic = useMic({ onFinal: evaluate })
  const play = () => speak(item.ex, { voiceName: settings.voiceA, rate: settings.speechRate })
  const next = () => ans && onDone({ en: item.en, said: ans.t, ok: ans.ok })
  useHotkeys({ h: () => setHint(true), r: () => ans && play(), Enter: next })

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="text-sm text-slate-500">Nói <b>cả câu</b>, điền đúng cụm có nghĩa:</div>
        <div className="text-2xl font-semibold">“{item.vi}”</div>
        <div className="rounded-xl bg-slate-50 p-3 text-lg font-mono tracking-wide">{masked}</div>
        {hint ? <div className="text-sm">💡 Gợi ý: <b>{item.en.split(' ').map((w) => w[0] + '…').join(' ')}</b></div> : !ans && <button className="btn-ghost !py-1" onClick={() => setHint(true)}>💡 Gợi ý chữ cái đầu <span className="kbd">H</span></button>}
      </div>
      <div className="card flex flex-col items-center gap-3">
        <MicButton mic={mic} label={ans ? 'Nói lại cho nhuần' : 'Giữ để nói cả câu'} />
        <div className="w-full"><LiveTranscript mic={mic} /></div>
        {!ans && <div className="w-full"><TypeFallback onSubmit={evaluate} /></div>}
      </div>
      {ans && (
        <div className={`card space-y-2 ${ans.ok ? 'border-emerald-300' : 'border-rose-300'}`}>
          <div className="text-lg font-semibold">{ans.ok ? '✅ Chính xác!' : '❌ Chưa đúng cụm từ'}</div>
          <div className="text-sm"><span className="text-slate-500">Bạn nói:</span> “{ans.t}”</div>
          {ans.retry && <div className="text-sm"><span className="text-slate-500">Lần nói lại:</span> “{ans.retry}” {ans.retryOk ? '✅' : ''}</div>}
          <div className="text-lg"><b className="text-indigo-700">{item.en}</b> – “{item.ex}” <button onClick={play}>🔈</button></div>
          <SentenceVi en={item.ex} vi={item.exVi} ctx={exCtx(item)} />
          <SentenceReview key={ans.t} transcript={ans.t} chunks={[item.en]} model={item.ex} situationVi={`Nói một câu dùng “${item.en}” (${item.vi})`} />
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={play}>🔊 Nghe <span className="kbd">Ctrl</span></button>
            <button className="btn-primary" onClick={next}>Tiếp <span className="kbd !bg-indigo-500 !text-white !border-indigo-400">Enter</span></button>
          </div>
          {!ans.ok && <p className="text-xs text-slate-500">Từ này sẽ quay lại vào ngày mai. Hãy nghe và nói lại câu đúng 2 lần ngay bây giờ.</p>}
        </div>
      )}
      <Shortcuts items={[['Space (giữ)', 'nói'], ['H', 'gợi ý'], ['Ctrl', 'nghe câu'], ['Enter', 'tiếp']]} />
    </div>
  )
}
