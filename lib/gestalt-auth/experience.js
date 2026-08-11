import { getSupabase, isSupabaseConfigured } from './supabase.js'

const EXPERIENCE_COLUMNS = `
  id, title, title_pt, org, org_handle, description, description_pt,
  location, employment_type, start_date, end_date, is_current, featured,
  href, card_span, show_on_page, sort_order
`.replace(/\s+/g, ' ').trim()

/**
 * Work-experience entries for the /work gallery — one row per role, sourced
 * from `portfolio.experience` (public read via RLS). Visible copy is bilingual
 * on the same row (`title`/`title_pt`, `description`/`description_pt`); callers
 * pick the locale column and fall back to the English base.
 *
 * Returns null when Supabase is not configured so the caller can use its own
 * static fallback (the gallery must never render empty).
 */
export async function fetchExperiences() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('experience')
    .select(EXPERIENCE_COLUMNS)
    .eq('show_on_page', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Pick the locale-specific copy for a visible field, falling back to English. */
export function localizeExperience(entry, locale = 'en') {
  return {
    ...entry,
    title: (locale === 'pt' && entry.title_pt) || entry.title,
    description: (locale === 'pt' && entry.description_pt) || entry.description,
  }
}
