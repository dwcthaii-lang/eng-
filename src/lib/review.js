// Lặp lại ngắt quãng cho TỪNG BÀI HỌC (kiểu SM-2 rút gọn)
// Mỗi bài đã học (thẻ nói, bài nghe, nhập vai, đoạn dịch) có lịch ôn riêng.
// grade 0–5: 0–2 = quên/khó (ôn lại ngày mai), 3 = tạm, 4 = tốt, 5 = rất dễ
import { update, getState } from './store'
import { today, addDays } from './date'

export const REVIEW_TYPES = {
  recall: { label: 'Thẻ nói', icon: '🗣️', href: (r) => '#/recall/review' },
  listening: { label: 'Bài nghe', icon: '🎧', href: (r) => `#/listening/${r.refId}` },
  roleplay: { label: 'Nhập vai', icon: '⏱️', href: (r) => `#/roleplay/${r.refId}` },
  translate: { label: 'Dịch Việt→Anh', icon: '✍️', href: (r) => `#/writing/translate/${r.refId}` },
  unit: { label: 'Chủ đề từ vựng', icon: '🧭', href: (r) => `#/course/${r.refId}/review` },
}

export function reviewKey(type, refId) {
  return `${type}:${refId}`
}

// Ghi nhận một lần học/ôn và tính ngày ôn tiếp theo
export function scheduleReview(type, refId, grade, title = '') {
  grade = Math.max(0, Math.min(5, Math.round(grade)))
  update((s) => {
    const key = reviewKey(type, refId)
    const r = s.reviews[key] || (s.reviews[key] = { key, type, refId, title, reps: 0, interval: 0, ease: 2.5, due: today(), log: [] })
    if (title) r.title = title
    const t = today()
    // Ôn nhiều lần trong 1 ngày chỉ tính lần đầu cho lịch
    const sameDay = r.log.length && r.log[r.log.length - 1].d === t
    r.log.push({ d: t, g: grade })
    r.log = r.log.slice(-30)
    if (sameDay && r.reps > 0) return
    if (grade < 3) {
      r.reps = 0
      r.interval = 1
    } else {
      r.reps += 1
      r.interval = r.reps === 1 ? 1 : r.reps === 2 ? 3 : Math.round(r.interval * r.ease)
    }
    r.ease = Math.max(1.3, r.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)))
    r.interval = Math.min(r.interval, 120)
    r.due = addDays(t, r.interval)
    r.last = t
  })
}

export function dueReviews(state = getState(), t = today()) {
  return Object.values(state.reviews || {}).filter((r) => r.due <= t).sort((a, b) => a.due.localeCompare(b.due))
}

export function reviewOf(type, refId, state = getState()) {
  return state.reviews?.[reviewKey(type, refId)]
}

export function isLessonDue(type, refId, state = getState()) {
  const r = reviewOf(type, refId, state)
  return !!r && r.due <= today()
}

// Số bài MỚI đã bắt đầu hôm nay theo loại (để giới hạn học mới, ưu tiên ôn)
export function newStartedToday(type, state = getState()) {
  const t = today()
  return Object.values(state.reviews || {}).filter((r) => r.type === type && r.log[0]?.d === t).length
}

export function nextDueLabel(r) {
  if (!r) return 'Chưa học'
  const t = today()
  if (r.due <= t) return 'Đến hạn hôm nay'
  return `Ôn lại ${r.due.slice(8, 10)}/${r.due.slice(5, 7)}`
}
