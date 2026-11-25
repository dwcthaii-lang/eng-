// Ngày theo giờ địa phương, dạng YYYY-MM-DD
export function today(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return today(dt)
}
export function daysBetween(a, b) {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number)
  const da = new Date(pa[0], pa[1] - 1, pa[2]), db = new Date(pb[0], pb[1] - 1, pb[2])
  return Math.round((db - da) / 86400000)
}
export function lastNDays(n) {
  const t = today()
  return Array.from({ length: n }, (_, i) => addDays(t, i - n + 1))
}
export function fmtMin(sec) {
  return Math.round((sec || 0) / 60)
}
