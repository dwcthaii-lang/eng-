import { useEffect, useState } from 'react'
import { STAGES } from '../lib/srs'
import { TIERS, FREQS, freqOf } from '../data'

export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function StageChip({ stage }) {
  const s = STAGES[stage] || STAGES.new
  return <span className={`chip ${s.color}`}>{s.label}</span>
}

export function TierChip({ tier }) {
  return <span className={`chip ${(TIERS[tier] || TIERS[1]).color}`}>{(TIERS[tier] || TIERS[1]).short}</span>
}

// Đồng hồ phiên học (gợi ý thời lượng của module)
export function SessionTimer({ targetMin }) {
  const [start] = useState(Date.now())
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const sec = Math.floor((now - start) / 1000)
  const mm = String(Math.floor(sec / 60)).padStart(2, '0'), ss = String(sec % 60).padStart(2, '0')
  const over = sec >= targetMin * 60
  return (
    <div className={`chip ${over ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} font-mono text-sm`}>
      ⏱ {mm}:{ss} / {targetMin}:00 {over && '· Xong phiên! Nghỉ 5 phút nhé'}
    </div>
  )
}

export function Progress({ value, max, color = 'bg-indigo-500' }) {
  const pct = Math.min(100, Math.round(((value || 0) / Math.max(1, max)) * 100))
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Shortcuts({ items }) {
  return (
    <div className="hidden md:flex flex-wrap gap-3 text-xs text-slate-500">
      {items.map(([k, label]) => (
        <span key={k}>
          <span className="kbd">{k}</span> {label}
        </span>
      ))}
    </div>
  )
}

// Nhóm bài theo mức độ thường gặp: Thường gặp → Thỉnh thoảng → Hiếm khi
export function FreqGroups({ items, render, cols = 'sm:grid-cols-2' }) {
  return (
    <div className="space-y-4">
      {FREQS.map(([k, label, hint]) => {
        const list = items.filter((x) => freqOf(x) === k)
        if (!list.length) return null
        return (
          <div key={k}>
            <div className="mb-2 flex items-baseline gap-2"><span className="text-sm font-semibold">{label}</span><span className="text-xs text-slate-500">{hint} · {list.length} bài</span></div>
            <div className={`grid gap-3 ${cols}`}>{list.map(render)}</div>
          </div>
        )
      })}
    </div>
  )
}
