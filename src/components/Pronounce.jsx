// PHÁT ÂM & TRA TỪ NHANH (dùng ở mọi trang)
// 1) Nút 🔊 nổi: dán từ/câu → nghe mẫu giọng Anh-Mỹ / Anh-Anh, đọc chậm, thử đọc bằng mic
// 2) Bôi chọn một từ/cụm từ trên trang → cửa sổ nhỏ: phiên âm, nghĩa tiếng Việt, loại từ, ví dụ, loa
// Từ lưu lại → vào kho từ (nguồn 'pron') → có lịch ôn lặp lại ngắt quãng như mọi từ khác.
import { useEffect, useRef, useState } from 'react'
import { lookupWord, pronounce, posVi, cleanWord } from '../lib/dict'
import { useStore, update } from '../lib/store'
import { today, addDays } from '../lib/date'
import { seedVocab, recordSpoken, vocabId, isDue } from '../lib/srs'
import { useSpeechRecognition, stopSpeaking } from '../lib/speech'
import { useHotkeys } from '../lib/hotkeys'
import { normalize } from '../lib/text'

const SRC = 'pron'
const isWordish = (t) => /^[A-Za-z][A-Za-z'’\- ]{0,40}$/.test(t) && t.trim().split(/\s+/).length <= 4

// Lưu từ hay đọc sai: vào kho từ + hẹn ôn lần đầu ngày mai (rồi giãn dần 1 → 2 → 4 → 7 ngày)
function savePron(word, vi = '', example = '') {
  seedVocab([{ en: word, vi, source: SRC, example }])
  update((d) => {
    const it = d.vocab[vocabId(word)]
    if (!it) return
    if (vi && !it.vi) it.vi = vi
    if (example && !it.example) it.example = example
    if (!it.nextReview && it.stage !== 'mastered') { it.nextReview = addDays(today(), 1); if (it.stage === 'new') it.stage = 'heard' }
  })
}

// Nút loa giọng Mỹ / Anh (+ chậm)
function Speakers({ text, info, small = false }) {
  const [note, setNote] = useState('')
  const play = async (acc, slow) => {
    const r = await pronounce(text, acc, { slow, info })
    setNote(r === 'no-voice' ? `Máy chưa có giọng ${acc === 'UK' ? 'Anh-Anh' : 'Anh-Mỹ'}, đang dùng giọng mặc định. Dùng Chrome/Edge để có đủ giọng.` : '')
  }
  const cls = small ? 'rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-indigo-50' : 'rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-indigo-50'
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <button className={cls} onClick={() => play('US', false)} title="Giọng Anh-Mỹ">🇺🇸 Mỹ 🔈</button>
        <button className={cls} onClick={() => play('UK', false)} title="Giọng Anh-Anh">🇬🇧 Anh 🔈</button>
        <button className={cls} onClick={() => play('US', true)} title="Đọc chậm (Mỹ)">🐢 chậm</button>
        {!small && <button className={cls} onClick={() => play('UK', true)} title="Đọc chậm (Anh)">🐢 Anh</button>}
      </div>
      {note && <div className="mt-1 text-[11px] text-amber-700">{note}</div>}
    </div>
  )
}

