import en from '../content/i18n/en.json'
import pt from '../content/i18n/pt.json'
import de from '../content/i18n/de.json'

export const LOCALES = ['en', 'pt', 'de']

/** @type {Record<string, typeof en>} */
export const MESSAGES = { en, pt, de }

const STORAGE_KEY = 'portfolio-locale'

export function normalizeLocale(value) {
  if (value === 'pt' || value?.startsWith('pt')) return 'pt'
  if (value === 'de' || value?.startsWith('de')) return 'de'
  return 'en'
}

export function readStoredLocale() {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && LOCALES.includes(stored)) return stored
  return normalizeLocale(window.navigator.language)
}

export function storeLocale(locale) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale === 'pt' ? 'pt-BR' : locale
}

export function getMessage(messages, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], messages)
}

export function t(messages, path, fallback = '') {
  const value = getMessage(messages, path)
  return value ?? fallback
}
