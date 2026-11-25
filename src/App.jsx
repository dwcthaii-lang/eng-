import { useEffect, useState } from 'react'
import { update, useStore } from './lib/store'
import { today } from './lib/date'
import { seedVocab, isDue } from './lib/srs'
import { seedVocabEntries } from './data'
import { stopSpeaking } from './lib/speech'
import Dashboard from './modules/Dashboard'
import Recall from './modules/Recall'
import Listening from './modules/Listening'
import Roleplay from './modules/Roleplay'
import Vocabulary from './modules/Vocabulary'
import Writing from './modules/Writing'
import Settings from './modules/Settings'

const NAV = [
  { path: '', label: 'Tổng quan', short: 'Tổng quan', icon: '📊', hint: 'M4' },
  { path: 'recall', label: 'Từ vựng chủ động', short: 'Nói', icon: '🗣️', hint: 'M1 · 20′' },
  { path: 'listening', label: 'Nghe cai phụ đề', short: 'Nghe', icon: '🎧', hint: 'M2 · 25′' },
  { path: 'roleplay', label: 'Nhập vai phản xạ', short: 'Nhập vai', icon: '⏱️', hint: 'M3 · 30′' },
  { path: 'writing', label: 'Đọc & Viết', short: 'Đọc-Viết', icon: '✍️', hint: '15′' },
  { path: 'vocab', label: 'Kho từ vựng', short: 'Từ vựng', icon: '📚', hint: 'SRS' },
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

export default function App() {
  const [page, param] = useHashRoute()
  const vocab = useStore((s) => s.vocab)
  const dueCount = Object.values(vocab).filter((v) => isDue(v)).length

  useEffect(() => { seedVocab(seedVocabEntries) }, [])

  const moduleKey = { recall: 'recall', listening: 'listening', roleplay: 'roleplay', writing: 'writing', vocab: 'recall' }[page]
  useActiveTime(moduleKey)

  let content
  switch (page) {
    case 'recall': content = <Recall mode={param} />; break
    case 'listening': content = <Listening id={param} />; break
    case 'roleplay': content = <Roleplay id={param} />; break
    case 'vocab': content = <Vocabulary />; break
    case 'writing': content = <Writing />; break
    case 'settings': content = <Settings />; break
    default: content = <Dashboard />
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-60 md:min-h-screen md:sticky md:top-0 md:h-screen border-b md:border-b-0 md:border-r border-slate-200 bg-white">
        <div className="px-5 py-3 md:py-5">
          <div className="text-lg font-bold">🎙️ English Reflex</div>
          <div className="text-xs text-slate-500">Nghe & Nói phản xạ · Semiconductor × Taiwan</div>
        </div>
        <nav className="hidden md:flex md:flex-col px-3 pb-3 gap-1">
          {NAV.map((n) => {
            const active = (page || '') === n.path
            return (
              <a
                key={n.path}
                href={`#/${n.path}`}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm whitespace-nowrap ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span>{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                {n.path === 'vocab' && dueCount > 0 ? (
                  <span className="chip bg-rose-100 text-rose-700">{dueCount}</span>
                ) : (
                  <span className="hidden md:inline text-[10px] text-slate-400">{n.hint}</span>
                )}
              </a>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 px-4 pt-5 pb-24 md:px-10 md:py-8 max-w-5xl">{content}</main>
      {/* Thanh điều hướng dưới cho điện thoại */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 grid grid-cols-7 border-t border-slate-200 bg-white/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map((n) => {
          const active = (page || '') === n.path
          return (
            <a key={n.path} href={`#/${n.path}`} className={`relative flex flex-col items-center py-2 text-[10px] ${active ? 'text-indigo-700 font-semibold' : 'text-slate-500'}`}>
              <span className="text-lg leading-none">{n.icon}</span>
              <span className="mt-1 truncate max-w-full">{n.short}</span>
              {n.path === 'vocab' && dueCount > 0 && <span className="absolute right-1 top-1 rounded-full bg-rose-500 px-1 text-[9px] text-white">{dueCount}</span>}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
