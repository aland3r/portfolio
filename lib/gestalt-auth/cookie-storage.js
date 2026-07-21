const CHUNK_SIZE = 3000

function cookieDomain() {
  if (typeof window === 'undefined') return null
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return null
  if (host.endsWith('.alander.io') || host === 'alander.io') return '.alander.io'
  return null
}

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`
  const chunks = []

  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      chunks.push({ index: 0, value: decodeURIComponent(trimmed.slice(prefix.length)) })
      continue
    }

    const chunkMatch = trimmed.match(/^(.+)\.(\d+)=([^;]*)$/)
    if (!chunkMatch) continue

    const [, baseName, index, value] = chunkMatch
    if (baseName === encodeURIComponent(name)) {
      chunks.push({ index: Number(index), value: decodeURIComponent(value) })
    }
  }

  if (chunks.length === 0) return null
  return chunks.sort((a, b) => a.index - b.index).map((chunk) => chunk.value).join('')
}

function writeCookie(name, value) {
  const domain = cookieDomain()
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const base = `${encodeURIComponent(name)}`
  const attrs = [
    'path=/',
    'SameSite=Lax',
    ...(secure ? ['Secure'] : []),
    ...(domain ? [`domain=${domain}`] : []),
  ].join('; ')

  const clear = (cookieName) => {
    document.cookie = `${cookieName}=; Max-Age=0; path=/; ${domain ? `domain=${domain}; ` : ''}`
  }

  clear(base)
  for (let index = 0; index < 32; index += 1) {
    clear(`${base}.${index}`)
  }

  if (value === null || value === undefined) return

  const encoded = encodeURIComponent(value)
  if (encoded.length <= CHUNK_SIZE) {
    document.cookie = `${base}=${encoded}; ${attrs}`
    return
  }

  let offset = 0
  let chunkIndex = 0
  while (offset < encoded.length) {
    const slice = encoded.slice(offset, offset + CHUNK_SIZE)
    document.cookie = `${base}.${chunkIndex}=${slice}; ${attrs}`
    offset += CHUNK_SIZE
    chunkIndex += 1
  }
}

/** Supabase auth storage shared across *.alander.io (localhost uses default per-port cookies). */
export function createGestaltAuthStorage(storageKey = 'gestalt-auth') {
  return {
    getItem(key) {
      if (typeof window === 'undefined') return null
      return readCookie(key) ?? window.localStorage.getItem(key)
    },
    setItem(key, value) {
      if (typeof window === 'undefined') return
      writeCookie(key, value)
      try {
        window.localStorage.setItem(key, value)
      } catch {
        // ignore quota errors on local fallback
      }
    },
    removeItem(key) {
      if (typeof window === 'undefined') return
      writeCookie(key, null)
      window.localStorage.removeItem(key)
    },
  }
}

export function isGestaltProductionHost() {
  if (typeof window === 'undefined') return false
  return window.location.hostname.endsWith('.alander.io')
    || window.location.hostname === 'alander.io'
}
