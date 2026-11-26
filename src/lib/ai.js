// Gọi Gemini / OpenAI trực tiếp từ trình duyệt (API key lưu cục bộ trong LocalStorage)
import { getState } from './store'

export function aiEnabled() {
  const s = getState().settings
  return (s.aiProvider === 'gemini' && s.geminiKey) || (s.aiProvider === 'openai' && s.openaiKey)
}

function extractJson(text) {
  const t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try { return JSON.parse(t) } catch {}
  const m = t.match(/\{[\s\S]*\}/)
  if (m) return JSON.parse(m[0])
  throw new Error('AI không trả về JSON hợp lệ')
}

export let lastUsedModel = ''
const FIRST_MS = 12000 // phải có chữ đầu tiên trong 12 giây, nếu không chuyển model
const TOTAL_MS = 90000 // tối đa cho cả lượt (kể cả chuyển model, sinh bài dài)
const goodModel = {} // model đã chạy tốt trong phiên này (tránh gọi lại model đang quá tải)
const thinkIdx = {}
// Tắt/giảm "suy nghĩ" để có chữ đầu tiên nhanh (thử lần lượt, model không nhận thì bỏ)
function thinkingOptions(model) {
  const v = parseFloat((model.match(/^gemini-([\d.]+)/) || [])[1] || '0')
  if (v >= 3) return /pro/.test(model) ? [{ thinkingLevel: 'low' }, null] : [{ thinkingLevel: 'minimal' }, { thinkingLevel: 'low' }, null]
  if (v >= 2.5) return /pro/.test(model) ? [{ thinkingBudget: 128 }, null] : [{ thinkingBudget: 0 }, null]
  return [null]
}

