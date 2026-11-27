// Dịch đoạn văn Việt -> Anh: gợi ý từ khi bí, sửa ngữ pháp (LanguageTool) + từ vựng (AI), có lịch ôn
import { useEffect, useMemo, useRef, useState } from 'react'
import { getTranslations, useTranslations } from '../data/translations'
import { EndlessCard } from '../components/Endless'
import { seedVocab } from '../lib/srs'
import { TIERS, TIER_IDS, findSituation } from '../data'
import { useStore, update, getState, logHistory } from '../lib/store'
import { scheduleReview, nextDueLabel } from '../lib/review'
import { similarity, chunkUsed, normalize } from '../lib/text'
import { speak } from '../lib/speech'
import { aiEnabled, gradeTranslation, lookupPhrase } from '../lib/ai'
import { checkGrammar, applyFixes, isMinorMatch } from '../lib/grammar'
import { lookupViEn } from '../lib/dict'
import { GradeView } from '../components/GradeView'
import { today } from '../lib/date'
import { Elapsed } from '../components/Elapsed'
import { TierChip, FreqGroups } from '../components/ui'

export default function Translate({ id }) {
  const list = useTranslations()
  const item = list.find((x) => x.id === id)
  return item ? <TranslateTask key={item.id} item={item} /> : <TranslateList />
}

