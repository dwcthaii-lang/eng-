// Sửa ngữ pháp/chính tả miễn phí qua LanguageTool (không cần API key).
// Văn bản được gửi tới api.languagetool.org để kiểm tra.
export async function checkGrammar(text) {
  const body = new URLSearchParams({ text, language: 'en-US', level: 'picky' })
  const res = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`LanguageTool lỗi ${res.status}`)
  const data = await res.json()
  return (data.matches || []).map((m) => ({
    offset: m.offset,
    length: m.length,
    wrong: text.substr(m.offset, m.length),
    message: m.message,
    replacements: (m.replacements || []).slice(0, 3).map((r) => r.value),
    type: m.rule?.issueType || 'grammar',
  }))
}

// Áp dụng gợi ý đầu tiên của mọi lỗi để có bản đã sửa
export function applyFixes(text, matches) {
  let out = text
  ;[...matches].sort((a, b) => b.offset - a.offset).forEach((m) => {
    if (m.replacements[0] != null) out = out.slice(0, m.offset) + m.replacements[0] + out.slice(m.offset + m.length)
  })
  return out
}
