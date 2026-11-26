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

// ───────── Bộ định tuyến model Gemini ─────────
// - Ghi lại thời gian ra chữ đầu tiên (TTFT) của từng model → ưu tiên model nhanh
// - "Gửi dự phòng" (hedging) khi model đầu chậm – NHƯNG chỉ khi model kế còn dư lượt (không đốt quota)
// - Hết lượt (429): đọc Google báo "thử lại sau bao lâu" + loại quota (theo phút / theo ngày) → khoá đúng model+key đó đến lúc hồi
// - Tự giới hạn số yêu cầu/phút cho mỗi model (gói miễn phí ~10/phút) → hiếm khi bị 429
// - Yêu cầu NỀN (dịch mượt, tra thêm) xếp hàng từng cái, chừa lượt cho việc bạn đang làm
// - Nhiều key (khác project Google) → mỗi key có hạn mức riêng; hết sạch Gemini → dùng OpenAI nếu có key
const STATS_KEY = 'english-reflex:aistats'
const QUOTA_KEY = 'english-reflex:quota'
const HEDGE_MS = 4000
const MAX_PARALLEL = 2
let stats = {}
try { stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{}') } catch {}
const saveStats = () => { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch {} }
const st = (m) => (stats[m] ||= { ttft: 0, n: 0, failAt: 0, think: 0 })
function recordOk(model, ms) { const x = st(model); x.ttft = x.n ? Math.round(x.ttft * 0.6 + ms * 0.4) : ms; x.n++; x.failAt = 0; saveStats() }
// model thua vì chậm: ghi nhận ít nhất bằng thời gian đã chờ → lần sau xếp sau
function recordSlow(model, ms) { const x = st(model); x.ttft = Math.max(x.ttft, ms); x.n = Math.max(1, x.n); saveStats() }
function recordFail(model, status) { st(model).failAt = Date.now(); if (status === 404) st(model).gone = Date.now(); saveStats() }
export function modelStats() { return stats }

// Hạn mức theo từng cặp key+model
let quota = {}
try { quota = JSON.parse(localStorage.getItem(QUOTA_KEY) || '{}') } catch {}
const saveQuota = () => { try { localStorage.setItem(QUOTA_KEY, JSON.stringify(quota)) } catch {} }
const kid = (key) => String(key).slice(-6)
const qid = (key, model) => `${kid(key)}|${model}`
const reqLog = {} // qid -> [thời điểm gửi] trong 60 giây gần nhất (chỉ trong phiên)
const softRpm = (model) => (/lite/.test(model) ? 14 : /pro/.test(model) ? 4 : 9)
function usedLastMinute(id) { const now = Date.now(); const a = (reqLog[id] = (reqLog[id] || []).filter((t) => now - t < 60000)); return a.length }
function blockedUntil(key, model) { const x = quota[qid(key, model)]; return x && x.until > Date.now() ? x : null }
// thời điểm hạn mức NGÀY được làm mới (nửa đêm giờ Thái Bình Dương ≈ 15:00 giờ Việt Nam / 16:00 giờ Đài Loan)
function nextPacificMidnight() {
  const d = new Date(); const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 8))
  if (t <= d) t.setUTCDate(t.getUTCDate() + 1)
  return t.getTime()
}
// Đọc lỗi 429 của Google: theo ngày hay theo phút, và phải đợi bao lâu
export function parseQuotaError(body) {
  const perDay = /PerDay/i.test(body)
  const m = body.match(/retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/) || body.match(/retry in (\d+(?:\.\d+)?)\s*s/i)
  const delayMs = m ? Math.ceil(parseFloat(m[1]) * 1000) : 0
  return { perDay, delayMs }
}
function noteBlock(key, model, status, body) {
  const now = Date.now()
  let until, why
  if (status === 429) {
    const { perDay, delayMs } = parseQuotaError(body)
    if (perDay) { until = nextPacificMidnight(); why = 'day' }
    else { until = now + (delayMs ? Math.max(delayMs, 2000) : 20000) + 500; why = 'minute' }
  } else { until = now + 120000; why = 'busy' } // 503/500: tránh 2 phút
  quota[qid(key, model)] = { until, why }
  saveQuota()
}
const geminiKeys = (s) => [...new Set([s.geminiKey, ...String(s.geminiKeysExtra || '').split(/[\s,;]+/)].map((k) => (k || '').trim()).filter((k) => k.length > 8))]

