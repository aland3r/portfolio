import { getSupabase, isSupabaseConfigured } from './supabase.js'

const PROJECT_COLUMNS = `
  id, code, product_code, title, title_pt, summary, summary_pt,
  body, body_pt, cover_url, external_url, status, sort_order, updated_at
`.replace(/\s+/g, ' ').trim()

function splitBody(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export function localizeProject(row, locale = 'en') {
  const usePt = locale === 'pt'
  return {
    id: row.code,
    code: row.code,
    productCode: row.product_code ?? null,
    title: (usePt && row.title_pt) || row.title,
    excerpt: (usePt && row.summary_pt) || row.summary || '',
    body: splitBody((usePt && row.body_pt) || row.body || ''),
    coverUrl: row.cover_url ?? null,
    externalUrl: row.external_url ?? null,
    status: row.status,
    sortOrder: row.sort_order ?? 0,
    source: 'db',
  }
}

function buildProjectQuery() {
  return getSupabase()
    .schema('portfolio')
    .from('projects')
    .select(PROJECT_COLUMNS)
    .order('sort_order', { ascending: true })
}

export async function fetchProjects({ productCode } = {}) {
  if (!isSupabaseConfigured()) return null

  let query = buildProjectQuery()
  if (productCode) query = query.eq('product_code', productCode)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchProjectByCode(code) {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await buildProjectQuery().eq('code', code).maybeSingle()
  if (error) throw new Error(error.message)
  return data ?? null
}

export async function fetchProjectsCatalog(locale = 'en', { productCode } = {}) {
  const rows = await fetchProjects({ productCode })
  if (!rows) return null
  return rows.map((row) => localizeProject(row, locale))
}

export async function fetchProjectDetail(code, locale = 'en') {
  const row = await fetchProjectByCode(code)
  if (!row) return null
  return localizeProject(row, locale)
}
