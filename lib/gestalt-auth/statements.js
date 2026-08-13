import { getSupabase, isSupabaseConfigured } from './supabase.js'

const KINDS = ['vision', 'mission', 'value']

/**
 * Owner brand statements for the portfolio home.
 *
 * Model B: `portfolio.statements` is the single source of truth, keyed by
 * (brand, kind, lang) — language is data, so this scales past en/pt without
 * schema changes. The owner's brand is linked to `portfolio.human` via
 * `brands.human_id`; there is no declared FK from statements.brand_id to
 * brands, so we resolve the human row, then its brand, then read the final
 * statements for the requested language.
 *
 * @returns {Promise<{vision: string|null, mission: string|null, values: string[]} | null>}
 *   Grouped statements, or null when Supabase isn't configured.
 */
export async function fetchHumanStatements(lang = 'en') {
  if (!isSupabaseConfigured()) return null
  const db = getSupabase().schema('portfolio')

  const { data: human, error: humanError } = await db
    .from('human')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (humanError) throw new Error(humanError.message)
  if (!human) return { vision: null, mission: null, values: [] }

  const { data: brand, error: brandError } = await db
    .from('brands')
    .select('id')
    .eq('human_id', human.id)
    .maybeSingle()
  if (brandError) throw new Error(brandError.message)
  if (!brand) return { vision: null, mission: null, values: [] }

  const { data, error } = await db
    .from('statements')
    .select('kind, content, sort_order')
    .eq('brand_id', brand.id)
    .eq('status', 'active')
    .eq('lang', lang)
    .in('kind', KINDS)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)

  const rows = data ?? []
  return {
    vision: rows.find((row) => row.kind === 'vision')?.content ?? null,
    mission: rows.find((row) => row.kind === 'mission')?.content ?? null,
    values: rows.filter((row) => row.kind === 'value').map((row) => row.content),
  }
}
