import { loadStaticProject } from './projects-fallback.js'

/** Legacy /projects slugs → portfolio.projects.code */
export const PROJECT_CODE_ALIASES = {
  'deviante-suporte-decisao-manutencao': 'deviante',
}

export function resolveProjectCode(slug) {
  const normalized = String(slug ?? '').trim()
  return PROJECT_CODE_ALIASES[normalized] ?? normalized
}

function estimateReadMinutes(body = []) {
  const words = body.join(' ').split(/\s+/).filter(Boolean).length
  if (!words) return null
  return Math.max(4, Math.round(words / 200))
}

/** Map projects row (localized) to the PublicationDetail shape. */
export function mapProjectAsPublication(entry) {
  if (!entry) return null

  return {
    id: entry.id,
    slug: entry.id,
    productCode: entry.productCode ?? null,
    venue: 'scientific',
    platform: null,
    title: entry.title,
    excerpt: entry.excerpt ?? '',
    body: entry.body ?? [],
    status: entry.status,
    readMinutes: estimateReadMinutes(entry.body),
    externalUrl: entry.externalUrl ?? null,
    coverUrl: entry.coverUrl ?? null,
    publishedAt: entry.publishedAt ?? null,
    sortOrder: entry.sortOrder ?? 0,
    source: entry.source ?? 'db',
    detailKind: 'project',
  }
}

export function loadStaticProjectAsPublication(code, locale = 'en') {
  return mapProjectAsPublication(loadStaticProject(code, locale))
}