// Thông báo trạng thái AI cho giao diện (đang đợi hết lượt, đang dùng dự phòng…)
let notice = null
const noticeSubs = new Set()
export function subscribeAiNotice(fn) { noticeSubs.add(fn); return () => noticeSubs.delete(fn) }
export function getAiNotice() { return notice }
function setNotice(n) { notice = n; noticeSubs.forEach((f) => f(n)) }

// Tóm tắt tình trạng hạn mức (Cài đặt)
export function quotaStatus() {
  const now = Date.now()
  return Object.entries(quota).filter(([, x]) => x.until > now).map(([id, x]) => ({ model: id.split('|')[1], key: '…' + id.split('|')[0], why: x.why, until: x.until }))
}
export function clearQuotaBlocks() { quota = {}; saveQuota(); Object.values(stats).forEach((x) => { x.failAt = 0 }); saveStats() }

let modelListCache = null
async function candidateModels(s) {
  if (!modelListCache) {
    const cached = (() => { try { return JSON.parse(localStorage.getItem('english-reflex:models') || 'null') } catch { return null } })()
    if (cached && Date.now() - cached.at < 86400000 && cached.key === s.geminiKey.slice(-6)) modelListCache = cached.list
    else {
      const list = await listGeminiModels(s.geminiKey)
      if (list.length) { modelListCache = list; try { localStorage.setItem('english-reflex:models', JSON.stringify({ at: Date.now(), key: s.geminiKey.slice(-6), list })) } catch {} }
    }
  }
  // chỉ dùng model Google thật sự cho phép với key này; model báo 404 (không tồn tại) bị loại 7 ngày
  const fallback = modelListCache?.length ? [] : ['gemini-flash-latest', 'gemini-flash-lite-latest']
  const pool = [...new Set([...(s.geminiModel && s.geminiModel !== 'auto' ? [s.geminiModel] : []), ...(modelListCache || []), ...fallback])]
    .filter((m) => !(stats[m]?.gone && Date.now() - stats[m].gone < 7 * 86400000))
  const now = Date.now()
  const score = (m) => {
    const x = stats[m]
    let v = x?.n ? x.ttft : 6000 // chưa đo: coi như 6 giây
    if (x?.failAt && now - x.failAt < 600000) v += 60000 // vừa lỗi: xếp cuối
    if (m === s.geminiModel) v -= 1500 // ưu tiên nhẹ model bạn chọn
    return v
  }
  return pool.sort((a, b) => score(a) - score(b))
}

// Danh sách cặp (key, model) theo thứ tự ưu tiên
async function candidatePairs(s) {
  const models = await candidateModels(s)
  const keys = geminiKeys(s)
  const out = []
  models.forEach((model) => keys.forEach((key) => out.push({ key, model, id: qid(key, model) })))
  return out
}
// Cặp còn dùng được ngay: không bị khoá, còn dư lượt/phút (yêu cầu nền chừa lại 4 lượt cho bạn)
function usable(p, bg) {
  if (blockedUntil(p.key, p.model)) return false
  return usedLastMinute(p.id) < softRpm(p.model) - (bg ? 4 : 0)
}
// Bao lâu nữa thì có cặp dùng lại được (ms), hoặc Infinity nếu chỉ còn bị khoá theo ngày
function soonestFree(pairs) {
  const now = Date.now()
  let best = Infinity
  for (const p of pairs) {
    const b = blockedUntil(p.key, p.model)
    if (b) { if (b.why !== 'day') best = Math.min(best, b.until - now) ; continue }
    const log = reqLog[p.id] || []
    best = Math.min(best, log.length >= softRpm(p.model) ? 60000 - (now - log[0]) + 200 : 0)
  }
  return best
}

