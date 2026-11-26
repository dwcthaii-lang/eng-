// Dịch đoạn văn Việt -> Anh: gợi ý từ khi bí, sửa ngữ pháp (LanguageTool) + từ vựng (AI), có lịch ôn
import { useMemo, useState } from 'react'
import { translationSet } from '../data/translations'
import { TIERS } from '../data'
import { useStore, update, getState, logHistory } from '../lib/store'
import { scheduleReview, nextDueLabel } from '../lib/review'
import { similarity, chunkUsed, normalize } from '../lib/text'
import { speak } from '../lib/speech'
import { aiEnabled, gradeTranslation, lookupPhrase } from '../lib/ai'
import { checkGrammar, applyFixes } from '../lib/grammar'
import { today } from '../lib/date'
import { Elapsed } from '../components/Elapsed'
import { TierChip } from '../components/ui'

export default function Translate({ id }) {
  const item = translationSet.find((x) => x.id === id)
  return item ? <TranslateTask key={item.id} item={item} /> : <TranslateList />
}

function TranslateList() {
  const reviews = useStore((s) => s.reviews)
  const t = today()
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">Đọc đoạn tiếng Việt → dịch sang tiếng Anh tự nhiên. Bí từ thì bấm gợi ý hoặc tra nhanh. Sau khi nộp: sửa ngữ pháp, gợi ý từ tự nhiên hơn, so với bản mẫu. Mỗi đoạn được xếp lịch ôn lại.</p>
      {[1, 2].map((tier) => (
        <div key={tier}>
          <div className="label mb-2">{TIERS[tier].label}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {translationSet.filter((x) => x.tier === tier).map((x) => {
              const rv = reviews[`translate:${x.id}`]
              return (
                <a key={x.id} href={`#/writing/translate/${x.id}`} className="card !p-4 flex items-center justify-between gap-3 hover:border-indigo-300">
                  <span className="font-medium">{x.titleVi}</span>
                  {rv ? <span className={`chip ${rv.due <= t ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{rv.due <= t ? '📅 Cần ôn' : nextDueLabel(rv)}</span> : <span className="chip bg-slate-100 text-slate-600">Mới</span>}
                </a>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function lookupOffline(q) {
  const n = q.trim().toLowerCase()
  if (!n) return []
  const out = []
  translationSet.forEach((t) => t.glossary.forEach(([vi, en]) => vi.toLowerCase().includes(n) && out.push({ vi, en })))
  Object.values(getState().vocab).forEach((v) => v.vi?.toLowerCase().includes(n) && out.push({ vi: v.vi, en: v.en }))
  return [...new Map(out.map((x) => [x.en, x])).values()].slice(0, 6)
}

function TranslateTask({ item }) {
  const settings = useStore((s) => s.settings)
  const [text, setText] = useState('')
  const [shownHints, setShownHints] = useState(0)
  const [q, setQ] = useState('')
  const [aiLookup, setAiLookup] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const offline = useMemo(() => lookupOffline(q), [q])

  const doLookup = async () => {
    if (!aiEnabled() || !q.trim()) return
    setAiLookup({ loading: true })
    try { setAiLookup(await lookupPhrase({ phrase: q, context: item.vi })) } catch (e) { setAiLookup({ error: String(e.message || e) }) }
  }

  const submit = async () => {
    setBusy(true)
    const sim = similarity(text, item.en)
    const terms = item.glossary.map(([, en]) => en)
    const used = terms.filter((en) => chunkUsed(en, text))
    const out = { sim: Math.round(sim * 100), used, terms }
    // AI chấm song song với LanguageTool; kết quả LanguageTool hiện trước, AI hiện sau (không bắt chờ)
    const aiP = aiEnabled() ? gradeTranslation({ vi: item.vi, reference: item.en, text }).then((r) => ({ r }), (e) => ({ e })) : null
    if (settings.grammarCheck) {
      try { out.grammar = await checkGrammar(text) } catch (e) { out.grammarError = String(e.message || e) }
    }
    const schedule = (ai) => {
      // Mức nhớ 0–5 cho lịch ôn
      let grade = ai?.score != null ? ai.score / 2 : 5 * (0.5 * (used.length / terms.length) + 0.5 * Math.min(1, sim / 0.6))
      grade -= (shownHints / Math.max(1, terms.length)) * 2
      scheduleReview('translate', item.id, Math.max(0, grade), `✍️ ${item.titleVi}`)
    }
    update((s) => {
      const r = s.translations[item.id] || (s.translations[item.id] = { attempts: 0 })
      r.attempts += 1
      r.last = text
      r.lastAt = Date.now()
    })
    if (aiP) {
      out.aiLoading = true
      aiP.then(({ r, e }) => {
        setResult((x) => (x ? { ...x, aiLoading: false, ai: r, aiError: e ? String(e.message || e) : undefined } : x))
        schedule(r)
      })
    } else schedule(null)
    logHistory('translate', `${item.titleVi} · khớp ${out.sim}%`)
    setResult(out)
    setBusy(false)
  }

  return (
    <div className="space-y-4">
      <a href="#/writing/translate" className="text-sm text-indigo-600 hover:underline">← Danh sách đoạn văn</a>
      <div className="card space-y-3">
        <div className="flex items-center gap-2"><TierChip tier={item.tier} /><b>{item.titleVi}</b></div>
        <p className="text-lg leading-8">{item.vi}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-ghost !py-1" disabled={shownHints >= item.glossary.length} onClick={() => setShownHints((n) => n + 1)}>💡 Gợi ý từ ({shownHints}/{item.glossary.length})</button>
          {item.glossary.slice(0, shownHints).map(([vi, en]) => (
            <span key={en} className="chip bg-amber-100 text-amber-900">{vi} → <b className="ml-1">{en}</b></span>
          ))}
        </div>
      </div>

      <div className="card space-y-2">
        <div className="label">Tra nhanh khi bí từ (gõ tiếng Việt)</div>
        <div className="flex gap-2">
          <input className="input" value={q} onChange={(e) => { setQ(e.target.value); setAiLookup(null) }} onKeyDown={(e) => e.key === 'Enter' && doLookup()} placeholder="vd: chậm tiến độ, rò khí, xả nước…" />
          {aiEnabled() && <button className="btn-ghost" onClick={doLookup}>Hỏi AI</button>}
        </div>
        {offline.length > 0 && <div className="flex flex-wrap gap-2">{offline.map((o) => <span key={o.en} className="chip bg-sky-50 text-sky-800">{o.vi} → <b className="ml-1">{o.en}</b></span>)}</div>}
        {q && !offline.length && !aiEnabled() && <div className="text-xs text-slate-400">Không có trong từ điển sẵn có. Nhập API key để tra bằng AI.</div>}
        {aiLookup?.loading && <div className="text-xs text-slate-500">Đang tra…</div>}
        {aiLookup?.error && <div className="text-xs text-rose-600">{aiLookup.error}</div>}
        {aiLookup?.options && (
          <div className="text-sm space-y-1">
            {aiLookup.options.map((o) => <div key={o.en}><b>{o.en}</b> <span className="text-slate-500">– {o.note_vi}</span></div>)}
            {aiLookup.example && <div className="text-slate-600">“{aiLookup.example}”</div>}
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <div className="label">Bản dịch của bạn</div>
        <textarea className="input min-h-[150px] text-base" value={text} onChange={(e) => setText(e.target.value)} disabled={!!result} placeholder="Viết bản dịch tiếng Anh ở đây…" spellCheck />
        {!result ? (
          <button className="btn-primary" disabled={normalize(text).length < 8 || busy} onClick={submit}>{busy ? 'Đang chấm…' : 'Nộp & sửa lỗi'}</button>
        ) : (
          <button className="btn-ghost" onClick={() => { setResult(null) }}>✏️ Sửa lại bản dịch</button>
        )}
      </div>

      {result && (
        <div className="card space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>Độ khớp ý với bản mẫu: <b>{result.sim}%</b></span>
            {result.ai?.score != null && <span>AI chấm: <b>{result.ai.score}/10</b></span>}
            <span>Cụm từ khoá: <b>{result.used.length}/{result.terms.length}</b></span>
          </div>

          <div>
            <div className="label mb-2">Ngữ pháp & chính tả {settings.grammarCheck ? '(LanguageTool)' : ''}</div>
            {result.grammarError && <div className="text-sm text-rose-600">Không kiểm tra được: {result.grammarError}</div>}
            {result.grammar && result.grammar.length === 0 && <div className="text-sm text-emerald-700">✓ Không phát hiện lỗi ngữ pháp/chính tả.</div>}
            {result.grammar?.length > 0 && (
              <div className="space-y-1 text-sm">
                {result.grammar.map((m, i) => (
                  <div key={i}>• <s className="text-rose-600">{m.wrong}</s> → <b className="text-emerald-700">{m.replacements.join(' / ') || '?'}</b> <span className="text-slate-500">– {m.message}</span></div>
                ))}
                <div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-500">Bản đã sửa tự động: </span>{applyFixes(text, result.grammar)}</div>
              </div>
            )}
            {!settings.grammarCheck && <div className="text-xs text-slate-400">Bật “Sửa ngữ pháp bằng LanguageTool” trong Cài đặt.</div>}
          </div>

          {result.aiLoading && <div className="text-sm text-slate-500">🤖 AI đang chấm bản dịch…<Elapsed /></div>}
          {result.aiError && <div className="text-sm text-rose-600">AI lỗi: {result.aiError}</div>}
          {result.ai && (
            <div className="rounded-xl bg-indigo-50 p-3 text-sm space-y-2">
              <div><b>Bản sửa của AI:</b> {result.ai.corrected}</div>
              {result.ai.grammar?.length > 0 && <div><b>Ngữ pháp:</b>{result.ai.grammar.map((g, i) => <div key={i}>• <s className="text-rose-600">{g.from}</s> → <b className="text-emerald-700">{g.to}</b> <span className="text-slate-500">({g.why_vi})</span></div>)}</div>}
              {result.ai.vocab?.length > 0 && <div><b>Từ vựng tự nhiên hơn:</b>{result.ai.vocab.map((g, i) => <div key={i}>• {g.from} → <b className="text-emerald-700">{g.to}</b> <span className="text-slate-500">({g.why_vi})</span></div>)}</div>}
              {result.ai.missing_vi && <div className="text-amber-800">Thiếu ý: {result.ai.missing_vi}</div>}
              <div className="text-slate-600">{result.ai.feedback_vi}</div>
            </div>
          )}

          <div>
            <div className="label mb-2">Cụm từ khoá trong đoạn</div>
            <div className="flex flex-wrap gap-2">{result.terms.map((en) => <span key={en} className={`chip ${result.used.includes(en) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{en}</span>)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="label mb-1">Bản dịch mẫu (một cách diễn đạt tự nhiên)</div>
            <div>{item.en} <button onClick={() => speak(item.en)}>🔈</button></div>
          </div>
          <p className="text-xs text-slate-500">Bước cuối: đọc to bản dịch mẫu 2 lần. Đoạn này sẽ được nhắc ôn lại theo lịch – lần sau hãy thử dịch mà không cần gợi ý.</p>
        </div>
      )}
    </div>
  )
}
