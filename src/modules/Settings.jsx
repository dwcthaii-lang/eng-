import { useRef, useState } from 'react'
import { useStore, update, getState, replaceState, resetAll } from '../lib/store'
import { useVoices, speak, sttSupported, ttsSupported } from '../lib/speech'
import { testConnection } from '../lib/ai'
import { PageHeader } from '../components/ui'

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1">
      <div className="text-sm font-medium">{label}</div>
      {children}
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </label>
  )
}

export default function Settings() {
  const s = useStore((x) => x.settings)
  const voices = useVoices()
  const [test, setTest] = useState('')
  const fileRef = useRef()
  const set = (patch) => update((d) => Object.assign(d.settings, patch))

  const [notif, setNotif] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  const enableReminder = async (on) => {
    if (on && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission()
      setNotif(p)
    }
    set({ reminderOn: on })
  }
  // File lịch (.ics) nhắc ôn mỗi ngày – thêm vào Google Calendar / điện thoại
  const downloadIcs = () => {
    const [h, m] = s.reminderTime.split(':')
    const d = new Date()
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    const url = window.location.origin + window.location.pathname + '#/review'
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//English Reflex//VI', 'BEGIN:VEVENT',
      `UID:english-reflex-daily-${ymd}`, `DTSTAMP:${ymd}T000000`, `DTSTART:${ymd}T${h}${m}00`, 'DURATION:PT30M', 'RRULE:FREQ=DAILY',
      'SUMMARY:📅 Ôn tập English Reflex', `DESCRIPTION:Mở ${url} để ôn các bài đến hạn hôm nay.`, `URL:${url}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Đến giờ ôn tiếng Anh', 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    a.download = 'english-reflex-nhac-on.ics'
    a.click()
  }

  const runTest = async () => {
    setTest('Đang kiểm tra…')
    try {
      setTest((await testConnection()) ? '✅ Kết nối thành công' : '⚠️ Phản hồi lạ')
    } catch (e) {
      setTest('❌ ' + (e.message || e))
    }
  }

  const exportData = () => {
    const data = { ...getState(), settings: { ...getState().settings, geminiKey: '', openaiKey: '' } }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `english-reflex-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const importData = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      const keep = getState().settings
      replaceState({ ...data, settings: { ...data.settings, geminiKey: keep.geminiKey, openaiKey: keep.openaiKey } })
      alert('Đã nhập dữ liệu!')
    } catch {
      alert('File không hợp lệ')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="⚙️ Cài đặt" />

      <div className="card space-y-2 text-sm">
        <div className="label">Kiểm tra trình duyệt</div>
        <div>{sttSupported ? '✅' : '❌'} Nhận diện giọng nói (SpeechRecognition) {sttSupported ? '' : '– hãy dùng Google Chrome hoặc Microsoft Edge'}</div>
        <div>{ttsSupported ? '✅' : '❌'} Đọc văn bản (SpeechSynthesis) · {voices.length} giọng tiếng Anh</div>
      </div>

      <div className="card space-y-4">
        <div className="label">AI nâng cao (tuỳ chọn) – chấm ngữ nghĩa & sinh hội thoại động</div>
        <div className="flex flex-wrap gap-2">
          {[['none', 'Không dùng (miễn phí, offline)'], ['gemini', 'Google Gemini'], ['openai', 'OpenAI']].map(([k, l]) => (
            <button key={k} onClick={() => set({ aiProvider: k })} className={s.aiProvider === k ? 'btn-primary' : 'btn-ghost'}>{l}</button>
          ))}
        </div>
        {s.aiProvider === 'gemini' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Gemini API key" hint="Lấy miễn phí tại aistudio.google.com → Get API key">
              <input className="input" type="password" value={s.geminiKey} onChange={(e) => set({ geminiKey: e.target.value.trim() })} placeholder="AIza…" />
            </Field>
            <Field label="Model" hint="vd: gemini-2.5-flash">
              <input className="input" value={s.geminiModel} onChange={(e) => set({ geminiModel: e.target.value.trim() })} />
            </Field>
          </div>
        )}
        {s.aiProvider === 'openai' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="OpenAI API key" hint="platform.openai.com → API keys">
              <input className="input" type="password" value={s.openaiKey} onChange={(e) => set({ openaiKey: e.target.value.trim() })} placeholder="sk-…" />
            </Field>
            <Field label="Model" hint="vd: gpt-4o-mini">
              <input className="input" value={s.openaiModel} onChange={(e) => set({ openaiModel: e.target.value.trim() })} />
            </Field>
          </div>
        )}
        {s.aiProvider !== 'none' && (
          <div className="flex items-center gap-3">
            <button className="btn-ghost" onClick={runTest}>Kiểm tra kết nối</button>
            <span className="text-sm">{test}</span>
          </div>
        )}
        <p className="text-xs text-slate-500">API key chỉ lưu trong LocalStorage của trình duyệt trên máy bạn và được gửi thẳng tới Google/OpenAI khi dùng tính năng AI. Không có máy chủ trung gian. Khi xuất dữ liệu sao lưu, key sẽ được loại bỏ.</p>
      </div>

      <div className="card space-y-4">
        <div className="label">Giọng đọc & tốc độ</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[['voiceA', 'Giọng nhân vật A / AI'], ['voiceB', 'Giọng nhân vật B']].map(([k, l]) => (
            <Field key={k} label={l}>
              <div className="flex gap-2">
                <select className="input" value={s[k]} onChange={(e) => set({ [k]: e.target.value })}>
                  <option value="">Tự động (ưu tiên giọng Natural/Google)</option>
                  {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                </select>
                <button className="btn-ghost" onClick={() => speak("Hey, are you gonna use the washer later?", { voiceName: s[k], voiceIndex: k === 'voiceA' ? 0 : 1, rate: s.speechRate })}>🔈</button>
              </div>
            </Field>
          ))}
        </div>
        <Field label={`Tốc độ nói: ${s.speechRate}×`} hint="1.0–1.1 là tốc độ tự nhiên. Edge có các giọng “Online (Natural)” nghe rất thật.">
          <input type="range" min="0.7" max="1.3" step="0.05" value={s.speechRate} onChange={(e) => set({ speechRate: Number(e.target.value) })} className="w-full" />
        </Field>
      </div>

      <div className="card space-y-4">
        <div className="label">📅 Nhắc ôn hằng ngày</div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.reminderOn} onChange={(e) => enableReminder(e.target.checked)} /> Thông báo trên trình duyệt lúc</label>
          <input type="time" className="input !w-32" value={s.reminderTime} onChange={(e) => set({ reminderTime: e.target.value })} />
          {notif === 'denied' && <span className="text-xs text-rose-600">Trình duyệt đang chặn thông báo – bật lại trong cài đặt trang web.</span>}
          {notif === 'unsupported' && <span className="text-xs text-rose-600">Trình duyệt này không hỗ trợ thông báo.</span>}
        </div>
        <p className="text-xs text-slate-500">Thông báo hiện khi web/app đang mở (kể cả ở tab nền). Để chắc chắn được nhắc mỗi ngày kể cả khi không mở web, hãy thêm lịch nhắc vào Google Calendar / lịch điện thoại:</p>
        <button className="btn-ghost" onClick={downloadIcs}>⬇ Tải lịch nhắc hằng ngày (.ics)</button>
      </div>

      <div className="card space-y-4">
        <div className="label">Luyện tập</div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={`Đếm ngược phản xạ: ${s.countdownSec} giây`} hint="Khuyến nghị bắt đầu 8s, giảm dần xuống 5s">
            <input type="range" min="5" max="8" step="1" value={s.countdownSec} onChange={(e) => set({ countdownSec: Number(e.target.value) })} className="w-full" />
          </Field>
          <Field label={`Mục tiêu mỗi ngày: ${s.dailyGoalMin} phút`}>
            <input type="range" min="60" max="120" step="10" value={s.dailyGoalMin} onChange={(e) => set({ dailyGoalMin: Number(e.target.value) })} className="w-full" />
          </Field>
          <Field label={`Số thẻ mỗi phiên Module 1: ${s.recallSessionSize}`}>
            <input type="range" min="5" max="20" step="1" value={s.recallSessionSize} onChange={(e) => set({ recallSessionSize: Number(e.target.value) })} className="w-full" />
          </Field>
          <Field label={`Từ MỚI/ngày (Lộ trình từ vựng): ${s.newWordsPerDay}`} hint="15 từ/ngày ≈ 3000 từ trong ~7 tháng">
            <input type="range" min="5" max="40" step="5" value={s.newWordsPerDay} onChange={(e) => set({ newWordsPerDay: Number(e.target.value) })} className="w-full" />
          </Field>
          <Field label={`Thẻ nói MỚI tối đa/ngày: ${s.newRecallPerDay}`} hint="Giới hạn học mới để luôn còn sức ôn bài cũ">
            <input type="range" min="2" max="20" step="1" value={s.newRecallPerDay} onChange={(e) => set({ newRecallPerDay: Number(e.target.value) })} className="w-full" />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={s.grammarCheck} onChange={(e) => set({ grammarCheck: e.target.checked })} />
          <span>Sửa ngữ pháp & chính tả bằng <b>LanguageTool</b> (miễn phí, không cần key) ở phần Viết/Dịch. <span className="text-slate-500">Bài viết được gửi tới api.languagetool.org để kiểm tra.</span></span>
        </label>
      </div>

      <div className="card space-y-3">
        <div className="label">Dữ liệu (lưu cục bộ trong trình duyệt)</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={exportData}>⬇ Xuất file sao lưu</button>
          <button className="btn-ghost" onClick={() => fileRef.current.click()}>⬆ Nhập file sao lưu</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importData} />
          <button className="btn-danger" onClick={() => confirm('Xoá toàn bộ tiến độ học? Không thể hoàn tác.') && (resetAll(), location.reload())}>Xoá toàn bộ dữ liệu</button>
        </div>
        <p className="text-xs text-slate-500">Dữ liệu gắn với trình duyệt + địa chỉ http://localhost:5173. Nên xuất sao lưu mỗi tuần.</p>
      </div>

      <div className="card text-sm space-y-1">
        <div className="label mb-1">Phím tắt</div>
        <div><span className="kbd">Space</span> (giữ) nói · <span className="kbd">R</span> nghe lại · <span className="kbd">H</span> gợi ý · <span className="kbd">Enter</span> tiếp tục · <span className="kbd">T</span> hiện/ẩn chữ (nhập vai) · <span className="kbd">S</span> shadow câu đang chọn</div>
      </div>
    </div>
  )
}