// Tắt/giảm "suy nghĩ" để có chữ đầu tiên nhanh (thử lần lượt, model không nhận thì bỏ; nhớ lại lựa chọn)
function thinkingOptions(model) {
  const v = parseFloat((model.match(/^gemini-([\d.]+)/) || [])[1] || '0')
  if (v >= 3) return /pro/.test(model) ? [{ thinkingLevel: 'low' }, null] : [{ thinkingLevel: 'minimal' }, { thinkingLevel: 'low' }, null]
  if (v >= 2.5) return /pro/.test(model) ? [{ thinkingBudget: 128 }, null] : [{ thinkingBudget: 0 }, null]
  return [null]
}

// Một lần gọi tới MỘT model (stream). onFirst() khi có chữ đầu tiên; onText(text) mỗi lần có thêm chữ
function attemptModel({ model, key, system, user, json, temperature, onFirst, onText }) {
  const ctrl = new AbortController()
  const t0 = Date.now()
  const id = qid(key, model)
  const run = async () => {
    const opts = thinkingOptions(model)
    for (let tries = 0; tries < 4; tries++) {
      if (ctrl.signal.aborted) throw new Error('aborted')
      const think = opts[Math.min(st(model).think || 0, opts.length - 1)]
      usedLastMinute(id); (reqLog[id] ||= []).push(Date.now())
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}), ...(think ? { thinkingConfig: think } : {}) },
        }),
      })
      if (!res.ok) {
        const body = (await res.text()).slice(0, 3000)
        if (res.status === 400 && think && /think/i.test(body)) { st(model).think = (st(model).think || 0) + 1; saveStats(); continue }
        const err = new Error(`Gemini lỗi ${res.status} (${model}): ${body.slice(0, 140)}`)
        err.status = res.status
        if (res.status === 429) err.quota = parseQuotaError(body)
        if (res.status === 429 || res.status >= 500) noteBlock(key, model, res.status, body)
        if (res.status === 401 || res.status === 403 || (res.status === 400 && /api key|API_KEY/i.test(body))) err.fatal = true
        throw err
      }
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
              if (!got) { got = true; recordOk(model, Date.now() - t0); if (!onFirst(id)) { ctrl.abort(); throw new Error('aborted') } }
              onText(id, text)
            }
          } catch (e) { if (e.message === 'aborted') throw e }
        }
      }
      if (!text) throw new Error(`Model ${model} không trả lời.`)
      return text
    }
    throw new Error(`Model ${model} không nhận cấu hình.`)
  }
  return { model, id, abort: () => ctrl.abort(), promise: run().catch((e) => { throw ctrl.signal.aborted ? new Error('aborted') : e }) }
}

const secs = (ms) => (ms >= 3600000 ? `${Math.floor(ms / 3600000)} giờ ${Math.round((ms % 3600000) / 60000)} phút` : ms >= 60000 ? `${Math.round(ms / 60000)} phút` : `${Math.ceil(ms / 1000)} giây`)
function exhaustedMessage(pairs, errs) {
  const day = pairs.length && pairs.every((p) => blockedUntil(p.key, p.model)?.why === 'day')
  const wait = soonestFree(pairs)
  const head = day
    ? `Đã dùng hết lượt AI miễn phí của HÔM NAY (mọi model). Lượt mới có lại sau khoảng ${secs(nextPacificMidnight() - Date.now())}.`
    : wait < Infinity ? `AI đang hết lượt/quá tải tạm thời – thử lại sau khoảng ${secs(Math.max(wait, 1000))}.` : 'Chưa có model AI nào trả lời được.'
  return `${head} Cách khắc phục: thêm key Gemini dự phòng (tạo ở project Google khác) hoặc key OpenAI trong Cài đặt → AI.${errs.length ? ` (Chi tiết: ${errs.slice(0, 4).join('; ')})` : ''}`
}

