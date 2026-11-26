// Hiển thị kết quả chấm theo Ý (dịch / viết / tóm tắt): điểm thành phần, từng ý, lỗi, bản sửa theo ý bạn, bản tự nhiên
import { speak } from '../lib/speech'

const IDEA = {
  ok: ['✅', 'Đủ ý', 'text-emerald-700'],
  partial: ['🟡', 'Chưa rõ/thiếu sắc thái', 'text-amber-700'],
  wrong: ['❌', 'Sai ý', 'text-rose-700'],
  missing: ['⛔', 'Thiếu ý', 'text-rose-700'],
}
const TYPE = { grammar: 'Ngữ pháp', word: 'Dùng từ', collocation: 'Kết hợp từ', meaning: 'Sai nghĩa', unnatural: 'Không tự nhiên', missing: 'Thiếu', usage: 'Cách dùng' }

function Score({ label, v }) {
  if (v == null) return null
  const c = v >= 8 ? 'bg-emerald-100 text-emerald-800' : v >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'
  return <span className={`chip ${c}`}>{label}: <b className="ml-1">{v}/10</b></span>
}

export function GradeView({ r, text, kind = 'viết' }) {
  if (!r) return null
  const same = (a, b) => String(a || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === String(b || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2">
        <Score label="Tổng" v={r.score} />
        <Score label="Truyền đạt ý" v={r.meaning_score ?? r.task_score} />
        <Score label="Ngữ pháp" v={r.grammar_score} />
        <Score label="Tự nhiên" v={r.natural_score} />
        {r.coverage != null && <span className="chip bg-slate-100 text-slate-700">Đủ ý: <b className="ml-1">{r.coverage}%</b></span>}
      </div>
      {r.verdict_vi && <div className="font-medium">{r.verdict_vi}</div>}

      {r.ideas?.length > 0 && (
        <div>
          <div className="label mb-1">Từng ý trong bản gốc – bạn đã truyền đạt được chưa?</div>
          <div className="space-y-1">
            {r.ideas.map((i, k) => {
              const [ic, lb, cl] = IDEA[i.status] || IDEA.partial
              return (
                <div key={k} className="rounded-lg bg-slate-50 p-2">
                  <span className="mr-1">{ic}</span><b>{i.idea_vi}</b> <span className={`text-xs ${cl}`}>({lb})</span>
                  {i.learner && <div className="text-slate-500">Bạn {kind}: “{i.learner}”</div>}
                  {i.status !== 'ok' && i.note_vi && <div className="text-slate-600">→ {i.note_vi}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {r.errors?.length > 0 && (
        <div>
          <div className="label mb-1">Lỗi cần sửa ({r.errors.length})</div>
          <div className="space-y-1">
            {r.errors.map((e, k) => (
              <div key={k}>
                • <s className="text-rose-600">{e.wrong || '(thiếu)'}</s> → <b className="text-emerald-700">{e.fix}</b>{' '}
                <span className="chip bg-slate-100 text-slate-600 !py-0 text-[11px]">{TYPE[e.type] || e.type}</span>
                {e.why_vi && <div className="ml-3 text-slate-600">{e.why_vi}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {r.errors?.length === 0 && r.score >= 8 && <div className="text-emerald-700">✓ AI không thấy lỗi đáng kể.</div>}

      {r.fixed && (
        <div className="rounded-xl bg-emerald-50 p-3">
          <div className="label mb-1">✏️ Sửa theo ý bạn (giữ cách viết của bạn, chỉ sửa chỗ sai)</div>
          <div>{r.fixed} <button onClick={() => speak(r.fixed)}>🔈</button></div>
          {same(r.fixed, text) && <div className="text-xs text-slate-500 mt-1">Câu của bạn đã đúng – xem bản tự nhiên bên dưới để nâng cấp.</div>}
        </div>
      )}
      {r.native && (
        <div className="rounded-xl bg-indigo-50 p-3">
          <div className="label mb-1">🌟 Người bản xứ sẽ viết</div>
          <div>{r.native} <button onClick={() => speak(r.native)}>🔈</button></div>
          {r.native_why_vi && <div className="mt-1 text-slate-600">{r.native_why_vi}</div>}
        </div>
      )}
      {r.feedback_vi && <div className="text-slate-600">💬 {r.feedback_vi}</div>}
    </div>
  )
}
