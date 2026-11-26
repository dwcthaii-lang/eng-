// Lịch sử học đầy đủ (lưu trong trình duyệt, tối đa 3000 hoạt động gần nhất)
import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { today, fmtMin } from '../lib/date'
import { PageHeader } from '../components/ui'

const MOD = { recall: '🗣️ Nói', listening: '🎧 Nghe', roleplay: '⏱️ Nhập vai', writing: '✍️ Viết', translate: '✍️ Dịch', course: '🧭 Lộ trình' }

export default function History() {
  const history = useStore((s) => s.history)
  const time = useStore((s) => s.time)
  const [mod, setMod] = useState('all')
  const groups = useMemo(() => {
    const g = {}
    history.filter((h) => mod === 'all' || h.module === mod).forEach((h) => {
      const d = today(new Date(h.at))
      ;(g[d] = g[d] || []).push(h)
    })
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]))
  }, [history, mod])
  const totalMin = Object.values(time).reduce((a, d) => a + fmtMin(d.total), 0)
  const days = Object.values(time).filter((d) => fmtMin(d.total) >= 1).length

  return (
    <div>
      <PageHeader title="🗂️ Lịch sử học" subtitle={`Tổng ${totalMin} phút trong ${days} ngày · ${history.length} hoạt động đã lưu`} />
      <div className="mb-4 flex flex-wrap gap-2">
        {[['all', 'Tất cả'], ...Object.entries(MOD)].map(([k, l]) => <button key={k} onClick={() => setMod(k)} className={mod === k ? 'btn-primary !py-1' : 'btn-ghost !py-1'}>{l}</button>)}
      </div>
      {groups.length === 0 && <div className="card text-sm text-slate-500">Chưa có hoạt động nào.</div>}
      <div className="space-y-3">
        {groups.map(([d, items]) => (
          <div key={d} className="card !p-4">
            <div className="mb-2 flex justify-between text-sm"><b>{d.slice(8, 10)}/{d.slice(5, 7)}/{d.slice(0, 4)}</b><span className="text-slate-500">{fmtMin(time[d]?.total)} phút học</span></div>
            <div className="space-y-1 text-sm">
              {items.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-12 shrink-0 text-slate-400">{new Date(h.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="w-24 shrink-0">{MOD[h.module] || h.module}</span>
                  <span className="text-slate-700">{h.detail}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
