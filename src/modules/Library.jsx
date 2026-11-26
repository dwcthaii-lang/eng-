// Thư viện bài học: xem tất cả tình huống, tạo thêm không giới hạn bằng AI, nhập/xuất gói bài học
import { useRef, useState } from 'react'
import { useSituations, TIERS, TIER_IDS, baseSituations, randomTopic } from '../data'
import { useStore, update, logHistory } from '../lib/store'
import { nextDueLabel } from '../lib/review'
import { aiEnabled, generateSituation } from '../lib/ai'
import { today } from '../lib/date'
import { Elapsed } from '../components/Elapsed'
import { PageHeader, TierChip } from '../components/ui'

// Kiểm tra & chuẩn hoá một tình huống (từ AI hoặc file)
export function normalizeSituation(raw, tier) {
  const id = raw.id && !baseSituations.some((b) => b.id === raw.id) ? String(raw.id) : `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
  const t = [1, 2, 3].includes(Number(raw.tier || tier)) ? Number(raw.tier || tier) : 1
  const recall = (raw.recall || []).slice(0, 4).map((r, i) => ({
    id: `${id}-${i + 1}`, vi: String(r.vi || ''), context: String(r.context || ''),
    chunks: (r.chunks || []).slice(0, 4).map((c) => ({ en: String(c.en || ''), vi: String(c.vi || '') })).filter((c) => c.en),
    model: String(r.model || ''),
  })).filter((r) => r.vi && r.chunks.length && r.model)
  const L = raw.listening || {}
  const lines = (L.lines || []).map((l) => ({ s: l.s === 'B' ? 'B' : 'A', t: String(l.t || '') })).filter((l) => l.t)
  const R = raw.roleplay || {}
  const turns = (R.turns || []).map((x) => ({ ai: String(x.ai || ''), hint: (x.hint || []).slice(0, 3).map(String), model: String(x.model || '') })).filter((x) => x.ai)
  if (!recall.length || lines.length < 3 || !turns.length) throw new Error('Dữ liệu bài học chưa đủ (cần thẻ nói, bài nghe ≥3 câu, nhập vai).')
  return {
    id, tier: t, custom: true, emoji: String(raw.emoji || '✨').slice(0, 4), title: String(raw.title || 'New situation'), titleVi: String(raw.titleVi || raw.title || 'Tình huống mới'),
    recall,
    listening: {
      speakers: { A: String(L.speakers?.A || 'Speaker A'), B: String(L.speakers?.B || 'Minh') },
      gistVi: String(L.gistVi || ''), keyPoints: (L.keyPoints || []).map(String),
      chunks: (L.chunks || []).map((c) => ({ en: String(c.en || ''), vi: String(c.vi || '') })).filter((c) => c.en),
      lines,
    },
    roleplay: {
      aiName: String(R.aiName || 'Alex'), aiRoleEn: String(R.aiRoleEn || 'a conversation partner'), roleVi: String(R.roleVi || 'Người đối thoại'),
      setupEn: String(R.setupEn || ''), goalVi: String(R.goalVi || ''), turns,
    },
    createdAt: today(),
  }
}

export default function Library() {
  const situations = useSituations()
  const reviews = useStore((s) => s.reviews)
  const listening = useStore((s) => s.listening)
  const [tier, setTier] = useState(1)
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  const create = async () => {
    setBusy(true)
    setMsg('')
    try {
      const titles = situations.map((x) => `${x.titleVi} (${x.title})`)
      const raw = await generateSituation({ tier, topicVi: topic || randomTopic(tier, titles), avoid: titles })
      const sit = normalizeSituation(raw, tier)
      update((s) => { s.customSituations.push(sit) })
      logHistory('recall', `Tạo tình huống mới: ${sit.titleVi}`)
      setMsg(`✅ Đã tạo “${sit.emoji} ${sit.titleVi}”. Bài đã có trong cả 3 module.`)
      setTopic('')
    } catch (e) {
      setMsg('❌ ' + (e.message || e))
    }
    setBusy(false)
  }

  const exportPack = () => {
    const custom = situations.filter((s) => s.custom)
    const blob = new Blob([JSON.stringify({ type: 'english-reflex-lessons', situations: custom }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `english-reflex-lessons-${today()}.json`
    a.click()
  }
  const importPack = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      const list = Array.isArray(data) ? data : data.situations || [data]
      const ok = []
      list.forEach((raw) => { try { ok.push(normalizeSituation(raw, raw.tier || 1)) } catch {} })
      update((s) => {
        ok.forEach((sit) => {
          const i = s.customSituations.findIndex((x) => x.id === sit.id)
          if (i >= 0) s.customSituations[i] = sit
          else s.customSituations.push(sit)
        })
      })
      setMsg(`✅ Đã nhập ${ok.length}/${list.length} tình huống.`)
    } catch {
      setMsg('❌ File không hợp lệ')
    }
    e.target.value = ''
  }
  const remove = (id) => update((s) => { s.customSituations = s.customSituations.filter((x) => x.id !== id) })

  const t = today()
  const chip = (type, id) => {
    const r = reviews[`${type}:${id}`]
    if (!r) return <span className="text-slate-300">—</span>
    return <span className={r.due <= t ? 'text-rose-600 font-semibold' : 'text-emerald-700'}>{r.due <= t ? 'Cần ôn' : nextDueLabel(r).replace('Ôn lại ', '')}</span>
  }

  return (
    <div>
      <PageHeader title="🗃️ Thư viện bài học" subtitle={`${situations.length} tình huống (${situations.filter((s) => s.custom).length} do bạn tạo thêm). Mỗi tình huống có thẻ nói, bài nghe và kịch bản nhập vai.`} />

      <div className="card mb-4 space-y-3">
        <div className="label">✨ Tạo tình huống mới – không giới hạn</div>
        {aiEnabled() ? (
          <>
            <div className="flex flex-wrap gap-2">
              {TIER_IDS.map((k) => <button key={k} onClick={() => setTier(k)} className={tier === k ? 'btn-primary !py-1' : 'btn-ghost !py-1'}>{TIERS[k].label}</button>)}
            </div>
            <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Chủ đề bạn muốn (tuỳ chọn), vd: mượn xe máy của bạn, hỏi giáo sư về học bổng, máy ALD báo lỗi nhiệt độ…" />
            <button className="btn-primary" onClick={create} disabled={busy}>{busy ? <>⏳ AI đang soạn bài…<Elapsed /></> : '✨ Tạo bằng AI'}</button>
          </>
        ) : (
          <p className="text-sm text-slate-600">Nhập API key Gemini (miễn phí) trong <a className="text-indigo-600 underline" href="#/settings">Cài đặt</a> để AI soạn thêm tình huống mới theo chủ đề bạn muốn, đủ cho cả 3 module. Không có key: bạn vẫn có thể nhập gói bài học (file JSON) bên dưới và tự thêm cụm từ ở Kho từ vựng.</p>
        )}
        {msg && <div className="text-sm">{msg}</div>}
        <div className="flex flex-wrap gap-2 pt-1">
          <button className="btn-ghost !py-1" onClick={exportPack} disabled={!situations.some((s) => s.custom)}>⬇ Xuất gói bài đã tạo</button>
          <button className="btn-ghost !py-1" onClick={() => fileRef.current.click()}>⬆ Nhập gói bài học (.json)</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importPack} />
        </div>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Tình huống</th><th className="p-3">Thẻ nói</th><th className="p-3">Nghe</th><th className="p-3">Nhập vai</th><th /></tr>
          </thead>
          <tbody>
            {situations.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="p-3">
                  <div className="font-medium">{s.emoji} {s.titleVi} {s.custom && <span className="chip bg-amber-100 text-amber-800 ml-1">tự tạo</span>}</div>
                  <div className="mt-1"><TierChip tier={s.tier} /></div>
                </td>
                <td className="p-3">{s.recall.map((r) => <div key={r.id}>{chip('recall', r.id)}</div>)}</td>
                <td className="p-3"><a href={`#/listening/${s.id}`} className="hover:underline">{listening[s.id]?.done ? chip('listening', s.id) : 'Học →'}</a></td>
                <td className="p-3"><a href={`#/roleplay/${s.id}`} className="hover:underline">{reviews[`roleplay:${s.id}`] ? chip('roleplay', s.id) : 'Học →'}</a></td>
                <td className="p-3 text-right">{s.custom && <button className="text-slate-400 hover:text-rose-600" onClick={() => remove(s.id)} title="Xoá">✕</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
