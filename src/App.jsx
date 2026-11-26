import { useEffect, useState } from 'react'
import { update, useStore, getState } from './lib/store'
import { today } from './lib/date'
import { seedVocab, isDue } from './lib/srs'
import { dueReviews } from './lib/review'
import { getSeedVocabEntries } from './data'
import { stopSpeaking } from './lib/speech'
import Dashboard from './modules/Dashboard'
import Review from './modules/Review'
import Course from './modules/Course'
import Grammar from './modules/Grammar'
import Recall from './modules/Recall'
import Listening from './modules/Listening'
import Roleplay from './modules/Roleplay'
import Vocabulary from './modules/Vocabulary'
import Writing from './modules/Writing'
import Library from './modules/Library'
import History from './modules/History'
import Settings from './modules/Settings'

const NAV = [
  { path: '', label: 'Tổng quan', short: 'Tổng quan', icon: '📊', hint: 'M4', main: true },
  { path: 'review', label: 'Ôn tập hôm nay', short: 'Ôn tập', icon: '📅', hint: 'SRS', main: true },
  { path: 'course', label: 'Lộ trình từ vựng', short: 'Lộ trình', icon: '🧭', hint: 'A2→C1', main: true },
  { path: 'recall', label: 'Từ vựng chủ động', short: 'Nói', icon: '🗣️', hint: 'M1 · 20′', main: true },
  { path: 'listening', label: 'Nghe cai phụ đề', short: 'Nghe', icon: '🎧', hint: 'M2 · 25′', main: true },
  { path: 'roleplay', label: 'Nhập vai phản xạ', short: 'Nhập vai', icon: '⏱️', hint: 'M3 · 30′', main: true },
  { path: 'grammar', label: 'Ngữ pháp', short: 'Ngữ pháp', icon: '📐', hint: 'thì · câu ĐK' },
  { path: 'writing', label: 'Đọc & Viết', short: 'Đọc-Viết', icon: '✍️', hint: '15′' },
  { path: 'vocab', label: 'Kho từ vựng', short: 'Từ vựng', icon: '📚', hint: 'cụm từ' },
  { path: 'library', label: 'Thư viện bài học', short: 'Bài học', icon: '🗃️', hint: '+AI' },
  { path: 'history', label: 'Lịch sử học', short: 'Lịch sử', icon: '🗂️', hint: '' },
  { path: 'settings', label: 'Cài đặt', short: 'Cài đặt', icon: '⚙️', hint: 'API key' },
]

