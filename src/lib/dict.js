// Tra từ nhanh: phiên âm Anh-Mỹ/Anh-Anh, âm thanh người thật, loại từ, định nghĩa, ví dụ, nghĩa tiếng Việt
// Nguồn: Free Dictionary API (dictionaryapi.dev) + dữ liệu có sẵn trong app + AI (nếu có key) / MyMemory
import { getState } from './store'
import { getUnits } from '../data/course'
import { getEnrich } from '../data/enrich'
import { vocabId } from './srs'
import { aiEnabled, askJson } from './ai'
import { speakAccent, playAudio } from './speech'

const CACHE_KEY = 'english-reflex:dict'
let cache = {}
try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch {}
function save(k, v) {
  cache[k] = v
  const keys = Object.keys(cache)
  if (keys.length > 400) keys.slice(0, keys.length - 400).forEach((x) => delete cache[x])
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch {}
}

const POS_VI = { noun: 'danh từ', verb: 'động từ', adjective: 'tính từ', adverb: 'trạng từ', pronoun: 'đại từ', preposition: 'giới từ', conjunction: 'liên từ', interjection: 'thán từ', determiner: 'từ hạn định', exclamation: 'thán từ', phrase: 'cụm từ', idiom: 'thành ngữ', 'phrasal verb': 'cụm động từ' }
export const posVi = (p) => POS_VI[String(p || '').toLowerCase()] || p

export function cleanWord(s) {
  return String(s || '').replace(/[“”"()[\]{}.,!?;:…]+/g, ' ').replace(/\s+/g, ' ').trim()
}

// Nghĩa tiếng Việt có sẵn trong app (kho từ, lộ trình, cụm từ mở rộng)
function localVi(word) {
  const s = getState()
  const w = word.toLowerCase()
  const v = s.vocab[vocabId(word)]
  if (v?.vi) return { vi: v.vi, ex: v.example }
  for (const u of getUnits(s)) {
    const it = u.items.find((i) => i.en.toLowerCase() === w)
    if (it) return { vi: it.vi, ex: it.ex }
  }
  const e = getEnrich(word, s.enrich)
  if (e?.vi) return { vi: e.vi }
  return null
}

function candidates(w) {
  const l = w.toLowerCase()
  const out = [l]
  if (l.includes(' ')) return out
  if (l.endsWith('ies')) out.push(l.slice(0, -3) + 'y')
  if (l.endsWith('es')) out.push(l.slice(0, -2))
  if (l.endsWith('s')) out.push(l.slice(0, -1))
  if (l.endsWith('ied')) out.push(l.slice(0, -3) + 'y')
  if (l.endsWith('ed')) out.push(l.slice(0, -2), l.slice(0, -1), l.slice(0, -3))
  if (l.endsWith('ing')) out.push(l.slice(0, -3), l.slice(0, -3) + 'e', l.slice(0, -4))
  return [...new Set(out)].filter((x) => x.length > 1)
}

async function fetchDictionary(word) {
  for (const c of candidates(word)) {
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(c)}`, { signal: AbortSignal.timeout?.(8000) })
      if (!r.ok) continue
      const data = await r.json()
      if (!Array.isArray(data) || !data.length) continue
      const phon = data.flatMap((d) => d.phonetics || [])
      const pick = (re) => phon.find((p) => p.audio && re.test(p.audio))
      const us = pick(/-us\.mp3$/), uk = pick(/-uk\.mp3$/)
      const anyText = data.map((d) => d.phonetic).find(Boolean) || phon.find((p) => p.text)?.text || ''
      const meanings = []
      data.forEach((d) => (d.meanings || []).forEach((m) => {
        let mm = meanings.find((x) => x.pos === m.partOfSpeech)
        if (!mm) meanings.push((mm = { pos: m.partOfSpeech, defs: [], synonyms: [] }))
        ;(m.definitions || []).forEach((df) => mm.defs.length < 3 && mm.defs.push({ def: df.definition, ex: df.example || '' }))
        mm.synonyms.push(...(m.synonyms || []))
      }))
      meanings.forEach((m) => (m.synonyms = [...new Set(m.synonyms)].slice(0, 5)))
      return {
        lemma: data[0].word,
        ipaUS: us?.text || anyText, ipaUK: uk?.text || anyText,
        audioUS: us?.audio || '', audioUK: uk?.audio || '',
        meanings,
      }
    } catch {}
  }
  return null
}

// AI tra nghĩa theo ngữ cảnh (chạy SAU, không bắt cửa sổ tra từ phải chờ)
const aiWordCache = {}
export async function lookupWordAI(word, context = '') {
  const k = word.toLowerCase() + '|' + context.slice(0, 80)
  if (aiWordCache[k]) return aiWordCache[k]
  const r = await askJson(
    'You are an English-Vietnamese learner dictionary for spoken English. Return JSON only.',
    `Word/phrase: "${word}"\nContext sentence: "${context.slice(0, 300)}"\nReturn JSON: {"vi": "nghĩa tiếng Việt ngắn gọn, đúng nghĩa trong ngữ cảnh", "pos": "part of speech in English", "note_vi": "1 câu: dùng khi nào / sắc thái", "example": "a natural everyday example sentence", "exampleVi": "dịch câu ví dụ tự nhiên"}`,
    { maxMs: 25000 }
  )
  if (r?.vi) aiWordCache[k] = { ...r, by: 'AI' }
  return aiWordCache[k] || null
}

async function fetchVi(word) {
  try {
    const t = await translateText(word)
    if (t?.vi && t.vi.toLowerCase() !== word.toLowerCase()) return { vi: t.vi, by: t.by }
  } catch {}
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`, { signal: AbortSignal.timeout?.(8000) })
    const d = await r.json()
    const t = d?.responseData?.translatedText
    if (t && t.toLowerCase() !== word.toLowerCase()) return { vi: t, by: 'MyMemory' }
  } catch {}
  return null
}

