// Thông báo nhỏ khi AI hết lượt và đang tự đợi / chuyển sang dự phòng
import { useEffect, useState } from 'react'
import { subscribeAiNotice, getAiNotice } from '../lib/ai'

export function AiNotice() {
  const [n, setN] = useState(getAiNotice())
  const [, tick] = useState(0)
  useEffect(() => subscribeAiNotice(setN), [])
  useEffect(() => {
    if (!n) return
    const t = setInterval(() => { tick((x) => x + 1); if (n.until && Date.now() > n.until + 1500) setN(null) }, 500)
    return () => clearInterval(t)
  }, [n])
  if (!n) return null
  const left = n.until ? Math.max(0, Math.ceil((n.until - Date.now()) / 1000)) : null
  return (
    <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-amber-100 px-4 py-1.5 text-sm text-amber-900 shadow" role="status">
      ⏳ {n.msg}{n.kind === 'wait' && left != null ? ` (${left}s)` : ''}
    </div>
  )
}
