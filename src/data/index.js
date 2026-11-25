import { dormSituations } from './dorm'
import { labSituations } from './lab'
import { getState, useStore } from '../lib/store'

export const baseSituations = [...dormSituations, ...labSituations]

export const TIERS = {
  1: { label: 'Tầng 1 · KTX & đời sống Đài Loan', short: 'KTX & Đời sống', color: 'bg-teal-100 text-teal-800' },
  2: { label: 'Tầng 2 · Lab bán dẫn & Học thuật', short: 'Lab & Học thuật', color: 'bg-violet-100 text-violet-800' },
}

// Gồm cả tình huống bạn tạo thêm bằng AI / nhập file (lưu trong trình duyệt)
export function getSituations(state = getState()) {
  return [...baseSituations, ...(state.customSituations || [])]
}

export function useSituations() {
  const custom = useStore((s) => s.customSituations)
  return [...baseSituations, ...(custom || [])]
}

export function findSituation(id) {
  return getSituations().find((s) => s.id === id)
}

export function getRecallPrompts(state = getState()) {
  return getSituations(state).flatMap((s) => s.recall.map((r) => ({ ...r, situationId: s.id, tier: s.tier, emoji: s.emoji, titleVi: s.titleVi })))
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
