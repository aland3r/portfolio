'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { savePostLoginIntent, clearPostLoginIntent } from '../../lib/auth-intent'
import { useAuth } from '../components/AuthProvider'
import { useLocale } from '../components/LocaleProvider'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loading, isAuthenticated, loginWithGoogle } = useAuth()
  const { t } = useLocale()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const next = searchParams.get('next')
  const product = searchParams.get('product')

  useEffect(() => {
    if (loading || !isAuthenticated) return
    const query = window.location.search
    router.replace(query ? `/auth/callback${query}` : '/auth/callback')
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (product) {
      savePostLoginIntent({ type: 'product', code: product })
    } else if (next?.startsWith('/')) {
      savePostLoginIntent({ type: 'path', path: next })
    } else {
      clearPostLoginIntent()
    }
  }, [next, product])

  async function handleGoogleLogin() {
    setSubmitting(true)
    setError('')
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      setSubmitting(false)
    }
  }

  return (
    <section className="panel panel--auth">
      <p className="eyebrow">{t('login.eyebrow')}</p>
      <h1>{t('login.title')}</h1>

      {error ? <p className="alert">{error}</p> : null}

      <button
        type="button"
        className="button button--google"
        disabled={submitting || loading}
        onClick={handleGoogleLogin}
      >
        {submitting ? t('login.loading') : t('login.google')}
      </button>
    </section>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<section className="panel panel--auth"><p className="muted">…</p></section>}>
      <LoginForm />
    </Suspense>
  )
}
