import { getSupabase, isSupabaseConfigured } from './supabase.js'

const PUBLICATION_COLUMNS = `
  id, slug, product_code, venue, platform, title, excerpt, body,
  status, read_minutes, external_url, published_at, sort_order, updated_at
`.replace(/\s+/g, ' ').trim()

export function pickLocaleField(map, locale, fallbackLocale = 'en') {
  if (!map || typeof map !== 'object') return ''
  return map[locale] ?? map[fallbackLocale] ?? Object.values(map)[0] ?? ''
}

export function normalizePublicationBody(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()]
  return []
}

export function mapPublicationRow(row, locale = 'en') {
  const bodyRaw = pickLocaleField(row.body, locale)
  return {
    id: row.slug,
    slug: row.slug,
    productCode: row.product_code ?? null,
    venue: row.venue,
    platform: row.platform ?? null,
    title: pickLocaleField(row.title, locale),
    excerpt: pickLocaleField(row.excerpt, locale),
    body: normalizePublicationBody(bodyRaw),
    status: row.status,
    readMinutes: row.read_minutes ?? null,
    externalUrl: row.external_url ?? null,
    publishedAt: row.published_at ?? null,
    sortOrder: row.sort_order ?? 0,
    source: 'db',
  }
}

function buildPublicationQuery() {
  return getSupabase()
    .schema('portfolio')
    .from('publications')
    .select(PUBLICATION_COLUMNS)
    .order('sort_order', { ascending: true })
}

export async function fetchPublicPublications({ productCode } = {}) {
  if (!isSupabaseConfigured()) return null

  let query = buildPublicationQuery()
  if (productCode) query = query.eq('product_code', productCode)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchPublicationBySlug(slug) {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await buildPublicationQuery().eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  return data ?? null
}

export async function fetchPublicationsCatalog(locale = 'en', { productCode } = {}) {
  const rows = await fetchPublicPublications({ productCode })
  if (!rows) return null
  return rows.map((row) => mapPublicationRow(row, locale))
}

export async function fetchPublicationDetail(slug, locale = 'en') {
  const row = await fetchPublicationBySlug(slug)
  if (!row) return null
  return mapPublicationRow(row, locale)
}
