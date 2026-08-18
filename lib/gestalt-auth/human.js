import { getSupabase, isSupabaseConfigured } from './supabase.js'

/** `portfolio.human` row → the shape the site renders. */
export function mapHumanRow(row) {
  return {
    id: row.id,
    name: row.name ?? null,
    roleTitle: row.role_title ?? null,
    roleTitlePt: row.role_title_pt ?? null,
    phoneNumber: row.phone_number ?? null,
    email: row.email ?? null,
  }
}

/** Pick the locale-specific role title, falling back to English. */
export function localizeRoleTitle(human, locale = 'en') {
  if (!human) return null
  if (locale === 'pt' && human.roleTitlePt) return human.roleTitlePt
  return human.roleTitle
}

/**
 * The single identity row (name, role, contact). Content lives only in
 * `portfolio.human` — see gestalt-kit/partials/portfolio-content-governance.md.
 * Public read via RLS `human_public_read`. Returns `null` when Supabase is
 * unconfigured or the table is empty; callers render nothing rather than
 * hardcoding a fallback.
 */
export async function fetchHuman() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('human')
    .select('id, name, role_title, role_title_pt, phone_number, email')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapHumanRow(data) : null
}