// Danh sách model Gemini dùng được với key này, ưu tiên bản "flash" mới nhất, ổn định
export async function listGeminiModels(key, { all = false } = {}) {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`)
    if (!r.ok) return []
    const d = await r.json()
    const names = (d.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name).replace(/^models\//, ''))
      .filter((n) => (all ? /^gemini-[\d.]+-(flash|pro)/ : /^gemini-[\d.]+-flash/).test(n) && !/image|tts|audio|live|thinking|exp|embedding/.test(n))
    const ver = (n) => parseFloat(n.match(/^gemini-([\d.]+)/)[1])
    const rank = (n) => (/preview/.test(n) ? 2 : 0) + (/lite/.test(n) ? 1 : 0) + (/pro/.test(n) ? 0.5 : 0)
    return names.sort((a, b) => rank(a) - rank(b) || ver(b) - ver(a)).slice(0, all ? 30 : 5)
  } catch {
    return []
  }
}

// Gọi Gemini dạng STREAM: chữ về tới đâu báo tới đó (onText), tự chuyển model khi bận/chậm/ngừng
async function geminiStream({ system, user, json = false, onText, temperature = 0.5 }) {
  const s = getState().settings
  const chosen = s.geminiModel || 'gemini-3.8-flash'
  const models = [...new Set([goodModel[chosen] || chosen, chosen])]
  const tried = new Set()
  let discovered = false
  let lastErr = null
  const t0 = Date.now()
  for (let mi = 0; mi < models.length && mi < 6; mi++) {
    const model = models[mi]
    if (tried.has(model)) continue
    tried.add(model)
    const opts = thinkingOptions(model)
    for (let attempt = 0; attempt < 4; attempt++) {
      if (Date.now() - t0 > TOTAL_MS) throw lastErr || new Error('AI phản hồi quá chậm.')
      const think = opts[Math.min(thinkIdx[model] || 0, opts.length - 1)]
      const ctrl = new AbortController()
      let timer = setTimeout(() => ctrl.abort(), FIRST_MS)
      let res
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(s.geminiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}), ...(think ? { thinkingConfig: think } : {}) },
          }),
        })
        if (res.ok) {
          const reader = res.body.getReader()
          const dec = new TextDecoder()
          let buf = '', text = '', got = false
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            buf += dec.decode(value, { stream: true })
            let i
            while ((i = buf.indexOf('\n')) >= 0) {
              const line = buf.slice(0, i).trim()
              buf = buf.slice(i + 1)
              if (!line.startsWith('data:')) continue
              try {
                const d = JSON.parse(line.slice(5))
                const t = (d.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought && p.text).map((p) => p.text).join('')
                if (t) {
                  text += t
                  if (!got) { got = true; clearTimeout(timer); timer = setTimeout(() => ctrl.abort(), TOTAL_MS) }
                  onText?.(text)
                }
              } catch {}
            }
          }
          clearTimeout(timer)
          if (!text) { lastErr = new Error(`Model ${model} không trả lời.`); break }
          lastUsedModel = model
          goodModel[chosen] = model
          return text
        }
      } catch (e) {
        clearTimeout(timer)
        lastErr = new Error(e.name === 'AbortError' ? `Model ${model} trả lời quá chậm, đã chuyển model khác.` : `Lỗi mạng khi gọi Gemini: ${e.message}`)
        break
      }
      clearTimeout(timer)
      const body = (await res.text()).slice(0, 300)
      lastErr = new Error(`Gemini lỗi ${res.status} (${model}): ${body.slice(0, 160)}`)
      if (res.status === 400 && think && /think/i.test(body)) { thinkIdx[model] = (thinkIdx[model] || 0) + 1; continue }
      if (res.status === 401 || res.status === 403 || (res.status === 400 && /api key|API_KEY/i.test(body))) throw new Error(`Gemini lỗi ${res.status}: API key không hợp lệ hoặc chưa được bật.`)
      if (res.status === 503 && attempt === 0) { await new Promise((r) => setTimeout(r, 800)); continue }
      break
    }
    if (!discovered && mi === models.length - 1) {
      discovered = true
      models.push(...(await listGeminiModels(s.geminiKey)).filter((m) => !tried.has(m)))
    }
  }
  throw lastErr
}

// Văn bản tự do (có stream nếu dùng Gemini)
export async function askText(system, user, onText) {
  const s = getState().settings
  if (s.aiProvider === 'gemini' && s.geminiKey) return geminiStream({ system, user, onText, temperature: 0.3 })
  if (s.aiProvider === 'openai' && s.openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.openaiKey}` },
      body: JSON.stringify({ model: s.openaiModel || 'gpt-4o-mini', temperature: 0.3, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    })
    if (!res.ok) throw new Error(`OpenAI lỗi ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const text = (await res.json()).choices?.[0]?.message?.content || ''
    onText?.(text)
    return text
  }
  throw new Error('Chưa cấu hình API key trong Cài đặt')
}

export async function askJson(system, user) {
  const s = getState().settings
  if (s.aiProvider === 'gemini' && s.geminiKey) return extractJson(await geminiStream({ system, user, json: true, temperature: 0.7 }))
  if (s.aiProvider === 'openai' && s.openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.openaiKey}` },
      body: JSON.stringify({
        model: s.openaiModel || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI lỗi ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data = await res.json()
    return extractJson(data.choices?.[0]?.message?.content || '')
  }
  throw new Error('Chưa cấu hình API key trong Cài đặt')
}

const LEARNER = 'The learner is a Vietnamese master\'s student in semiconductor engineering living in an international dorm in Taiwan. Good reading vocabulary, weak speaking reflexes. Speech comes from browser speech recognition, so ignore punctuation/capitalization and small recognition errors.'

// Module 1: chấm câu nói theo ngữ nghĩa
export function gradeRecall({ situationVi, context, chunks, transcript, model }) {
  return askJson(
    `You are a friendly English speaking coach. ${LEARNER} Return JSON only.`,
    `Situation (Vietnamese): ${situationVi}
Context: ${context}
Target chunks: ${chunks.join('; ')}
Reference answer: ${model}
Learner said: "${transcript}"

Evaluate whether the learner's sentence communicates the situation naturally. Return JSON:
{"score": 0-10 integer, "meaning_ok": boolean, "used_chunks": [chunks used correctly], "natural": "a more natural version of what the learner tried to say (keep their idea, max 30 words)", "feedback_vi": "1-2 short sentences of feedback in Vietnamese"}`
  )
}

