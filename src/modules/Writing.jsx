// ĐỌC & VIẾT (15 phút/ngày) – phục vụ cho kỹ năng Nói, không tách rời
// 1) Đọc chủ động: đọc văn bản thật ngắn, "đào" cụm từ vào kho để luyện nói
// 2) Nhật ký 3–5 câu: viết về ngày hôm nay bằng các cụm từ đang học, rồi ĐỌC TO lại
// 3) Dịch ngược: đọc câu mẫu → che đi → nhìn tiếng Việt và viết lại tiếng Anh
import { useMemo, useState } from 'react'
import { readings } from '../data/readings'
import { getRecallPrompts } from '../data'
import Translate from './Translate'
import { useStore, update, logHistory } from '../lib/store'
import { addReactivate, isDue, vocabId } from '../lib/srs'
import { chunkUsed, similarity, normalize } from '../lib/text'
import { speak } from '../lib/speech'
import { aiEnabled, gradeWriting } from '../lib/ai'
import { checkGrammar, applyFixes } from '../lib/grammar'
import { today } from '../lib/date'
import { useMic, MicButton, LiveTranscript } from '../components/Mic'
import { Elapsed } from '../components/Elapsed'
import { PageHeader, SessionTimer, TierChip } from '../components/ui'

const TABS = [
  ['translate', '🇻🇳→🇬🇧 Dịch đoạn văn'],
  ['read', '📖 Đọc chủ động'],
  ['journal', '📝 Nhật ký 3–5 câu'],
  ['back', '🔄 Dịch ngược'],
]

export default function Writing({ tab: routeTab, id }) {
  const tab = TABS.some(([k]) => k === routeTab) ? routeTab : 'translate'
  const setTab = (k) => (window.location.hash = `#/writing/${k}`)
  return (
    <div>
      <PageHeader title="✍️ Đọc & Viết phục vụ Nói" subtitle="15 phút/ngày. Đọc để lấy “nguyên liệu” (cụm từ), viết để sắp xếp câu chậm – rồi đọc to để chuyển sang phản xạ nói." right={<SessionTimer targetMin={15} />} />
      <div className="mb-4 flex gap-2">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={tab === k ? 'btn-primary' : 'btn-ghost'}>{l}</button>)}
      </div>
      {tab === 'translate' && <Translate id={id} />}
      {tab === 'read' && <ActiveReading />}
      {tab === 'journal' && <Journal />}
      {tab === 'back' && <BackTranslation />}
    </div>
  )
}

function ActiveReading() {
  const vocab = useStore((s) => s.vocab)
  const [id, setId] = useState(readings[0].id)
  const r = readings.find((x) => x.id === id)
  const parts = r.text.split(/(\{\{.+?\}\})/g)
  const plain = r.text.replace(/\{\{|\}\}/g, '')
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {readings.map((x) => <button key={x.id} onClick={() => setId(x.id)} className={x.id === id ? 'btn-primary !py-1' : 'btn-ghost !py-1'}>{x.titleVi}</button>)}
      </div>
      <div className="card space-y-3">
        <div className="flex items-center gap-2"><TierChip tier={r.tier} /><b>{r.title}</b>
          <button className="btn-ghost !py-1 ml-auto" onClick={() => speak(plain)}>🔈 Nghe đọc</button>
        </div>
        <p className="text-lg leading-8">
          {parts.map((p, i) => {
            const m = p.match(/^\{\{(.+)\}\}$/)
            if (!m) return <span key={i}>{p}</span>
            const inVocab = !!vocab[vocabId(m[1])]
            return (
              <button key={i} onClick={() => addReactivate(m[1], { source: r.id, example: plain.split(/(?<=\.)\s/).find((s) => s.includes(m[1])) })}
                className={`rounded px-1 ${inVocab ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'}`} title={inVocab ? 'Đã có trong kho từ' : 'Bấm để thêm vào kho từ'}>
                {m[1]}{inVocab ? ' ✓' : ' +'}
              </button>
            )
          })}
        </p>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="font-semibold mb-1">Trả lời bằng miệng (giữ Space ở tab Nhật ký) hoặc trong đầu:</div>
          <ul className="list-disc pl-5">{r.questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </div>
        <p className="text-xs text-slate-500">Quy trình 5 phút: đọc lướt 1 lần (không tra từ) → đọc lại, bấm các cụm từ màu vàng muốn dùng khi nói → trả lời 2 câu hỏi thành tiếng. Khi đọc paper thật, hãy chép 3 cụm từ/ngày vào “Kho từ vựng”.</p>
      </div>
    </div>
  )
}

