'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  GESTALT_PRODUCTS,
  grantProductAccess,
  provisionProductUser,
  searchAuthUsersByEmail,
} from '@gestalt/auth'
import { useAuth } from '../components/AuthProvider'
import { useLocale } from '../components/LocaleProvider'

export default function AdminPage() {
  const router = useRouter()
  const { loading, isAuthenticated, isOwner, authUser, refreshProfile } = useAuth()
  const { t } = useLocale()
  const [emailQuery, setEmailQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedProducts, setSelectedProducts] = useState(['deviante'])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) router.replace('/login')
    else if (!isOwner) router.replace('/')
  }, [loading, isAuthenticated, isOwner, router])

  async function handleSearch(event) {
    event.preventDefault()
    setError('')
    try {
      const results = await searchAuthUsersByEmail(emailQuery)
      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    }
  }

  function toggleProduct(code) {
    setSelectedProducts((current) => (
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    ))
  }

  async function grantToUser(userId, email) {
    if (!authUser || selectedProducts.length === 0) return
    setBusy(true)
    setError('')
    setMessage('')

    try {
      for (const productCode of selectedProducts) {
        await grantProductAccess({
          userId,
          productCode,
          role: 'member',
          grantedBy: authUser.id,
        })
        await provisionProductUser(
          { id: userId, email, user_metadata: {} },
          productCode,
          'member',
        )
      }
      setMessage(`Access granted for ${email}.`)
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant access.')
    } finally {
      setBusy(false)
    }
  }

  if (loading || !isOwner) {
    return (
      <section className="panel">
        <p className="muted">{t('misc.loading')}</p>
      </section>
    )
  }

  const grantableProducts = GESTALT_PRODUCTS.filter((product) => !product.comingSoon)

  return (
    <section className="panel">
      <h1>{t('admin.title')}</h1>

      {error ? <p className="alert">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <div className="admin-block">
        <h2>Products to grant</h2>
        <div className="checkbox-row">
          {grantableProducts.map((product) => (
            <label key={product.code}>
              <input
                type="checkbox"
                checked={selectedProducts.includes(product.code)}
                onChange={() => toggleProduct(product.code)}
              />
              {product.name}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-block">
        <h2>Grant by email</h2>
        <form className="inline-form" onSubmit={handleSearch}>
          <input
            type="email"
            placeholder="email@gmail.com"
            value={emailQuery}
            onChange={(event) => setEmailQuery(event.target.value)}
            required
          />
          <button type="submit" className="button">Search</button>
        </form>

        {searchResults.length > 0 ? (
          <ul className="admin-list">
            {searchResults.map((user) => (
              <li key={user.id}>
                <span>{user.email}</span>
                <button
                  type="button"
                  className="button button--primary"
                  disabled={busy}
                  onClick={() => grantToUser(user.id, user.email)}
                >
                  Grant
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="muted">
          The person must have signed in at least once (Google) to exist in Auth.
        </p>
      </div>
    </section>
  )
}
