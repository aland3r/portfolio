import { getSupabase, isSupabaseConfigured } from './supabase.js'

function isLocalDev() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

export const GESTALT_PRODUCTS = [
  {
    code: 'deviante',
    gestaltCode: 'DV',
    name: 'Deviante',
    lifecycle: 'developing',
    tagline: 'Industrial maintenance intelligence',
    description: 'Process mining and drift detection for preventive maintenance decisions.',
    port: 5173,
    subdomain: 'deviante.alander.io',
    dashboardPath: '/dashboard',
    live: true,
    icon: '/icons/deviante.svg',
    iconMask: 'ios',
  },
  {
    code: 'milebrick',
    gestaltCode: 'MB',
    name: 'Cosmopia',
    lifecycle: 'designing',
    tagline: 'Context-driven language learning',
    description: 'Vocabulary and guided practice built from real books, films, and series.',
    port: 5174,
    subdomain: 'cosmopia.alander.io',
    dashboardPath: '/dashboard',
    live: false,
    icon: '/icons/milebrick.svg',
    iconMask: 'android',
  },
]

export function getProductByCode(code) {
  return GESTALT_PRODUCTS.find((product) => product.code === code) ?? null
}

const APP_PRODUCT_COLUMNS = `
  code, name, tagline, description, subdomain, dashboard_path,
  icon_path, port, status, coming_soon, live, sort_order
`.replace(/\s+/g, ' ').trim()

/** Live `portfolio.products` row → the shape the hub renders (static entry fills the gaps). */
export function mapProductRow(row) {
  const base = getProductByCode(row.code) ?? {}
  return {
    ...base,
    code: row.code,
    name: row.name ?? base.name ?? row.code,
    lifecycle: row.status ?? base.lifecycle ?? null,
    tagline: row.tagline ?? base.tagline ?? null,
    description: row.description ?? base.description ?? null,
    subdomain: row.subdomain ?? base.subdomain ?? null,
    dashboardPath: row.dashboard_path ?? base.dashboardPath ?? '/dashboard',
    port: row.port ?? base.port ?? null,
    icon: row.icon_path ?? base.icon ?? null,
    live: row.live ?? base.live ?? false,
    comingSoon: row.coming_soon ?? base.comingSoon ?? false,
  }
}

/**
 * Products shown on the /apps hub — `show_in_apps = true` in Supabase
 * (public read via RLS `products_public_read`). Callers keep
 * `GESTALT_PRODUCTS` as the fallback so the hub never renders empty.
 */
export async function fetchAppProducts() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('products')
    .select(APP_PRODUCT_COLUMNS)
    .eq('show_in_apps', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapProductRow)
}

/** Whether a product entry (static or live row) is reachable in the current environment. */
export function isProductEntryLive(product) {
  if (!product || product.comingSoon) return false
  if (isLocalDev()) return true
  return product.live !== false
}

/** Whether the product app is reachable in the current environment. */
export function isProductLive(productCode) {
  return isProductEntryLive(getProductByCode(productCode))
}

function productOrigin(product) {
  if (isLocalDev()) {
    return `http://localhost:${product.port}`
  }
  const host = product.stagingHost ?? product.subdomain
  return `https://${host}`
}

/** Entry to sign in and use the app (login on product host). */
export function getProductTryUrl(productCode) {
  const product = getProductByCode(productCode)
  if (!product) return 'https://alander.io/apps'
  return `${productOrigin(product)}/login`
}

/** Related projects on the portfolio hub (public). */
export function getProductArticlesUrl(productCode) {
  const product = getProductByCode(productCode)
  const origin = getPortfolioOrigin()
  if (!product) return `${origin}/projects`
  return `${origin}/projects?product=${encodeURIComponent(productCode)}`
}

/** Public landing page for the product (root of its host) — no session required. */
export function getProductLandingUrl(productOrCode) {
  const product = typeof productOrCode === 'string'
    ? getProductByCode(productOrCode)
    : productOrCode
  const host = product?.subdomain
  if (!host) return 'https://alander.io/apps'
  return `https://${host}/`
}

/** Direct link to the app dashboard — requires session + access on product host. */
export function getProductAppUrl(productCode) {
  const product = getProductByCode(productCode)
  if (!product) return 'https://alander.io/apps'
  return `${productOrigin(product)}${product.dashboardPath}`
}

export function getPortfolioOrigin() {
  if (isLocalDev()) {
    return 'http://localhost:3000'
  }
  return 'https://alander.io'
}

export function getAuthCallbackUrl(origin) {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://alander.io')
  return `${base}/auth/callback`
}

export function isOAuthReturn() {
  if (typeof window === 'undefined') return false
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return search.has('code') || search.has('error') || hash.has('access_token')
}
