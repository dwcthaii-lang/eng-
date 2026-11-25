// MODULE 4: Thống kê & tiến độ (dashboard)
import { useState } from 'react'
import { useStore } from '../lib/store'
import { today, lastNDays, fmtMin } from '../lib/date'
import { stageCounts, isDue, STAGES } from '../lib/srs'
import { situations } from '../data'
import { PageHeader, Progress } from '../components/ui'

const PLAN = [
  { key: 'recall', label: 'Từ vựng chủ động', min: 20, href: '#/recall', icon: '🗣️' },
  { key: 'listening', label: 'Nghe cai phụ đề', min: 25, href: '#/listening', icon: '🎧' },
  { key: 'roleplay', label: 'Nhập vai phản xạ', min: 30, href: '#/roleplay', icon: '⏱️' },
  { key: 'writing', label: 'Đọc & Viết', min: 15, href: '#/writing', icon: '✍️' },
]

const STAGE_BAR = { new: 'bg-slate-300', heard: 'bg-sky-400', spoken: 'bg-amber-400', mastered: 'bg-emerald-500' }

function WeekChart({ days, time, goal }) {
  const [hover, setHover] = useState(null)
  const vals = days.map((d) => fmtMin(time[d]?.total))
  const max = Math.max(goal, ...vals, 1)
  return (
    <div>
      <div className="relative flex h-40 items-end gap-2 border-b border-slate-200">
        <div className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-slate-300" style={{ bottom: `${(goal / max) * 100}%` }}>
          <span className="absolute -top-4 right-0 text-[10px] text-slate-400">mục tiêu {goal}′</span>
        </div>
        {days.map((d, i) => (
          <div key={d} className="relative flex h-full flex-1 items-end justify-center" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className={`w-full max-w-[28px] rounded-t ${d === today() ? 'bg-indigo-600' : 'bg-indigo-300'}`} style={{ height: `${(vals[i] / max) * 100}%`, minHeight: vals[i] ? 2 : 0 }} />
            {hover === i && (
              <div className="absolute bottom-full mb-1 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs text-white shadow">
                {d.slice(5)}: <b>{vals[i]} phút</b>
                {PLAN.map((p) => (time[d]?.[p.key] ? <div key={p.key}>{p.label}: {fmtMin(time[d][p.key])}′</div> : null))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2 text-center text-[11px] text-slate-500">
        {days.map((d) => <div key={d} className="flex-1">{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(d + 'T00:00').getDay()]}</div>)}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const s = useStore()
  const t = today()
  const goal = s.settings.dailyGoalMin
  const todayRec = s.time[t] || {}
  const todayMin = fmtMin(todayRec.total)
  const days = lastNDays(7)
  const counts = stageCounts(s.vocab)
  const totalVocab = Object.values(counts).reduce((a, b) => a + b, 0)
  const due = Object.values(s.vocab).filter((v) => isDue(v)).length
  const reactivate = Object.values(s.vocab).filter((v) => v.reactivate && v.stage !== 'mastered').length
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = lastNDays(i + 1)[0]
    if (fmtMin(s.time[d]?.total) >= 15) streak++
    else if (i > 0) break
  }
  const listenDone = situations.filter((x) => s.listening[x.id]?.done).length
  const roleplayDone = situations.filter((x) => s.roleplay[x.id]?.count).length

  return (
    <div>
      <PageHeader title="📊 Tổng quan hôm nay" subtitle="Mục tiêu: 60–120 phút/ngày, chia nhỏ 15–30 phút/phiên. Thời gian chỉ được tính khi bạn thật sự thao tác." />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-1">
          <div className="label">Thời gian học hôm nay</div>
          <div className="mt-2 text-4xl font-bold">{todayMin}<span className="text-lg text-slate-400"> / {goal} phút</span></div>
          <div className="mt-3"><Progress value={todayMin} max={goal} color={todayMin >= 60 ? 'bg-emerald-500' : 'bg-indigo-500'} /></div>
          <div className="mt-2 text-sm text-slate-500">{todayMin >= goal ? '🎉 Đạt mục tiêu!' : todayMin >= 60 ? '✅ Đã qua mức tối thiểu 60 phút' : `Còn ${Math.max(0, 60 - todayMin)} phút tới mức tối thiểu`}</div>
          <div className="mt-3 text-sm">🔥 Chuỗi ngày học (≥15′): <b>{streak}</b></div>
        </div>
        <div className="card md:col-span-2">
          <div className="label mb-3">7 ngày gần nhất (phút)</div>
          <WeekChart days={days} time={s.time} goal={goal} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="label mb-3">Lộ trình 90 phút hôm nay</div>
          <div className="space-y-3">
            {PLAN.map((p) => {
              const m = fmtMin(todayRec[p.key])
              return (
                <a key={p.key} href={p.href} className="block rounded-xl p-2 hover:bg-slate-50">
                  <div className="flex justify-between text-sm">
                    <span>{p.icon} {p.label}</span>
                    <span className={m >= p.min ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>{m}/{p.min}′ {m >= p.min && '✓'}</span>
                  </div>
                  <div className="mt-1"><Progress value={m} max={p.min} color={m >= p.min ? 'bg-emerald-500' : 'bg-indigo-400'} /></div>
                </a>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">Gợi ý: nghỉ 5 phút giữa các phiên. Nếu chỉ có 60 phút: 15′ từ vựng + 20′ nghe + 25′ nhập vai.</p>
        </div>

        <div className="card">
          <div className="label mb-3">Kho từ vựng theo kỹ năng nói ({totalVocab} cụm)</div>
          <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full">
            {Object.keys(STAGES).map((k) => counts[k] ? <div key={k} title={`${STAGES[k].label}: ${counts[k]}`} className={STAGE_BAR[k]} style={{ width: `${(counts[k] / Math.max(1, totalVocab)) * 100}%` }} /> : null)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(STAGES).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-sm ${STAGE_BAR[k]}`} />
                <span className="flex-1 text-slate-600">{v.label}</span>
                <b>{counts[k] || 0}</b>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="#/recall" className="btn-primary">Ôn {due} cụm đến hạn</a>
            {reactivate > 0 && <a href="#/recall" className="btn-danger">🔁 {reactivate} từ cần kích hoạt lại</a>}
            <a href="#/vocab" className="btn-ghost">Xem kho từ</a>
          </div>
          <p className="mt-3 text-xs text-slate-500">“Thành thạo” = tự nói đúng cụm từ trong ngữ cảnh, không xem gợi ý, ở 3 ngày ôn khác nhau.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="card"><div className="label">Bài nghe hoàn thành</div><div className="mt-1 text-2xl font-bold">{listenDone}/{situations.length}</div></div>
        <div className="card"><div className="label">Tình huống đã nhập vai</div><div className="mt-1 text-2xl font-bold">{roleplayDone}/{situations.length}</div></div>
        <div className="card"><div className="label">Tình huống nói đã thử</div><div className="mt-1 text-2xl font-bold">{Object.keys(s.recall).length}/{situations.length * 2}</div></div>
      </div>

      <div className="card mt-4">
        <div className="label mb-2">Hoạt động gần đây</div>
        {s.history.length === 0 ? (
          <div className="text-sm text-slate-500">Chưa có hoạt động. Bắt đầu với <a className="text-indigo-600 underline" href="#/recall">Module 1</a> nhé!</div>
        ) : (
          <div className="space-y-1 text-sm">
            {s.history.slice(0, 8).map((h, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-28 shrink-0 text-slate-400">{new Date(h.at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                <span>{{ recall: '🗣️', listening: '🎧', roleplay: '⏱️', writing: '✍️' }[h.module]} {h.detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
