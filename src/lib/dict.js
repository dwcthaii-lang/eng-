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
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(c)}`)
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

async function fetchVi(word, context) {
  if (aiEnabled()) {
    try {
      const r = await askJson(
        'You are an English-Vietnamese learner dictionary. Return JSON only.',
        `Word/phrase: "${word}"\nContext: "${context || ''}"\nReturn JSON: {"vi": "nghĩa tiếng Việt ngắn gọn (theo ngữ cảnh nếu có)", "pos": "part of speech in English", "ipaUS": "/.../", "ipaUK": "/.../", "example": "a natural everyday example sentence", "exampleVi": "dịch câu ví dụ"}`
      )
      if (r?.vi) return { ...r, by: 'AI' }
    } catch {}
  }
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`)
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
  const [dict, vi] = await Promise.all([fetchDictionary(word), localVi(word) ? Promise.resolve(null) : fetchVi(word, context)])
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
