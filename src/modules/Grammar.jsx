// NGỮ PHÁP CHO NGƯỜI NÓI
// Học theo NHU CẦU GIAO TIẾP (muốn nói gì → dùng cấu trúc nào), không học thuộc tên thì.
// Mỗi bài: ghi chú (khi nào dùng · công thức · dấu hiệu · lỗi người Việt hay mắc · ví dụ)
// → luyện 3 bậc: CHỌN (nhận biết) → SỬA LỖI (chú ý) → NÓI (tự sản sinh, có mic)
// → xếp lịch ôn lặp lại ngắt quãng (scheduleReview 'grammar'), hiện ở “Ôn tập hôm nay”.
import { useState } from 'react'
import { grammarLessons, irregularVerbs, tenseTable, tenseTree } from '../data/grammar'
import { getState, update, useStore, logHistory } from '../lib/store'
import { scheduleReview, nextDueLabel, reviewOf, newStartedToday } from '../lib/review'
import { chunkUsed, normalize, similarity, sameAnswer } from '../lib/text'
import { speak } from '../lib/speech'
import { useHotkeys } from '../lib/hotkeys'
import { today, addDays } from '../lib/date'
import { useMic, MicButton, LiveTranscript, TypeFallback } from '../components/Mic'
import { PageHeader, Progress, Shortcuts, SessionTimer } from '../components/ui'
import { SentenceReview } from '../components/SentenceReview'
import { SentenceVi } from '../components/SentenceVi'

const LEVEL_NAMES = {
  1: ['Cấp 1 · Nền tảng để nói hằng ngày', 'Các thì cơ bản và câu hỏi – đủ dùng cho 80% hội thoại.'],
  2: ['Cấp 2 · Nói linh hoạt, tự nhiên hơn', 'Khuyên bảo, so sánh, mạo từ, điều kiện – để không bị “cứng”.'],
  3: ['Cấp 3 · Nâng band IELTS 6.5', 'Câu phức: bị động, mệnh đề quan hệ, tường thuật, giả định.'],
}
const VERB_ID = 'g-irregular'
const VERB_TITLE = '🔤 Động từ bất quy tắc'
const VERB_BOX_DAYS = [1, 2, 4, 7, 15, 30]
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)
const findLesson = (id) => grammarLessons.find((l) => l.id === id)
const lessonTitle = (l) => `${l.emoji} ${l.titleVi}`

export default function Grammar({ id, mode }) {
  if (id === 'tense') return <TenseTool />
  if (id === 'table') return <TenseTablePage />
  if (id === VERB_ID) return <VerbDrill key={mode || 'x'} />
  const lesson = findLesson(id)
  if (lesson) return mode === 'review' ? <ReviewLesson lesson={lesson} /> : <LessonPage key={lesson.id} lesson={lesson} />
  return <Overview />
}

