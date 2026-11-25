import { useCallback, useState } from 'react'
import { useSpeechRecognition } from '../lib/speech'
import { useHoldToTalk } from '../lib/hotkeys'
import { stopSpeaking } from '../lib/speech'

// Hook dùng micro: giữ Space hoặc giữ nút để nói; thả ra -> onFinal(text)
export function useMic({ onFinal, enabled = true, onStart } = {}) {
  const rec = useSpeechRecognition()
  const begin = useCallback(() => {
    if (!enabled) return
    stopSpeaking()
    onStart?.()
    rec.start()
  }, [enabled, rec, onStart])
  const end = useCallback(async () => {
    if (!rec.listening && !enabled) return
    const text = await rec.stop()
    if (text && text.trim()) onFinal?.(text.trim())
  }, [rec, onFinal, enabled])
  useHoldToTalk({ onStart: begin, onStop: end, enabled })
  return { ...rec, begin, end, enabled }
}

export function MicButton({ mic, label = 'Giữ để nói', size = 'lg' }) {
  const big = size === 'lg'
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={!mic.enabled}
        onMouseDown={mic.begin}
        onMouseUp={mic.end}
        onMouseLeave={() => mic.listening && mic.end()}
        onTouchStart={(e) => { e.preventDefault(); mic.begin() }}
        onTouchEnd={(e) => { e.preventDefault(); mic.end() }}
        style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative rounded-full flex items-center justify-center select-none transition disabled:opacity-40 ${
          big ? 'h-20 w-20 text-3xl' : 'h-12 w-12 text-xl'
        } ${mic.listening ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        title="Nhấn giữ (hoặc giữ phím Space) để nói"
      >
        {mic.listening && <span className="absolute inset-0 rounded-full animate-ping bg-rose-400 opacity-40" />}
        <span className="relative">🎙️</span>
      </button>
      <div className="text-xs text-slate-500">
        {mic.listening ? 'Đang nghe… thả ra để dừng' : <>{label}<span className="hidden md:inline"> · giữ <span className="kbd">Space</span></span></>}
      </div>
      {!mic.supported && <div className="text-xs text-rose-600">Trình duyệt không hỗ trợ nhận diện giọng nói – hãy dùng Chrome/Edge, hoặc gõ câu trả lời.</div>}
      {mic.error && <div className="text-xs text-rose-600">{mic.error}</div>}
    </div>
  )
}

export function LiveTranscript({ mic, placeholder = 'Câu bạn nói sẽ hiện ở đây…' }) {
  const text = [mic.transcript, mic.interim].filter(Boolean).join(' ')
  return (
    <div className={`min-h-[3rem] rounded-xl border px-4 py-3 text-base ${mic.listening ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
      {text ? (
        <span>
          {mic.transcript} <span className="text-slate-400">{mic.interim}</span>
        </span>
      ) : (
        <span className="text-slate-400">{placeholder}</span>
      )}
    </div>
  )
}

// Ô gõ thay thế khi không dùng mic
export function TypeFallback({ onSubmit, placeholder = 'Hoặc gõ câu trả lời rồi Enter…' }) {
  const [v, setV] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (v.trim()) { onSubmit(v.trim()); setV(''); e.target.querySelector('input')?.blur() }
      }}
    >
      <input className="input" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} />
    </form>
  )
}
