// Ôn tập hôm nay: gom mọi bài đến hạn (thẻ nói, cụm từ, bài nghe, nhập vai, đoạn dịch)
import { useStore } from '../lib/store'
import { REVIEW_TYPES, dueReviews } from '../lib/review'
import { isDue } from '../lib/srs'
import { today, addDays, daysBetween } from '../lib/date'
import { PageHeader } from '../components/ui'
import { courseDueItems } from './Course'

export default function Review() {
  const s = useStore()
  const t = today()
  const due = dueReviews(s, t)
  const vocabDue = Object.values(s.vocab).filter((v) => isDue(v, t))
  const recallDue = due.filter((r) => r.type === 'recall')
  const courseDue = courseDueItems(s)
  const others = due.filter((r) => r.type !== 'recall')
  const all = Object.values(s.reviews)
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(t, i + 1)
    return { d, n: all.filter((r) => r.due === d).length }
  })
  const maxF = Math.max(1, ...forecast.map((f) => f.n))
  const nextDue = all.filter((r) => r.due > t).sort((a, b) => a.due.localeCompare(b.due))[0]

  return (
    <div>
      <PageHeader title="📅 Ôn tập hôm nay" subtitle="Lặp lại ngắt quãng: mỗi bài bạn đã học sẽ quay lại đúng lúc sắp quên (1 → 3 → 7 → 15 → 30+ ngày). Nhớ tốt thì giãn lịch ra, quên thì ôn lại sớm." />

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5 mb-4">
        {[
          ['🗣️ Thẻ nói', recallDue.length],
          ['📚 Cụm từ', vocabDue.length],
          ['🎧 Nghe', due.filter((r) => r.type === 'listening').length],
          ['🧭 Chủ đề từ vựng', due.filter((r) => r.type === 'unit').length],
          ['⏱️ Nhập vai + ✍️ Dịch', due.filter((r) => r.type === 'roleplay' || r.type === 'translate').length],
        ].map(([k, v]) => (
          <div key={k} className={`card !p-4 ${v ? 'border-rose-200' : ''}`}><div className="text-sm text-slate-500">{k}</div><div className={`text-3xl font-bold ${v ? 'text-rose-600' : 'text-emerald-600'}`}>{v}</div></div>
        ))}
      </div>

      {due.length === 0 && vocabDue.length === 0 ? (
        <div className="card mb-4">
          <div className="text-lg font-semibold">✅ Không còn gì cần ôn hôm nay!</div>
          <p className="mt-1 text-sm text-slate-500">{nextDue ? `Lần ôn tiếp theo: ${nextDue.due.slice(8, 10)}/${nextDue.due.slice(5, 7)}. ` : 'Hãy học bài mới để có lịch ôn. '}Bây giờ bạn có thể học thêm bài mới.</p>
          <div className="mt-3 flex flex-wrap gap-2"><a className="btn-primary" href="#/recall">🗣️ Học thẻ mới</a><a className="btn-ghost" href="#/listening">🎧 Bài nghe mới</a><a className="btn-ghost" href="#/roleplay">⏱️ Nhập vai mới</a></div>
        </div>
      ) : (
        <div className="card mb-4 space-y-3">
          <div className="label">Thứ tự gợi ý</div>
          {courseDue.length > 0 && (
            <a href="#/course/review" className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 hover:bg-emerald-100">
              <span className="text-xl">🧭</span>
              <span className="flex-1"><b>Ôn từ vựng lộ trình</b> <span className="text-sm text-slate-600">({courseDue.length} từ) – nói lại cả câu khi từ bị che</span></span>
              <span className="btn-primary">Bắt đầu</span>
            </a>
          )}
          {(recallDue.length > 0 || vocabDue.length > courseDue.length) && (
            <a href="#/recall/review" className="flex items-center gap-3 rounded-xl bg-indigo-50 p-3 hover:bg-indigo-100">
              <span className="text-xl">🗣️</span>
              <span className="flex-1"><b>Ôn thẻ nói tình huống</b> <span className="text-sm text-slate-600">({recallDue.length} thẻ, {vocabDue.length - courseDue.length} cụm từ) – nói lại không nhìn gợi ý</span></span>
              <span className="btn-primary">Bắt đầu</span>
            </a>
          )}
          {others.map((r, i) => {
            const T = REVIEW_TYPES[r.type]
            const late = daysBetween(r.due, t)
            return (
              <a key={r.key} href={T.href(r)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                <span className="text-xl">{T.icon}</span>
                <span className="flex-1">
                  <b>{T.label}:</b> {r.title || r.refId}
                  <span className="ml-2 text-xs text-slate-500">ôn lần {r.reps + 1}{late > 0 ? ` · trễ ${late} ngày` : ''}</span>
                </span>
                <span className="text-sm text-indigo-600">Ôn →</span>
              </a>
            )
          })}
        </div>
      )}

      <div className="card">
        <div className="label mb-3">Lịch ôn 7 ngày tới</div>
        <div className="flex h-24 items-end gap-2">
          {forecast.map((f) => (
            <div key={f.d} className="flex h-full flex-1 flex-col items-center justify-end" title={`${f.d}: ${f.n} bài`}>
              <span className="text-xs text-slate-600">{f.n || ''}</span>
              <div className="w-full max-w-[28px] rounded-t bg-indigo-300" style={{ height: `${(f.n / maxF) * 70}%`, minHeight: f.n ? 3 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-2 text-center text-[11px] text-slate-500">{forecast.map((f) => <div key={f.d} className="flex-1">{f.d.slice(8, 10)}/{f.d.slice(5, 7)}</div>)}</div>
        <p className="mt-3 text-xs text-slate-500">Tổng cộng {all.length} bài đang trong vòng ôn tập. Muốn được nhắc tự động: Cài đặt → Nhắc ôn hằng ngày.</p>
      </div>
    </div>
  )
}