function useHashRoute() {
  const get = () => window.location.hash.replace(/^#\/?/, '').split('/')
  const [parts, setParts] = useState(get())
  useEffect(() => {
    const h = () => { stopSpeaking(); setParts(get()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  return parts
}

// Đếm thời gian học THỰC TẾ: chỉ tính khi tab đang mở và có thao tác trong 90 giây gần nhất
function useActiveTime(module) {
  useEffect(() => {
    if (!module) return
    let last = Date.now()
    const mark = () => (last = Date.now())
    const evs = ['keydown', 'mousedown', 'mousemove', 'touchstart']
    evs.forEach((e) => window.addEventListener(e, mark, { passive: true }))
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible' || Date.now() - last > 90000) return
      update((s) => {
        const d = today()
        const rec = s.time[d] || (s.time[d] = { total: 0 })
        rec.total = (rec.total || 0) + 5
        rec[module] = (rec[module] || 0) + 5
      })
    }, 5000)
    return () => {
      clearInterval(t)
      evs.forEach((e) => window.removeEventListener(e, mark))
    }
  }, [module])
}

function countDue(s) {
  return dueReviews(s).length + Object.values(s.vocab).filter((v) => isDue(v)).length
}

// Nhắc ôn: thông báo của trình duyệt khi đến giờ đã chọn (khi web/app đang mở hoặc chạy nền)
function useReminder() {
  useEffect(() => {
    const check = () => {
      const s = getState()
      const st = s.settings
      const n = countDue(s)
      if ('setAppBadge' in navigator) (n ? navigator.setAppBadge(n) : navigator.clearAppBadge?.())?.catch?.(() => {})
      if (!st.reminderOn || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      if (hhmm < st.reminderTime || s.lastNotified === today() || n === 0) return
      update((d) => { d.lastNotified = today() })
      try {
        const note = new Notification('📅 English Reflex – đến giờ ôn bài', { body: `Bạn có ${n} mục cần ôn hôm nay. Ôn 15 phút để không quên nhé!`, icon: './icon-192.png', tag: 'er-review' })
        note.onclick = () => { window.focus(); window.location.hash = '#/review' }
      } catch {}
    }
    check()
    const t = setInterval(check, 60000)
    return () => clearInterval(t)
  }, [])
}

export default function App() {
  const [page, param, param2] = useHashRoute()
  const s = useStore()
  const due = countDue(s)
  const [moreOpen, setMoreOpen] = useState(false)

  // Đưa cụm từ của mọi tình huống (kể cả tình huống mới tạo) vào kho từ
  useEffect(() => { seedVocab(getSeedVocabEntries()) }, [s.customSituations])
  useReminder()
  useEffect(() => setMoreOpen(false), [page])

  const moduleKey = { recall: 'recall', listening: 'listening', roleplay: 'roleplay', writing: 'writing', vocab: 'recall', review: 'recall', course: 'course', grammar: 'grammar' }[page]
  useActiveTime(moduleKey)

  let content
  switch (page) {
    case 'review': content = <Review />; break
    case 'course': content = <Course key={(param || 'x') + (param2 || '')} unitId={param} mode={param2} />; break
    case 'grammar': content = <Grammar key={(param || 'x') + (param2 || '')} id={param} mode={param2} />; break
    case 'recall': content = <Recall key={param || 'x'} mode={param} />; break
    case 'listening': content = <Listening key={param || 'x'} id={param} />; break
    case 'roleplay': content = <Roleplay key={param || 'x'} id={param} />; break
    case 'vocab': content = <Vocabulary />; break
    case 'writing': content = <Writing tab={param} id={param2} />; break
    case 'library': content = <Library />; break
    case 'history': content = <History />; break
    case 'settings': content = <Settings />; break
    default: content = <Dashboard />
  }

  const badge = (n) => n.path === 'review' && due > 0

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-60 md:min-h-screen md:sticky md:top-0 md:h-screen md:overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 bg-white">
        <div className="px-5 py-3 md:py-5">
          <div className="text-lg font-bold">🎙️ English Reflex</div>
          <div className="text-xs text-slate-500">Nghe & Nói phản xạ · Semiconductor × Taiwan</div>
        </div>
        <nav className="hidden md:flex md:flex-col px-3 pb-3 gap-1">
          {NAV.map((n) => {
            const active = (page || '') === n.path
            return (
              <a key={n.path} href={`#/${n.path}`} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm whitespace-nowrap ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span>{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                {badge(n) ? <span className="chip bg-rose-100 text-rose-700">{due}</span> : <span className="text-[10px] text-slate-400">{n.hint}</span>}
              </a>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 px-4 pt-5 pb-24 md:px-10 md:py-8 max-w-5xl">{content}</main>

      {/* Điều hướng cho điện thoại */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-16 inset-x-3 rounded-2xl bg-white p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {NAV.filter((n) => !n.main).map((n) => (
              <a key={n.path} href={`#/${n.path}`} className="flex items-center gap-3 rounded-xl px-4 py-3 text-base hover:bg-slate-50">
                <span>{n.icon}</span>{n.label}
              </a>
            ))}
          </div>
        </div>
      )}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-7 border-t border-slate-200 bg-white/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.filter((n) => n.main).map((n) => {
          const active = (page || '') === n.path
          return (
            <a key={n.path} href={`#/${n.path}`} className={`relative flex flex-col items-center py-2 text-[10px] ${active ? 'text-indigo-700 font-semibold' : 'text-slate-500'}`}>
              <span className="text-lg leading-none">{n.icon}</span>
              <span className="mt-1 truncate max-w-full">{n.short}</span>
              {badge(n) && <span className="absolute right-2 top-1 rounded-full bg-rose-500 px-1 text-[9px] text-white">{due}</span>}
            </a>
          )
        })}
        <button onClick={() => setMoreOpen((x) => !x)} className={`flex flex-col items-center py-2 text-[10px] ${moreOpen || NAV.some((n) => !n.main && n.path === page) ? 'text-indigo-700 font-semibold' : 'text-slate-500'}`}>
          <span className="text-lg leading-none">☰</span>
          <span className="mt-1">Thêm</span>
        </button>
      </nav>
    </div>
  )
}