export async function lookupWord(raw, context = '') {
  const word = cleanWord(raw)
  if (!word) return null
  const key = word.toLowerCase()
  if (cache[key] && !context) return { ...cache[key], local: localVi(word) }
  const [dict, vi] = await Promise.all([fetchDictionary(word), localVi(word) ? Promise.resolve(null) : fetchVi(word)])
  const res = { word, dict, vi, at: Date.now() }
  if (dict || vi) save(key, res)
  return { ...res, local: localVi(word) }
}

// Phát âm: ưu tiên file giọng người thật đúng giọng (nếu có), nếu không thì giọng máy
export async function pronounce(text, accent = 'US', { slow = false, info } = {}) {
  const url = accent === 'UK' ? info?.audioUK : info?.audioUS
  if (url && (await playAudio(url, slow ? 0.7 : 1))) return 'human'
  const ok = await speakAccent(text, accent, { rate: slow ? 0.6 : 0.95 })
  return ok ? 'tts' : 'no-voice'
}

// Dịch câu Anh → Việt (lưu bộ nhớ đệm để lần sau hiện ngay, dùng được cả khi offline)
const TR_KEY = 'english-reflex:tr'
let tr = {}
try { tr = JSON.parse(localStorage.getItem(TR_KEY) || '{}') } catch {}
export function cachedTranslation(en) {
  return tr[en.trim()] || null
}
export async function translateText(en) {
  const key = en.trim()
  if (!key) return null
  if (tr[key]) return tr[key]
  let out = null
  try {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout?.(8000) })
    const d = await r.json()
    const t = (d?.[0] || []).map((x) => x?.[0] || '').join('').trim()
    if (t) out = { vi: t, by: 'Google' }
  } catch {}
  if (!out && aiEnabled()) {
    try {
      const r = await askJson('Translate English to natural, everyday Vietnamese. Return JSON only.', `Sentence: "${key}"\nReturn JSON: {"vi": "..."}`, { maxMs: 20000 })
      if (r?.vi) out = { vi: String(r.vi), by: 'AI' }
    } catch {}
  }
  if (!out) {
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(key)}&langpair=en|vi`, { signal: AbortSignal.timeout?.(8000) })
      const d = await r.json()
      const t = d?.responseData?.translatedText
      if (t && t.toLowerCase() !== key.toLowerCase()) out = { vi: t, by: 'MyMemory' }
    } catch {}
  }
  if (out) {
    tr[key] = out
    const ks = Object.keys(tr)
    if (ks.length > 3000) ks.slice(0, ks.length - 3000).forEach((k) => delete tr[k])
    try { localStorage.setItem(TR_KEY, JSON.stringify(tr)) } catch {}
  }
  return out
}

// Dịch TỰ NHIÊN bằng AI theo ngữ cảnh: gom các câu cùng ngữ cảnh (cả đoạn hội thoại) vào 1 lần gọi
const natQ = new Map() // ctx -> { list: [en], waiters: Map(en -> [resolve]), timer }
export function translateNatural(en, ctx = '') {
  const key = en.trim()
  if (!key) return Promise.resolve(null)
  if (tr[key]?.by === 'AI') return Promise.resolve(tr[key])
  if (!aiEnabled()) return Promise.resolve(null)
  return new Promise((resolve) => {
    let g = natQ.get(ctx)
    if (!g) natQ.set(ctx, (g = { list: [], waiters: new Map(), timer: null }))
    if (!g.waiters.has(key)) { g.waiters.set(key, []); g.list.push(key) }
    g.waiters.get(key).push(resolve)
    clearTimeout(g.timer)
    g.timer = setTimeout(() => flushNatural(ctx), 80)
  })
}

async function flushNatural(ctx) {
  const g = natQ.get(ctx)
  natQ.delete(ctx)
  if (!g) return
  for (let i = 0; i < g.list.length; i += 30) {
    const batch = g.list.slice(i, i + 30)
    let out = []
    try {
      const r = await askJson(
        `You are a professional English→Vietnamese subtitle translator. Translate into natural, idiomatic SPOKEN Vietnamese — exactly how a Vietnamese person would say it in that situation, NOT word-for-word.
- Keep the tone (casual between friends/roommates, polite with professors/staff). Between peers use "mình/cậu" or "mình/bạn" consistently; use natural particles (nhé, à, nhỉ, đấy, thôi, mà) where a Vietnamese speaker would.
- Translate idioms and fillers by meaning: "Will do" → "Ok, để mình làm", "Cool" → "Ok"/"Được đó", "kinda" → "kiểu như"/"hơi", "Lemme know" → "Báo mình nhé", "heads-up" → "báo trước", "Seriously?" → "Thật á?".
- Keep technical terms commonly used in Vietnamese labs (wafer, SEM, cleanroom…) if Vietnamese engineers would say them in English.
- Short, smooth sentences; no explanations. Return JSON only: {"vi": ["…", …]} with exactly the same number and order as the input lines.`,
        `Context / full conversation (for meaning and tone):\n${ctx || '(none)'}\n\nLines to translate (JSON array):\n${JSON.stringify(batch)}`,
        { maxMs: 25000 }
      )
      out = Array.isArray(r?.vi) ? r.vi : []
    } catch {}
    batch.forEach((en, j) => {
      const vi = out[j] && String(out[j]).trim()
      const res = vi ? { vi, by: 'AI' } : null
      if (res) tr[en] = res
      ;(g.waiters.get(en) || []).forEach((fn) => fn(res))
    })
    try { localStorage.setItem(TR_KEY, JSON.stringify(tr)) } catch {}
  }
}
