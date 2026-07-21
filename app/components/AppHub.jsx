'use client'

import { GESTALT_PRODUCTS } from '@gestalt/auth'
import AppIcon, { AppTrackChip } from './AppIcon'
import { TrackPlacement } from './TrackPlayChip'
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
    getProductLandingUrl,
    getProductArticlesUrl,
    isProductLive,
  } = useLaunchProduct()

  return (
    <div className="app-hub-page">
      <TrackPlacement placement="apps" hubOnly className="track-placement--apps" />
      <div className="app-hub" role="list">
        {GESTALT_PRODUCTS.map((product) => {
          const live = isProductLive(product.code)
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
              <AppTrackChip productCode={product.code} />

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
                {!product.comingSoon ? (
                  <a
                    href={getProductLandingUrl(product.code)}
                    className="app-hub__action app-hub__action--secondary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('apps.landing')}
                  </a>
                ) : null}
                <a
                  href={getProductArticlesUrl(product.code)}
                  className="app-hub__action app-hub__action--tertiary"
                >
                  {t('apps.publications')}
                </a>
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
