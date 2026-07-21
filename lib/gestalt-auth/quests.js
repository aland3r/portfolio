import { getSupabase, isSupabaseConfigured } from './supabase.js'

const QUEST_COLUMNS = `
  product_code, phase_id, phase_codename, phase_label, phase_sort_order,
  quest_id, uc_number, label, status, sort_order
`.replace(/\s+/g, ' ').trim()

/** All quests, every product — public read (RLS: quests_public_read USING (true)). */
export async function fetchAllQuests() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('quests')
    .select(QUEST_COLUMNS)
    .order('product_code', { ascending: true })
    .order('phase_sort_order', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Product name + lifecycle (`status`) + metadata (v1 gate), used to label roadmap phases. */
export async function fetchProductsMeta() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('products')
    .select('code, name, status, metadata')

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Persistent Gestalt version (trigger-maintained in portfolio.gestalt_version)
 * — gradual 0.xx toward 1.0, never computed client-side. Returns null if the
 * row is missing (table not migrated yet) so callers can fall back.
 */
export async function fetchGestaltVersion() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('gestalt_version')
    .select('version, done_quests, total_quests, approved')
    .eq('id', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ?? null
}
