// Lặp lại ngắt quãng cho KỸ NĂNG NÓI
// Trạng thái: new (Mới) -> heard (Đã hiểu khi nghe) -> spoken (Đã bật ra được khi nói) -> mastered (Thành thạo)
// Thành thạo = tự nói đúng trong ngữ cảnh, KHÔNG xem gợi ý, ở 3 lần ôn khác ngày nhau.
import { update, getState } from './store'
import { today, addDays, daysBetween } from './date'

export const STAGES = {
  new: { label: 'Mới', color: 'bg-slate-100 text-slate-700' },
  heard: { label: 'Đã hiểu khi nghe', color: 'bg-sky-100 text-sky-700' },
  spoken: { label: 'Đã bật ra khi nói', color: 'bg-amber-100 text-amber-800' },
  mastered: { label: 'Thành thạo', color: 'bg-emerald-100 text-emerald-700' },
}
const ORDER = ['new', 'heard', 'spoken', 'mastered']
const INTERVALS = [1, 2, 4, 7] // ngày, theo số lần nói đúng không gợi ý
export const MASTERY_DAYS = 3

export function vocabId(en) {
  return en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function blank(en, vi = '', extra = {}) {
  return {
    id: vocabId(en), en, vi, stage: 'new', unaidedDays: [], nextReview: null, lapses: 0,
    reactivate: false, sources: [], example: '', addedAt: today(), lastSeen: null, ...extra,
  }
}

function raise(item, stage) {
  if (ORDER.indexOf(stage) > ORDER.indexOf(item.stage)) item.stage = stage
}

// Đưa toàn bộ chunk trong seed data vào kho từ (nếu chưa có)
export function seedVocab(entries) {
  const s = getState()
  const missing = entries.filter((e) => !s.vocab[vocabId(e.en)])
  const needSource = entries.filter((e) => s.vocab[vocabId(e.en)] && !s.vocab[vocabId(e.en)].sources.includes(e.source))
  if (!missing.length && !needSource.length) return
  update((d) => {
    for (const e of entries) {
      const id = vocabId(e.en)
      if (!d.vocab[id]) d.vocab[id] = blank(e.en, e.vi, { example: e.example || '' })
      if (e.source && !d.vocab[id].sources.includes(e.source)) d.vocab[id].sources.push(e.source)
    }
  })
}

export function markHeard(ens) {
  update((d) => {
    for (const en of ens) {
      const it = d.vocab[vocabId(en)]
      if (it) { raise(it, 'heard'); it.lastSeen = today() }
    }
  })
}

// Ghi nhận kết quả nói một cụm từ
// correct: có dùng được cụm từ trong câu; aided: có xem gợi ý không
export function recordSpoken(en, { correct, aided }) {
  update((d) => {
    const id = vocabId(en)
    const it = d.vocab[id] || (d.vocab[id] = blank(en))
    const t = today()
    it.lastSeen = t
    if (!correct) {
      if (it.stage === 'spoken' || it.stage === 'mastered') it.lapses += 1
      if (it.stage === 'mastered') it.stage = 'spoken'
      it.nextReview = addDays(t, 1)
      return
    }
    raise(it, 'spoken')
    if (aided) {
      if (!it.nextReview || daysBetween(t, it.nextReview) > 1) it.nextReview = addDays(t, 1)
      return
    }
    const last = it.unaidedDays[it.unaidedDays.length - 1]
    if (last !== t) it.unaidedDays.push(t) // chỉ tính 1 lần mỗi ngày
    it.reactivate = false
    if (it.unaidedDays.length >= MASTERY_DAYS) it.stage = 'mastered'
    it.nextReview = addDays(t, INTERVALS[Math.min(it.unaidedDays.length, INTERVALS.length - 1)])
  })
}

// Thêm vào danh sách "Từ cần kích hoạt lại" (từ bị bí khi nhập vai)
export function addReactivate(en, { vi = '', example = '', source = '' } = {}) {
  update((d) => {
    const id = vocabId(en)
    const it = d.vocab[id] || (d.vocab[id] = blank(en, vi, { example }))
    it.reactivate = true
    if (it.stage === 'mastered') it.stage = 'spoken'
    if (example && !it.example) it.example = example
    if (source && !it.sources.includes(source)) it.sources.push(source)
    it.nextReview = today()
  })
}

export function isDue(it, t = today()) {
  return it.stage !== 'mastered' && (it.reactivate || (it.nextReview && it.nextReview <= t))
}

export function stageCounts(vocab) {
  const c = { new: 0, heard: 0, spoken: 0, mastered: 0 }
  Object.values(vocab).forEach((v) => (c[v.stage] = (c[v.stage] || 0) + 1))
  return c
}

// Giới hạn số cụm từ ôn mỗi ngày (ưu tiên trễ lâu, hay quên, cần kích hoạt lại); phần còn lại để dành hôm sau
export function capDueVocab(list, cap = Number(getState().settings?.vocabCap) || 40) {
  const t = today()
  const vocab = getState().vocab
  const score = (x) => { const v = vocab[vocabId(x.en)] || x; return sc(v) }
  const sc = (v) => (v.reactivate ? 100 : 0) + (v.nextReview ? Math.max(0, daysBetween(v.nextReview, t)) : 0) + (v.lapses || 0) * 2
  return [...list].sort((a, b) => score(b) - score(a)).slice(0, Math.max(1, cap))
}