// Gọi Gemini: chọn model nhanh nhất còn lượt, gửi dự phòng khi chậm, tự đợi khi chỉ hết lượt theo phút
function geminiStream({ system, user, json = false, onText, temperature = 0.5, maxMs = 60000, bg = false }) {
  const s = getState().settings
  return new Promise(async (resolve, reject) => {
    const pairs = await candidatePairs(s)
    const tried = new Set()
    const dead = new Set() // lỗi không phải do hết lượt/quá tải → không thử lại trong lần này
    const live = new Map()
    let winner = null, finished = false, lastErr = null, hedgeTimer = null, waitTimer = null
    const errs = []
    const t0 = Date.now()
    const end = (fn, v) => {
      if (finished) return
      finished = true
      clearTimeout(hedgeTimer); clearTimeout(deadline); clearTimeout(waitTimer)
      live.forEach((a) => a.abort())
      if (!bg && notice?.kind === 'wait') setNotice(null)
      fn(v)
    }
    const fail = () => { const e = new Error(exhaustedMessage(pairs, errs)); e.exhausted = true; end(reject, e) }
    const deadline = setTimeout(() => end(reject, lastErr && errs.length ? new Error(exhaustedMessage(pairs, errs)) : new Error(`AI không trả lời trong ${Math.round(maxMs / 1000)} giây.`)), maxMs)
    const next = () => pairs.find((p) => !tried.has(p.id) && !dead.has(p.id) && !live.has(p.id) && usable(p, bg))
    const launch = (isHedge = false) => {
      if (finished || winner) return
      const p = next()
      if (!p) {
        if (isHedge || live.size) return
        // Hết cặp dùng được ngay: nếu chỉ phải đợi ngắn (hết lượt theo phút) → tự đợi rồi thử lại
        const wait = soonestFree(pairs.filter((x) => !dead.has(x.id)))
        const left = maxMs - (Date.now() - t0) - 8000
        if (!bg && wait < Infinity && wait <= Math.min(left, 65000)) {
          setNotice({ kind: 'wait', until: Date.now() + wait, msg: 'AI hết lượt theo phút – đang tự đợi rồi gửi lại' })
          tried.clear()
          waitTimer = setTimeout(() => { if (notice?.kind === 'wait') setNotice(null); launch() }, Math.max(wait, 500))
          return
        }
        return fail()
      }
      tried.add(p.id)
      const a = attemptModel({
        model: p.model, key: p.key, system, user, json, temperature,
        onFirst: (id) => {
          if (winner && winner !== id) return false
          winner = id
          clearTimeout(hedgeTimer)
          live.forEach((x, k) => { if (k !== id) { x.abort(); live.delete(k); recordSlow(x.model, Date.now() - x.t0) } })
          return true
        },
        onText: (id, t) => { if (id === winner) onText?.(t) },
      })
      a.t0 = Date.now()
      live.set(p.id, a)
      a.promise.then(
        (text) => { if (p.id === winner) { lastUsedModel = p.model; end(resolve, text) } },
        (e) => {
          live.delete(p.id)
          if (finished || e.message === 'aborted') return
          if (e.fatal) return end(reject, new Error('Gemini: API key không hợp lệ hoặc chưa được bật.'))
          lastErr = e
          errs.push(`${p.model}: ${e.status === 404 ? 'không tồn tại với key này' : e.status === 429 ? (e.quota?.perDay ? 'hết lượt hôm nay' : 'hết lượt/phút') : e.status >= 500 ? 'Google đang quá tải' : String(e.message).slice(0, 60)}`)
          if (e.status !== 429) recordFail(p.model, e.status)
          if (!(e.status === 429 || e.status >= 500)) dead.add(p.id)
          if (p.id === winner) return end(reject, e) // đã đang viết mà đứt giữa chừng
          launch() // lỗi → thử ngay cặp khác
        }
      )
      // chưa có chữ sau HEDGE_MS → gửi thêm 1 model song song (chỉ yêu cầu chính, không phải nền)
      clearTimeout(hedgeTimer)
      if (!bg) hedgeTimer = setTimeout(() => { if (!winner && live.size < MAX_PARALLEL && Date.now() - t0 < maxMs) launch(true) }, HEDGE_MS)
    }
    launch()
  })
}