// Thử đọc: giữ nút mic, so với từ mẫu
function TryMic({ word, onResult }) {
  const rec = useSpeechRecognition()
  const [res, setRes] = useState(null)
  const begin = () => { stopSpeaking(); setRes(null); rec.start() }
  const end = async () => {
    const said = await rec.stop()
    if (!said) return
    const target = normalize(word).join(' ')
    const ok = (' ' + normalize(said).join(' ') + ' ').includes(' ' + target + ' ')
    setRes({ said, ok })
    onResult?.(ok)
  }
  if (!rec.supported) return null
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button
        onMouseDown={begin} onMouseUp={end} onMouseLeave={() => rec.listening && end()}
        onTouchStart={(e) => { e.preventDefault(); begin() }} onTouchEnd={(e) => { e.preventDefault(); end() }}
        onContextMenu={(e) => e.preventDefault()} style={{ touchAction: 'none' }}
        className={`rounded-lg px-3 py-1.5 text-white ${rec.listening ? 'bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
      >🎙️ {rec.listening ? 'Đang nghe… thả ra' : 'Giữ để thử đọc'}</button>
      {rec.listening && <span className="text-slate-500">{rec.transcript} {rec.interim}</span>}
      {res && <span className={res.ok ? 'text-emerald-700' : 'text-rose-700'}>{res.ok ? '✅ Máy nghe đúng!' : `❌ Máy nghe thành “${res.said}” – nghe mẫu rồi thử lại`}</span>}
      {rec.error && <span className="text-rose-600">{rec.error}</span>}
    </div>
  )
}

// Thẻ tra từ (dùng chung cho cửa sổ chọn từ và thanh phát âm)
export function LookupCard({ word, context = '' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const vocab = useStore((s) => s.vocab)
  const saved = vocab[vocabId(word)]
  const isPron = saved?.sources.includes(SRC)

  useEffect(() => {
    let alive = true
    setLoading(true)
    lookupWord(word, context).then((d) => { if (alive) { setData(d); setLoading(false) } }).catch(() => alive && setLoading(false))
    return () => { alive = false }
  }, [word, context])

  const info = data?.dict
  const vi = data?.local?.vi || data?.vi?.vi
  const ipaUS = info?.ipaUS || data?.vi?.ipaUS
  const ipaUK = info?.ipaUK || data?.vi?.ipaUK
  const posList = info?.meanings?.map((m) => m.pos) || (data?.vi?.pos ? [data.vi.pos] : [])
  const aiEx = data?.vi?.example
  const exLocal = data?.local?.ex

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-lg font-bold">{word}</span>
        {info?.lemma && info.lemma.toLowerCase() !== word.toLowerCase() && <span className="text-xs text-slate-500">(gốc: {info.lemma})</span>}
        {ipaUS && <span className="text-slate-600">🇺🇸 {ipaUS}</span>}
        {ipaUK && ipaUK !== ipaUS && <span className="text-slate-600">🇬🇧 {ipaUK}</span>}
      </div>
      <Speakers text={word} info={info} />
      {loading && <div className="text-slate-400">⏳ Đang tra từ điển…</div>}
      {!loading && (
        <>
          {vi && <div><span className="text-slate-500">Nghĩa:</span> <b>{vi}</b>{data?.vi?.by && !data?.local?.vi && <span className="ml-1 text-[10px] text-slate-400">({data.vi.by})</span>}</div>}
          {posList.length > 0 && <div className="flex flex-wrap gap-1">{[...new Set(posList)].map((p) => <span key={p} className="chip bg-indigo-50 text-indigo-700">{posVi(p)}</span>)}</div>}
          {exLocal && <Example en={exLocal} />}
          {aiEx && <Example en={aiEx} vi={data.vi.exampleVi} />}
          {info?.meanings?.slice(0, 3).map((m) => (
            <div key={m.pos} className="rounded-lg bg-slate-50 p-2">
              <div className="text-[11px] font-semibold uppercase text-slate-500">{posVi(m.pos)} · {m.pos}</div>
              {m.defs.slice(0, 2).map((d, i) => (
                <div key={i} className="mt-1">
                  <div className="text-slate-700">• {d.def}</div>
                  {d.ex && <Example en={d.ex} />}
                </div>
              ))}
              {m.synonyms.length > 0 && <div className="mt-1 text-xs text-slate-500">≈ {m.synonyms.join(', ')}</div>}
            </div>
          ))}
          {!info && !vi && <div className="text-slate-500">Không tìm thấy trong từ điển (có thể do mất mạng). Bạn vẫn nghe được phát âm ở trên.</div>}
        </>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
        {isPron ? (
          <span className="text-xs text-emerald-700">⭐ Đã lưu để ôn{saved.nextReview ? ` · ôn lại ${saved.nextReview.slice(8, 10)}/${saved.nextReview.slice(5, 7)}` : ''}</span>
        ) : (
          <button className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200" onClick={() => savePron(word, vi || '', exLocal || aiEx || info?.meanings?.[0]?.defs.find((d) => d.ex)?.ex || '')}>⭐ Lưu để ôn (lặp lại ngắt quãng)</button>
        )}
        <TryMic word={word} onResult={(ok) => { if (!isPron) savePron(word, vi || ''); recordSpoken(word, { correct: ok, aided: false }) }} />
      </div>
    </div>
  )
}

function Example({ en, vi }) {
  return (
    <div className="flex gap-1 text-slate-600">
      <button onClick={() => pronounce(en, 'US')} className="text-slate-400 hover:text-indigo-600">🔈</button>
      <span><i>“{en}”</i>{vi ? <span className="text-slate-500"> – {vi}</span> : null}</span>
    </div>
  )
}

// ───── Cửa sổ nhỏ khi bôi chọn từ ─────
export function SelectionLookup() {
  const [pop, setPop] = useState(null) // { word, context, x, y }
  const ref = useRef(null)

  useEffect(() => {
    let timer = null
    const check = () => {
      const sel = window.getSelection?.()
      if (!sel || sel.isCollapsed || !sel.rangeCount) return
      const node = sel.anchorNode
      const el = node?.nodeType === 1 ? node : node?.parentElement
      if (!el || ref.current?.contains(el) || el.closest('input,textarea,[contenteditable],[data-no-lookup]')) return
      const text = cleanWord(sel.toString())
      if (!text || !isWordish(text)) return
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      const context = (el.closest('p,li,td,div')?.textContent || '').slice(0, 300)
      const w = Math.min(360, window.innerWidth - 16)
      const x = Math.max(8, Math.min(rect.left + window.scrollX, window.scrollX + window.innerWidth - w - 8))
      setPop({ word: text, context, x, y: rect.bottom + window.scrollY + 10, w })
    }
    const onUp = (e) => { if (ref.current?.contains(e.target)) return; clearTimeout(timer); timer = setTimeout(check, 30) }
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    const onSelChange = () => { if (!coarse) return; clearTimeout(timer); timer = setTimeout(check, 700) }
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setPop(null) }
    const onKey = (e) => { if (e.key === 'Escape') setPop(null) }
    document.addEventListener('mouseup', onUp)
    document.addEventListener('selectionchange', onSelChange)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    const onHash = () => setPop(null)
    window.addEventListener('hashchange', onHash)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('selectionchange', onSelChange)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  if (!pop) return null
  return (
    <div ref={ref} data-no-lookup className="absolute z-[60] max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl" style={{ left: pop.x, top: pop.y, width: pop.w }}>
      <button className="absolute right-2 top-1 text-slate-400 hover:text-slate-700" onClick={() => setPop(null)} aria-label="Đóng">✕</button>
      <LookupCard key={pop.word} word={pop.word} context={pop.context} />
    </div>
  )
}

// ───── Thanh phát âm nổi ─────
export function PronounceBar() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [look, setLook] = useState('')
  const vocab = useStore((s) => s.vocab)
  const list = Object.values(vocab).filter((v) => v.sources.includes(SRC)).sort((a, b) => (isDue(b) - isDue(a)) || (b.addedAt || '').localeCompare(a.addedAt || ''))
  const due = list.filter((v) => isDue(v)).length
  useHotkeys({ p: () => setOpen((x) => !x) })

  const words = text.split(/[\n,;]+/).map(cleanWord).filter(Boolean)
  const single = words.length === 1 && isWordish(words[0])
  const play = (acc, slow) => pronounce(text.replace(/\n+/g, '. '), acc, { slow })
  const saveAll = () => words.filter(isWordish).forEach((w) => savePron(w))

  return (
    <>
      <button
        onClick={() => setOpen((x) => !x)}
        data-no-lookup
        className="fixed right-3 bottom-20 md:bottom-6 md:right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-xl text-white shadow-lg hover:bg-indigo-700"
        title="Phát âm & tra từ (phím P)"
      >
        {open ? '✕' : '🔊'}
        {!open && due > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px]">{due}</span>}
      </button>
      {open && (
        <div data-no-lookup className="fixed right-3 bottom-36 md:bottom-20 md:right-6 z-50 w-[min(26rem,calc(100vw-1.5rem))] max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">🔊 Phát âm & tra từ</div>
            <span className="hidden md:inline text-[11px] text-slate-400"><span className="kbd">P</span> mở/đóng</span>
          </div>
          <textarea
            className="input min-h-[3.5rem]"
            rows={2}
            value={text}
            onChange={(e) => { setText(e.target.value); setLook('') }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); play('US') } }}
            placeholder="Dán từ hoặc câu bạn chưa biết đọc… (Enter để nghe)"
          />
          {text.trim() && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={() => play('US')}>🇺🇸 Mỹ 🔈</button>
                <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={() => play('UK')}>🇬🇧 Anh 🔈</button>
                <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => play('US', true)}>🐢 Chậm</button>
                {single && <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setLook(words[0])}>📖 Tra nghĩa</button>}
                {words.filter(isWordish).length > 0 && <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={saveAll}>⭐ Lưu để ôn</button>}
              </div>
              {words.length > 1 && words.length <= 12 && (
                <div className="flex flex-wrap gap-1">
                  {words.map((w, i) => <button key={i} className="chip bg-slate-100 hover:bg-indigo-100" onClick={() => setLook(w)} title="Tra từ này">{w}</button>)}
                </div>
              )}
            </div>
          )}
          {look && <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3"><LookupCard key={look} word={look} /></div>}

          <div className="border-t border-slate-100 pt-2">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold">⭐ Từ hay đọc sai ({list.length})</span>
              {due > 0 && <a href="#/pron" onClick={() => setOpen(false)} className="chip bg-rose-100 text-rose-700 hover:bg-rose-200">{due} cần ôn → Ôn ngay</a>}
            </div>
            {list.length === 0 ? (
              <p className="text-xs text-slate-500">Chưa có từ nào. Bấm “⭐ Lưu để ôn” hoặc thử đọc một từ, app sẽ nhắc bạn ôn lại theo lịch lặp lại ngắt quãng.</p>
            ) : (
              <div className="space-y-1">
                {list.slice(0, 30).map((v) => (
                  <div key={v.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${isDue(v) ? 'bg-rose-50' : ''}`}>
                    <button className="flex-1 text-left hover:underline" onClick={() => setLook(v.en)}>{v.en}{v.vi && <span className="text-xs text-slate-500"> – {v.vi}</span>}</button>
                    <button title="Mỹ" onClick={() => pronounce(v.en, 'US')}>🇺🇸</button>
                    <button title="Anh" onClick={() => pronounce(v.en, 'UK')}>🇬🇧</button>
                  </div>
                ))}
                <p className="pt-1 text-[11px] text-slate-500">Bấm vào từ để nghe, xem nghĩa và <b>giữ mic thử đọc</b>. Từ cần ôn cũng hiện trong 📅 Ôn tập hôm nay.</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Mẹo: bôi đen (hoặc nhấn giữ trên điện thoại) một từ bất kỳ trên trang để xem nghĩa và nghe phát âm.</p>
        </div>
      )}
    </>
  )
}

