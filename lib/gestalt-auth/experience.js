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

const CASE_STUDY_COLUMNS = `
  experience_id, intro, intro_pt, context, context_pt, problem, problem_pt,
  hypotheses, hypotheses_pt, solution, solution_pt, hero_image_url,
  context_image_url, problem_image_url, hypotheses_image_url, solution_image_url
`.replace(/\s+/g, ' ').trim()

/** The four narrative sections of a case study, in reading order. */
export const CASE_STUDY_SECTION_KEYS = ['context', 'problem', 'hypotheses', 'solution']

/** Split a rich-text field into trimmed paragraphs (blank-line separated). */
function splitParagraphs(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/**
 * Structured case study for a single experience, sourced from
 * `portfolio.experience_case_study` (1:1 with `experience`, public read).
 * Returns null when Supabase is unconfigured or no row exists — the detail
 * page still renders the role header without a case study.
 */
export async function fetchExperienceCaseStudy(experienceId) {
  if (!isSupabaseConfigured() || !experienceId) return null

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('experience_case_study')
    .select(CASE_STUDY_COLUMNS)
    .eq('experience_id', experienceId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ?? null
}

/**
 * Localize a raw case-study row into render-ready shape: an intro paragraph
 * (fixed right column) plus the four narrative sections, each fragmented into
 * paragraphs and carrying an optional image URL.
 */
export function localizeCaseStudy(row, locale = 'en') {
  if (!row) return null
  const usePt = locale === 'pt'
  const pick = (en, pt) => (usePt && pt) || en || ''

  const sections = CASE_STUDY_SECTION_KEYS.map((key) => ({
    key,
    paragraphs: splitParagraphs(pick(row[key], row[`${key}_pt`])),
    imageUrl: row[`${key}_image_url`] ?? null,
  }))

  return {
    experienceId: row.experience_id,
    intro: pick(row.intro, row.intro_pt),
    heroUrl: row.hero_image_url ?? null,
    sections,
    hasContent: sections.some((section) => section.paragraphs.length > 0),
  }
}
