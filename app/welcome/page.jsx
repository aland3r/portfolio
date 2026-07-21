'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getProductByCode, isProductLive } from '@gestalt/auth'
import { useAuth } from '../components/AuthProvider'
import { useLocale } from '../components/LocaleProvider'

function WelcomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const { loading, isAuthenticated, isOwner, authUser } = useAuth()

  const productCode = searchParams.get('product')
  const product = productCode ? getProductByCode(productCode) : null
  const productOffline = product && !isProductLive(product.code)

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) router.replace('/login')
    else if (!isOwner) router.replace('/apps')
  }, [loading, isAuthenticated, isOwner, router])

  if (loading || !isAuthenticated || !isOwner) {
    return (
      <section className="panel">
        <p className="muted">{t('misc.loading')}</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <p className="eyebrow">{t('welcome.eyebrow')}</p>
      <h1>{t('welcome.title')}</h1>
      <p className="lead">{t('welcome.lead')}</p>

      {authUser?.email ? (
        <p className="welcome-email">{authUser.email}</p>
      ) : null}

      {productOffline ? (
        <p className="alert">{t('welcome.productOffline')} {product.name}</p>
      ) : null}

      <ol className="welcome-steps">
        <li>
          <strong>{t('welcome.step1Title')}</strong>
          <p className="muted">{t('welcome.step1Body')}</p>
          <Link href="/admin" className="button">{t('welcome.admin')}</Link>
        </li>
        <li>
          <strong>{t('welcome.step2Title')}</strong>
          <p className="muted">{t('welcome.step2Body')}</p>
        </li>
        <li>
          <strong>{t('welcome.step3Title')}</strong>
          <p className="muted">{t('welcome.step3Body')}</p>
          <Link href="/apps" className="button">{t('welcome.apps')}</Link>
        </li>
      </ol>
    </section>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<section className="panel"><p className="muted">…</p></section>}>
      <WelcomeContent />
    </Suspense>
  )
}
