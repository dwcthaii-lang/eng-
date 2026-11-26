// Hiển thị một cụm từ theo "chùm": đồng nghĩa, trái nghĩa, từ liên quan, ví dụ văn nói
import { useState } from 'react'
import { getEnrich } from '../data/enrich'
import { useStore, update } from '../lib/store'
import { vocabId } from '../lib/srs'
import { speak } from '../lib/speech'
import { Elapsed } from './Elapsed'
import { aiEnabled, enrichChunk } from '../lib/ai'

function Row({ label, items, color }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-wrap items-baseline gap-1.5 text-sm">
      <span className="w-20 shrink-0 text-xs font-semibold text-slate-500">{label}</span>
      {items.map((x) => (
        <button key={x} onClick={() => speak(x)} className={`rounded-md px-2 py-0.5 ${color}`} title="Bấm để nghe">{x}</button>
      ))}
    </div>
  )
}

export function ChunkCluster({ en, vi, compact = false }) {
  const ai = useStore((s) => s.enrich)
  const data = getEnrich(en, ai)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const expand = async () => {
    setLoading(true)
    setErr('')
    try {
      const r = await enrichChunk({ en, vi })
      update((s) => { s.enrich[vocabId(en)] = { syn: r.syn || [], ant: r.ant || [], rel: r.rel || [], ex: r.ex || [] } })
    } catch (e) {
      setErr(String(e.message || e))
    }
    setLoading(false)
  }

  return (
    <div className={`rounded-xl border border-slate-200 ${compact ? 'p-3' : 'p-4'} space-y-1.5`}>
      <div className="flex items-center gap-2">
        <button onClick={() => speak(en)} className="font-semibold text-indigo-700">🔈 {en}</button>
        {vi && <span className="text-sm text-slate-500">· {vi}</span>}
      </div>
      {data ? (
        <>
          <Row label="Đồng nghĩa" items={data.syn} color="bg-emerald-50 text-emerald-800" />
          <Row label="Trái nghĩa" items={data.ant} color="bg-rose-50 text-rose-700" />
          <Row label="Liên quan" items={data.rel} color="bg-sky-50 text-sky-800" />
          {data.ex?.length > 0 && (
            <div className="space-y-0.5 pt-1">
              {data.ex.map((x) => (
                <div key={x} className="text-sm text-slate-700">
                  <button onClick={() => speak(x)} className="mr-1 text-slate-400 hover:text-indigo-600">🔈</button>“{x}”
                </div>
              ))}
            </div>
          )}
        </>
      ) : aiEnabled() ? (
        <button className="btn-ghost !py-1 text-xs" onClick={expand} disabled={loading}>{loading ? <>Đang tạo…<Elapsed /></> : '✨ Mở rộng cụm từ bằng AI (đồng nghĩa, ví dụ…)'}</button>
      ) : (
        <div className="text-xs text-slate-400">Chưa có dữ liệu mở rộng. Nhập API key trong Cài đặt để AI tạo đồng nghĩa, trái nghĩa và ví dụ.</div>
      )}
      {err && <div className="text-xs text-rose-600">{err}</div>}
    </div>
  )
}