// Yêu cầu NỀN: chạy lần lượt từng cái (không tranh lượt với việc bạn đang làm)
let bgChain = Promise.resolve()
function runBg(fn) {
  const p = bgChain.then(fn, fn)
  bgChain = p.then(() => {}, () => {})
  return p
}

// Đo tốc độ từng model (Cài đặt)
export async function benchmarkModels(onRow) {
  const s = getState().settings
  const list = (await candidateModels(s)).slice(0, 6)
  const rows = []
  for (const model of list) {
    const t0 = Date.now()
    try {
      await new Promise((resolve, reject) => {
        const a = attemptModel({ model, key: s.geminiKey, system: 'Reply with one word.', user: 'Say OK', json: false, temperature: 0, onFirst: () => true, onText: () => {} })
        const to = setTimeout(() => { a.abort(); reject(new Error('quá 20 giây')) }, 20000)
        a.promise.then((v) => { clearTimeout(to); resolve(v) }, (e) => { clearTimeout(to); reject(e) })
      })
      rows.push({ model, ms: Date.now() - t0 })
    } catch (e) {
      if (e.status !== 429) recordFail(model, e.status)
      rows.push({ model, error: e.status === 429 ? (e.quota?.perDay ? 'hết lượt hôm nay' : 'hết lượt/phút – đợi chút') : String(e.message || e).slice(0, 80) })
    }
    onRow?.([...rows])
  }
  return rows
}

// Danh sách model Gemini dùng được với key này, ưu tiên bản "flash" mới nhất, ổn định (gồm cả bản lite – hạn mức riêng)
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
    return names.sort((a, b) => rank(a) - rank(b) || ver(b) - ver(a)).slice(0, all ? 30 : 8)
  } catch {
    return []
  }
}

async function openaiCall({ system, user, json, temperature }) {
  const s = getState().settings
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.openaiKey}` },
    signal: AbortSignal.timeout?.(60000),
    body: JSON.stringify({
      model: s.openaiModel || 'gpt-4o-mini',
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI lỗi ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return (await res.json()).choices?.[0]?.message?.content || ''
}

// Gọi AI chung: Gemini (nhiều key, nhiều model) → hết lượt thì OpenAI (nếu có key)
async function callAI({ system, user, json, temperature, onText, maxMs, bg }) {
  const s = getState().settings
  if (s.aiProvider === 'openai' && s.openaiKey) { const t = await openaiCall({ system, user, json, temperature }); onText?.(t); return t }
  if (s.aiProvider === 'gemini' && s.geminiKey) {
    const go = () => geminiStream({ system, user, json, onText, temperature, maxMs, bg })
    try {
      return await (bg ? runBg(go) : go())
    } catch (e) {
      if (!bg && s.openaiKey && !/aborted/.test(e.message)) {
        setNotice({ kind: 'info', msg: 'Gemini hết lượt/quá tải → đang dùng OpenAI dự phòng', until: Date.now() + 6000 })
        const t = await openaiCall({ system, user, json, temperature })
        onText?.(t)
        return t
      }
      throw e
    }
  }
  throw new Error('Chưa cấu hình API key trong Cài đặt')
}

// Văn bản tự do (có stream nếu dùng Gemini)
export function askText(system, user, onText, { maxMs = 60000, bg = false } = {}) {
  return callAI({ system, user, json: false, temperature: 0.3, onText, maxMs, bg })
}

export async function askJson(system, user, { maxMs = 60000, bg = false, temperature = 0.7, onText } = {}) {
  return extractJson(await callAI({ system, user, json: true, temperature, onText, maxMs, bg }))
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
  ,
    { maxMs: 30000 }
  )
}

// Module 3: sửa 3 lỗi diễn đạt tự nhiên nhất + từ bị bí
export function roleplayFeedback({ scenario, history, stuckWords }) {
  const convo = history.map((h, i) => `${h.who === 'ai' ? scenario.aiName : 'Learner'}: ${h.text}`).join('\n')
  const lines = history.filter((h) => h.who === 'me').map((h) => h.text)
  return askJson(
    `You are a strict but kind English speaking teacher (IELTS examiner standard). ${LEARNER} All explanations in Vietnamese, concrete: name the rule/collocation, why it is wrong or odd for a native speaker, and how to fix it. Return JSON only.`,
    `Roleplay: ${scenario.titleVi} (${scenario.setupEn})
