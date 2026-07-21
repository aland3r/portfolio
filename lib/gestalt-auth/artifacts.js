import { getSupabase, isSupabaseConfigured } from './supabase.js'

const DEFAULT_DOCS_REPO = 'https://github.com/aland3r/portfolio/blob/main'

function docsRepoBase() {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GESTALT_DOCS_REPO) {
    return process.env.NEXT_PUBLIC_GESTALT_DOCS_REPO.replace(/\/$/, '')
  }
  return DEFAULT_DOCS_REPO
}

/** Resolve a public href from artifact source fields. */
export function resolveArtifactHref(artifact) {
  if (!artifact?.source_ref) return null

  if (artifact.source_kind === 'url') {
    return artifact.source_ref
  }

  if (artifact.source_kind === 'storage') {
    return artifact.storage_path ?? null
  }

  const path = artifact.source_ref.replace(/^\//, '')
  return `${docsRepoBase()}/${path}`
}

export function mapArtifactRow(row) {
  return {
    id: row.id,
    productCode: row.product_code,
    type: row.artifact_type,
    code: row.code,
    title: row.title,
    summary: row.summary,
    href: resolveArtifactHref(row),
    isPublic: row.is_public,
    sortOrder: row.sort_order,
    metadata: row.metadata ?? {},
  }
}

export async function fetchPublicArtifacts() {
  if (!isSupabaseConfigured()) return null

  const supabase = getSupabase()
  const { data, error } = await supabase
    .schema('portfolio')
    .from('artifacts')
    .select('id, product_code, artifact_type, code, title, summary, source_kind, source_ref, storage_path, is_public, sort_order, metadata')
    .eq('is_public', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapArtifactRow)
}

export async function fetchArtifactsByProduct(productCode, { publicOnly = false } = {}) {
  if (!isSupabaseConfigured()) return null

  let query = getSupabase()
    .schema('portfolio')
    .from('artifacts')
    .select('id, product_code, artifact_type, code, title, summary, source_kind, source_ref, storage_path, is_public, sort_order, metadata')
    .eq('product_code', productCode)
    .order('sort_order', { ascending: true })

  if (publicOnly) {
    query = query.eq('is_public', true)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapArtifactRow)
}

export async function fetchAllArtifacts() {
  if (!isSupabaseConfigured()) return null

  const supabase = getSupabase()
  const { data, error } = await supabase
    .schema('portfolio')
    .from('artifacts')
    .select('id, product_code, artifact_type, code, title, summary, source_kind, source_ref, storage_path, is_public, sort_order, metadata')
    .order('product_code', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapArtifactRow)
}
