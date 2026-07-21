'use client'

import { Suspense } from 'react'
import KitPanel from '../components/KitPanel'
import { useAuth } from '../components/AuthProvider'
import { useLocale } from '../components/LocaleProvider'

function KitPageContent() {
  const { loading } = useAuth()
  const { t } = useLocale()

  if (loading) {
    return (
      <section className="panel">
        <p className="muted">{t('misc.loading')}</p>
      </section>
    )
  }

  return (
    <section className="panel panel--kit panel--kit-list">
      <KitPanel />
    </section>
  )
}

export default function KitPage() {
  const { t } = useLocale()

  return (
    <Suspense fallback={<section className="panel"><p className="muted">{t('misc.loading')}</p></section>}>
      <KitPageContent />
    </Suspense>
  )
}
