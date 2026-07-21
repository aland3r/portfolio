'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { isOAuthReturn } from '@gestalt/auth'
import { resolvePostLoginRoute } from '../../../lib/post-login'
import { useAuth } from '../../components/AuthProvider'

function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    authReady,
    isAuthenticated,
    hasPortfolioAccess,
    isOwner,
    hasProductAccess,
    authUser,
  } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('error_description') ?? params.get('error')
    if (oauthError) {
      setError(decodeURIComponent(oauthError.replace(/\+/g, ' ')))
    }
  }, [])

  useEffect(() => {
    if (!authReady || error) return
    if (!isAuthenticated) {
      if (!isOAuthReturn()) router.replace('/login')
      return
    }

    const route = resolvePostLoginRoute({
      authEmail: authUser?.email,
      hasPortfolioAccess,
      isOwner,
      hasProductAccess,
      searchParams,
    })

    if (route.href) {
      window.location.href = route.href
      return
    }

    router.replace(route.path ?? '/apps')
  }, [
    authReady,
    error,
    isAuthenticated,
    hasPortfolioAccess,
    isOwner,
    hasProductAccess,
    authUser,
    router,
    searchParams,
  ])

  useEffect(() => {
    if (!authReady || error || isAuthenticated) return
    if (!isOAuthReturn()) return

    const timeout = window.setTimeout(() => {
      setError('Could not complete sign-in. Please try again.')
    }, 8000)

    return () => window.clearTimeout(timeout)
  }, [authReady, error, isAuthenticated])

  if (error) {
    return (
      <section className="panel panel--auth">
        <p className="alert">{error}</p>
        <p><Link href="/login">Back to sign in</Link></p>
      </section>
    )
  }

  return (
    <section className="panel panel--auth">
      <p className="muted">…</p>
    </section>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<section className="panel panel--auth"><p className="muted">Loading…</p></section>}>
      <AuthCallbackHandler />
    </Suspense>
  )
}
