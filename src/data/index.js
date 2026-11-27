import { dormSituations } from './dorm'
import { labSituations } from './lab'
import { careerSituations } from './career'
import { lifeSituations } from './life'
import { campusSituations } from './campus'
import { getState, useStore } from '../lib/store'

// Mức độ thường gặp + nhóm chủ đề cho các tình huống có sẵn (bài mới khai báo trực tiếp trong file)
const META = {
  'dorm-laundry': ['sometimes', 'Ký túc xá'], 'dorm-kitchen': ['common', 'Ký túc xá'], 'dorm-noise': ['sometimes', 'Ký túc xá'],
  'dorm-convenience': ['common', 'Mua sắm & ăn uống'], 'dorm-transport': ['common', 'Đường phố & giao tiếp'], 'dorm-friends': ['common', 'Bạn bè & xã giao'],
  'dorm-food': ['common', 'Mua sắm & ăn uống'], 'dorm-clinic': ['sometimes', 'Sức khoẻ & khẩn cấp'], 'dorm-groupwork': ['common', 'Trường học'], 'dorm-recycling': ['common', 'Ký túc xá'],
  'lab-weekly': ['common', 'Phòng lab'], 'lab-etching': ['sometimes', 'Phòng lab'], 'lab-cleanroom': ['common', 'Phòng lab'], 'lab-equipment': ['sometimes', 'Phòng lab'],
  'lab-booking': ['common', 'Phòng lab'], 'lab-litho': ['sometimes', 'Phòng lab'], 'lab-qna': ['sometimes', 'Học thuật'], 'lab-paper': ['sometimes', 'Học thuật'],
  'lab-data': ['common', 'Phòng lab'], 'lab-safety': ['rare', 'Phòng lab'],
  'car-conference': ['sometimes', 'Học thuật'], 'car-interview': ['rare', 'Sự nghiệp'], 'car-vendor': ['sometimes', 'Sự nghiệp'], 'car-handover': ['rare', 'Sự nghiệp'],
}
const withMeta = (s) => ({ ...s, freq: s.freq || META[s.id]?.[0] || 'sometimes', cat: s.cat || META[s.id]?.[1] || '' })
export const baseSituations = [...dormSituations, ...lifeSituations, ...labSituations, ...campusSituations, ...careerSituations].map(withMeta)

export const FREQS = [
  ['common', '🔥 Thường gặp', 'Gặp gần như mỗi tuần – học trước'],
  ['sometimes', '🌤️ Thỉnh thoảng', 'Vài lần mỗi tháng/học kỳ'],
  ['rare', '🌙 Hiếm khi', 'Ít gặp nhưng khi gặp thì rất cần'],
]
export const freqOf = (x) => (['common', 'sometimes', 'rare'].includes(x?.freq) ? x.freq : 'sometimes')

