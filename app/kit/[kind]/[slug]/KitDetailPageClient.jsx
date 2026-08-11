'use client'

import { Suspense } from 'react'
import { KitDetailPanel } from '../../../components/KitPanel'
import { useAuth } from '../../../components/AuthProvider'
import { useLocale } from '../../../components/LocaleProvider'

function KitDetailContent() {
  const { loading, authReady, isOwner } = useAuth()
  const { t } = useLocale()

  if (loading || !authReady) {
    return <section className="panel"><p className="muted">{t('misc.loading')}</p></section>
  }

  // Owner-only while the kit content is being reviewed for consistency.
  if (!isOwner) {
    return (
      <section className="panel">
        <p className="muted">{t('kit.ownerOnly') || t('misc.notFound') || 'Not available.'}</p>
      </section>
    )
  }

  return (
    <section className="panel panel--kit panel--kit-detail">
      <KitDetailPanel />
    </section>
  )
}

export function KitDetailPageClient() {
  const { t } = useLocale()

  return (
    <Suspense fallback={<section className="panel"><p className="muted">{t('misc.loading')}</p></section>}>
      <KitDetailContent />
    </Suspense>
  )
}