// ───── Trang ôn phát âm (#/pron): từ đã lưu đến hạn → nghe → tự đọc → máy chấm → xếp lịch ôn ─────
export function PronReview() {
  const vocab = useStore((s) => s.vocab)
  const [queue] = useState(() => Object.values(vocab).filter((v) => v.sources.includes(SRC) && isDue(v)).map((v) => v.en))
  const [idx, setIdx] = useState(0)
  const [heard, setHeard] = useState(false)
  const [result, setResult] = useState(null)
  const [score, setScore] = useState(0)
  const word = queue[idx]
  const v = word ? vocab[vocabId(word)] : null
  const next = () => { setIdx(idx + 1); setHeard(false); setResult(null) }
  useHotkeys({ Enter: () => result != null && next(), r: () => { if (word) { setHeard(true); pronounce(word, 'US') } } })

  if (!queue.length || idx >= queue.length) {
    return (
      <div>
        <h1 className="mb-2 text-xl md:text-2xl font-bold">🔊 Ôn phát âm</h1>
        <div className="card">{queue.length ? `🎉 Xong! Đọc đúng ${score}/${queue.length} từ. Từ sai sẽ quay lại ngày mai.` : '✅ Không có từ phát âm nào cần ôn hôm nay.'} <a className="text-indigo-600 underline" href="#/review">📅 Ôn tập hôm nay</a></div>
      </div>
    )
  }
  return (
    <div>
      <h1 className="mb-1 text-xl md:text-2xl font-bold">🔊 Ôn phát âm</h1>
      <p className="mb-4 text-sm text-slate-500">Tự đọc trước (không nghe mẫu) để biết mình nhớ thật chưa. Từ {idx + 1}/{queue.length}.</p>
      <div className="card space-y-3 text-center">
        <div className="text-4xl font-bold">{word}</div>
        {v?.vi && <div className="text-slate-500">{v.vi}</div>}
        <div className="flex justify-center"><TryMic key={word} word={word} onResult={(ok) => { if (result == null) { recordSpoken(word, { correct: ok, aided: heard }); if (ok && !heard) setScore((x) => x + 1) } setResult(ok) }} /></div>
        <div className="flex justify-center" onClickCapture={() => setHeard(true)}><Speakers text={word} /></div>
        <div className="text-xs text-slate-500">{heard ? 'Đã nghe mẫu → lần này tính là “có gợi ý”.' : 'Mẹo: thử đọc trước, sau đó mới bấm loa để so sánh.'}</div>
        <div className="flex justify-center gap-2">
          {result == null && <button className="btn-ghost" onClick={() => { recordSpoken(word, { correct: false, aided: true }); setResult(false) }}>Bỏ qua (chưa đọc được)</button>}
          {result != null && <button className="btn-primary" onClick={next}>Tiếp →</button>}
        </div>
      </div>
    </div>
  )
}