export const TIERS = {
  1: { label: 'Tầng 1 · KTX & đời sống Đài Loan', short: 'KTX & Đời sống', color: 'bg-teal-100 text-teal-800' },
  2: { label: 'Tầng 2 · Lab bán dẫn & Học thuật', short: 'Lab & Học thuật', color: 'bg-violet-100 text-violet-800' },
  3: { label: 'Tầng 3 · Sự nghiệp & giao tiếp chuyên nghiệp', short: 'Sự nghiệp', color: 'bg-amber-100 text-amber-800' },
}
export const TIER_IDS = [1, 2, 3]
export const TIER_AI = {
  1: 'international dorm & daily life in Taiwan',
  2: 'semiconductor lab, cleanroom, advisor meetings, academic presentations',
  3: 'career & professional communication for a semiconductor engineer: conferences, job/internship interviews, emails & calls with vendors/clients, fab shift work, team meetings at a company, thesis defense, networking',
}
// Gợi ý chủ đề để AI tạo bài mới khi bạn không nhập chủ đề (tránh trùng bài cũ)
export const TOPIC_IDEAS = {
  1: ['thuê phòng ngoài KTX', 'mua điện thoại cũ', 'trả giá ở chợ đêm', 'đặt bàn nhà hàng qua điện thoại', 'gọi taxi/Uber', 'sửa xe đạp', 'đi khám nha sĩ', 'mua kính mắt', 'nói chuyện với chủ nhà về hợp đồng', 'đi tiệm giặt là', 'xếp hàng mua đồ ăn đường phố', 'tình nguyện ở sự kiện', 'đi chùa/lễ hội địa phương', 'đổi sim điện thoại', 'mượn đồ của bạn cùng phòng', 'đặt đồ ăn qua Foodpanda bị giao nhầm', 'đi leo núi cuối tuần', 'mời bạn ăn Tết', 'làm thẻ thư viện', 'xe máy bị phạt đỗ sai chỗ', 'động đất ban đêm', 'ốm và xin nghỉ học', 'mua vé tàu cao tốc'],
  2: ['máy ALD báo lỗi nhiệt độ', 'xin thêm thời gian dùng máy SEM', 'thảo luận kết quả XRD', 'chuẩn bị slide group meeting', 'viết abstract hội nghị', 'phản hồi reviewer', 'đặt mua hoá chất', 'hướng dẫn sinh viên mới đo I-V', 'mẫu bị nhiễm bẩn', 'tranh luận về phương pháp đo', 'xin giáo sư đi hội nghị', 'chia sẻ máy với lab khác', 'sự cố mất điện trong phòng sạch', 'đọc và tóm tắt paper'],
  3: ['phỏng vấn kỹ thuật về quy trình lithography', 'đàm phán lương thực tập', 'giới thiệu bản thân khi networking ở hội chợ việc làm', 'họp đầu tuần với quản lý ở công ty', 'báo cáo yield giảm', 'làm việc với khách hàng nước ngoài', 'email xin thư giới thiệu', 'thuyết trình poster', 'trả lời câu hỏi khó của hội đồng', 'đào tạo nhân viên mới ca đêm', 'xin nghỉ phép với quản lý', 'thảo luận root cause analysis 8D', 'gọi video với đối tác Hà Lan', 'phỏng vấn tiếng Anh bằng video call'],
}
export function randomTopic(tier, avoid = []) {
  const pool = (TOPIC_IDEAS[tier] || []).filter((t) => !avoid.some((a) => String(a).toLowerCase().includes(t.toLowerCase())))
  const list = pool.length ? pool : TOPIC_IDEAS[tier] || []
  return list[Math.floor(Math.random() * list.length)] || ''
}

// Gồm cả tình huống bạn tạo thêm bằng AI / nhập file (lưu trong trình duyệt)
export function getSituations(state = getState()) {
  return [...baseSituations, ...(state.customSituations || []).map(withMeta)]
}

export function useSituations() {
  const custom = useStore((s) => s.customSituations)
  return [...baseSituations, ...(custom || [])]
}

export function findSituation(id) {
  return getSituations().find((s) => s.id === id)
}

export function getRecallPrompts(state = getState()) {
  return getSituations(state).flatMap((s) => s.recall.map((r) => ({ ...r, situationId: s.id, tier: s.tier, freq: freqOf(s), emoji: s.emoji, titleVi: s.titleVi })))
}

export function findRecallPrompt(id) {
  return getRecallPrompts().find((p) => p.id === id)
}

// Tất cả cụm từ để khởi tạo kho từ vựng
export function getSeedVocabEntries(state = getState()) {
  return getSituations(state).flatMap((s) => [
    ...s.recall.flatMap((r) => r.chunks.map((c) => ({ en: c.en, vi: c.vi, source: s.id, example: r.model }))),
    ...(s.listening?.chunks || []).map((c) => ({ en: c.en, vi: c.vi, source: s.id })),
  ])
}
