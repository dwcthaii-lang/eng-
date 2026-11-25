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

export async function askJson(system, user) {
  const s = getState().settings
  if (s.aiProvider === 'gemini' && s.geminiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(s.geminiModel || 'gemini-2.5-flash')}:generateContent?key=${encodeURIComponent(s.geminiKey)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
    })
    if (!res.ok) throw new Error(`Gemini lỗi ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
    return extractJson(text)
  }
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
