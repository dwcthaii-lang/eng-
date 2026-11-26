// Nghĩa tiếng Việt của một câu tiếng Anh
// - Có sẵn trong dữ liệu → dùng luôn
// - Hiện ngay bản dịch nhanh (Google), rồi AI dịch lại TỰ NHIÊN theo ngữ cảnh cả đoạn (ctx) và thay vào
import { useEffect, useState } from 'react'
import { translateText, translateNatural, cachedTranslation } from '../lib/dict'
import { aiEnabled } from '../lib/ai'
import { useStore } from '../lib/store'
import { Elapsed } from './Elapsed'

export function SentenceVi({ en, vi, ctx = '', className = '' }) {
  const show = useStore((s) => s.settings.showSentenceVi)
  const [res, setRes] = useState(() => (vi ? { vi, by: 'data' } : cachedTranslation(en)))
  const [failed, setFailed] = useState(false)
  const [polishing, setPolishing] = useState(false)
  useEffect(() => {
    if (!show || vi) return
    let alive = true
    const cur = cachedTranslation(en)
    if (cur) setRes(cur)
    if (!cur) translateText(en).then((r) => { if (!alive) return; if (r) setRes((x) => (x?.by === 'AI' ? x : r)); else if (!aiEnabled()) setFailed(true) })
    if (aiEnabled() && cur?.by !== 'AI') {
      setPolishing(true)
      translateNatural(en, ctx).then((r) => { if (!alive) return; setPolishing(false); if (r) setRes(r) })
    }
    return () => { alive = false }
  }, [en, vi, show])
  if (!show) return null
  return (
    <div data-no-lookup className={`text-base text-slate-500 ${className}`}>
      🇻🇳 {res ? res.vi : failed ? <span className="text-xs">(chưa dịch được – kiểm tra mạng)</span> : <span className="text-xs">đang dịch…</span>}
      {res && res.by === 'Google' && (polishing ? <span className="ml-1 text-[10px] text-indigo-400 animate-pulse">· AI đang dịch mượt hơn…<Elapsed /></span> : <span className="ml-1 text-[10px] text-slate-400" title="Nhập API key Gemini trong Cài đặt để AI dịch tự nhiên theo ngữ cảnh">(dịch máy)</span>)}
    </div>
  )
}