function Journal() {
  const vocab = useStore((s) => s.vocab)
  const entries = useStore((s) => s.writing)
  const suggestions = useMemo(() => {
    const vs = Object.values(vocab)
    const pick = [...vs.filter((v) => v.reactivate), ...vs.filter((v) => isDue(v) && !v.reactivate), ...vs.filter((v) => v.stage === 'heard')]
    return [...new Map(pick.map((v) => [v.id, v])).values()].slice(0, 5)
  }, [vocab])
  const [prompt, setPrompt] = useState('lab')
  const [text, setText] = useState('')
  const [fb, setFb] = useState(null)
  const [readAloud, setReadAloud] = useState(null)
  const [gram, setGram] = useState(null)
  const grammarOn = useStore((s) => s.settings.grammarCheck)
  const mic = useMic({ onFinal: (t) => setReadAloud({ said: t, sim: Math.round(similarity(t, text) * 100) }) })

  const promptEn = prompt === 'lab' ? 'Write a 3-5 sentence lab log: what you did today, one problem, and your next step.' : 'Write 3-5 sentences about something that happened in your dorm or daily life in Taiwan today.'
  const used = suggestions.filter((v) => chunkUsed(v.en, text))

  const submit = async () => {
    const entry = { date: today(), at: Date.now(), prompt, text, used: used.map((v) => v.en) }
    update((s) => { s.writing.unshift(entry); s.writing = s.writing.slice(0, 100) })
    logHistory('writing', `Nhật ký ${normalize(text).length} từ`)
    setFb({ saved: true })
    if (grammarOn) {
      setGram({ loading: true })
      checkGrammar(text).then((m) => setGram({ matches: m })).catch((e) => setGram({ error: String(e.message || e) }))
    }
    if (aiEnabled()) {
      try {
        setFb({ saved: true, loading: true })
        setFb({ saved: true, ...(await gradeWriting({ promptEn, text, chunks: suggestions.map((v) => v.en) })) })
      } catch (e) {
        setFb({ saved: true, error: String(e.message || e) })
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex gap-2">
          <button className={prompt === 'lab' ? 'btn-primary !py-1' : 'btn-ghost !py-1'} onClick={() => setPrompt('lab')}>🔬 Nhật ký Lab</button>
          <button className={prompt === 'life' ? 'btn-primary !py-1' : 'btn-ghost !py-1'} onClick={() => setPrompt('life')}>🏠 Đời sống KTX</button>
        </div>
        <div className="text-sm text-slate-600">{prompt === 'lab' ? 'Viết 3–5 câu: hôm nay làm gì ở lab, gặp vấn đề gì, bước tiếp theo. (Chính là nội dung báo cáo tuần của bạn!)' : 'Viết 3–5 câu về một chuyện xảy ra hôm nay ở KTX / Đài Loan.'}</div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-slate-500">Cố gắng dùng ≥2 cụm:</span>
            {suggestions.map((v) => <span key={v.id} className={`chip ${used.includes(v) ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>{v.en}</span>)}
          </div>
        )}
        <textarea className="input min-h-[140px] text-base" value={text} onChange={(e) => setText(e.target.value)} placeholder="Today I ..." />
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={normalize(text).length < 15} onClick={submit}>Lưu {aiEnabled() ? '& nhờ AI sửa' : ''}</button>
          <span className="text-xs text-slate-500">{normalize(text).length} từ</span>
        </div>
        {fb?.loading && <div className="text-sm text-slate-500">🤖 AI đang sửa…<Elapsed /></div>}
        {fb?.error && <div className="text-sm text-rose-600">AI lỗi: {fb.error}</div>}
        {fb?.corrected && (
          <div className="rounded-xl bg-indigo-50 p-3 text-sm space-y-2">
            <div><b>Bản đã sửa:</b> {fb.corrected} <button onClick={() => speak(fb.corrected)}>🔈</button></div>
            {fb.top_fixes?.map((f, i) => <div key={i}>• <s className="text-rose-600">{f.from}</s> → <b className="text-emerald-700">{f.to}</b> <span className="text-slate-500">({f.why_vi})</span></div>)}
            <div className="text-slate-600">{fb.feedback_vi}</div>
          </div>
        )}
        {fb?.saved && !fb.loading && !fb.corrected && !fb.error && <div className="text-sm text-emerald-600">✓ Đã lưu.</div>}
        {gram?.loading && <div className="text-sm text-slate-500">Đang kiểm tra ngữ pháp…</div>}
        {gram?.error && <div className="text-sm text-rose-600">Không kiểm tra được ngữ pháp: {gram.error}</div>}
        {gram?.matches && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
            <b>Ngữ pháp & chính tả (LanguageTool):</b>
            {gram.matches.length === 0 ? <div className="text-emerald-700">✓ Không phát hiện lỗi.</div> : gram.matches.map((m, i) => (
              <div key={i}>• <s className="text-rose-600">{m.wrong}</s> → <b className="text-emerald-700">{m.replacements.join(' / ') || '?'}</b> <span className="text-slate-500">– {m.message}</span></div>
            ))}
            {gram.matches.length > 0 && <div className="pt-1"><span className="text-slate-500">Bản đã sửa: </span>{applyFixes(text, gram.matches)}</div>}
          </div>
        )}
      </div>
      {fb?.saved && (
        <div className="card flex flex-col items-center gap-3">
          <div className="label">Bước cuối: ĐỌC TO đoạn bạn vừa viết (không nhìn càng tốt)</div>
          <MicButton mic={mic} />
          <div className="w-full"><LiveTranscript mic={mic} /></div>
          {readAloud && <div className="text-sm">Độ khớp: <b>{readAloud.sim}%</b> {readAloud.sim >= 80 ? '👏' : '– thử đọc lại trôi chảy hơn'}</div>}
        </div>
      )}
      {entries.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer text-sm font-semibold">Nhật ký đã viết ({entries.length})</summary>
          <div className="mt-3 space-y-3 text-sm">
            {entries.slice(0, 20).map((e) => <div key={e.at}><span className="text-slate-400">{e.date}</span> · {e.text}</div>)}
          </div>
        </details>
      )}
    </div>
  )
}

function BackTranslation() {
  const allRecallPrompts = useMemo(() => getRecallPrompts(), [])
  const [i, setI] = useState(() => Math.floor(Math.random() * allRecallPrompts.length))
  const p = allRecallPrompts[i]
  const [phase, setPhase] = useState('read') // read -> write -> check
  const [text, setText] = useState('')
  const sim = Math.round(similarity(text, p.model) * 100)
  const next = () => { setI(Math.floor(Math.random() * allRecallPrompts.length)); setPhase('read'); setText('') }
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2"><TierChip tier={p.tier} /><span className="text-sm text-slate-500">{p.emoji} {p.titleVi}</span></div>
      {phase === 'read' && (
        <>
          <div className="label">1. Đọc kỹ câu mẫu trong 20 giây (đọc to 2 lần)</div>
          <div className="text-xl font-semibold">{p.model} <button onClick={() => speak(p.model)}>🔈</button></div>
          <button className="btn-primary" onClick={() => setPhase('write')}>Che câu mẫu & viết lại →</button>
        </>
      )}
      {phase !== 'read' && (
        <>
          <div className="label">2. Nhìn tình huống tiếng Việt, viết lại bằng tiếng Anh</div>
          <div className="text-lg">{p.vi}</div>
          <textarea className="input min-h-[90px] text-base" value={text} onChange={(e) => setText(e.target.value)} disabled={phase === 'check'} />
          {phase === 'write' && <button className="btn-primary" disabled={!text.trim()} onClick={() => setPhase('check')}>So sánh</button>}
        </>
      )}
      {phase === 'check' && (
        <div className="space-y-2">
          <div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500 text-sm">Câu mẫu: </span><b>{p.model}</b></div>
          <div className="text-sm">Độ giống: <b>{sim}%</b> · Cụm từ: {p.chunks.map((c) => <span key={c.en} className={`chip mr-1 ${chunkUsed(c.en, text) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{c.en}</span>)}</div>
          <p className="text-xs text-slate-500">Không cần giống 100% – quan trọng là các cụm từ (chunk) xuất hiện đúng. Cụm màu đỏ: hãy nói to câu mẫu thêm 2 lần.</p>
          <button className="btn-primary" onClick={next}>Câu khác →</button>
        </div>
      )}
    </div>
  )
}