function TranslateList() {
  const reviews = useStore((s) => s.reviews)
  const translationSet = useTranslations()
  const t = today()
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">Đọc đoạn tiếng Việt → dịch sang tiếng Anh tự nhiên. Bí từ thì bấm gợi ý hoặc tra nhanh. Sau khi nộp: sửa ngữ pháp, gợi ý từ tự nhiên hơn, so với bản mẫu. Mỗi đoạn được xếp lịch ôn lại.</p>
      {TIER_IDS.map((tier) => (
        <div key={tier}>
          <div className="label mb-2">{TIERS[tier].label}</div>
          <FreqGroups cols="sm:grid-cols-2 !gap-2" items={translationSet.filter((x) => x.tier === tier).map((x) => ({ ...x, freq: x.freq || findSituation(x.situationId)?.freq }))} render={(x) => {
              const rv = reviews[`translate:${x.id}`]
              return (
                <a key={x.id} href={`#/writing/translate/${x.id}`} className="card !p-4 flex items-center justify-between gap-3 hover:border-indigo-300">
                  <span className="font-medium">{x.titleVi}{x.custom && <span className="chip bg-amber-100 text-amber-800 ml-2">AI tạo</span>}</span>
                  {rv ? <span className={`chip ${rv.due <= t ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{rv.due <= t ? '📅 Cần ôn' : nextDueLabel(rv)}</span> : <span className="chip bg-slate-100 text-slate-600">Mới</span>}
                </a>
              )
            }} />
          <EndlessCard kind="translation" tier={tier} label="đoạn dịch" total={translationSet.filter((x) => x.tier === tier).length} done={translationSet.filter((x) => x.tier === tier && reviews[`translate:${x.id}`]).length} hrefFor={(it) => `#/writing/translate/${it.id}`} />
        </div>
      ))}
    </div>
  )
}

function lookupOffline(q) {
  const n = q.trim().toLowerCase()
  if (!n) return []
  const out = []
  getTranslations().forEach((t) => t.glossary.forEach(([vi, en]) => vi.toLowerCase().includes(n) && out.push({ vi, en })))
  Object.values(getState().vocab).forEach((v) => v.vi?.toLowerCase().includes(n) && out.push({ vi: v.vi, en: v.en }))
  return [...new Map(out.map((x) => [x.en, x])).values()].slice(0, 6)
}

const aiCache = {}

function TranslateTask({ item }) {
  const settings = useStore((s) => s.settings)
  const [text, setText] = useState('')
  const [shownHints, setShownHints] = useState(0)
  const [q, setQ] = useState('')
  const [aiLookup, setAiLookup] = useState(null)
  const [quick, setQuick] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const offline = useMemo(() => lookupOffline(q), [q])
  const qRef = useRef('')

  // Tra nhanh (Google/MyMemory, không cần AI) – tự chạy khi ngừng gõ 0,5 giây
  const quickLookup = async (phrase) => {
    const p = phrase.trim()
    if (!p) return setQuick(null)
    setQuick((x) => (x?.q === p ? x : { q: p, loading: true }))
    const r = await lookupViEn(p)
    if (qRef.current.trim() === p) setQuick({ q: p, ...(r || { none: true }) })
  }
  useEffect(() => {
    qRef.current = q
    if (!q.trim()) { setQuick(null); return }
    const t = setTimeout(() => quickLookup(q), 500)
    return () => clearTimeout(t)
  }, [q])

  const doLookup = async () => {
    const p = q.trim()
    if (!p) return
    quickLookup(p)
    if (!aiEnabled()) return
    if (aiCache[p.toLowerCase()]) return setAiLookup(aiCache[p.toLowerCase()])
    setAiLookup({ loading: true, q: p })
    try {
      const r = await lookupPhrase({ phrase: p, context: item.vi })
      aiCache[p.toLowerCase()] = r
      if (qRef.current.trim() === p) setAiLookup(r)
    } catch (e) { if (qRef.current.trim() === p) setAiLookup({ error: String(e.message || e) }) }
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
    seedVocab(item.glossary.map(([vi, en]) => ({ en, vi, source: `translate:${item.id}` })))
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
    logHistory('translate', `${item.titleVi}`)
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
          <input className="input" value={q} onChange={(e) => { setQ(e.target.value); setAiLookup(null) }} onKeyDown={(e) => e.key === 'Enter' && doLookup()} placeholder="vd: chậm tiến độ, rò khí, không xả nước…" />
          <button className="btn-ghost shrink-0" onClick={doLookup}>{aiEnabled() ? 'Tra + hỏi AI' : 'Tra'}</button>
        </div>
        {offline.length > 0 && <div className="flex flex-wrap gap-2">{offline.map((o) => <span key={o.en} className="chip bg-sky-50 text-sky-800">{o.vi} → <b className="ml-1">{o.en}</b></span>)}</div>}
        {quick?.loading && <div className="text-xs text-slate-500">Đang tra…</div>}
        {quick?.main && (
          <div className="text-sm space-y-1">
            <div><span className="text-slate-500">Dịch nhanh:</span> <b>{quick.main}</b> <button onClick={() => speak(quick.main)}>🔈</button> <span className="text-xs text-slate-400">(máy dịch – nên kiểm tra lại)</span></div>
            {quick.alts?.length > 0 && <div className="flex flex-wrap gap-1.5">{quick.alts.map((a) => <span key={a.en} className="chip bg-slate-100 text-slate-700">{a.en}{a.pos && <span className="ml-1 text-slate-400">({a.pos})</span>}</span>)}</div>}
          </div>
        )}
        {quick?.none && !offline.length && <div className="text-xs text-slate-400">Không tìm được bản dịch nhanh{aiEnabled() ? ' – bấm “Tra + hỏi AI” (hoặc Enter).' : '.'}</div>}
        {aiLookup?.loading && <div className="text-xs text-slate-500">🤖 AI đang gợi ý cách nói tự nhiên theo ngữ cảnh…<Elapsed /></div>}
        {aiLookup?.error && <div className="text-xs text-rose-600">AI chưa trả lời được: {aiLookup.error}{quick?.main ? ' – dùng tạm kết quả tra nhanh ở trên.' : ''}</div>}
        {aiLookup?.options && (
          <div className="rounded-lg bg-indigo-50 p-2 text-sm space-y-1">
            <div className="text-xs font-semibold text-indigo-700">🤖 AI gợi ý (theo ngữ cảnh đoạn văn)</div>
            {aiLookup.options.map((o) => <div key={o.en}><b>{o.en}</b> <button onClick={() => speak(o.en)}>🔈</button> <span className="text-slate-500">– {o.note_vi}</span></div>)}
            {aiLookup.example && <div className="text-slate-600">“{aiLookup.example}”{aiLookup.example_vi && <span className="text-slate-400"> – {aiLookup.example_vi}</span>}</div>}
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
          {result.aiLoading && <div className="text-sm text-slate-500">🤖 AI đang chấm theo Ý của cả đoạn, sửa lỗi và viết bản tự nhiên…<Elapsed /></div>}
          {result.aiError && <div className="text-sm text-rose-600">AI chưa chấm được: {result.aiError}</div>}
          {result.ai && <GradeView r={result.ai} text={text} kind="dịch" />}
          {!result.ai && (
            <div className="text-sm text-slate-500">
              Độ trùng từ với bản mẫu: <b>{result.sim}%</b> <span className="text-xs">(chỉ tham khảo – trùng từ không có nghĩa là đúng ý. {aiEnabled() ? 'AI sẽ chấm theo ý.' : 'Bật AI trong Cài đặt để được chấm theo ý cả câu.'})</span>
            </div>
          )}

          <GrammarBlock result={result} text={text} enabled={settings.grammarCheck} />

          <div>
            <div className="label mb-2">Cụm từ trong bản mẫu (tham khảo – không bắt buộc, không tính điểm)</div>
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

// Lỗi LanguageTool: lỗi thật trước, lỗi nhỏ (viết hoa/dấu câu) gộp gọn
function GrammarBlock({ result, text, enabled }) {
  const all = result.grammar || []
  const main = all.filter((m) => !isMinorMatch(m))
  const minor = all.filter(isMinorMatch)
  return (
    <div>
      <div className="label mb-2">Kiểm tra chính tả nhanh {enabled ? '(LanguageTool)' : ''}</div>
      {result.grammarError && <div className="text-sm text-rose-600">Không kiểm tra được: {result.grammarError}</div>}
      {result.grammar && all.length === 0 && <div className="text-sm text-emerald-700">✓ Không phát hiện lỗi chính tả/ngữ pháp cơ bản.</div>}
      {main.length > 0 && (
        <div className="space-y-1 text-sm">
          {main.map((m, i) => <div key={i}>• <s className="text-rose-600">{m.wrong}</s> → <b className="text-emerald-700">{m.replacements.join(' / ') || '?'}</b> <span className="text-slate-500">– {m.message}</span></div>)}
        </div>
      )}
      {minor.length > 0 && <div className="mt-1 text-xs text-slate-500">Lỗi nhỏ viết hoa/dấu câu ({minor.length}): {minor.slice(0, 6).map((m) => `${m.wrong || '·'}→${m.replacements[0] ?? ''}`).join(', ')}</div>}
      {all.length > 0 && !result.ai && <div className="mt-1 rounded-lg bg-slate-50 p-2 text-sm"><span className="text-slate-500">Bản sửa chính tả tự động: </span>{applyFixes(text, all)}</div>}
      {!enabled && <div className="text-xs text-slate-400">Bật “Sửa ngữ pháp bằng LanguageTool” trong Cài đặt.</div>}
    </div>
  )
}
