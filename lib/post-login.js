import {
  getProductAppUrl,
  getProductTryUrl,
  isGestaltOwnerEmail,
  isProductLive,
} from '@gestalt/auth'
import { consumePostLoginIntent } from './auth-intent'

/**
 * @param {{
 *   authEmail?: string
 *   hasPortfolioAccess: boolean
 *   isOwner: boolean
 *   hasProductAccess: (code: string) => boolean
 *   searchParams: URLSearchParams
 * }} options
 * @returns {{ path?: string, href?: string }}
 */
export function resolvePostLoginRoute({
  authEmail,
  hasPortfolioAccess,
  isOwner,
  hasProductAccess,
  searchParams,
}) {
  const isOwnerUser = isOwner || isGestaltOwnerEmail(authEmail)

  const intent = consumePostLoginIntent()
  const productCode = intent?.type === 'product'
    ? intent.code
    : searchParams?.get('product') ?? undefined

  if (intent?.type === 'path' && intent.path.startsWith('/')) {
    return { path: intent.path }
  }

  const next = searchParams?.get('next')
  if (next?.startsWith('/') && !productCode) {
    return { path: next }
  }

  if (productCode && isProductLive(productCode)) {
    const canOpenApp = isOwnerUser || hasProductAccess(productCode)
    return {
      href: canOpenApp ? getProductAppUrl(productCode) : getProductTryUrl(productCode),
    }
  }

  if (isOwnerUser) {
    if (productCode) {
      return { path: `/welcome?product=${encodeURIComponent(productCode)}` }
    }
    return { path: '/welcome' }
  }

  if (productCode && hasProductAccess(productCode)) {
    return { path: '/apps' }
  }

  return { path: '/apps' }
}