Full conversation:
${convo}
Words the learner needed hints for: ${stuckWords.join(', ') || 'none'}

Review EVERY learner line below, in order (judge grammar, word choice, naturalness, register AND whether it replies appropriately to what ${scenario.aiName} just said):
${JSON.stringify(lines)}

Return JSON:
{"turns":[{"said":"learner line exactly","score":0-10,"verdict_vi":"1 câu: câu này trả lời đúng ý/đúng ngữ cảnh chưa, vấn đề lớn nhất","errors":[{"wrong":"exact words from the line","fix":"correction","type":"grammar|word|usage|unnatural|missing","why_vi":"giải thích ngắn gọn nhưng cụ thể"}],"fixed":"the learner's OWN sentence with ALL listed errors corrected — keep their idea and wording; never just copy it if errors exist","better":"how a native speaker would naturally say it here","why_vi":"vì sao cách nói 'better' hay hơn"}],
 "reactivate":[{"en":"useful chunk the learner lacked","vi":"nghĩa"}],
 "summary_vi":"2 câu: điểm mạnh + điều quan trọng nhất cần cải thiện"}`,
    { maxMs: 60000, temperature: 0.3 }
  ).then((r) => {
    ;(r.turns || []).forEach((t) => { if (t && (!t.fixed || sameText(t.fixed, t.said)) && t.errors?.length) t.fixed = applyErrorList(t.said || '', t.errors) })
    return r
  })
}

// Quy tắc chấm chung cho bài VIẾT/DỊCH: chấm theo Ý, không theo từ khoá; bản sửa phải sửa THẬT
const MEANING_RULES = `GRADING PRINCIPLES (very important):
- Judge whether the learner CONVEYS THE FULL MEANING, idea by idea — NOT whether they used particular keywords. Using the "right" keywords inside a wrong/unclear sentence earns nothing; a different wording that conveys the idea correctly is fully correct.
- Split the source into its separate ideas/facts (who, what, when, why, conditions, nuance). For each, decide: ok (fully and accurately conveyed), partial (vague, nuance lost, or ambiguous), wrong (says something different), missing.
- Be strict like an IELTS examiner. Do not praise generically.
- "fixed" = the learner's OWN text with EVERY error corrected (grammar, wrong word, collocation, article, tense, preposition, unclear meaning, missing idea added back) — keep their structure where it is correct. It must NOT simply copy the learner's text unless it is genuinely error-free.
- "native" = how a fluent native speaker would naturally write it — rewrite freely for clarity and naturalness; it must read clearly better than the learner's text.
- List EVERY real error in "errors" (up to 10), most serious first. Ignore pure capitalization/punctuation slips unless they change meaning.
- Explanations in Vietnamese, concrete: name the rule/collocation, why it is wrong or unnatural, and the correct form.`

const IDEA_SCHEMA = `"ideas": [{"idea_vi":"một ý trong bản gốc (tiếng Việt, ngắn)","status":"ok|partial|wrong|missing","learner":"phần người học viết cho ý này (copy nguyên văn, rỗng nếu thiếu)","note_vi":"vì sao chưa đạt / cần diễn đạt thế nào"}]`
const ERR_SCHEMA = `"errors": [{"wrong":"exact words copied from the learner's text","fix":"correction","type":"grammar|word|collocation|meaning|unnatural|missing","why_vi":"giải thích cụ thể"}]`

// Sửa câu theo danh sách lỗi (khi AI lười chép lại nguyên câu)
function applyErrorList(text, errors = []) {
  let out = text
  errors.forEach((e) => { if (e.wrong && e.fix && out.includes(e.wrong)) out = out.replace(e.wrong, e.fix) })
  return out
}
const sameText = (a, b) => String(a || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === String(b || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
function normalizeGrade(r, text) {
  r.errors = Array.isArray(r.errors) ? r.errors.filter((e) => e && (e.wrong || e.fix)) : []
  r.ideas = Array.isArray(r.ideas) ? r.ideas : []
  if ((!r.fixed || sameText(r.fixed, text)) && r.errors.length) r.fixed = applyErrorList(text, r.errors)
  if (r.ideas.length) {
    const w = { ok: 1, partial: 0.5, wrong: 0, missing: 0 }
    const cov = r.ideas.reduce((a, i) => a + (w[i.status] ?? 0), 0) / r.ideas.length
    r.coverage = Math.round(cov * 100)
    if (r.meaning_score == null) r.meaning_score = Math.round(cov * 10)
    // điểm tổng không được cao hơn mức truyền đạt ý cho phép
    if (r.score != null) r.score = Math.min(r.score, Math.round(cov * 10) + 1)
  }
  // tương thích giao diện cũ
  r.corrected = r.fixed
  return r
}

// Đọc/Viết: sửa nhật ký – chấm theo ý + sửa thật + bản tự nhiên
export async function gradeWriting({ promptEn, text, chunks }) {
  const r = await askJson(
    `You are a strict, expert English writing teacher for Vietnamese learners. ${LEARNER} ${MEANING_RULES} Return JSON only.`,
    `Task / prompt: ${promptEn}
