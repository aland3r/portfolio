'use client'

import { useRouter } from 'next/navigation'
import {
  GESTALT_PRODUCTS,
  getProductAppUrl,
  getProductArticlesUrl,
  getProductTryUrl,
  isProductLive,
} from '@gestalt/auth'
import { loginHref, savePostLoginIntent } from '../../lib/auth-intent'
import { useAuth } from './AuthProvider'

export function useLaunchProduct() {
  const router = useRouter()
  const { loading, isAuthenticated, hasProductAccess, isOwner } = useAuth()

  function tryApp(productCode) {
    const product = GESTALT_PRODUCTS.find((item) => item.code === productCode)
    if (!product || product.comingSoon) return

    if (!isProductLive(productCode)) {
      if (isOwner) {
        router.push(`/welcome?product=${encodeURIComponent(productCode)}`)
      }
      return
    }

    if (isAuthenticated && (isOwner || hasProductAccess(productCode))) {
      window.location.href = getProductAppUrl(productCode)
      return
    }

    if (!isAuthenticated) {
      savePostLoginIntent({ type: 'product', code: productCode })
      router.push(loginHref({ next: '/apps', product: productCode }))
      return
    }

    window.location.href = getProductTryUrl(productCode)
  }

  /** @deprecated use tryApp */
  function launchProduct(productCode) {
    tryApp(productCode)
  }

  return {
    tryApp,
    launchProduct,
    loading,
    isAuthenticated,
    isOwner,
    hasProductAccess,
    getProductArticlesUrl,
    isProductLive,
  }
}
