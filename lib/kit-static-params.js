/**
 * Build-time params for `/kit/[kind]/[slug]` (static export / GitHub Pages).
 * Prefers live Supabase when NEXT_PUBLIC_* env is present (CI deploy).
 */
import { createClient } from '@supabase/supabase-js'

export async function loadKitStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    console.warn('[kit] generateStaticParams: missing Supabase public env — no detail paths')
    return []
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .schema('portfolio')
    .from('kit_docs')
    .select('kind,slug')
    .order('kind')
    .order('slug')

  if (error) {
    console.warn('[kit] generateStaticParams failed:', error.message)
    return []
  }

  return (data ?? [])
    .filter((row) => row?.kind && row?.slug)
    .map((row) => ({ kind: String(row.kind), slug: String(row.slug) }))
}
