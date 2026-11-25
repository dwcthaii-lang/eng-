// Phím tắt: giữ Space để nói, R nghe lại, H gợi ý, Enter tiếp tục...
import { useEffect, useRef } from 'react'

function isTyping(e) {
  const t = e.target
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
}

// map: { r: fn, h: fn, Enter: fn, ... } (không phân biệt hoa thường cho chữ cái)
export function useHotkeys(map, enabled = true) {
  const ref = useRef(map)
  ref.current = map
  useEffect(() => {
    if (!enabled) return
    const onKey = (e) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const fn = ref.current[k]
      if (fn) {
        e.preventDefault()
        fn(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

// Nhấn giữ Space để nói, thả ra để dừng
export function useHoldToTalk({ onStart, onStop, enabled = true }) {
  const ref = useRef({ onStart, onStop })
  ref.current = { onStart, onStop }
  const down = useRef(false)
  useEffect(() => {
    if (!enabled) return
    const kd = (e) => {
      // Esc trong ô nhập -> thoát ô để dùng lại phím Space nói
      if (e.key === 'Escape' && isTyping(e)) return e.target.blur()
      if (e.code !== 'Space' || isTyping(e)) return
      e.preventDefault()
      if (e.repeat || down.current) return
      down.current = true
      ref.current.onStart?.()
    }
    const ku = (e) => {
      if (e.code !== 'Space' || isTyping(e)) return
      e.preventDefault()
      if (!down.current) return
      down.current = false
      ref.current.onStop?.()
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [enabled])
}
