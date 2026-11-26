// Web Speech API: đọc văn bản (TTS) và nhận diện giọng nói (STT)
import { useCallback, useEffect, useRef, useState } from 'react'
import { plainLine } from './text'

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
export const sttSupported = !!SR

let cachedVoices = []
export function getVoices() {
  if (!ttsSupported) return []
  const v = window.speechSynthesis.getVoices().filter((x) => x.lang?.toLowerCase().startsWith('en'))
  if (v.length) cachedVoices = v
  return cachedVoices
}

export function useVoices() {
  const [voices, setVoices] = useState(getVoices())
  useEffect(() => {
    if (!ttsSupported) return
    const h = () => setVoices(getVoices())
    window.speechSynthesis.addEventListener('voiceschanged', h)
    h()
    return () => window.speechSynthesis.removeEventListener('voiceschanged', h)
  }, [])
  return voices
}

// Ưu tiên giọng tự nhiên (Google / Microsoft Online Natural)
function pickVoice(name, fallbackIndex = 0) {
  const voices = getVoices()
  if (name) {
    const v = voices.find((x) => x.name === name)
    if (v) return v
  }
  const natural = voices.filter((v) => /natural|google|online/i.test(v.name) && v.lang.startsWith('en-US'))
  const pool = natural.length ? natural : voices.filter((v) => v.lang.startsWith('en-US')).length ? voices.filter((v) => v.lang.startsWith('en-US')) : voices
  return pool[fallbackIndex % Math.max(1, pool.length)] || null
}

export function stopSpeaking() {
  if (ttsSupported) window.speechSynthesis.cancel()
}

export function speak(text, { voiceName, rate = 1, voiceIndex = 0 } = {}) {
  return new Promise((resolve) => {
    if (!ttsSupported) return resolve()
    const u = new SpeechSynthesisUtterance(plainLine(text))
    const v = pickVoice(voiceName, voiceIndex)
    if (v) { u.voice = v; u.lang = v.lang } else u.lang = 'en-US'
    u.rate = rate
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

// Đọc nhiều dòng hội thoại liên tiếp với 2 giọng A/B
export async function speakLines(lines, settings, { onLine, shouldStop } = {}) {
  for (let i = 0; i < lines.length; i++) {
    if (shouldStop?.()) break
    onLine?.(i)
    const isA = lines[i].s === 'A'
    await speak(lines[i].t, {
      voiceName: isA ? settings.voiceA : settings.voiceB,
      voiceIndex: isA ? 0 : 1,
      rate: settings.speechRate,
    })
    await new Promise((r) => setTimeout(r, 180))
  }
  onLine?.(-1)
}

// Hook nhận diện giọng nói. stop() trả về Promise với câu cuối cùng.
export function useSpeechRecognition({ lang = 'en-US' } = {}) {
  const recRef = useRef(null)
  const finalRef = useRef('')
  const resolveRef = useRef(null)
  const interimRef = useRef('')
  const consumedRef = useRef(true)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')

  const start = useCallback(() => {
    if (!SR || recRef.current) return
    const rec = new SR()
    rec.lang = lang
    rec.continuous = true
    rec.interimResults = true
    finalRef.current = ''
    interimRef.current = ''
    consumedRef.current = false
    setTranscript('')
    setInterim('')
    setError('')
    rec.onresult = (e) => {
      let fin = '', int = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) fin += r[0].transcript + ' '
        else int += r[0].transcript
      }
      finalRef.current = fin.trim()
      interimRef.current = int
      setTranscript(fin.trim())
      setInterim(int)
    }
    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') setError(e.error === 'not-allowed' ? 'Trình duyệt chưa được cấp quyền micro.' : `Lỗi micro: ${e.error}`)
    }
    rec.onend = () => {
      recRef.current = null
      setListening(false)
      const text = (finalRef.current + ' ' + (interimRef.current || '')).trim()
      finalRef.current = text
      interimRef.current = ''
      setTranscript(text)
      setInterim('')
      resolveRef.current?.(text)
      resolveRef.current = null
    }
    try {
      rec.start()
      recRef.current = rec
      setListening(true)
    } catch (err) {
      setError(String(err))
    }
  }, [lang])

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      if (!recRef.current) {
        // đã tự kết thúc trước khi thả phím: trả kết quả một lần duy nhất
        const out = consumedRef.current ? '' : finalRef.current
        consumedRef.current = true
        return resolve(out)
      }
      consumedRef.current = true
      resolveRef.current = resolve
      recRef.current.stop()
    })
  }, [])

  const reset = useCallback(() => {
    finalRef.current = ''
    setTranscript('')
    setInterim('')
  }, [])

  useEffect(() => () => recRef.current?.abort(), [])

  return { supported: sttSupported, listening, transcript, interim, error, start, stop, reset, setTranscript }
}

// Đọc theo giọng Anh-Mỹ ('US') hoặc Anh-Anh ('UK'). Trả về false nếu máy không có giọng phù hợp.
export function accentVoice(accent) {
  const lang = accent === 'UK' ? 'en-GB' : 'en-US'
  const voices = getVoices().filter((v) => v.lang.replace('_', '-').startsWith(lang))
  return voices.find((v) => /natural|google|online/i.test(v.name)) || voices[0] || null
}

export function speakAccent(text, accent = 'US', { rate = 1 } = {}) {
  return new Promise((resolve) => {
    if (!ttsSupported) return resolve(false)
    stopSpeaking()
    const u = new SpeechSynthesisUtterance(text)
    const v = accentVoice(accent)
    u.lang = accent === 'UK' ? 'en-GB' : 'en-US'
    if (v) u.voice = v
    u.rate = rate
    u.onend = () => resolve(!!v)
    u.onerror = () => resolve(!!v)
    window.speechSynthesis.speak(u)
  })
}

// Phát file âm thanh (giọng người thật từ từ điển); lỗi thì trả về false
export function playAudio(url, rate = 1) {
  return new Promise((resolve) => {
    try {
      stopSpeaking()
      const a = new Audio(url)
      a.playbackRate = rate
      a.onended = () => resolve(true)
      a.onerror = () => resolve(false)
      a.play().catch(() => resolve(false))
    } catch { resolve(false) }
  })
}
