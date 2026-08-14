'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  LOCALES,
  MESSAGES,
  readStoredLocale,
  storeLocale,
  t as translate,
} from '../../lib/i18n'

const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState('en')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const initial = readStoredLocale()
    setLocaleState(initial)
    storeLocale(initial)
    setReady(true)
  }, [])

  function setLocale(next) {
    if (!LOCALES.includes(next)) return
    setLocaleState(next)
    storeLocale(next)
  }

  const messages = MESSAGES[locale] ?? MESSAGES.en

  useEffect(() => {
  document.title = translate(
    messages,
    'site.title',
    'Alander de Ávila • Product Portfolio'
  )
}, [messages])

  const value = useMemo(() => ({
    locale,
    ready,
    setLocale,
    messages,
    t: (path, fallback = '') => translate(messages, path, fallback),
  }), [locale, ready, messages])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}
