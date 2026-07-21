'use client'

import { Suspense } from 'react'
import { KitDetailPanel } from '../../../components/KitPanel'
import { useLocale } from '../../../components/LocaleProvider'

function KitDetailContent() {
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
