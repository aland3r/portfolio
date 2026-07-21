'use client'

import { Suspense } from 'react'
import OwnerUseCasesPanel from '../components/OwnerUseCasesPanel'
import { useAuth } from '../components/AuthProvider'
import { useLocale } from '../components/LocaleProvider'

function CasesPageContent() {
  const { loading } = useAuth()
  const { t } = useLocale()

  // Public read for everyone once auth state settles; OwnerUseCasesPanel itself
  // gates create/edit affordances and DB rows behind ownerDbAccess (isOwner).
  if (loading) {
    return (
      <section className="panel">
        <p className="muted">{t('misc.loading')}</p>
      </section>
    )
  }

  return (
    <section className="panel panel--cases">
      <OwnerUseCasesPanel />
    </section>
  )
}

export default function CasesPage() {
  const { t } = useLocale()

  return (
    <Suspense fallback={<section className="panel"><p className="muted">{t('misc.loading')}</p></section>}>
      <CasesPageContent />
    </Suspense>
  )
}
