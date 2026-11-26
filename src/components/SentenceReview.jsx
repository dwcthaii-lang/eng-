// CHẤM & SỬA CẢ CÂU người học nói/gõ
// - Có API key: AI chấm như giáo viên (ngữ pháp, từ vựng, tự nhiên, đúng yêu cầu), nhận xét cách dùng từng cụm từ, hiện dần (stream)
// - Không có key: luật lỗi hay gặp của người Việt + LanguageTool (miễn phí), dịch giải thích sang tiếng Việt
import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { aiEnabled, reviewSentence } from '../lib/ai'
import { checkGrammar } from '../lib/grammar'
import { translateText } from '../lib/dict'
import { chunkUsed, similarity, normalize } from '../lib/text'
import { speak } from '../lib/speech'

// Lỗi người Việt hay mắc khi nói (luôn chạy, không cần mạng)
const BASE = { uses: 'use', goes: 'go', does: 'do', has: 'have', makes: 'make', takes: 'take', gets: 'get', comes: 'come', sees: 'see', needs: 'need', wants: 'want', works: 'work', tells: 'tell', asks: 'ask', checks: 'check', sends: 'send', fixes: 'fix', tries: 'try', used: 'use', went: 'go', did: 'do', had: 'have', made: 'make', took: 'take', got: 'get', came: 'come', saw: 'see', needed: 'need', wanted: 'want', worked: 'work', told: 'tell', asked: 'ask', sent: 'send', checked: 'check', tried: 'try', fixed: 'fix' }
const RULES = [
  { re: /\bin (the )?(first|second|third|fourth|fifth|sixth|top|ground|\d+(?:st|nd|rd|th)) floor\b/gi, fix: (m) => `on the ${m[2]} floor`, why: 'Với tầng nhà dùng giới từ ON và có THE: “on the third floor”.', type: 'grammar' },
  { re: new RegExp(`\\b(should|can|could|will|would|must|might|may|don't|doesn't|didn't|do not|does not|did not|to)\\s+(${Object.keys(BASE).join('|')})\\b`, 'gi'), fix: (m) => `${m[1]} ${BASE[m[2].toLowerCase()]}`, why: 'Sau động từ khuyết thiếu (should, can, will…), do/does/did hoặc “to” luôn dùng động từ NGUYÊN MẪU, không thêm -s/-ed.', type: 'grammar' },
  { re: /\b(i|we|they|you) (am|are) agree\b/gi, fix: (m) => `${m[1]} agree`, why: '“agree” đã là động từ, không thêm am/are.', type: 'grammar' },
  { re: /\bdiscuss about\b/gi, fix: () => 'discuss', why: '“discuss” không đi với “about”: discuss the plan.', type: 'grammar' },
  { re: /\bexplain me\b/gi, fix: () => 'explain to me', why: 'explain + TO + người: “explain to me”.', type: 'grammar' },
  { re: /\b(open|opened) the (lights?|fan|air ?con(?:ditioner)?|tv|computer)\b/gi, fix: (m) => `turn on the ${m[2]}`, why: 'Thiết bị điện dùng “turn on”, không dùng “open” (dịch từ “mở đèn”).', type: 'word' },
  { re: /\b(close|closed) the (lights?|fan|air ?con(?:ditioner)?|tv|computer)\b/gi, fix: (m) => `turn off the ${m[2]}`, why: 'Thiết bị điện dùng “turn off”, không dùng “close” (dịch từ “tắt/đóng”).', type: 'word' },
  { re: /\bmachine (to )?do the laundry\b/gi, fix: () => 'washing machine', why: 'Máy giặt là “washing machine” (hoặc “the washer”), không nói “machine do the laundry”.', type: 'word' },
  { re: /\b(he|she|it) (don't)\b/gi, fix: (m) => `${m[1]} doesn't`, why: 'He/she/it dùng “doesn’t”.', type: 'grammar' },
  { re: /\bvery like\b/gi, fix: () => 'really like', why: 'Không nói “very like”; dùng “really like” hoặc “like … very much”.', type: 'unnatural' },
]

function localErrors(text) {
  const out = []
  RULES.forEach((r) => {
    for (const m of text.matchAll(r.re)) out.push({ offset: m.index, length: m[0].length, wrong: m[0], fix: r.fix(m), why: r.why, type: r.type, src: 'rule' })
  })
  return out
}

const SKIP_CAT = new Set(['CASING', 'PUNCTUATION', 'TYPOGRAPHY', 'TYPOS_WHITESPACE'])
const SKIP_RULE = /UPPERCASE|COMMA|WHITESPACE|QUOTES|SENTENCE_FRAGMENT|I_LOWERCASE|PUNCT|EN_A_VS_AN_CAPS/
function overlaps(a, b) { return a.offset < b.offset + b.length && b.offset < a.offset + a.length }

const TYPE = {
  grammar: ['Ngữ pháp', 'bg-rose-100 text-rose-700'],
  word: ['Chọn từ', 'bg-amber-100 text-amber-800'],
  usage: ['Cách dùng', 'bg-amber-100 text-amber-800'],
  unnatural: ['Chưa tự nhiên', 'bg-sky-100 text-sky-800'],
  missing: ['Thiếu ý', 'bg-slate-200 text-slate-700'],
  avoid: ['Nên tránh', 'bg-slate-200 text-slate-700'],
  misspelling: ['Chính tả / nhận dạng', 'bg-slate-100 text-slate-600'],
}
const CHUNK_ST = { ok: ['✅', 'text-emerald-700'], wrong: ['❌', 'text-rose-700'], unnatural: ['⚠️', 'text-amber-700'], missing: ['➖', 'text-slate-500'] }
const QUICK_CAP = 8 // chấm nhanh không hiểu ý nghĩa → không cho điểm tuyệt đối

function quickCheck({ transcript, chunks, model, errors }) {
  const used = chunks.filter((c) => chunkUsed(c, transcript))
  const chunkScore = chunks.length ? (used.length / chunks.length) * 10 : 10
  const real = errors.filter((e) => e.type !== 'misspelling').length
  const grammarScore = Math.max(0, 10 - real * 2)
  const sim = model ? similarity(transcript, model) : 0.5
  const naturalScore = Math.max(0, Math.round(Math.min(10, sim * 14) - errors.filter((e) => e.type === 'word' || e.type === 'unnatural').length * 2))
  const short = normalize(transcript).length < 5 ? 2 : 0
  const score = Math.min(QUICK_CAP, Math.max(0, Math.round(chunkScore * 0.35 + grammarScore * 0.25 + naturalScore * 0.4 - short)))
  return { score, scores: [['Dùng cụm từ', Math.round(chunkScore)], ['Ngữ pháp (máy)', Math.round(grammarScore)], ['Giống câu mẫu', naturalScore]] }
}

// onScore(score | null): null = AI đang chấm (chưa có điểm cuối)
export function SentenceReview({ transcript, chunks = [], model = '', situationVi = '', context = '', onScore }) {
  const grammarOn = useStore((s) => s.settings.grammarCheck)
  const [quick, setQuick] = useState(null)
  const [ai, setAi] = useState(null) // { ...parseReview, done }
  const [aiState, setAiState] = useState(aiEnabled() ? 'pending' : 'off') // off | pending | done | error
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    let alive = true
    const aiOn = !!aiEnabled()
    if (aiOn) {
      onScore?.(null)
      reviewSentence({ situationVi, context, chunks, transcript, model }, (part) => alive && setAi({ ...part, done: false }))
        .then((final) => {
          if (!alive) return
          if (final.score == null) throw new Error('AI trả lời sai định dạng')
          setAi({ ...final, done: true })
          setAiState('done')
          onScore?.(final.score)
        })
        .catch((e) => {
          if (!alive) return
          setAiError(String(e.message || e))
          setAiState('error')
          setQuick((q) => { if (q) onScore?.(q.score); return q })
        })
    }
    ;(async () => {
      let errors = localErrors(transcript)
      let ltFailed = false
      if (grammarOn) {
        try {
          const lt = (await checkGrammar(transcript)).filter((m) => !SKIP_CAT.has(m.category) && !SKIP_RULE.test(m.rule) && m.type !== 'typographical' && m.type !== 'whitespace')
          lt.forEach((m) => {
            if (errors.some((e) => overlaps(e, m))) return
            errors.push({ offset: m.offset, length: m.length, wrong: m.wrong, fix: m.replacements[0] ?? '', why: m.message, whyEn: true, type: m.type === 'misspelling' ? 'misspelling' : m.type === 'style' ? 'unnatural' : 'grammar', src: 'lt' })
          })
        } catch { ltFailed = true }
      }
      errors.sort((a, b) => a.offset - b.offset)
      let corrected = transcript
      ;[...errors].sort((a, b) => b.offset - a.offset).forEach((e) => { if (e.offset >= 0 && e.fix != null) corrected = corrected.slice(0, e.offset) + e.fix + corrected.slice(e.offset + e.length) })
      const q = { ...quickCheck({ transcript, chunks, model, errors }), errors, corrected: errors.length ? corrected : '', ltFailed: grammarOn && ltFailed, ltOff: !grammarOn }
      if (!alive) return
      setQuick(q)
      if (!aiOn) onScore?.(q.score)
      setAiState((st) => { if (st === 'error') onScore?.(q.score); return st })
      errors.forEach((e, i) => {
        if (!e.whyEn) return
        translateText(e.why).then((r) => {
          if (r && alive) setQuick((x) => x && { ...x, errors: x.errors.map((y, j) => (j === i ? { ...y, whyVi: r.vi } : y)) })
        })
      })
    })()
    return () => { alive = false }
  }, [transcript])

  const hasAi = ai && (ai.score != null || ai.verdict)
  if (!hasAi && !quick) return <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">🔎 Đang chấm cả câu…</div>
  if (hasAi) return <AiView ai={ai} transcript={transcript} />

  return (
    <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">📝 Chấm cả câu <span className="chip bg-slate-100 text-slate-600">chấm nhanh · điểm sơ bộ</span>{aiState === 'pending' && <span className="ml-2 text-xs font-normal text-indigo-600 animate-pulse">🤖 AI đang chấm ngữ nghĩa & cách dùng từ…</span>}</div>
        <Chips scores={quick.scores} />
      </div>
      <div className="leading-relaxed"><span className="text-slate-500">Câu của bạn: </span><Marked text={transcript} errors={quick.errors} /></div>
      {quick.errors.length === 0 ? (
        <div className="text-slate-600">Máy không bắt được lỗi ngữ pháp phổ biến nào. <b>Chấm nhanh chưa đánh giá được ý nghĩa và cách dùng từ</b>, nên điểm tối đa là {QUICK_CAP}/10.</div>
      ) : <ErrorList errors={quick.errors} />}
      {quick.corrected && quick.corrected !== transcript && <div><span className="text-slate-500">✏️ Câu đã sửa (máy): </span><b>{quick.corrected}</b> <button onClick={() => speak(quick.corrected)}>🔈</button></div>}
      {aiState === 'error' && <div className="text-xs text-rose-600">AI chưa chấm được: {aiError.slice(0, 160)}</div>}
      {quick.ltFailed && <div className="text-xs text-slate-500">Không kết nối được LanguageTool, chỉ kiểm tra các lỗi phổ biến của người Việt.</div>}
      {aiState === 'off' && <div className="text-[11px] text-slate-400">Muốn chấm ý nghĩa, cách dùng từ và độ tự nhiên như giáo viên? Nhập API key Gemini miễn phí trong Cài đặt.</div>}
    </div>
  )
}

function Chips({ scores }) {
  return (
    <div className="flex flex-wrap gap-1">
      {scores.filter(([, v]) => v != null).map(([k, v]) => (
        <span key={k} className={`chip ${v >= 8 ? 'bg-emerald-100 text-emerald-800' : v >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}`}>{k} {v}/10</span>
      ))}
    </div>
  )
}

function ErrorList({ errors }) {
  return (
    <div className="space-y-1.5">
      {errors.map((e, i) => (
        <div key={i} className="rounded-lg bg-white p-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`chip ${(TYPE[e.type] || TYPE.grammar)[1]}`}>{(TYPE[e.type] || TYPE.grammar)[0]}</span>
            <span className="text-rose-700 line-through decoration-rose-300">{e.wrong}</span>
            {e.fix ? <>→ <b className="text-emerald-700">{e.fix}</b></> : null}
          </div>
          <div className="mt-0.5 text-slate-700">💡 {e.why_vi || e.whyVi || e.why}{e.whyEn && e.whyVi && <span className="block text-[11px] text-slate-400">{e.why}</span>}</div>
        </div>
      ))}
    </div>
  )
}

function AiView({ ai, transcript }) {
  const errors = ai.errors.map((e) => {
    const i = transcript.toLowerCase().indexOf(String(e.wrong).toLowerCase())
    return { ...e, offset: i, length: i >= 0 ? e.wrong.length : 0 }
  })
  const sub = ai.sub || {}
  return (
    <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">📝 Chấm cả câu <span className="chip bg-indigo-100 text-indigo-700">AI · giáo viên</span>{!ai.done && <span className="ml-2 text-xs font-normal text-indigo-600 animate-pulse">đang viết…</span>}</div>
        <Chips scores={[['Ngữ pháp', sub.grammar], ['Từ vựng', sub.vocab], ['Tự nhiên', sub.natural], ['Đúng yêu cầu', sub.task]]} />
      </div>
      {ai.verdict && <div className="rounded-lg bg-white p-2 text-slate-800">🧑‍🏫 {ai.verdict}</div>}
      <div className="leading-relaxed"><span className="text-slate-500">Câu của bạn: </span><Marked text={transcript} errors={errors} /></div>
      {errors.length > 0 && <ErrorList errors={errors} />}
      {ai.chunks.length > 0 && (
        <div className="space-y-1">
          <div className="label">Cách bạn dùng các cụm từ</div>
          {ai.chunks.map((c, i) => {
            const [icon, cls] = CHUNK_ST[c.status] || CHUNK_ST.unnatural
            return <div key={i} className="rounded-lg bg-white p-2"><span className={`font-semibold ${cls}`}>{icon} {c.chunk}</span> <span className="text-slate-700">– {c.note}</span></div>
          })}
        </div>
      )}
      {ai.corrected && ai.corrected !== transcript && <div><span className="text-slate-500">✏️ Câu của bạn, đã sửa: </span><b>{ai.corrected}</b> <button onClick={() => speak(ai.corrected)}>🔈</button></div>}
      {ai.natural && (
        <div>
          <span className="text-slate-500">🗣️ Người bản xứ sẽ nói: </span><b className="text-indigo-700">{ai.natural}</b> <button onClick={() => speak(ai.natural)}>🔈</button>
          {ai.naturalVi && <div className="text-slate-500">🇻🇳 {ai.naturalVi}</div>}
        </div>
      )}
      {ai.avoid && <div><span className="text-slate-500">🚫 Nên tránh: </span>{ai.avoid}</div>}
      {ai.tip && <div className="text-slate-700">🎯 {ai.tip}</div>}
    </div>
  )
}

function Marked({ text, errors }) {
  const spans = errors.filter((e) => e.offset >= 0 && e.length > 0).sort((a, b) => a.offset - b.offset)
  const out = []
  let pos = 0
  spans.forEach((e, i) => {
    if (e.offset < pos) return
    out.push(<span key={'t' + i}>{text.slice(pos, e.offset)}</span>)
    out.push(<span key={'e' + i} className="rounded bg-rose-100 px-0.5 text-rose-700 underline decoration-wavy decoration-rose-400" title={e.fix ? `→ ${e.fix}` : ''}>{text.slice(e.offset, e.offset + e.length)}</span>)
    pos = e.offset + e.length
  })
  out.push(<span key="end">{text.slice(pos)}</span>)
  return <span>“{out}”</span>
}