// Module 3: AI đóng vai sinh lượt thoại tiếp theo
export function roleplayTurn({ scenario, history }) {
  const convo = history.map((h) => `${h.who === 'ai' ? scenario.aiName : 'Learner'}: ${h.text}`).join('\n')
  return askJson(
    `You play ${scenario.aiName}, ${scenario.aiRoleEn}. Scenario: ${scenario.setupEn}. ${LEARNER}
Speak naturally like a real person (contractions, casual or academic register as fits), 1-2 short sentences per turn, max 35 words, and always end with something the learner must respond to. Return JSON only.`,
    `Conversation so far:\n${convo}\n\nWrite your next line. Return JSON: {"reply": "your line", "hint": ["2-3 English keywords/chunks the learner could use to answer"], "end": boolean (true if the conversation reached a natural ending)}`
  )
}

// Module 3: sửa 3 lỗi diễn đạt tự nhiên nhất + từ bị bí
export function roleplayFeedback({ scenario, history, stuckWords }) {
  const convo = history.map((h) => `${h.who === 'ai' ? scenario.aiName : 'Learner'}: ${h.text}`).join('\n')
  return askJson(
    `You are an English speaking coach. ${LEARNER} Return JSON only.`,
    `Roleplay: ${scenario.titleVi} (${scenario.setupEn})\n${convo}\nWords the learner needed hints for: ${stuckWords.join(', ') || 'none'}

Pick ONLY the 3 most important improvements in the learner's lines (naturalness, register, collocations), not tiny grammar nitpicks. Return JSON:
{"corrections":[{"said":"learner's original sentence","better":"how a native speaker / academic would say it","why_vi":"short reason in Vietnamese"}], "reactivate":[{"en":"useful chunk the learner lacked","vi":"Vietnamese meaning"}], "summary_vi":"one encouraging sentence in Vietnamese"}`
  )
}

// Đọc/Viết: sửa nhật ký
export function gradeWriting({ promptEn, text, chunks }) {
  return askJson(
    `You are an English writing coach for academic and daily English. ${LEARNER} Return JSON only.`,
    `Task: ${promptEn}\nTarget chunks: ${chunks.join('; ')}\nLearner text:\n${text}\n\nReturn JSON: {"corrected": "corrected full text, minimal edits", "top_fixes": [{"from":"...","to":"...","why_vi":"..."}] (max 3), "feedback_vi": "1-2 sentences in Vietnamese"}`
  )
}

// Module 2: chấm tóm tắt ý chính (nghe không phụ đề)
export function gradeSummary({ transcript, summary }) {
  return askJson(
    `You check listening comprehension. Return JSON only.`,
    `Dialogue transcript:\n${transcript}\n\nLearner's summary (may be Vietnamese or English): "${summary}"\nReturn JSON: {"score": 0-10, "caught": ["main points the learner got"], "missed": ["main points missed, in Vietnamese"], "feedback_vi": "1 short sentence in Vietnamese"}`
  )
}

export async function testConnection() {
  const r = await askJson('Return JSON only.', 'Return {"ok": true}')
  return !!r.ok
}

// Mở rộng cụm từ: đồng nghĩa, trái nghĩa, liên quan, ví dụ văn nói
export function enrichChunk({ en, vi }) {
  return askJson(
    `You are an English vocabulary coach focusing on natural spoken English. ${LEARNER} Return JSON only.`,
    `Chunk: "${en}" (Vietnamese: ${vi || '?'})
Return JSON: {"syn": ["1-3 synonyms or near-synonym chunks"], "ant": ["0-2 opposites, empty if none"], "rel": ["2-3 related collocations/word family"], "ex": ["2 short natural sentences a student would SAY in daily life or in a lab, using the chunk"]}`
  )
}

