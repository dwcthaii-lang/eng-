import { dormSituations } from './dorm'
import { labSituations } from './lab'

export const situations = [...dormSituations, ...labSituations]
export const TIERS = {
  1: { label: 'Tầng 1 · KTX & đời sống Đài Loan', short: 'KTX & Đời sống', color: 'bg-teal-100 text-teal-800' },
  2: { label: 'Tầng 2 · Lab bán dẫn & Học thuật', short: 'Lab & Học thuật', color: 'bg-violet-100 text-violet-800' },
}

export const allRecallPrompts = situations.flatMap((s) => s.recall.map((r) => ({ ...r, situationId: s.id, tier: s.tier, emoji: s.emoji, titleVi: s.titleVi })))

export function findSituation(id) {
  return situations.find((s) => s.id === id)
}

// Tất cả cụm từ để khởi tạo kho từ vựng
export const seedVocabEntries = situations.flatMap((s) => [
  ...s.recall.flatMap((r) => r.chunks.map((c) => ({ en: c.en, vi: c.vi, source: s.id, example: r.model }))),
  ...s.listening.chunks.map((c) => ({ en: c.en, vi: c.vi, source: s.id })),
])