Suggested chunks (optional, do NOT grade on whether they appear): ${chunks.join('; ')}
Learner text:
${text}

Return JSON:
{"score": 0-10, "task_score": 0-10, "grammar_score": 0-10, "natural_score": 0-10,
 "verdict_vi": "1-2 câu: bài viết có trả lời đúng đề không, người đọc hiểu thế nào, vấn đề lớn nhất",
 ${ERR_SCHEMA},
 "fixed": "the learner's full text with every error corrected",
 "native": "native-like rewrite of the whole text",
 "native_why_vi": "vì sao bản native hay hơn (2-3 điểm cụ thể)",
 "top_fixes": [{"from":"...","to":"...","why_vi":"..."}] (3 most important),
 "feedback_vi": "1-2 câu: điểm mạnh + việc cần làm nhất"}`,
    { maxMs: 60000, temperature: 0.3 }
  )
  return normalizeGrade(r, text)
}

// Module 2: chấm tóm tắt ý chính (nghe không phụ đề) – theo từng ý
export function gradeSummary({ transcript, summary, keyPoints = [] }) {
  return askJson(
    `You check listening comprehension. Judge by IDEAS understood, not by matching words; the summary may be in Vietnamese or English. Be strict: vague or wrong understanding is not "caught". Return JSON only.`,
    `Dialogue transcript:\n${transcript}\n${keyPoints.length ? `Main ideas to check (use exactly these as "ideas", in order): ${JSON.stringify(keyPoints)}\n` : ''}\nLearner's summary: "${summary}"
