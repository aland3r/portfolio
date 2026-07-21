'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  ensureOwnerBootstrap,
  fetchPortfolioUser,
  fetchProductAccess,
  getAuthSessionUser,
  getPortfolioOrigin,
  isGestaltOwnerEmail,
  isSupabaseConfigured,
  loginWithGoogle,
  logoutAuth,
  subscribeToAuthChanges,
} from '@gestalt/auth'

const SESSION_EVENTS = new Set(['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT'])

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null)
  const [portfolioUser, setPortfolioUser] = useState(null)
  const [productAccess, setProductAccess] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)
  const [error, setError] = useState('')

  async function hydrateProfile(user) {
    setProfileReady(false)

    if (!user) {
      setPortfolioUser(null)
      setProductAccess([])
      setProfileReady(true)
      return
    }

    try {
      const profile = await ensureOwnerBootstrap(user)
      setPortfolioUser(profile)

      if (profile) {
        const access = await fetchProductAccess(user.id)
        setProductAccess(access)
      } else {
        setProductAccess([])
      }
    } finally {
      setProfileReady(true)
    }
  }

  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured()) {
      setLoading(false)
      setProfileReady(true)
      setError('Supabase não configurado.')
      return undefined
    }

    async function bootstrap() {
      try {
        const user = await getAuthSessionUser()
        if (!active) return
        setAuthUser(user)
        await hydrateProfile(user)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Falha ao carregar sessão.')
      } finally {
        if (active) {
          setLoading(false)
          setProfileReady(true)
        }
      }
    }

    bootstrap()

    const unsubscribe = subscribeToAuthChanges(async (user, event) => {
      if (!active) return
      setAuthUser(user)
      try {
        await hydrateProfile(user)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao sincronizar perfil.')
        setProfileReady(true)
      }
      if (SESSION_EVENTS.has(event)) {
        setLoading(false)
      }
    })

    const timeout = window.setTimeout(() => {
      if (active) setLoading(false)
    }, 8000)

    return () => {
      active = false
      window.clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  const isOwnerByEmail = isGestaltOwnerEmail(authUser?.email)

  const value = useMemo(() => ({
    authUser,
    portfolioUser,
    productAccess,
    loading,
    profileReady,
    authReady: !loading && (!authUser || profileReady),
    error,
    isAuthenticated: Boolean(authUser),
    isOwner: portfolioUser?.role === 'owner' || isOwnerByEmail,
    hasPortfolioAccess: Boolean(portfolioUser),
    hasProductAccess: (code) => productAccess.some((entry) => entry.product_code === code),
    async loginWithGoogle() {
      // Always return to portfolio — never a product subdomain (may lack DNS).
      await loginWithGoogle(`${getPortfolioOrigin()}/auth/callback`)
    },
    async logout() {
      await logoutAuth()
      setAuthUser(null)
      setPortfolioUser(null)
      setProductAccess([])
      setProfileReady(true)
    },
    async refreshProfile() {
      if (!authUser) return
      const profile = await fetchPortfolioUser(authUser.id)
      setPortfolioUser(profile)
      if (profile) {
        const access = await fetchProductAccess(authUser.id)
        setProductAccess(access)
      }
    },
  }), [authUser, portfolioUser, productAccess, loading, profileReady, error, isOwnerByEmail])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
