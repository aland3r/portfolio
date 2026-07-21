const INTENT_KEY = 'gestalt-post-login-intent'

/** @typedef {{ type: 'path', path: string } | { type: 'product', code: string }} PostLoginIntent */

/** @param {PostLoginIntent} intent */
export function savePostLoginIntent(intent) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent))
}

export function clearPostLoginIntent() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(INTENT_KEY)
}

/** @returns {PostLoginIntent | null} */
export function consumePostLoginIntent() {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(INTENT_KEY)
  sessionStorage.removeItem(INTENT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function loginHref({ next, product } = {}) {
  const params = new URLSearchParams()
  if (next) params.set('next', next)
  if (product) params.set('product', product)
  const query = params.toString()
  return query ? `/login?${query}` : '/login'
}
