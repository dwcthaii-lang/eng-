// MODULE 2: Luyện nghe "Cai phụ đề" 3 bước (Blind → Gap-fill → Shadowing)
import { useEffect, useMemo, useRef, useState } from 'react'
import { situations, findSituation, TIERS } from '../data'
import { update, useStore, logHistory } from '../lib/store'
import { speakLines, speak, stopSpeaking, useSpeechRecognition } from '../lib/speech'
import { parseLine, plainLine, intonation, sameAnswer, similarity } from '../lib/text'
import { markHeard } from '../lib/srs'
import { aiEnabled, gradeSummary } from '../lib/ai'
import { useHotkeys } from '../lib/hotkeys'
import { useMic, MicButton, LiveTranscript } from '../components/Mic'
import { PageHeader, SessionTimer, TierChip, Shortcuts } from '../components/ui'

export default function Listening({ id }) {
  if (id && findSituation(id)) return <Player sit={findSituation(id)} />
  return <ListeningList />
}

function ListeningList() {
  const progress = useStore((s) => s.listening)
  return (
    <div>
      <PageHeader title="🎧 Nghe “cai phụ đề”" subtitle="Mỗi bài 30–60 giây, tốc độ tự nhiên. 3 bước khoá cứng: Nghe mù → Điền chỗ nuốt âm → Shadowing." />
      {[1, 2].map((tier) => (
        <div key={tier} className="mb-8">
          <div className="label mb-3">{TIERS[tier].label}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {situations.filter((s) => s.tier === tier).map((s) => {
              const p = progress[s.id]
              return (
                <a key={s.id} href={`#/listening/${s.id}`} className="card hover:border-indigo-300 hover:shadow transition flex items-center gap-4">
                  <div className="text-3xl">{s.emoji}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{s.titleVi}</div>
                    <div className="text-xs text-slate-500">{s.listening.speakers.A} · {s.listening.lines.length} lượt thoại</div>
                  </div>
                  {p?.done ? <span className="chip bg-emerald-100 text-emerald-700">✓ Xong {p.count > 1 ? `×${p.count}` : ''}</span> : p?.step ? <span className="chip bg-amber-100 text-amber-800">Bước {p.step}/3</span> : null}
                </a>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const STEPS = ['Nghe mù', 'Điền & nối âm', 'Shadowing']

function Player({ sit }) {
  const settings = useStore((s) => s.settings)
  const saved = useStore((s) => s.listening[sit.id])
  const L = sit.listening
  // Bước đã mở khoá (lưu lại để không bị mất khi tải lại trang)
  const [unlocked, setUnlocked] = useState(saved?.done ? 1 : saved?.step || 1)
  const [step, setStep] = useState(unlocked)
  const [playingLine, setPlayingLine] = useState(-1)
  const stopRef = useRef(false)

  useEffect(() => () => stopSpeaking(), [])

  const unlock = (n) => {
    setUnlocked((u) => Math.max(u, n))
    setStep(n)
    update((s) => {
      const p = s.listening[sit.id] || (s.listening[sit.id] = { count: 0 })
      p.step = Math.max(p.done ? 0 : p.step || 1, n)
    })
  }

  const playAll = async (rate) => {
    stopSpeaking()
    stopRef.current = false
    await new Promise((r) => setTimeout(r, 60))
    await speakLines(L.lines, { ...settings, speechRate: rate || settings.speechRate }, { onLine: setPlayingLine, shouldStop: () => stopRef.current })
  }
  const stop = () => {
    stopRef.current = true
    stopSpeaking()
    setPlayingLine(-1)
  }

  return (
    <div>
      <PageHeader
        title={`${sit.emoji} ${sit.titleVi}`}
        subtitle={<span className="flex items-center gap-2"><TierChip tier={sit.tier} /> {L.speakers.A} & {L.speakers.B}</span>}
        right={<div className="flex items-center gap-2"><SessionTimer targetMin={25} /><a className="btn-ghost" href="#/listening">← Danh sách</a></div>}
      />
      <div className="mb-5 grid grid-cols-3 gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1
          const locked = n > unlocked
          return (
            <button
              key={n}
              disabled={locked}
              onClick={() => { stop(); setStep(n) }}
              className={`rounded-xl border px-3 py-2 text-sm text-left ${step === n ? 'border-indigo-400 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white'} ${locked ? 'opacity-50' : ''}`}
            >
              <div className="text-xs text-slate-500">{locked ? '🔒' : n < unlocked ? '✓' : '▶'} Bước {n}</div>
              <div className="font-semibold">{label}</div>
            </button>
          )
        })}
      </div>
      {step === 1 && <BlindStep sit={sit} playAll={playAll} stop={stop} playingLine={playingLine} onNext={() => unlock(2)} />}
      {step === 2 && <GapStep sit={sit} settings={settings} playAll={playAll} stop={stop} playingLine={playingLine} onNext={() => { markHeard(L.chunks.map((c) => c.en)); unlock(3) }} />}
      {step === 3 && (
        <ShadowStep
          sit={sit}
          settings={settings}
          onDone={() => {
            update((s) => {
              const p = s.listening[sit.id] || (s.listening[sit.id] = { count: 0 })
              p.done = true
              p.step = 3
              p.count = (p.count || 0) + 1
              p.completedAt = Date.now()
            })
            logHistory('listening', sit.titleVi)
          }}
        />
      )}
    </div>
  )
}

// ---------- BƯỚC 1: NGHE MÙ ----------
function BlindStep({ sit, playAll, stop, playingLine, onNext }) {
  const L = sit.listening
  const [plays, setPlays] = useState(0)
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [ai, setAi] = useState(null)
  const [checked, setChecked] = useState({})

  const play = async () => {
    if (busy) return
    setBusy(true)
    await playAll()
    setBusy(false)
    setPlays((p) => p + 1)
  }
  const mic = useMic({ onFinal: (t) => setSummary((s) => (s ? s + ' ' : '') + t), enabled: !submitted })
  useHotkeys({ r: play })

  const submit = async () => {
    setSubmitted(true)
    stop()
    if (aiEnabled()) {
      try {
        setAi({ loading: true })
        setAi(await gradeSummary({ transcript: L.lines.map((l) => `${l.s}: ${plainLine(l.t)}`).join('\n'), summary }))
      } catch (e) {
        setAi({ error: String(e.message || e) })
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="label mb-2">Bước 1 · Nghe mù – KHÔNG có phụ đề</div>
        <p className="text-sm text-slate-600">Nghe đủ <b>2 lần</b>, sau đó gõ hoặc nói tóm tắt ý chính (tiếng Anh hoặc tiếng Việt đều được). Đừng cố nghe từng từ – hãy bắt ý: <i>Ai? Vấn đề gì? Quyết định gì?</i></p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button className="btn-primary text-base px-6 py-3" onClick={play} disabled={busy}>
            {busy ? '🔊 Đang phát…' : plays === 0 ? '▶ Nghe lần 1' : `🔁 Nghe lại (${plays} lần)`}
          </button>
          {busy && <button className="btn-ghost" onClick={stop}>■ Dừng</button>}
          <div className="flex gap-1">
            {L.lines.map((l, i) => (
              <span key={i} className={`h-8 w-2 rounded-full ${playingLine === i ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200'}`} />
            ))}
          </div>
          <span className={`chip ${plays >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{Math.min(plays, 2)}/2 lần bắt buộc</span>
        </div>
      </div>

      <div className={`card space-y-3 ${plays < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="label">Tóm tắt ý chính bạn nghe được</div>
        <textarea className="input min-h-[90px]" value={summary} disabled={submitted} onChange={(e) => setSummary(e.target.value)} placeholder="VD: Máy giặt bị hỏng, Minh sẽ báo cho văn phòng KTX…" />
        {!submitted && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <MicButton mic={mic} size="sm" label="Giữ để nói tóm tắt" />
            <div className="w-full sm:flex-1"><LiveTranscript mic={mic} placeholder="(Nói tiếng Anh – văn bản sẽ được thêm vào ô trên)" /></div>
          </div>
        )}
        {!submitted ? (
          <button className="btn-primary" disabled={summary.trim().length < 10} onClick={submit}>Nộp tóm tắt & xem ý chính</button>
        ) : (
          <div className="space-y-3">
            {ai?.loading && <div className="text-sm text-slate-500">🤖 AI đang chấm…</div>}
            {ai?.error && <div className="text-sm text-rose-600">AI lỗi: {ai.error}</div>}
            {ai?.score != null && (
              <div className="rounded-xl bg-indigo-50 p-3 text-sm">
                <b>AI: {ai.score}/10.</b> {ai.feedback_vi}
                {ai.missed?.length > 0 && <div className="mt-1 text-slate-600">Bỏ lỡ: {ai.missed.join('; ')}</div>}
              </div>
            )}
            <div className="text-sm font-medium">Tự đối chiếu – đánh dấu những ý bạn đã bắt được:</div>
            {L.keyPoints.map((k, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!checked[i]} onChange={(e) => setChecked({ ...checked, [i]: e.target.checked })} /> {k}
              </label>
            ))}
            <div className="text-xs text-slate-500">Tóm tắt chuẩn: {L.gistVi}</div>
            <button className="btn-primary" onClick={onNext}>Mở khoá Bước 2 →</button>
          </div>
        )}
      </div>
      <Shortcuts items={[['R', 'nghe lại'], ['Space (giữ)', 'nói tóm tắt']]} />
    </div>
  )
}

// ---------- BƯỚC 2: ĐIỀN CHỖ TRỐNG & NỐI ÂM ----------
function GapStep({ sit, settings, playAll, stop, playingLine, onNext }) {
  const L = sit.listening
  const parsed = useMemo(() => L.lines.map((l) => parseLine(l.t)), [L])
  const gaps = useMemo(() => {
    const out = []
    parsed.forEach((parts, li) => parts.forEach((p, pi) => p.type === 'gap' && out.push({ key: `${li}-${pi}`, li, ...p })))
    return out
  }, [parsed])
  const [vals, setVals] = useState({})
  const [active, setActive] = useState(gaps[0]?.key)
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputs = useRef({})

  const play = async () => {
    if (busy) return
    setBusy(true)
    await playAll()
    setBusy(false)
  }
  const playLine = (li) => {
    stop()
    const l = L.lines[li]
    speak(l.t, { voiceName: l.s === 'A' ? settings.voiceA : settings.voiceB, voiceIndex: l.s === 'A' ? 0 : 1, rate: settings.speechRate })
  }
  // Nói để điền vào ô đang chọn
  const mic = useMic({
    enabled: !checked,
    onFinal: (t) => {
      if (!active) return
      setVals((v) => ({ ...v, [active]: t }))
      const i = gaps.findIndex((g) => g.key === active)
      if (gaps[i + 1]) setActive(gaps[i + 1].key)
    },
  })
  useHotkeys({ r: play })

  const correctCount = gaps.filter((g) => sameAnswer(vals[g.key] || '', g.accept)).length
  const allFilled = gaps.every((g) => (vals[g.key] || '').trim())

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="label mb-2">Bước 2 · Điền từ bị nối âm / nuốt âm</div>
        <p className="text-sm text-slate-600">Transcript đã hiện nhưng các chỗ bị nối âm/nuốt âm bị che. Nghe lại và <b>gõ</b> vào ô, hoặc <b>bấm chọn ô → nhấn <span className="kbd">Esc</span> → giữ Space để nói</b> (hoặc giữ nút 🎙️). Viết dạng đầy đủ (going to) hay dạng nói (gonna) đều được.</p>
        <div className="mt-3 flex gap-2">
          <button className="btn-primary" onClick={play} disabled={busy}>{busy ? '🔊 Đang phát…' : '▶ Nghe cả bài (R)'}</button>
          {busy && <button className="btn-ghost" onClick={stop}>■ Dừng</button>}
        </div>
      </div>

      <div className="card space-y-3">
        {parsed.map((parts, li) => (
          <div key={li} className={`flex gap-3 rounded-xl p-2 ${playingLine === li ? 'bg-indigo-50' : ''}`}>
            <button className="text-slate-400 hover:text-indigo-600" onClick={() => playLine(li)} title="Nghe câu này">🔈</button>
            <span className="w-6 shrink-0 font-bold text-slate-400">{L.lines[li].s}</span>
            <div className="leading-9">
              {parts.map((p, pi) => {
                if (p.type === 'text') return <span key={pi}>{p.text.replace(/\*/g, '')}</span>
                const k = `${li}-${pi}`
                const ok = sameAnswer(vals[k] || '', p.accept)
                return (
                  <span key={pi} className="inline-flex flex-col align-top mx-1">
                    <input
                      ref={(el) => (inputs.current[k] = el)}
                      value={vals[k] || ''}
                      disabled={checked}
                      onFocus={() => setActive(k)}
                      onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
                      style={{ width: `${Math.max(6, p.text.length + 2)}ch` }}
                      className={`rounded-md border px-2 py-0.5 text-sm ${
                        checked ? (ok ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50') : active === k ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-300'
                      }`}
                    />
                    {checked && !ok && <span className="text-xs text-emerald-700">→ {p.text}</span>}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!checked && (
        <div className="card flex flex-col sm:flex-row items-center gap-4">
          <MicButton mic={mic} size="sm" label="Nói vào ô đang chọn" />
          <div className="flex-1"><LiveTranscript mic={mic} /></div>
          <button className="btn-primary" disabled={!allFilled} onClick={() => setChecked(true)}>Kiểm tra</button>
        </div>
      )}

      {checked && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="label">Giải thích hiện tượng nối âm / nuốt âm</div>
            <div className="font-bold">{correctCount}/{gaps.length} đúng</div>
          </div>
          {gaps.map((g) => (
            <div key={g.key} className="rounded-xl bg-slate-50 p-3 text-sm">
              <b className="text-indigo-700">“{g.text}”</b> — {g.rule}
              <button className="ml-2 text-slate-400 hover:text-indigo-600" onClick={() => speak(g.text, { rate: 0.9 })}>🔈</button>
            </div>
          ))}
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => { setChecked(false); setVals({}) }}>Làm lại</button>
            <button className="btn-primary" onClick={onNext}>Mở khoá Bước 3: Shadowing →</button>
          </div>
        </div>
      )}
      <Shortcuts items={[['R', 'nghe cả bài'], ['Space (giữ)', 'nói vào ô đang chọn'], ['Tab', 'ô tiếp theo']]} />
    </div>
  )
}

// ---------- BƯỚC 3: SHADOWING ----------
function StressedLine({ text }) {
  // *từ* -> in đậm, có chấm trọng âm
  const clean = plainLine(text.replace(/\*/g, '§')).split('§')
  return (
    <span>
      {clean.map((seg, i) =>
        i % 2 === 1 ? (
          <b key={i} className="text-indigo-700 underline decoration-indigo-300 decoration-2 underline-offset-4">{seg}</b>
        ) : (
          <span key={i}>{seg}</span>
        )
      )}
    </span>
  )
}

function ShadowStep({ sit, settings, onDone }) {
  const L = sit.listening
  const [cur, setCur] = useState(0)
  const [scores, setScores] = useState({})
  const [rate, setRate] = useState([0.8, 0.9, 1.0, 1.1].includes(settings.speechRate) ? settings.speechRate : 1.0)
  const [running, setRunning] = useState(false)
  const rec = useSpeechRecognition()
  const doneRef = useRef(false)

  const lineOpts = (l) => ({ voiceName: l.s === 'A' ? settings.voiceA : settings.voiceB, voiceIndex: l.s === 'A' ? 0 : 1, rate })

  const listen = (i = cur) => {
    stopSpeaking()
    setCur(i)
    speak(L.lines[i].t, lineOpts(L.lines[i]))
  }

  // Phát audio và ghi âm ĐỒNG THỜI → so khớp với câu gốc
  const shadow = async (i = cur) => {
    if (running) return
    setCur(i)
    setRunning(true)
    stopSpeaking()
    rec.start()
    await new Promise((r) => setTimeout(r, 250))
    await speak(L.lines[i].t, lineOpts(L.lines[i]))
    await new Promise((r) => setTimeout(r, 1200))
    const said = await rec.stop()
    const sc = Math.round(similarity(said, plainLine(L.lines[i].t)) * 100)
    setScores((s) => ({ ...s, [i]: { sc, said } }))
    setRunning(false)
    if (i + 1 < L.lines.length) setCur(i + 1)
  }

  const allDone = L.lines.every((_, i) => scores[i])
  useEffect(() => {
    if (allDone && !doneRef.current) {
      doneRef.current = true
      onDone()
    }
  }, [allDone, onDone])

  useHotkeys({ r: () => listen(), s: () => shadow(), ArrowDown: () => setCur((c) => Math.min(L.lines.length - 1, c + 1)), ArrowUp: () => setCur((c) => Math.max(0, c - 1)) })

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="label mb-2">Bước 3 · Shadowing – nhại lại đồng thời với audio</div>
        <p className="text-sm text-slate-600">
          Từ <b className="text-indigo-700 underline">gạch chân</b> là trọng âm câu (nói to, dài, rõ hơn). Mũi tên là ngữ điệu cuối câu: ↗ lên giọng, ↘ xuống giọng. Bấm <b>Shadow</b> (phím <span className="kbd">S</span>): audio phát và micro ghi âm cùng lúc – hãy nói <i>chồng lên</i> giọng mẫu. 🎧 Nên đeo tai nghe để mic không thu tiếng loa.
        </p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="text-slate-500">Tốc độ:</span>
          {[0.8, 0.9, 1.0, 1.1].map((r) => (
            <button key={r} className={rate === r ? 'btn-primary !py-1' : 'btn-ghost !py-1'} onClick={() => setRate(r)}>{r}×</button>
          ))}
        </div>
      </div>
      <div className="card space-y-2">
        {L.lines.map((l, i) => (
          <div key={i} onClick={() => setCur(i)} className={`flex items-start gap-3 rounded-xl p-3 cursor-pointer ${cur === i ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}>
            <span className="w-6 shrink-0 font-bold text-slate-400">{l.s}</span>
            <div className="flex-1 text-lg leading-relaxed">
              <StressedLine text={l.t} /> <span className="text-indigo-500 font-bold">{intonation(l.t)}</span>
              {scores[i] && (
                <div className="mt-1 text-xs text-slate-500">
                  <span className={`font-semibold ${scores[i].sc >= 75 ? 'text-emerald-600' : scores[i].sc >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{scores[i].sc}%</span> · mic nghe được: “{scores[i].said || '—'}”
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button className="btn-ghost !px-2 !py-1" onClick={(e) => { e.stopPropagation(); listen(i) }}>🔈</button>
              <button className={`btn !px-3 !py-1 ${running && cur === i ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`} onClick={(e) => { e.stopPropagation(); shadow(i) }} disabled={running}>
                {running && cur === i ? '● Đang ghi' : 'Shadow'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {allDone && (
        <div className="card border-emerald-300 bg-emerald-50">
          <div className="font-semibold text-emerald-800">🎉 Hoàn thành bài nghe! Các cụm từ trong bài đã được chuyển sang trạng thái “Đã hiểu khi nghe”.</div>
          <div className="mt-2 text-sm text-emerald-700">Mẹo: shadow lại những câu dưới 75% thêm 2–3 lần, sau đó thử ở tốc độ 1.1×.</div>
          <div className="mt-3 flex gap-2">
            <a className="btn-primary" href="#/listening">Bài khác</a>
            <a className="btn-ghost" href={`#/roleplay/${sit.id}`}>Nhập vai tình huống này →</a>
          </div>
        </div>
      )}
      <Shortcuts items={[['S', 'shadow câu đang chọn'], ['R', 'nghe câu đang chọn'], ['↑ ↓', 'chọn câu']]} />
    </div>
  )
}
