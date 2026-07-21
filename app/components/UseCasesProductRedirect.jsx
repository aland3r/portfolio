'use client'

import { Suspense, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from './LocaleProvider'

function RedirectBody() {
  const router = useRouter()
  const { product } = useParams()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (product) params.set('product', product)
    router.replace(`/cases?${params.toString()}`)
  }, [product, router, searchParams])

  return null
}

export default function UseCasesProductRedirect() {
  const { t } = useLocale()

  return (
    <Suspense fallback={<section className="panel"><p className="muted">{t('misc.loading')}</p></section>}>
      <RedirectBody />
    </Suspense>
  )
}
