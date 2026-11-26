// Nghĩa tiếng Việt của một câu tiếng Anh (dịch tự động, có bộ nhớ đệm)
import { useEffect, useState } from 'react'
import { translateText, cachedTranslation } from '../lib/dict'
import { useStore } from '../lib/store'

export function SentenceVi({ en, vi, className = '' }) {
  const show = useStore((s) => s.settings.showSentenceVi)
  const [res, setRes] = useState(() => (vi ? { vi } : cachedTranslation(en)))
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!show || vi || res) return
    let alive = true
    translateText(en).then((r) => { if (!alive) return; r ? setRes(r) : setFailed(true) })
    return () => { alive = false }
  }, [en, vi, show])
  if (!show) return null
  return (
    <div data-no-lookup className={`text-base text-slate-500 ${className}`}>
      🇻🇳 {res ? res.vi : failed ? <span className="text-xs">(chưa dịch được – kiểm tra mạng)</span> : <span className="text-xs">đang dịch…</span>}
      {res?.by && res.by !== 'Google' && <span className="ml-1 text-[10px] text-slate-400">({res.by})</span>}
    </div>
  )
}