// ───────────────────────── Tổng quan ─────────────────────────
function Overview() {
  const reviews = useStore((s) => s.reviews)
  const settings = useStore((s) => s.settings)
  const verbs = useStore((s) => s.grammarVerbs || {})
  const t = today()
  const due = Object.values(reviews).filter((r) => r.type === 'grammar' && r.due <= t)
  const startedToday = newStartedToday('grammar')
  const verbKnown = Object.values(verbs).filter((v) => v.box >= 3).length

  return (
    <div>
      <PageHeader title="📐 Ngữ pháp cho người nói" subtitle="Không học thuộc tên thì. Học theo điều bạn MUỐN NÓI, luyện đến khi nói ra tự động, rồi ôn lại đúng lúc sắp quên." />

      {due.length > 0 && (
        <div className="card mb-4 border-rose-200 bg-rose-50 space-y-2">
          <div className="font-semibold text-rose-800">📅 {due.length} bài ngữ pháp đến hạn ôn – ôn trước khi học bài mới</div>
          {due.map((r) => (
            <a key={r.key} href={`#/grammar/${r.refId}/review`} className="flex items-center gap-3 rounded-xl bg-white p-3 hover:bg-rose-100">
              <span className="flex-1">{r.title || r.refId}</span><span className="btn-primary !py-1">Ôn →</span>
            </a>
          ))}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <a href="#/grammar/tense" className="card !p-4 hover:border-indigo-300 hover:shadow transition">
          <div className="text-2xl">🧭</div>
          <div className="font-semibold">Chọn thì nào?</div>
          <div className="text-sm text-slate-500">Trả lời 2–3 câu hỏi, app chỉ cho bạn thì cần dùng + câu mẫu.</div>
        </a>
        <a href="#/grammar/table" className="card !p-4 hover:border-indigo-300 hover:shadow transition">
          <div className="text-2xl">📋</div>
          <div className="font-semibold">Bảng tóm tắt các thì</div>
          <div className="text-sm text-slate-500">8 thì hay dùng nhất khi nói: công thức, khi nào dùng, ví dụ.</div>
        </a>
        <a href={`#/grammar/${VERB_ID}`} className="card !p-4 hover:border-indigo-300 hover:shadow transition">
          <div className="flex items-center gap-2"><span className="text-2xl">🔤</span>{reviews[`grammar:${VERB_ID}`]?.due <= t && <span className="chip bg-rose-100 text-rose-700">📅 Ôn</span>}</div>
          <div className="font-semibold">Động từ bất quy tắc</div>
          <div className="text-sm text-slate-500">{irregularVerbs.length} động từ hay dùng · đã nhớ {verbKnown}. Nói V2 – V3, mỗi lượt 10 từ.</div>
        </a>
      </div>

      <details className="card mb-6">
        <summary className="cursor-pointer font-semibold">🔬 Vì sao học theo cách này? (cách học khoa học)</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li><b>Học theo nhu cầu giao tiếp:</b> mỗi bài bắt đầu bằng “bạn muốn nói điều gì”, không bắt đầu bằng tên thì. Khi nói, não bạn tìm theo ý muốn nói, nên học theo cách đó sẽ nhớ ra nhanh hơn.</li>
          <li><b>Chú ý lỗi của chính mình (noticing):</b> mỗi bài có mục <i>lỗi người Việt hay mắc</i> (quên -s, quên chia quá khứ, “I am agree”…) vì tiếng Việt không chia động từ.</li>
          <li><b>Luyện 3 bậc:</b> chọn đáp án (nhận biết) → sửa câu sai (chú ý) → tự NÓI câu theo tình huống (sản sinh). Bậc cuối quan trọng nhất: biết luật chưa đủ, phải nói ra được trong vài giây.</li>
          <li><b>Luyện truy xuất + lặp lại ngắt quãng:</b> mỗi bài tự quay lại sau 1 → 3 → 7 → 15+ ngày. Làm tốt thì giãn lịch, sai nhiều thì ôn sớm.</li>
          <li><b>Ít mà chắc:</b> tối đa {settings.newLessonsPerDay} bài mới/ngày. Đừng sợ sai khi nói: người nghe vẫn hiểu. Hãy ưu tiên 3 thì đủ dùng: hiện tại đơn, quá khứ đơn, hiện tại hoàn thành.</li>
        </ol>
      </details>

      {startedToday >= settings.newLessonsPerDay && (
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Hôm nay bạn đã học {startedToday} bài ngữ pháp mới (giới hạn {settings.newLessonsPerDay}). Nên ôn lại thay vì học thêm để nhớ lâu. Bạn vẫn có thể học tiếp nếu muốn.</div>
      )}

      {[1, 2, 3].map((lv) => (
        <div key={lv} className="mb-6">
          <div className="mb-2">
            <div className="font-bold">{LEVEL_NAMES[lv][0]}</div>
            <div className="text-sm text-slate-500">{LEVEL_NAMES[lv][1]}</div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {grammarLessons.filter((l) => l.level === lv).map((l) => {
              const rv = reviews[`grammar:${l.id}`]
              const isDue = rv && rv.due <= t
              const best = rv ? Math.max(...rv.log.map((x) => x.g)) : null
              return (
                <a key={l.id} href={isDue ? `#/grammar/${l.id}/review` : `#/grammar/${l.id}`} className="card !p-4 hover:border-indigo-300 hover:shadow transition">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{l.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold leading-tight">{l.titleVi}</div>
                      <div className="text-xs text-slate-500">{l.title}</div>
                    </div>
                    {isDue ? <span className="chip bg-rose-100 text-rose-700">📅 Ôn</span> : rv ? <span className="chip bg-emerald-100 text-emerald-700">{nextDueLabel(rv).replace('Ôn lại ', '')}</span> : <span className="chip bg-slate-100 text-slate-500">Mới</span>}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">{l.need}</div>
                  {rv && <div className="mt-1 text-[11px] text-slate-500">Đã luyện {rv.log.length} lần · điểm cao nhất {best}/5</div>}
                </a>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ───────────────────────── Ghi chú bài học ─────────────────────────
function Notes({ lesson }) {
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="label mb-1">🎯 Bạn cần bài này khi muốn…</div>
        <p className="text-slate-800">{lesson.need}</p>
      </div>
      <div className="card">
        <div className="label mb-2">📌 Khi nào dùng</div>
        <ul className="space-y-2 text-sm">
          {lesson.when.map((w, i) => <li key={i} className="rounded-lg bg-slate-50 p-2" dangerouslySetInnerHTML={{ __html: w }} />)}
        </ul>
      </div>
      <div className="card !p-0 overflow-x-auto">
        <div className="label px-5 pt-4">🧮 Công thức</div>
        <table className="w-full text-sm">
          <tbody>
            {lesson.form.map(([k, f]) => (
              <tr key={k} className="border-t border-slate-100 first:border-0">
                <td className="p-3 font-semibold whitespace-nowrap align-top">{k}</td>
                <td className="p-3 font-mono text-[13px] text-indigo-800">{f}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="label mb-1">🔎 Dấu hiệu nhận biết</div>
        <p className="text-sm text-slate-700">{lesson.signals}</p>
      </div>
      <div className="card">
        <div className="label mb-2">⚠️ Lỗi người Việt hay mắc</div>
        <div className="space-y-2">
          {lesson.mistakes.map(([wrong, right, why], i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="text-rose-700 line-through decoration-rose-300">❌ {wrong}</div>
              <div className="font-medium text-emerald-700">✅ {right} <button onClick={() => speak(right)} className="ml-1 text-slate-400 hover:text-indigo-600">🔈</button></div>
              <div className="mt-1 text-slate-600">💡 {why}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="label mb-2">💬 Ví dụ trong đời sống / phòng lab</div>
        <div className="space-y-2">
          {lesson.examples.map(([en, vi], i) => (
            <div key={i} className="flex gap-2 text-sm">
              <button onClick={() => speak(en)} className="text-slate-400 hover:text-indigo-600">🔈</button>
              <div><div className="font-medium">{en}</div><div className="text-slate-500">{vi}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LessonPage({ lesson }) {
  const rv = useStore((s) => s.reviews[`grammar:${lesson.id}`])
  const [practice, setPractice] = useState(false)
  if (practice) return <Drill lesson={lesson} onExit={() => setPractice(false)} />
  return (
    <div>
      <PageHeader
        title={`${lesson.emoji} ${lesson.titleVi}`}
        subtitle={`${lesson.title} · ${rv ? nextDueLabel(rv) : 'Bài mới'}`}
        right={<a className="btn-ghost" href="#/grammar">← Ngữ pháp</a>}
      />
      <Notes lesson={lesson} />
      <div className="card mt-4 flex flex-wrap items-center gap-3 border-indigo-200 bg-indigo-50">
        <div className="flex-1 text-sm text-indigo-900">Đọc xong ghi chú? Luyện ngay 3 bậc: <b>chọn</b> ({lesson.quiz.length}) → <b>sửa lỗi</b> ({lesson.mistakes.length}) → <b>nói</b> ({lesson.speak.length}). Kết quả sẽ xếp lịch ôn tự động.</div>
        <button className="btn-primary" onClick={() => setPractice(true)}>▶ Bắt đầu luyện</button>
      </div>
    </div>
  )
}

function ReviewLesson({ lesson }) {
  return <Drill lesson={lesson} review />
}

// ───────────────────────── Luyện tập 3 bậc ─────────────────────────
function buildSteps(lesson, review) {
  const mix = review ? shuffle : (a) => a
  const quiz = mix(lesson.quiz).map(([q, opts, why]) => ({ kind: 'quiz', q, answer: opts[0], opts: shuffle(opts), why }))
  const fix = mix(lesson.mistakes).map(([wrong, right, why]) => ({ kind: 'fix', wrong, right, why }))
  const say = mix(lesson.speak).map(([vi, model, must]) => ({ kind: 'speak', vi, model, must: must.split(';').map((x) => x.trim()).filter(Boolean) }))
  return [...quiz, ...fix, ...say]
}

const KIND = {
  quiz: ['① Chọn đáp án', 'bg-sky-100 text-sky-800'],
  fix: ['② Sửa câu sai', 'bg-amber-100 text-amber-800'],
  speak: ['③ Nói theo tình huống', 'bg-indigo-100 text-indigo-800'],
}

function Drill({ lesson, review = false, onExit }) {
  const [steps] = useState(() => buildSteps(lesson, review))
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState([])
  const [showNotes, setShowNotes] = useState(false)
  const [done, setDone] = useState(false)

  const next = (r) => {
    const res = [...results, { ...r, step: steps[idx] }]
    setResults(res)
    if (idx + 1 < steps.length) return setIdx(idx + 1)
    const score = res.reduce((a, x) => a + (x.ok ? (x.aided ? 0.6 : 1) : 0), 0) / res.length
    scheduleReview('grammar', lesson.id, score * 5, lessonTitle(lesson))
    logHistory('grammar', `${review ? 'Ôn' : 'Học'} ${lessonTitle(lesson)}: ${res.filter((x) => x.ok).length}/${res.length} đúng`)
    setDone(true)
  }

  if (done) {
    const ok = results.filter((r) => r.ok).length
    const wrong = results.filter((r) => !r.ok)
    const rv = reviewOf('grammar', lesson.id, getState())
    return (
      <div>
        <PageHeader title={`🎉 Xong: ${lessonTitle(lesson)}`} subtitle={`${ok}/${results.length} câu đúng · ${nextDueLabel(rv)} (lịch ôn đã tự xếp)`} />
        <div className="card space-y-3">
          {wrong.length ? (
            <>
              <div className="label">Cần chú ý lần sau</div>
              {wrong.map((r, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <div className="text-slate-500">{KIND[r.step.kind][0]}{r.said ? <> · bạn: <i>{r.said}</i></> : null}</div>
                  <div className="font-medium text-emerald-700">✅ {r.step.kind === 'quiz' ? r.step.q.replace('___', r.step.answer) : r.step.kind === 'fix' ? r.step.right : r.step.model}</div>
                  {r.step.why && <div className="text-slate-600">💡 {r.step.why}</div>}
                </div>
              ))}
            </>
          ) : <div className="text-emerald-700">Hoàn hảo! Lần ôn tới sẽ được giãn ra xa hơn.</div>}
          <p className="text-xs text-slate-500">Sai nhiều → bài quay lại ngày mai. Làm tốt → 3 ngày, rồi 1 tuần, 2 tuần, 1 tháng…</p>
          <div className="flex flex-wrap gap-2">
            {onExit ? <button className="btn-primary" onClick={onExit}>📖 Xem lại ghi chú</button> : <a className="btn-primary" href={`#/grammar/${lesson.id}`}>📖 Xem lại ghi chú</a>}
            <a className="btn-ghost" href="#/grammar">Về Ngữ pháp</a>
            <a className="btn-ghost" href="#/review">📅 Ôn tập hôm nay</a>
          </div>
        </div>
      </div>
    )
  }

  const step = steps[idx]
  return (
    <div>
      <PageHeader
        title={`${review ? '🔁 Ôn: ' : ''}${lessonTitle(lesson)}`}
        right={<div className="flex gap-2"><SessionTimer targetMin={10} />{onExit ? <button className="btn-ghost" onClick={onExit}>Thoát</button> : <a className="btn-ghost" href="#/grammar">Thoát</a>}</div>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span className={`chip ${KIND[step.kind][1]}`}>{KIND[step.kind][0]}</span>
        <span>{idx + 1}/{steps.length}</span>
        <div className="flex-1 min-w-[6rem]"><Progress value={idx} max={steps.length} /></div>
        <button className="text-indigo-600 underline" onClick={() => setShowNotes((x) => !x)}>{showNotes ? 'Ẩn ghi chú' : '📖 Xem ghi chú'}</button>
      </div>
      {showNotes && <div className="mb-4"><Notes lesson={lesson} /></div>}
      {step.kind === 'quiz' && <QuizCard key={idx} step={step} onDone={next} />}
      {step.kind === 'fix' && <FixCard key={idx} step={step} onDone={next} />}
      {step.kind === 'speak' && <SpeakCard key={idx} step={step} onDone={next} />}
    </div>
  )
}

function QuizCard({ step, onDone }) {
  const [pick, setPick] = useState(null)
  const ok = pick === step.answer
  const full = step.q.replace('___', step.answer)
  const choose = (o) => { if (pick == null) { setPick(o); speak(step.q.replace('___', step.answer)) } }
  const keys = {}
  step.opts.forEach((o, i) => { keys[String(i + 1)] = () => choose(o) })
  keys.Enter = () => pick != null && onDone({ ok })
  useHotkeys(keys)
  return (
    <div className="card space-y-4">
      <div className="text-lg font-medium">{step.q.split('___').map((p, i, arr) => <span key={i}>{p}{i < arr.length - 1 && <span className="mx-1 inline-block min-w-[3rem] border-b-2 border-indigo-400 text-center text-indigo-700">{pick ?? ''}</span>}</span>)}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {step.opts.map((o, i) => {
          const state = pick == null ? '' : o === step.answer ? 'border-emerald-400 bg-emerald-50' : o === pick ? 'border-rose-400 bg-rose-50' : 'opacity-50'
          return <button key={o} onClick={() => choose(o)} className={`rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 ${state}`}><span className="kbd mr-2 hidden md:inline">{i + 1}</span>{o}</button>
        })}
      </div>
      {pick != null && (
        <div className={`rounded-xl p-3 text-sm ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          <div className="font-semibold">{ok ? '✅ Đúng!' : `❌ Đáp án: ${step.answer}`}</div>
          <div>{full} <button onClick={() => speak(full)}>🔈</button></div>
          <div className="mt-1 text-slate-700">💡 {step.why}</div>
        </div>
      )}
      {pick != null && <button className="btn-primary" onClick={() => onDone({ ok })}>Tiếp →</button>}
      <Shortcuts items={[['1–3', 'chọn'], ['Enter', 'tiếp']]} />
    </div>
  )
}

function FixCard({ step, onDone }) {
  const [said, setSaid] = useState(null)
  const [gaveUp, setGaveUp] = useState(false)
  const check = (t) => similarity(t, step.right) >= 0.86 || sameAnswer(t, [step.right])
  const ok = said != null && check(said)
  const shown = said != null || gaveUp
  const mic = useMic({ onFinal: (t) => setSaid(t), enabled: !shown })
  useHotkeys({ Enter: () => shown && onDone({ ok, said }), r: () => shown && speak(step.right) })
  return (
    <div className="card space-y-4">
      <div className="text-sm text-slate-500">Câu này SAI ngữ pháp. Hãy NÓI (hoặc gõ) lại cho đúng:</div>
      <div className="rounded-xl bg-rose-50 p-4 text-lg text-rose-800">❌ {step.wrong}</div>
      {!shown && (
        <>
          <MicButton mic={mic} label="Giữ để nói câu đúng" />
          <LiveTranscript mic={mic} />
          <TypeFallback onSubmit={setSaid} placeholder="Hoặc gõ câu đúng rồi Enter…" />
          <button className="text-sm text-slate-500 underline" onClick={() => setGaveUp(true)}>Mình chưa biết – xem đáp án</button>
        </>
      )}
      {shown && (
        <div className={`rounded-xl p-3 text-sm ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
          {said != null && <div>Bạn: <i>{said}</i></div>}
          <div className="font-semibold">{ok ? '✅ Chính xác!' : '👉 Câu đúng:'} {step.right} <button onClick={() => speak(step.right)}>🔈</button></div>
          <div className="mt-1 text-slate-700">💡 {step.why}</div>
          {!ok && <div className="mt-1 text-xs text-slate-500">Nghe lại và nói to câu đúng 1 lần trước khi sang câu tiếp.</div>}
        </div>
      )}
      {shown && (
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => onDone({ ok, said })}>Tiếp →</button>
          {said != null && !ok && <button className="btn-ghost" onClick={() => onDone({ ok: true, said })}>✔ Mình nói đúng (máy nghe nhầm)</button>}
        </div>
      )}
      <Shortcuts items={[['Space', 'giữ để nói'], ['Ctrl', 'nghe câu đúng'], ['Enter', 'tiếp']]} />
    </div>
  )
}

function SpeakCard({ step, onDone }) {
  const [said, setSaid] = useState(null)
  const [hint, setHint] = useState(false)
  const [tries, setTries] = useState(0)
  const [first, setFirst] = useState(null) // kết quả lần nói đầu tiên (để chấm điểm)
  const hits = said == null ? [] : step.must.map((m) => chunkUsed(m, said))
  const ok = said != null && hits.every(Boolean)
  const mic = useMic({
    onFinal: (t) => {
      setSaid(t)
      setTries((n) => n + 1)
      if (first == null) setFirst(step.must.every((m) => chunkUsed(m, t)))
    },
  })
  const result = () => ({ ok: first ?? false, aided: hint, said })
  useHotkeys({ h: () => setHint(true), r: () => said != null && speak(step.model), Enter: () => said != null && onDone(result()) })
  return (
    <div className="card space-y-4">
      <div className="text-sm text-slate-500">Tình huống – hãy NÓI bằng tiếng Anh, dùng đúng cấu trúc của bài:</div>
      <div className="rounded-xl bg-indigo-50 p-4 text-lg text-indigo-900">🇻🇳 {step.vi}</div>
      <div className="text-sm">
        {hint ? <span>🔑 Gợi ý: {step.must.map((m) => <span key={m} className="chip mr-1 bg-white border border-slate-200">{m.split('/')[0]}</span>)}</span>
          : <button className="text-indigo-600 underline" onClick={() => setHint(true)}>💡 Gợi ý từ khoá (H)</button>}
      </div>
      <MicButton mic={mic} label={said == null ? 'Giữ để nói' : 'Giữ để nói lại'} />
      <LiveTranscript mic={mic} />
      {said == null && <TypeFallback onSubmit={(t) => { setSaid(t); setTries((n) => n + 1); if (first == null) setFirst(step.must.every((m) => chunkUsed(m, t))) }} />}
      {said != null && (
        <div className={`rounded-xl p-3 text-sm ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
          <div className="font-semibold">{ok ? '✅ Đúng cấu trúc!' : '👉 Còn thiếu phần in đỏ – nghe câu mẫu rồi nói lại:'}</div>
          <div className="mt-1 flex flex-wrap gap-1">{step.must.map((m, i) => <span key={m} className={`chip ${hits[i] ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>{hits[i] ? '✓' : '✗'} {m.split('/')[0]}</span>)}</div>
          <div className="mt-2">Câu mẫu: <b>{step.model}</b> <button onClick={() => speak(step.model)}>🔈</button></div>
          <SentenceVi en={step.model} ctx={`Tình huống: ${step.vi}`} className="!text-sm" />
          {tries > 1 && <div className="mt-1 text-xs text-slate-500">Lần nói lại chỉ để luyện; điểm tính theo lần đầu.</div>}
        </div>
      )}
      {said != null && <SentenceReview key={said} transcript={said} chunks={step.must} model={step.model} situationVi={step.vi} />}
      {said != null && (
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => onDone(result())}>Tiếp →</button>
          {!first && <button className="btn-ghost" onClick={() => onDone({ ok: true, aided: hint, said })}>✔ Mình nói đúng (máy nghe nhầm)</button>}
        </div>
      )}
      <Shortcuts items={[['Space', 'giữ để nói'], ['H', 'gợi ý'], ['Ctrl', 'nghe câu mẫu'], ['Enter', 'tiếp']]} />
    </div>
  )
}

// ───────────────────────── Chọn thì nào? ─────────────────────────
function TenseTool() {
  const [path, setPath] = useState(['start'])
  const cur = path[path.length - 1]
  const result = cur.startsWith('R:') ? tenseTree.results[cur.slice(2)] : null
  const node = result ? null : tenseTree[cur]
  const go = (next) => setPath([...path, next])
  const keys = { Backspace: () => path.length > 1 && setPath(path.slice(0, -1)) }
  node?.opts.forEach(([, n], i) => { keys[String(i + 1)] = () => go(n) })
  useHotkeys(keys)
  return (
    <div>
      <PageHeader title="🧭 Chọn thì nào?" subtitle="Khi sắp nói hoặc viết mà phân vân, trả lời vài câu hỏi đơn giản này." right={<a className="btn-ghost" href="#/grammar">← Ngữ pháp</a>} />
      <div className="card space-y-4">
        {path.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
            {path.slice(0, -1).map((p, i) => {
              const picked = tenseTree[p].opts.find(([, n]) => n === path[i + 1])
              return <span key={i} className="chip bg-slate-100">{picked?.[0]}</span>
            })}
          </div>
        )}
        {node && (
          <>
            <div className="text-lg font-semibold">{node.q}</div>
            <div className="grid gap-2">
              {node.opts.map(([label, n], i) => (
                <button key={label} onClick={() => go(n)} className="rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50"><span className="kbd mr-2 hidden md:inline">{i + 1}</span>{label}</button>
              ))}
            </div>
          </>
        )}
        {result && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
            <div className="text-sm text-emerald-700">Bạn nên dùng:</div>
            <div className="text-2xl font-bold text-emerald-900">{result[0]}</div>
            <div className="font-mono text-indigo-800">{result[1]}</div>
            <div>Ví dụ: <b>{result[2]}</b> <button onClick={() => speak(result[2])}>🔈</button></div>
            <a className="btn-primary inline-block" href={`#/grammar/${result[3]}`}>📖 Học bài này →</a>
          </div>
        )}
        <div className="flex gap-2">
          {path.length > 1 && <button className="btn-ghost" onClick={() => setPath(path.slice(0, -1))}>← Quay lại</button>}
          {path.length > 1 && <button className="btn-ghost" onClick={() => setPath(['start'])}>↺ Làm lại</button>}
        </div>
      </div>
      <div className="card mt-4 text-sm text-slate-700">
        <div className="label mb-1">💡 Mẹo khi nói mà sợ sai</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>Thêm <b>mốc thời gian</b> vào câu (yesterday, now, since 2024, next week). Người nghe vẫn hiểu đúng ý dù bạn chia sai.</li>
          <li>Ba thì đủ dùng cho phần lớn hội thoại: <b>hiện tại đơn</b>, <b>quá khứ đơn</b>, <b>hiện tại hoàn thành</b>. Thêm <b>will / going to</b> cho tương lai.</li>
          <li>Lỡ sai thì tự sửa luôn: “I go… I <i>went</i> there yesterday.” Người bản xứ cũng làm thế, nghe rất tự nhiên.</li>
        </ul>
      </div>
      <Shortcuts items={[['1–4', 'chọn'], ['Backspace', 'quay lại']]} />
    </div>
  )
}

function TenseTablePage() {
  return (
    <div>
      <PageHeader title="📋 Bảng tóm tắt các thì" subtitle="8 thì người bản xứ dùng nhiều nhất khi nói. Bấm 🔈 để nghe, bấm tên bài để học kỹ." right={<a className="btn-ghost" href="#/grammar">← Ngữ pháp</a>} />
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr><th className="p-3">Thì</th><th className="p-3">Công thức</th><th className="p-3">Dùng khi</th><th className="p-3">Ví dụ</th></tr>
          </thead>
          <tbody>
            {tenseTable.map((r) => (
              <tr key={r.name} className="border-t border-slate-100 align-top">
                <td className="p-3 font-semibold"><a className="text-indigo-700 hover:underline" href={`#/grammar/${r.lesson}`}>{r.name}</a></td>
                <td className="p-3 font-mono text-[13px] text-indigo-800 whitespace-nowrap">{r.form}</td>
                <td className="p-3 text-slate-600">{r.use}</td>
                <td className="p-3"><button onClick={() => speak(r.ex)} className="mr-1 text-slate-400 hover:text-indigo-600">🔈</button>{r.ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card mt-4 text-sm"><a className="text-indigo-600 underline" href="#/grammar/tense">🧭 Vẫn phân vân? Dùng công cụ “Chọn thì nào?” →</a></div>
    </div>
  )
}

// ───────────────────────── Động từ bất quy tắc ─────────────────────────
const SESSION_VERBS = 10
function verbOk(said, v) {
  const words = new Set(normalize(said))
  const has = (form) => form.split('/').some((f) => normalize(f).every((w) => words.has(w)))
  return has(v.v2) && has(v.v3)
}

function VerbDrill() {
  const verbs = useStore((s) => s.grammarVerbs || {})
  const [session, setSession] = useState(null) // { list, idx, res }
  const t = today()
  const dueList = irregularVerbs.filter((v) => verbs[v.v1] && verbs[v.v1].due <= t)
  const freshList = irregularVerbs.filter((v) => !verbs[v.v1])
  const known = irregularVerbs.filter((v) => verbs[v.v1]?.box >= 3).length

  const start = () => {
    const list = [...shuffle(dueList), ...freshList].slice(0, SESSION_VERBS)
    if (list.length < SESSION_VERBS) list.push(...shuffle(irregularVerbs.filter((v) => !list.includes(v))).slice(0, SESSION_VERBS - list.length))
    setSession({ list, idx: 0, res: [] })
  }

  const answer = (v, ok) => {
    update((s) => {
      s.grammarVerbs = s.grammarVerbs || {}
      const r = s.grammarVerbs[v.v1] || { box: 0, n: 0, ok: 0 }
      r.n++
      if (ok) { r.ok++; r.box = Math.min(r.box + 1, VERB_BOX_DAYS.length - 1) } else r.box = 0
      r.due = addDays(today(), ok ? VERB_BOX_DAYS[r.box] : 1)
      s.grammarVerbs[v.v1] = r
    })
    const res = [...session.res, { v, ok }]
    if (session.idx + 1 < session.list.length) return setSession({ ...session, idx: session.idx + 1, res })
    const acc = res.filter((x) => x.ok).length / res.length
    scheduleReview('grammar', VERB_ID, acc * 5, VERB_TITLE)
    logHistory('grammar', `${VERB_TITLE}: ${res.filter((x) => x.ok).length}/${res.length} đúng`)
    setSession({ ...session, res, done: true })
  }

  if (session?.done) {
    return (
      <div>
        <PageHeader title="🎉 Xong lượt động từ!" subtitle={`${session.res.filter((x) => x.ok).length}/${session.res.length} đúng · từ sai sẽ quay lại ngày mai`} />
        <div className="card space-y-1">
          {session.res.map(({ v, ok }) => (
            <div key={v.v1} className="flex justify-between border-b border-slate-100 py-1 text-sm last:border-0">
              <span><b>{v.v1} – {v.v2} – {v.v3}</b> <span className="text-slate-500">({v.vi})</span></span><span>{ok ? '✅' : '❌'}</span>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-3">
            <button className="btn-primary" onClick={() => setSession(null)}>Xong</button>
            <a className="btn-ghost" href="#/review">📅 Ôn tập hôm nay</a>
          </div>
        </div>
      </div>
    )
  }

  if (session) {
    const v = session.list[session.idx]
    return (
      <div>
        <PageHeader title={VERB_TITLE} right={<button className="btn-ghost" onClick={() => setSession(null)}>Thoát</button>} />
        <div className="mb-4 flex items-center gap-3 text-sm text-slate-500"><span>{session.idx + 1}/{session.list.length}</span><div className="flex-1"><Progress value={session.idx} max={session.list.length} /></div></div>
        <VerbCard key={v.v1 + session.idx} v={v} onDone={(ok) => answer(v, ok)} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={VERB_TITLE} subtitle="Nói nhanh dạng quá khứ (V2) và quá khứ phân từ (V3). Mỗi động từ có lịch ôn riêng: đúng → giãn 1 → 2 → 4 → 7 → 15 → 30 ngày; sai → ôn lại ngày mai." right={<a className="btn-ghost" href="#/grammar">← Ngữ pháp</a>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="card !p-4"><div className="text-sm text-slate-500">Cần ôn hôm nay</div><div className={`text-3xl font-bold ${dueList.length ? 'text-rose-600' : 'text-emerald-600'}`}>{dueList.length}</div></div>
        <div className="card !p-4"><div className="text-sm text-slate-500">Chưa học</div><div className="text-3xl font-bold">{freshList.length}</div></div>
        <div className="card !p-4"><div className="text-sm text-slate-500">Đã nhớ chắc</div><div className="text-3xl font-bold text-emerald-600">{known}<span className="text-base text-slate-400">/{irregularVerbs.length}</span></div><Progress value={known} max={irregularVerbs.length} color="bg-emerald-500" /></div>
      </div>
      <div className="card mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 text-sm text-slate-600">Mỗi lượt {SESSION_VERBS} động từ: từ đến hạn trước, sau đó đến từ mới. Thấy “go” → nói “<b>went, gone</b>”.</div>
        <button className="btn-primary" onClick={start}>▶ Bắt đầu ({dueList.length ? `${Math.min(dueList.length, SESSION_VERBS)} ôn` : 'học mới'})</button>
      </div>
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-3">V1</th><th className="p-3">V2 (quá khứ)</th><th className="p-3">V3 (hoàn thành / bị động)</th><th className="p-3">Nghĩa</th><th className="p-3">Lịch ôn</th></tr></thead>
          <tbody>
            {irregularVerbs.map((v) => {
              const r = verbs[v.v1]
              return (
                <tr key={v.v1} className="border-t border-slate-100">
                  <td className="p-3 font-medium"><button onClick={() => speak(`${v.v1}, ${v.v2.replace('/', ' or ')}, ${v.v3}`)} className="mr-1 text-slate-400 hover:text-indigo-600">🔈</button>{v.v1}</td>
                  <td className="p-3">{v.v2}</td>
                  <td className="p-3">{v.v3}</td>
                  <td className="p-3 text-slate-600">{v.vi}</td>
                  <td className="p-3 text-xs">{!r ? <span className="text-slate-400">Chưa học</span> : r.due <= t ? <span className="chip bg-rose-100 text-rose-700">Đến hạn</span> : <span className="chip bg-emerald-100 text-emerald-700">{r.due.slice(8, 10)}/{r.due.slice(5, 7)}</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VerbCard({ v, onDone }) {
  const [said, setSaid] = useState(null)
  const [reveal, setReveal] = useState(false)
  const ok = said != null && verbOk(said, v)
  const shown = said != null || reveal
  const play = () => speak(`${v.v1}, ${v.v2.replace('/', ' or ')}, ${v.v3}`)
  const mic = useMic({ onFinal: (t) => { setSaid(t); play() }, enabled: !shown })
  useHotkeys({ Enter: () => shown && onDone(ok), r: play })
  return (
    <div className="card space-y-4 text-center">
      <div className="text-4xl font-bold">{v.v1}</div>
      <div className="text-slate-500">{v.vi}</div>
      {!shown && (
        <>
          <MicButton mic={mic} label="Giữ để nói V2, V3" />
          <LiveTranscript mic={mic} placeholder="Ví dụ: went, gone" />
          <TypeFallback onSubmit={(t) => { setSaid(t); play() }} placeholder="Hoặc gõ: went gone" />
          <button className="text-sm text-slate-500 underline" onClick={() => { setReveal(true); play() }}>Chưa nhớ – xem đáp án</button>
        </>
      )}
      {shown && (
        <div className={`rounded-xl p-3 ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
          {said != null && <div className="text-sm">Bạn: <i>{said}</i></div>}
          <div className="text-xl font-semibold">{ok ? '✅ ' : ''}{v.v1} – {v.v2} – {v.v3} <button onClick={play}>🔈</button></div>
        </div>
      )}
      {shown && (
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn-primary" onClick={() => onDone(ok)}>Tiếp →</button>
          {said != null && !ok && <button className="btn-ghost" onClick={() => onDone(true)}>✔ Mình nói đúng (máy nghe nhầm)</button>}
        </div>
      )}
      <Shortcuts items={[['Space', 'giữ để nói'], ['Ctrl', 'nghe'], ['Enter', 'tiếp']]} />
    </div>
  )
}
