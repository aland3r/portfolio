'use client'

import { useEffect, useState } from 'react'
import { GESTALT_PRODUCTS, fetchAppProducts, isProductEntryLive } from '@gestalt/auth'
import AppIcon from './AppIcon'
import { useLocale } from './LocaleProvider'
import { useLaunchProduct } from './useLaunchProduct'

export default function AppHub() {
  const { t } = useLocale()
  const {
    tryApp,
    loading,
    isAuthenticated,
    isOwner,
    hasProductAccess,
    getProductArticlesUrl,
  } = useLaunchProduct()

  // Names/lifecycle come from `portfolio.products` (show_in_apps); the static
  // list is the fallback so the three slots persist if the fetch fails.
  const [products, setProducts] = useState(GESTALT_PRODUCTS)

  useEffect(() => {
    let active = true
    fetchAppProducts()
      .then((rows) => {
        if (active && rows?.length) setProducts(rows)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="app-hub-page">
      <div className="app-hub" role="list">
        {products.map((product) => {
          const live = isProductEntryLive(product)
          const allowed = isOwner || hasProductAccess(product.code)

          return (
            <article
              key={product.code}
              className={
                product.comingSoon
                  ? 'app-hub__slot app-hub__slot--soon'
                  : 'app-hub__slot'
              }
            >
              <AppIcon product={product} />
              <span className="app-hub__name">{product.name}</span>

              <div className="app-hub__actions">
                {live && !product.comingSoon ? (
                  <button
                    type="button"
                    className="app-hub__action app-hub__action--primary"
                    onClick={() => tryApp(product.code)}
                  >
                    {t('apps.try')}
                  </button>
                ) : null}
                {/* Deviante shows a single primary CTA (login/launch) only. */}
                {product.code !== 'deviante' ? (
                  <a
                    href={getProductArticlesUrl(product.code)}
                    className="app-hub__action app-hub__action--tertiary"
                  >
                    {t('apps.publications')}
                  </a>
                ) : null}
              </div>

              {!loading && live && isAuthenticated && !allowed && !isOwner ? (
                <span className="app-hub__meta">{t('apps.contact')}</span>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
