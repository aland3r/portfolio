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

/**
 * One readable description paragraph. Prefers the single `description` field;
 * falls back to merging the legacy why/what/bounds trio (still written by the
 * vault sync) so older rows keep rendering.
 */
export function composeDescriptionParagraph(why, what, bounds, summary, description) {
  const single = cleanDescriptionText(description)
  if (single) return single

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
