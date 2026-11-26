// "Học mãi": tạo bài mới bằng AI ngay dưới mỗi tầng – không bao giờ hết bài
import { useState } from 'react'
import { aiEnabled, generateSituation, generateTranslation } from '../lib/ai'
import { update, logHistory, getState } from '../lib/store'
import { randomTopic, TIERS, getSituations } from '../data'
import { getTranslations } from '../data/translations'
import { normalizeSituation } from '../modules/Library'
import { seedVocab } from '../lib/srs'
import { today } from '../lib/date'
import { Elapsed } from './Elapsed'

export async function createSituation(tier, topic) {
  const titles = getSituations().map((s) => `${s.titleVi} (${s.title})`)
  const raw = await generateSituation({ tier, topicVi: topic || randomTopic(tier, titles), avoid: titles })
  const sit = normalizeSituation({ ...raw, tier }, tier)
  update((s) => { (s.customSituations ||= []).push(sit) })
  logHistory('recall', `Tạo tình huống mới: ${sit.titleVi}`)
  return sit
}

export function normalizeTranslation(raw, tier) {
  const glossary = (raw.glossary || []).map((g) => (Array.isArray(g) ? g : [g?.vi, g?.en])).map(([vi, en]) => [String(vi || ''), String(en || '')]).filter(([vi, en]) => vi && en).slice(0, 6)
  if (!raw.vi || !raw.en || String(raw.vi).length < 30) throw new Error('AI trả về đoạn dịch chưa đủ, thử lại nhé.')
  return { id: `trc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, tier, custom: true, titleVi: String(raw.titleVi || 'Đoạn mới'), vi: String(raw.vi), en: String(raw.en), glossary, createdAt: today() }
}

export async function createTranslation(tier, topic) {
  const titles = getTranslations().map((t) => t.titleVi)
  const raw = await generateTranslation({ tier, topicVi: topic || randomTopic(tier, titles), avoid: titles })
  const item = normalizeTranslation(raw, tier)
  update((s) => { (s.customTranslations ||= []).push(item) })
  // cụm từ trong bài → kho từ (có lịch ôn)
  seedVocab(item.glossary.map(([vi, en]) => ({ en, vi, source: `translate:${item.id}` })))
  logHistory('translate', `Tạo đoạn dịch mới: ${item.titleVi}`)
  return item
}

// kind: 'situation' (dùng cho Nhập vai / Nghe / Thẻ nói) | 'translation'
export function EndlessCard({ kind, tier, total, done, hrefFor, label }) {
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const finished = total > 0 && done >= total
  const create = async (rand) => {
    setBusy(true); setMsg(null)
    try {
      const it = kind === 'translation' ? await createTranslation(tier, rand ? '' : topic) : await createSituation(tier, rand ? '' : topic)
      setMsg({ ok: true, title: it.titleVi, href: hrefFor(it) })
      setTopic('')
    } catch (e) { setMsg({ ok: false, text: String(e.message || e) }) }
    setBusy(false)
  }
  return (
    <div className={`mt-3 rounded-2xl border-2 border-dashed p-4 ${finished ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          {finished ? <b>🎉 Bạn đã học hết {total} bài có sẵn của {TIERS[tier].short} – tạo bài mới để học tiếp!</b> : <span className="text-slate-600">Đã học {done}/{total} bài. Học hết vẫn còn tiếp: AI soạn bài mới không giới hạn.</span>}
        </div>
      </div>
      {aiEnabled() ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !busy && create(false)} placeholder={`Chủ đề ${label || 'bài'} mới (tuỳ chọn) – để trống: AI tự chọn chủ đề chưa học`} />
          <div className="flex gap-2 shrink-0">
            <button className="btn-primary" disabled={busy} onClick={() => create(false)}>{busy ? <>⏳ AI đang soạn…<Elapsed /></> : '✨ Tạo bài mới'}</button>
            {!busy && <button className="btn-ghost" title="Chủ đề ngẫu nhiên chưa học" onClick={() => create(true)}>🎲</button>}
          </div>
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-500">Nhập API key Gemini (miễn phí) trong <a className="text-indigo-600 underline" href="#/settings">Cài đặt</a> để AI soạn bài mới không giới hạn.</div>
      )}
      {msg?.ok && <div className="mt-2 text-sm text-emerald-700">✅ Đã tạo “{msg.title}” – đã có lịch ôn sau khi học. <a className="font-semibold underline" href={msg.href}>Học ngay →</a></div>}
      {msg && !msg.ok && <div className="mt-2 text-sm text-rose-600">❌ {msg.text}</div>}
    </div>
  )
}

export const situationDone = (type, id) => !!getState().reviews[`${type}:${id}`]