Return JSON: {"score": 0-10, ${IDEA_SCHEMA.replace('trong bản gốc', 'chính của đoạn hội thoại')}, "caught": ["main points the learner got right, in Vietnamese"], "missed": ["main points missed or misunderstood, in Vietnamese"], "feedback_vi": "1-2 câu tiếng Việt"}`,
    { maxMs: 45000, temperature: 0.3 }
  ).then((r) => normalizeGrade(r, summary))
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

// Chấm bản dịch Việt -> Anh: theo Ý cả đoạn + bản sửa theo ý bạn + bản tự nhiên
export async function gradeTranslation({ vi, reference, text }) {
  const r = await askJson(
    `You are a strict, expert Vietnamese→English translation teacher. ${LEARNER} ${MEANING_RULES} Return JSON only.`,
    `Vietnamese source:\n${vi}\n\nReference translation (only ONE possible answer — other wordings are fine if the meaning is right):\n${reference}\n\nLearner's translation:\n${text}

Return JSON:
{"meaning_score": 0-10 (how completely and accurately ALL ideas are conveyed), "grammar_score": 0-10, "natural_score": 0-10,
 "score": 0-10 (overall; meaning matters most),
 "verdict_vi": "1-2 câu: người đọc bản dịch sẽ hiểu đúng bao nhiêu phần ý gốc, vấn đề lớn nhất",
 ${IDEA_SCHEMA},
 ${ERR_SCHEMA},
 "fixed": "the learner's translation with every error corrected and missing ideas added, keeping their structure",
 "native": "how a fluent native speaker would translate the source",
 "native_why_vi": "vì sao bản native hay hơn (2-3 điểm cụ thể)",
 "feedback_vi": "1-2 câu: điểm mạnh + việc cần làm nhất lần sau"}`,
    { maxMs: 60000, temperature: 0.3 }
  )
  return normalizeGrade(r, text)
}

// Tra nhanh khi viết: tiếng Việt -> cách nói tiếng Anh tự nhiên
export function lookupPhrase({ phrase, context }) {
  return askJson(
    `You are a bilingual Vietnamese-English dictionary for spoken and academic English (lab/semiconductor + daily life). Return JSON only.`,
    `Vietnamese word/phrase: "${phrase}"\nContext (may be empty): "${(context || '').slice(0, 400)}"\nReturn JSON: {"options": [{"en": "natural English word/chunk", "note_vi": "khi nào dùng, sắc thái, ngắn gọn"}] (2-4 options, best for this context first), "example": "one example sentence in English using the best option", "example_vi": "dịch câu ví dụ"}`,
    { maxMs: 20000, temperature: 0.3 }
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
 "roleplay": {"aiName": "...", "aiRoleEn": "who the AI plays", "roleVi": "vai (tiếng Việt,
    { maxMs: 90000 }
  )", "setupEn": "scenario", "goalVi": "mục tiêu", "turns": [4 x {"ai": "AI line ending with something to respond to", "hint": ["2-3 keywords"], "model": "natural learner reply"}]}
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
  ,
    { maxMs: 90000 }
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
Rules: judge whether the sentence gets the whole IDEA across (not keyword matching). If you list any ERR line, FIXED must apply ALL those corrections — never just copy the learner's sentence. SCORE first. ERR lines ordered by importance (0-5 lines; write none if the sentence is truly fine). One CHUNK line per target chunk.
Scoring: 9-10 = grammatical, natural AND fully does the task. Chunks used incorrectly/unnaturally or a fragmented sentence → max 6. Task not achieved → max 5. Ignore punctuation/capitalization (speech recognition).`
  const user = `Situation (Vietnamese): ${situationVi}
Context: ${context}
Target chunks: ${chunks.join('; ')}
Reference answer: ${model}
Learner said: "${transcript}"`
  return askText(system, user, (t) => onPartial?.(parseReview(t)), { maxMs: 45000 }).then((t) => {
    const r = parseReview(t)
    if ((!r.corrected || sameText(r.corrected, transcript)) && r.errors.length) r.corrected = applyErrorList(transcript, r.errors)
    return r
  })
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
