'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '../components/LocaleProvider'

function UseCasesHubRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams.toString()
    router.replace(query ? `/cases?${query}` : '/cases')
  }, [router, searchParams])

  return null
}

export default function UseCasesHubPage() {
  const { t } = useLocale()

  return (
    <Suspense fallback={<section className="panel"><p className="muted">{t('misc.loading')}</p></section>}>
      <UseCasesHubRedirect />
    </Suspense>
  )
}
