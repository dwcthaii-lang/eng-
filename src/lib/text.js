// Xử lý văn bản: chuẩn hoá, so khớp cụm từ, chấm điểm cục bộ, đọc markup hội thoại

const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "it's": 'it is',
  "that's": 'that is', "there's": 'there is', "what's": 'what is', "don't": 'do not', "doesn't": 'does not',
  "didn't": 'did not', "can't": 'can not', "cannot": 'can not', "won't": 'will not', "isn't": 'is not',
  "aren't": 'are not', "wasn't": 'was not', "i'll": 'i will', "we'll": 'we will', "you'll": 'you will',
  "i've": 'i have', "we've": 'we have', "i'd": 'i would', "let's": 'let us', "haven't": 'have not',
  "shouldn't": 'should not', "couldn't": 'could not', "wouldn't": 'would not', "he's": 'he is', "she's": 'she is',
  gonna: 'going to', wanna: 'want to', gotta: 'got to', hafta: 'have to', kinda: 'kind of', lemme: 'let me',
  gimme: 'give me', dunno: 'do not know', outta: 'out of', lotta: 'lot of', ya: 'you', "'cause": 'because', cuz: 'because',
}

export function normalize(str = '') {
  let s = String(str).toLowerCase().replace(/[’‘`]/g, "'")
  s = s.replace(/[^a-z0-9'\s-]/g, ' ').replace(/-/g, ' ')
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => CONTRACTIONS[w] || w)
    .join(' ')
    .replace(/'/g, '')
    .split(/\s+/)
    .filter(Boolean)
}

const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'is', 'are', 'my', 'your', 'our', 'it', 'this', 'that', 'be', 'some', 'sb', 'sth', 'someone', 'something', 'one', 'ones'])

// Đơn giản hoá đuôi từ để "booked" ~ "book", "running" ~ "run"
export function stem(w) {
  return w.replace(/(ing|ed|es|s)$/,'').replace(/(.)\1$/, '$1')
}

// Cụm từ có xuất hiện trong câu nói không? (cho phép thiếu từ phụ, so theo gốc từ)
export function chunkUsed(chunk, transcript) {
  const alts = String(chunk).split('/').map((x) => x.trim()).filter(Boolean)
  const said = normalize(transcript).map(stem)
  const saidSet = new Set(said)
  return alts.some((alt) => {
    const all = normalize(alt.replace(/\(.*?\)/g, ''))
    let words = all.filter((w) => !STOP.has(w)).map(stem)
    if (!words.length) words = all.map(stem) // cụm chỉ gồm từ ngắn như "is", "be" (ngữ pháp)
    if (!words.length) return false
    const hit = words.filter((w) => saidSet.has(w)).length
    return hit / words.length >= (words.length >= 3 ? 0.75 : 1)
  })
}

// Độ tương đồng theo từ (LCS) giữa 2 câu, 0..1
export function similarity(a, b) {
  const x = normalize(a), y = normalize(b)
  if (!x.length || !y.length) return 0
  const dp = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0))
  for (let i = 1; i <= x.length; i++)
    for (let j = 1; j <= y.length; j++)
      dp[i][j] = x[i - 1] === y[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  return (2 * dp[x.length][y.length]) / (x.length + y.length)
}

export function sameAnswer(input, accepted) {
  const n = normalize(input).join(' ')
  return accepted.some((a) => normalize(a).join(' ') === n)
}

// Chấm cục bộ cho câu nói ở Module 1/3
export function localScore({ transcript, chunks = [], model = '' }) {
  const words = normalize(transcript)
  const used = chunks.filter((c) => chunkUsed(c, transcript))
  const chunkRatio = chunks.length ? used.length / chunks.length : 1
  const lengthOk = words.length >= 5
  const sim = model ? similarity(transcript, model) : 0
  const score = Math.round(Math.min(10, chunkRatio * 7 + (lengthOk ? 2 : 0) + sim * 2))
  return { score, used, missing: chunks.filter((c) => !used.includes(c)), words: words.length, sim }
}

// ---- Markup hội thoại ----
// [[nói|chấp nhận1,chấp nhận2|giải thích]]  -> chỗ trống nối âm/nuốt âm
// *từ*                                         -> trọng âm câu
export function parseLine(text) {
  const parts = []
  const re = /\[\[(.+?)\|(.*?)\|(.+?)\]\]/g
  let last = 0, m
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ type: 'text', text: text.slice(last, m.index) })
    parts.push({ type: 'gap', text: m[1], accept: [m[1], ...m[2].split(',').map((x) => x.trim()).filter(Boolean)], rule: m[3] })
    last = re.lastIndex
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) })
  return parts
}

export function plainLine(text) {
  return text.replace(/\[\[(.+?)\|.*?\|.+?\]\]/g, '$1').replace(/\*/g, '')
}

// Ngữ điệu: câu hỏi Yes/No thường lên giọng ↗, còn lại xuống giọng ↘
export function intonation(text) {
  const t = plainLine(text).trim()
  if (!t.endsWith('?')) return '↘'
  const last = t.split(/[.!]\s/).pop().trim().toLowerCase()
  return /^(what|where|when|why|how|who|which|whose)\b/.test(last) ? '↘' : '↗'
}