// Chấm bản dịch Việt -> Anh: sửa ngữ pháp + từ vựng
export function gradeTranslation({ vi, reference, text }) {
  return askJson(
    `You are an English writing coach. ${LEARNER} Return JSON only.`,
    `Vietnamese source:\n${vi}\n\nReference translation (one possible answer):\n${reference}\n\nLearner's translation:\n${text}

Evaluate meaning accuracy, grammar and natural word choice. Keep the learner's structure where it is correct. Return JSON:
{"score": 0-10, "corrected": "the learner's text with minimal corrections", "grammar": [{"from":"...","to":"...","why_vi":"..."}] (max 4), "vocab": [{"from":"...","to":"more natural word/chunk","why_vi":"..."}] (max 4), "missing_vi": "ideas from the source the learner left out, in Vietnamese, or empty", "feedback_vi": "1-2 sentences in Vietnamese"}`
  )
}

// Tra nhanh khi viết: tiếng Việt -> cách nói tiếng Anh tự nhiên
export function lookupPhrase({ phrase, context }) {
  return askJson(
    `You are a bilingual Vietnamese-English dictionary for spoken and academic English. Return JSON only.`,
    `Vietnamese word/phrase: "${phrase}"\nContext sentence: "${context || ''}"\nReturn JSON: {"options": [{"en": "natural English word/chunk", "note_vi": "khi nào dùng, ngắn gọn"}] (2-3 options), "example": "one example sentence in English"}`
  )
}

// Sinh tình huống mới đầy đủ cho cả 3 module (không giới hạn nội dung)
export function generateSituation({ tier, topicVi }) {
  return askJson(
    `You create English speaking & listening lessons. ${LEARNER} Return JSON only, exactly following the schema.`,
    `Create ONE new lesson situation. Tier ${tier} (${tier === 1 ? 'international dorm & daily life in Taiwan' : 'semiconductor lab, cleanroom, advisor meetings, academic presentations'}).
Topic idea from learner (Vietnamese, may be empty): "${topicVi || ''}"

Schema:
{
 "emoji": "one emoji", "title": "short English title", "titleVi": "short Vietnamese title",
 "recall": [ 2 items: {"vi": "Vietnamese instruction describing what to say", "context": "Vietnamese context", "chunks": [3 x {"en": "natural chunk/collocation", "vi": "nghĩa"}], "model": "natural spoken model answer using all 3 chunks"} ],
 "listening": {
   "speakers": {"A": "Name (role)", "B": "Minh"},
   "gistVi": "1-sentence Vietnamese summary", "keyPoints": ["3 Vietnamese key points"],
   "chunks": [3 x {"en":"...","vi":"..."}],
   "lines": [5-7 x {"s": "A" or "B", "t": "line text"}]
 },
 "roleplay": {"aiName": "...", "aiRoleEn": "who the AI plays", "roleVi": "vai (tiếng Việt)", "setupEn": "scenario", "goalVi": "mục tiêu", "turns": [4 x {"ai": "AI line ending with something to respond to", "hint": ["2-3 keywords"], "model": "natural learner reply"}]}
}
Listening line markup rules (IMPORTANT):
- Put 4-6 connected-speech gaps across the lines using [[spoken form|accepted alternatives comma separated|Vietnamese explanation of the linking/reduction]], e.g. [[gonna|going to|going to → gonna: 'to' giảm thành /ə/]] or [[did you|didja|did you → /ˈdɪdʒə/: /d/ + /j/ thành /dʒ/]].
- The spoken form must be pronounceable by text-to-speech.
- Mark sentence stress by wrapping stressed content words in *asterisks*.
Natural, real-life language, 30-60 seconds of audio.`
  )
}

// Thêm từ/cụm từ mới cho một chủ đề của Lộ trình từ vựng
export function generateUnitItems({ title, levelName, existing, count = 15 }) {
  return askJson(
    `You are an English vocabulary curriculum designer focusing on natural spoken British/American English. ${LEARNER} Return JSON only.`,
    `Topic: "${title}" — level: ${levelName}.
Already learned (do NOT repeat): ${existing.join('; ')}
Give ${count} NEW high-frequency words, collocations, phrasal verbs or short everyday sentences that native speakers really use for this topic at this level.
Return JSON: {"items": [{"en": "word/chunk", "vi": "nghĩa tiếng Việt ngắn gọn", "ex": "one natural spoken example sentence that CONTAINS the exact chunk"}]}`
  )
}

