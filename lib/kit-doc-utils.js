/**
 * Kit CMS helpers — placeholders, section slots, cross-doc relations.
 * Runtime bodies live in portfolio.kit_docs; authoring remains gestalt-kit/.
 */

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_-]+)(?:\s*\|\s*([^}]*))?\s*\}\}/g

const REF_PATTERNS = [
  { kind: 'skill', re: /(?:gestalt-kit\/)?skills\/([a-z0-9_-]+)/gi },
  { kind: 'command', re: /(?:gestalt-kit\/)?skills\/([a-z0-9_-]+)/gi },
  { kind: 'agent', re: /(?:gestalt-kit\/)?agents\/([a-z0-9_-]+)/gi },
  { kind: 'partial', re: /(?:gestalt-kit\/)?partials\/([a-z0-9_-]+)/gi },
]

export function docKey(kind, slug) {
  return `${kind}:${slug}`
}

/** List index URL — filters stay as query params. */
export function kitListHref({ kind = 'all', q = '' } = {}) {
  const params = new URLSearchParams()
  if (kind && kind !== 'all') params.set('kind', kind)
  if (q?.trim()) params.set('q', q.trim())
  const query = params.toString()
  return query ? `/kit?${query}` : '/kit'
}

/** Full-page doc URL — `/kit/{kind}/{slug}` (+ optional edit/q). */
export function kitDocHref({ kind, slug, edit = false, q = '' } = {}) {
  if (!kind || !slug) return kitListHref({ q })
  const base = `/kit/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}`
  const params = new URLSearchParams()
  if (edit) params.set('edit', '1')
  if (q?.trim()) params.set('q', q.trim())
  const query = params.toString()
  return query ? `${base}?${query}` : base
}

/** Unique {{key}} / {{key|default}} entries in template order. */
export function listPlaceholders(template) {
  if (!template) return []
  const seen = new Set()
  const out = []
  const re = new RegExp(PLACEHOLDER_RE.source, 'g')
  let match
  while ((match = re.exec(template)) !== null) {
    const key = match[1]
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      key,
      defaultValue: (match[2] ?? '').trim(),
    })
  }
  return out
}

export function applyPlaceholders(template, values = {}) {
  if (!template) return ''
  return template.replace(PLACEHOLDER_RE, (_, key, fallback = '') => {
    const raw = values[key]
    if (raw != null && String(raw).length > 0) return String(raw)
    return String(fallback ?? '').trim()
  })
}

/**
 * Split markdown into fixed heading structure + editable content slots.
 * Used when the body has no {{placeholders}}.
 */
export function parseSectionSlots(markdown) {
  const text = markdown ?? ''
  const headingRe = /^(#{1,3}\s+.+)$/gm
  const headings = []
  let match
  while ((match = headingRe.exec(text)) !== null) {
    headings.push({ index: match.index, heading: match[1], length: match[0].length })
  }

  if (headings.length === 0) {
    return [
      {
        id: 'body',
        label: 'Body',
        heading: null,
        content: text,
      },
    ]
  }

  const slots = []
  const preamble = text.slice(0, headings[0].index)
  if (preamble.trim()) {
    slots.push({
      id: 'preamble',
      label: 'Intro',
      heading: null,
      content: preamble.replace(/\n$/, ''),
    })
  }

  headings.forEach((h, i) => {
    const contentStart = h.index + h.length
    const contentEnd = i + 1 < headings.length ? headings[i + 1].index : text.length
    const content = text.slice(contentStart, contentEnd).replace(/^\n/, '').replace(/\n$/, '')
    const label = h.heading.replace(/^#+\s+/, '').trim()
    slots.push({
      id: `h-${i}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
      label,
      heading: h.heading,
      content,
    })
  })

  return slots
}

export function assembleSectionSlots(slots) {
  return slots
    .map((slot) => {
      if (slot.heading) {
        const body = slot.content?.trim() ? `\n${slot.content.replace(/^\n/, '')}` : ''
        return `${slot.heading}${body}`
      }
      return slot.content ?? ''
    })
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function addRef(bucket, kind, slug) {
  const clean = String(slug || '')
    .replace(/\.md$/i, '')
    .replace(/\/SKILL$/i, '')
    .replace(/\/reference$/i, '')
    .trim()
  if (!clean) return
  if (!bucket[kind]) bucket[kind] = new Set()
  bucket[kind].add(clean)
}

/** Outgoing refs from one doc (metadata.skills + path mentions in body/summary). */
export function extractOutgoingRefs(doc) {
  const bucket = { agent: new Set(), skill: new Set(), command: new Set(), partial: new Set() }
  const metaSkills = doc.metadata?.skills
  if (Array.isArray(metaSkills)) {
    metaSkills.forEach((s) => addRef(bucket, 'skill', s))
  } else if (typeof metaSkills === 'string' && metaSkills.trim()) {
    metaSkills.split(/[,\s]+/).forEach((s) => addRef(bucket, 'skill', s))
  }

  const blob = `${doc.summary || ''}\n${doc.bodyMd || ''}\n${doc.sourcePath || ''}`
  for (const { kind, re } of REF_PATTERNS) {
    const local = new RegExp(re.source, 'gi')
    let m
    while ((m = local.exec(blob)) !== null) {
      addRef(bucket, kind, m[1])
    }
  }

  // Drop self-refs
  if (bucket[doc.kind]) bucket[doc.kind].delete(doc.slug)

  return {
    agent: [...bucket.agent],
    skill: [...bucket.skill],
    command: [...bucket.command],
    partial: [...bucket.partial],
  }
}

/**
 * Bidirectional relation index keyed by kind:slug.
 * incoming[key] = docs that reference this doc.
 */
export function buildRelationIndex(docs) {
  const byKey = new Map(docs.map((d) => [docKey(d.kind, d.slug), d]))
  const skillOrCommand = new Map()
  for (const d of docs) {
    if (d.kind === 'skill' || d.kind === 'command') skillOrCommand.set(d.slug, d)
  }

  const outgoing = new Map()
  const incoming = new Map()

  function ensureIncoming(key) {
    if (!incoming.has(key)) {
      incoming.set(key, { agent: [], skill: [], command: [], partial: [], architecture: [] })
    }
    return incoming.get(key)
  }

  for (const doc of docs) {
    const key = docKey(doc.kind, doc.slug)
    const raw = extractOutgoingRefs(doc)
    const resolved = { agent: [], skill: [], command: [], partial: [] }

    for (const kind of ['agent', 'skill', 'command', 'partial']) {
      for (const slug of raw[kind]) {
        let target = byKey.get(docKey(kind, slug))
        if (!target && (kind === 'skill' || kind === 'command')) {
          target = skillOrCommand.get(slug) ?? null
        }
        if (!target || target.id === doc.id) continue
        if (!resolved[target.kind]?.some((d) => d.id === target.id)) {
          resolved[target.kind]?.push(target)
        }
        const inc = ensureIncoming(docKey(target.kind, target.slug))
        if (!inc[doc.kind].some((d) => d.id === doc.id)) {
          inc[doc.kind].push(doc)
        }
      }
    }

    outgoing.set(key, resolved)
    ensureIncoming(key)
  }

  return { byKey, outgoing, incoming }
}

export function resolveDocMarkdown(doc, placeholderValues) {
  const values = placeholderValues
    ?? doc.metadata?.placeholders
    ?? {}
  const keys = listPlaceholders(doc.bodyMd)
  if (keys.length > 0) return applyPlaceholders(doc.bodyMd, values)
  return doc.bodyMd ?? ''
}
