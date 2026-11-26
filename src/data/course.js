import { course1 } from './course1'
import { course2 } from './course2'
import { getState, useStore } from '../lib/store'

export const LEVELS = {
  1: { name: 'Cấp 1 · Nền tảng', cefr: 'A2', band: 'IELTS 4.0–4.5', desc: 'Từ & câu cơ bản người bản xứ dùng mỗi ngày: ở nhà, ăn uống, mua sắm, đi lại…' },
  2: { name: 'Cấp 2 · Giao tiếp hằng ngày', cefr: 'B1', band: 'IELTS 5.0–5.5', desc: 'Xử lý tự tin các tình huống đời sống: khách sạn, trường học, công việc, tiền bạc, sự cố…' },
  3: { name: 'Cấp 3 · IELTS Speaking', cefr: 'B2', band: 'IELTS 6.0–6.5', desc: 'Từ vựng theo chủ đề IELTS và cách diễn đạt quan điểm trôi chảy.' },
  4: { name: 'Cấp 4 · Nâng cao', cefr: 'C1', band: 'IELTS 7.0+', desc: 'Phrasal verbs, thành ngữ, từ nối, ngôn ngữ học thuật và từ vựng ăn điểm.' },
}

function parse(unit) {
  const items = unit.items
    .trim()
    .split('\n')
    .map((l) => l.split('|').map((x) => x.trim()))
    .filter((p) => p.length >= 3 && p[0])
    .map(([en, vi, ex]) => ({ en, vi, ex }))
  return { ...unit, items }
}

export const baseUnits = [...course1, ...course2].map(parse)

// Gồm cả từ AI thêm vào từng chủ đề (lưu trong trình duyệt)
export function getUnits(state = getState()) {
  const extra = state.courseExtra || {}
  return [...baseUnits, ...(state.customUnits || [])].map((u) => ({ ...u, items: [...u.items, ...(extra[u.id] || [])] }))
}

export function useUnits() {
  const extra = useStore((s) => s.courseExtra)
  const custom = useStore((s) => s.customUnits)
  return [...baseUnits, ...(custom || [])].map((u) => ({ ...u, items: [...u.items, ...((extra || {})[u.id] || [])] }))
}
