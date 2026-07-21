/** Strip vault noise accidentally stored in description fields. */
export function cleanDescriptionText(text) {
  if (!text) return ''
  let value = text.trim()
  const tableStart = value.search(/\n\s*\|/)
  if (tableStart >= 0) value = value.slice(0, tableStart)
  const headingStart = value.search(/\n###\s/)
  if (headingStart >= 0) value = value.slice(0, headingStart)
  return value
    .replace(/\[\[[^\]]+\]\]\s*/g, '')
    .replace(/^>\s*\[!NOTE\]\s*Description\s*\n?/im, '')
    .replace(/^>\s*\[!NOTE\][^\n]*\n?/gim, '')
    .replace(/^>\s?/gm, '')
    .trim()
}

/** Merge why/what/bounds into one readable paragraph (labels stay in the editor only). */
export function composeDescriptionParagraph(why, what, bounds, summary) {
  const parts = [
    cleanDescriptionText(why),
    cleanDescriptionText(what || summary),
    cleanDescriptionText(bounds),
  ].filter(Boolean)
  return parts.join(' ')
}

/** Minimal inline markdown: **bold** and `code` only. */
export function renderProseInline(text) {
  if (!text) return null
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }
    return part
  })
}
