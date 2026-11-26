// Phím tắt: giữ Space để nói, R nghe lại, H gợi ý, Enter tiếp tục...
import { useEffect, useRef } from 'react'

function isTyping(e) {
  const t = e.target
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
}

// Ô gõ câu trả lời (data-talk) đang TRỐNG: vẫn cho giữ Space để nói và Enter để sang câu
function emptyTalkBox(e) {
  const t = e.target
  return !!t && t.dataset?.talk !== undefined && !t.value
}

// map: { r: fn, h: fn, Enter: fn, ... } (không phân biệt hoa thường cho chữ cái)
export function useHotkeys(map, enabled = true) {
  const ref = useRef(map)
  ref.current = map
  useEffect(() => {
    if (!enabled) return
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isTyping(e) && !(e.key === 'Enter' && emptyTalkBox(e))) return
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const fn = ref.current[k]
      if (fn) {
        e.preventDefault()
        fn(e)
      }
    }
    // Nhấn rồi thả RIÊNG phím Ctrl = nghe lại (hành động của phím R). Dùng được cả khi đang gõ trong ô.
    let ctrlAlone = false
    const onCtrlDown = (e) => { ctrlAlone = e.key === 'Control' && !e.repeat ? true : e.key === 'Control' ? ctrlAlone : false }
    const onCtrlUp = (e) => {
      if (e.key !== 'Control' || !ctrlAlone) return
      ctrlAlone = false
      const fn = ref.current.r || ref.current.Control
      if (fn) fn(e)
    }
    const onMouse = () => { ctrlAlone = false }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keydown', onCtrlDown, true)
    window.addEventListener('keyup', onCtrlUp, true)
    window.addEventListener('mousedown', onMouse, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', onCtrlDown, true)
      window.removeEventListener('keyup', onCtrlUp, true)
      window.removeEventListener('mousedown', onMouse, true)
    }
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
      if (e.code !== 'Space' || (isTyping(e) && !emptyTalkBox(e))) return
      e.preventDefault()
      if (e.repeat || down.current) return
      down.current = true
      ref.current.onStart?.()
    }
    const ku = (e) => {
      if (e.code !== 'Space' || (isTyping(e) && !emptyTalkBox(e) && !down.current)) return
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