// Chấm & sửa CẢ CÂU người học nói – trả về dạng dòng để hiện dần (stream)
export function reviewSentence({ situationVi = '', context = '', chunks = [], transcript, model = '' }, onPartial) {
  const system = `You are a strict, expert English speaking teacher for Vietnamese learners (IELTS examiner standard). ${LEARNER}
Judge MEANING and USAGE, not just whether target words appear. A sentence that merely strings the target chunks together, uses a chunk with the wrong meaning or grammar, is a fragment/run-on, or does not do what the situation asks must NOT get a high score.
All explanations in Vietnamese: concrete and teaching-oriented — name the rule or collocation, say why it sounds wrong/odd to a native speaker, and give a short correct example. No generic praise.
Output ONLY plain-text lines in exactly this format (no markdown, no extra lines):
SCORE: <0-10>
SUB: grammar=<0-10>; vocab=<0-10>; natural=<0-10>; task=<0-10>
VERDICT: <1-2 câu: câu này có làm đúng yêu cầu tình huống không, người nghe hiểu thế nào, vấn đề lớn nhất>
ERR: <exact words copied from learner's sentence> => <correction> => <grammar|word|usage|unnatural|missing> => <giải thích sâu: quy tắc + vì sao sai + ví dụ đúng>
CHUNK: <target chunk> => <ok|wrong|unnatural|missing> => <nhận xét cách người học dùng cụm này (đúng nghĩa? đúng cấu trúc? đúng chỗ?) + cách dùng chuẩn + ví dụ>
FIXED: <learner's sentence minimally corrected, keep their idea and words>
NATIVE: <how a native speaker would naturally say it in this situation>
NATIVE_VI: <dịch NATIVE sang tiếng Việt>
AVOID: <1 thói quen/cách nói nên tránh, có lý do>
TIP: <1 mẹo cụ thể để lần sau nói tốt hơn>
Rules: SCORE first. ERR lines ordered by importance (0-5 lines; write none if the sentence is truly fine). One CHUNK line per target chunk.
Scoring: 9-10 = grammatical, natural AND fully does the task. Chunks used incorrectly/unnaturally or a fragmented sentence → max 6. Task not achieved → max 5. Ignore punctuation/capitalization (speech recognition).`
  const user = `Situation (Vietnamese): ${situationVi}
Context: ${context}
Target chunks: ${chunks.join('; ')}
Reference answer: ${model}
Learner said: "${transcript}"`
  return askText(system, user, (t) => onPartial?.(parseReview(t))).then(parseReview)
}

const num = (x) => { const n = parseFloat(x); return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n))) : undefined }
export function parseReview(text) {
  const out = { errors: [], chunks: [], sub: {} }
  const lines = String(text).split('\n')
  const complete = /\n\s*$/.test(text) ? lines : lines.slice(0, -1) // dòng cuối có thể chưa xong
  for (const raw of complete) {
    const line = raw.replace(/^[\s*\-•#]+/, '').trim()
    const m = line.match(/^([A-Z_]+)\s*:\s*(.*)$/)
    if (!m) continue
    const [, k, v] = m
    const parts = v.split('=>').map((x) => x.trim())
    if (k === 'SCORE') out.score = num(v)
    else if (k === 'SUB') v.split(/[;,]/).forEach((kv) => { const [a, b] = kv.split('='); if (a && b) out.sub[a.trim().toLowerCase()] = num(b) })
    else if (k === 'VERDICT') out.verdict = v
    else if (k === 'ERR' && parts.length >= 2) out.errors.push({ wrong: parts[0].replace(/^["“]|["”]$/g, ''), fix: parts[1], type: (parts[2] || 'grammar').toLowerCase(), why_vi: parts.slice(3).join(' => ') })
    else if (k === 'CHUNK' && parts.length >= 2) out.chunks.push({ chunk: parts[0], status: parts[1].toLowerCase(), note: parts.slice(2).join(' => ') })
    else if (k === 'FIXED') out.corrected = v
    else if (k === 'NATIVE') out.natural = v
    else if (k === 'NATIVE_VI') out.naturalVi = v
    else if (k === 'AVOID') out.avoid = v
    else if (k === 'TIP') out.tip = v
  }
  return out
}
