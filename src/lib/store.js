// Kho dữ liệu tối giản lưu trong LocalStorage, dùng với useSyncExternalStore
import { useSyncExternalStore } from 'react'

const KEY = 'english-reflex:v1'

export const defaultSettings = {
  aiProvider: 'none', // 'none' | 'gemini' | 'openai'
  geminiKey: '',
  geminiModel: 'gemini-3.8-flash',
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  voiceA: '', // tên giọng đọc nhân vật A
  voiceB: '', // tên giọng đọc nhân vật B
  speechRate: 1.05,
  countdownSec: 6, // 5–8 giây ép phản xạ
  dailyGoalMin: 90,
  recallSessionSize: 10,
  newRecallPerDay: 6, // số thẻ nói MỚI tối đa mỗi ngày (ưu tiên ôn bài cũ)
  newLessonsPerDay: 2, // số bài nghe/nhập vai MỚI gợi ý mỗi ngày
  reminderOn: false,
  reminderTime: '20:00',
  grammarCheck: true,
  theme: 'system', // 'light' | 'dark' | 'system'
  autoFocusType: true, // tự đặt con trỏ vào ô gõ (máy tính)
  showSentenceVi: true, // hiện nghĩa tiếng Việt của câu ví dụ
  newWordsPerDay: 15, // số từ MỚI tối đa/ngày trong Lộ trình từ vựng
  courseUnlocked: 1, // cấp độ cao nhất đã mở khoá thủ công // dùng LanguageTool miễn phí để sửa ngữ pháp
}

const initial = {
  settings: defaultSettings,
  vocab: {}, // id -> VocabItem
  recall: {}, // promptId -> { attempts, lastScore, lastAt }
  listening: {}, // dialogueId -> { step, done, completedAt, summary }
  roleplay: {}, // scenarioId -> { count, lastAt }
  time: {}, // 'YYYY-MM-DD' -> { total, recall, listening, roleplay, writing }
  writing: [], // { date, promptId, text, feedback }
  history: [], // nhật ký phiên: { at, module, detail }
  reviews: {}, // lịch ôn từng bài: 'type:id' -> {...}
  customSituations: [], // tình huống do AI tạo / bạn nhập
  translations: {}, // đoạn dịch: id -> { attempts, last }
  enrich: {}, // vocabId -> dữ liệu mở rộng do AI tạo
  lastNotified: '',
  courseExtra: {}, // unitId -> [{en, vi, ex}] do AI thêm
  grammarVerbs: {}, // động từ bất quy tắc: v1 -> { box, due, ok, n }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(initial)
    const data = JSON.parse(raw)
    return { ...structuredClone(initial), ...data, settings: { ...defaultSettings, ...(data.settings || {}) } }
  } catch {
    return structuredClone(initial)
  }
}

let state = load()
const listeners = new Set()
let saveTimer = null

function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => localStorage.setItem(KEY, JSON.stringify(state)), 150)
}

export function getState() {
  return state
}

// updater: (draft) => void  (được phép sửa trực tiếp bản sao)
export function update(updater) {
  const next = structuredClone(state)
  updater(next)
  state = next
  persist()
  listeners.forEach((l) => l())
}

export function replaceState(data) {
  state = { ...structuredClone(initial), ...data, settings: { ...defaultSettings, ...(data.settings || {}) } }
  persist()
  listeners.forEach((l) => l())
}

export function resetAll() {
  state = structuredClone(initial)
  localStorage.removeItem(KEY)
  listeners.forEach((l) => l())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(subscribe, () => selector(state))
}

export function logHistory(module, detail) {
  update((s) => {
    s.history.unshift({ at: Date.now(), module, detail })
    s.history = s.history.slice(0, 3000)
  })
}
