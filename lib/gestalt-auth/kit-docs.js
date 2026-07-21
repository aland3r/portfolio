/**
 * Portfolio kit CMS — agents / skills / partials / architecture
 * Runtime SoT for the site report; authoring SoT remains gestalt-kit/.
 */
import { getSupabase } from './supabase.js'

export const KIT_KINDS = ['agent', 'skill', 'command', 'partial', 'architecture']

export function mapKitDocRow(row) {
  if (!row) return null
  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? '',
    bodyMd: row.body_md ?? '',
    sourcePath: row.source_path ?? '',
    sortOrder: row.sort_order ?? 0,
    status: row.status,
    visibility: row.visibility,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function kitTable() {
  return getSupabase().schema('portfolio').from('kit_docs')
}

export async function fetchKitDocs({ kind = null, publicOnly = false } = {}) {
  let q = kitTable().select('*').order('sort_order', { ascending: true }).order('slug')
  if (kind) q = q.eq('kind', kind)
  if (publicOnly) {
    q = q.eq('visibility', 'public').in('status', ['ready', 'shipped'])
  }
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(mapKitDocRow)
}

export async function fetchKitDoc(kind, slug, { publicOnly = false } = {}) {
  let q = kitTable().select('*').eq('kind', kind).eq('slug', slug).maybeSingle()
  const { data, error } = await q
  if (error) throw error
  const doc = mapKitDocRow(data)
  if (!doc) return null
  if (publicOnly && !(doc.visibility === 'public' && ['ready', 'shipped'].includes(doc.status))) {
    return null
  }
  return doc
}

export async function updateKitDoc(id, input) {
  const payload = {
    updated_at: new Date().toISOString(),
  }
  if (input.title != null) payload.title = input.title
  if (input.summary != null) payload.summary = input.summary
  if (input.bodyMd != null) payload.body_md = input.bodyMd
  if (input.status != null) payload.status = input.status
  if (input.visibility != null) payload.visibility = input.visibility
  if (input.sortOrder != null) payload.sort_order = input.sortOrder
  if (input.metadata != null) payload.metadata = input.metadata

  const { data, error } = await kitTable().update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return mapKitDocRow(data)
}
