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
    landingPath: '/',
    dashboardPath: '/dashboard',
    live: true,
    icon: '/icons/deviante.svg',
    iconMask: 'ios',
  },
  {
    code: 'milebrick',
    gestaltCode: 'MB',
    name: 'Milebrick',
    lifecycle: 'designing',
    tagline: 'Context-driven language learning',
    description: 'Vocabulary and guided practice built from real books, films, and series.',
    port: 5174,
    subdomain: 'milebrick.alander.io',
    landingPath: '/',
    dashboardPath: '/dashboard',
    live: false,
    icon: '/icons/milebrick.svg',
    iconMask: 'android',
  },
  {
    code: 'harpia',
    gestaltCode: 'HA',
    name: 'Harpia',
    lifecycle: 'designing',
    tagline: 'Coming soon',
    description: 'Reserved product — access by invitation.',
    port: 5175,
    subdomain: 'harpia.alander.io',
    landingPath: '/',
    dashboardPath: '/dashboard',
    comingSoon: true,
    icon: null,
    iconMask: 'ios',
  },
]

export function getProductByCode(code) {
  return GESTALT_PRODUCTS.find((product) => product.code === code) ?? null
}

/** Whether the product app is reachable in the current environment. */
export function isProductLive(productCode) {
  const product = getProductByCode(productCode)
  if (!product || product.comingSoon) return false
  if (isLocalDev()) return true
  return product.live !== false
}

function productOrigin(product) {
  if (isLocalDev()) {
    return `http://localhost:${product.port}`
  }
  const host = product.stagingHost ?? product.subdomain
  return `https://${host}`
}

/** Product marketing / landing page (public when host is live). */
export function getProductLandingUrl(productCode) {
  const product = getProductByCode(productCode)
  if (!product) return 'https://alander.io/apps'
  const path = product.landingPath ?? '/'
  return `${productOrigin(product)}${path}`
}

/** Entry to sign in and use the app (login on product host). */
export function getProductTryUrl(productCode) {
  const product = getProductByCode(productCode)
  if (!product) return 'https://alander.io/apps'
  return `${productOrigin(product)}/login`
}

/** Related articles on the portfolio hub (public). */
export function getProductArticlesUrl(productCode) {
  const product = getProductByCode(productCode)
  const origin = getPortfolioOrigin()
  if (!product) return `${origin}/projects`
  return `${origin}/projects?product=${encodeURIComponent(productCode)}`
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
