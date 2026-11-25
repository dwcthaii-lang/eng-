// Kho từ vựng + trạng thái SRS
import { useMemo, useState } from 'react'
import { useStore, update } from '../lib/store'
import { STAGES, isDue, MASTERY_DAYS, vocabId } from '../lib/srs'
import { speak } from '../lib/speech'
import { today } from '../lib/date'
import { PageHeader, StageChip } from '../components/ui'
import { ChunkCluster } from '../components/ChunkCluster'
import { Fragment } from 'react'

export default function Vocabulary() {
  const vocab = useStore((s) => s.vocab)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ en: '', vi: '', example: '' })
  const [open, setOpen] = useState(null)

  const list = useMemo(() => {
    let l = Object.values(vocab)
    if (filter === 'due') l = l.filter((v) => isDue(v))
    else if (filter === 'reactivate') l = l.filter((v) => v.reactivate)
    else if (filter !== 'all') l = l.filter((v) => v.stage === filter)
    if (q) l = l.filter((v) => (v.en + ' ' + v.vi).toLowerCase().includes(q.toLowerCase()))
    return l.sort((a, b) => (b.reactivate - a.reactivate) || a.en.localeCompare(b.en))
  }, [vocab, filter, q])

  const add = (e) => {
    e.preventDefault()
    if (!form.en.trim()) return
    update((s) => {
      const id = vocabId(form.en)
      s.vocab[id] = s.vocab[id] || { id, en: form.en.trim(), vi: form.vi.trim(), stage: 'new', unaidedDays: [], nextReview: null, lapses: 0, reactivate: true, sources: ['custom'], example: form.example.trim(), addedAt: today(), lastSeen: null }
    })
    setForm({ en: '', vi: '', example: '' })
  }

  const remove = (id) => update((s) => { delete s.vocab[id] })

  const filters = [['all', 'Tất cả'], ['due', 'Đến hạn ôn'], ['reactivate', 'Cần kích hoạt lại'], ...Object.entries(STAGES).map(([k, v]) => [k, v.label])]

  return (
    <div>
      <PageHeader title="📚 Kho từ vựng (theo kỹ năng nói)" subtitle={`Mới → Đã hiểu khi nghe → Đã bật ra khi nói → Thành thạo (tự nói đúng, không gợi ý, ${MASTERY_DAYS} ngày khác nhau).`} />
      <form onSubmit={add} className="card mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
        <input className="input" placeholder="Cụm từ tiếng Anh (vd: run a dummy wafer)" value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} />
        <input className="input" placeholder="Nghĩa tiếng Việt" value={form.vi} onChange={(e) => setForm({ ...form, vi: e.target.value })} />
        <input className="input" placeholder="Câu ví dụ / ngữ cảnh (tuỳ chọn)" value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} />
        <button className="btn-primary">+ Thêm</button>
      </form>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {filters.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={filter === k ? 'btn-primary !py-1' : 'btn-ghost !py-1'}>{l}</button>
        ))}
        <input className="input sm:!w-48 sm:ml-auto" placeholder="Tìm…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Cụm từ</th><th className="p-3">Nghĩa</th><th className="p-3">Trạng thái</th><th className="p-3">Tự nói</th><th className="p-3 hidden sm:table-cell">Ôn lại</th><th /></tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <Fragment key={v.id}>
              <tr className="border-t border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => setOpen(open === v.id ? null : v.id)}>
                <td className="p-3 font-medium">
                  <button className="mr-1 text-slate-400 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); speak(v.example || v.en) }} title={v.example}>🔈</button>
                  {v.en} {v.reactivate && <span className="chip bg-rose-100 text-rose-700 ml-1">kích hoạt lại</span>}
                </td>
                <td className="p-3 text-slate-600">{v.vi}</td>
                <td className="p-3"><StageChip stage={v.stage} /></td>
                <td className="p-3">{v.unaidedDays.length}/{MASTERY_DAYS}</td>
                <td className="p-3 text-slate-500 hidden sm:table-cell">{v.stage === 'mastered' ? '—' : v.nextReview ? (v.nextReview <= today() ? 'Hôm nay' : v.nextReview.slice(5)) : 'Chưa học'}</td>
                <td className="p-3 text-right">{v.sources.includes('custom') && <button className="text-slate-400 hover:text-rose-600" onClick={(e) => { e.stopPropagation(); remove(v.id) }}>✕</button>}</td>
              </tr>
              {open === v.id && (
                <tr><td colSpan={6} className="bg-slate-50 p-3">
                  <ChunkCluster en={v.en} vi={v.vi} />
                  {v.example && <div className="mt-2 text-sm text-slate-600">Ngữ cảnh trong bài: “{v.example}”</div>}
                </td></tr>
              )}
              </Fragment>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Không có cụm từ nào.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">Bấm vào một dòng để xem cả “chùm”: đồng nghĩa, trái nghĩa, từ liên quan và ví dụ văn nói. Cụm từ bạn tự thêm sẽ vào danh sách “Cần kích hoạt lại” để luyện nói ngay ở Module 1.</p>
    </div>
  )
}
