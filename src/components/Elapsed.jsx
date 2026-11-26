// Đếm giây đang chờ AI (để biết app vẫn đang chạy, không bị treo)
import { useEffect, useState } from 'react'
export function Elapsed({ className = '' }) {
  const [t0] = useState(() => Date.now())
  const [, tick] = useState(0)
  useEffect(() => { const i = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(i) }, [])
  const s = Math.floor((Date.now() - t0) / 1000)
  return s >= 2 ? <span className={className}> · {s}s</span> : null
}
