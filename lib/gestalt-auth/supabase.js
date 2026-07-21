import { createClient } from '@supabase/supabase-js'
import { createGestaltAuthStorage } from './cookie-storage.js'

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null

function defaultEnv() {
  if (typeof process !== 'undefined' && process.env) return process.env
  if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env
  return {}
}

/** Next inlines only direct `process.env.NEXT_PUBLIC_*` references at build time. */
function nextPublicEnv() {
  if (typeof process === 'undefined' || !process.env) {
    return {
      url: undefined,
      publishableKey: undefined,
      ownerEmail: undefined,
    }
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ownerEmail: process.env.NEXT_PUBLIC_GESTALT_OWNER_EMAIL,
    ownerEmails: process.env.NEXT_PUBLIC_GESTALT_OWNER_EMAILS,
  }
}

export function readSupabaseEnv(env = defaultEnv()) {
  const next = nextPublicEnv()
  const url = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? next.url
  const publishableKey =
    env.VITE_SUPABASE_ANON_KEY
    ?? env.VITE_SUPABASE_PUBLISHABLE_KEY
    ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? next.publishableKey

  return { url, publishableKey }
}

export function isSupabaseConfigured(env = defaultEnv()) {
  const { url, publishableKey } = readSupabaseEnv(env)
  return Boolean(url && publishableKey)
}

export function getGestaltOwnerEmail(env = defaultEnv()) {
  return getGestaltOwnerEmails(env)[0] ?? ''
}

const DEFAULT_OWNER_EMAILS = ['design@alander.io', 'alanderavila@gmail.com']

export function getGestaltOwnerEmails(env = defaultEnv()) {
  const next = nextPublicEnv()
  const raw =
    env.NEXT_PUBLIC_GESTALT_OWNER_EMAILS
    ?? env.VITE_GESTALT_OWNER_EMAILS
    ?? next.ownerEmails
    ?? env.NEXT_PUBLIC_GESTALT_OWNER_EMAIL
    ?? env.VITE_GESTALT_OWNER_EMAIL
    ?? next.ownerEmail
    ?? ''

  const fromEnv = String(raw)
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)

  return [...new Set([...DEFAULT_OWNER_EMAILS, ...fromEnv])]
}

export function isGestaltOwnerEmail(email, env = defaultEnv()) {
  const normalized = email?.trim().toLowerCase()
  if (!normalized) return false
  return getGestaltOwnerEmails(env).includes(normalized)
}

export function getSupabase(env = defaultEnv()) {
  const { url, publishableKey } = readSupabaseEnv(env)
  if (!url || !publishableKey) {
    throw new Error('Supabase não configurado. Defina URL e anon/publishable key em .env')
  }

  if (!client) {
    client = createClient(url, publishableKey, {
      auth: {
        flowType: 'pkce',
        storage: createGestaltAuthStorage(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return client
}

export function resetSupabaseClient() {
  client = null
}
