import { getSupabase, isGestaltOwnerEmail } from './supabase.js'
import { getProductByCode } from './products.js'

function mapAuthError(message) {
  const normalized = message?.toLowerCase() ?? ''
  if (normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.'
  }
  return message || 'Não foi possível entrar agora.'
}

export async function loginWithGoogle(redirectTo) {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw new Error(mapAuthError(error.message))
}

export async function logoutAuth() {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(mapAuthError(error.message))
}

export async function getAuthSessionUser() {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(mapAuthError(error.message))
  return data.session?.user ?? null
}

export function subscribeToAuthChanges(callback) {
  const supabase = getSupabase()
  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, _event)
  })

  return () => subscription.subscription.unsubscribe()
}

export async function fetchPortfolioUser(userId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .schema('portfolio')
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function fetchProductAccess(userId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .schema('portfolio')
    .from('product_access')
    .select('product_code, role')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function hasProductAccess(userId, productCode) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .schema('portfolio')
    .from('product_access')
    .select('product_code')
    .eq('user_id', userId)
    .eq('product_code', productCode)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return Boolean(data)
}

export async function hasGestaltProductAccess(user, productCode) {
  if (!user?.id) return false

  const email = user.email?.toLowerCase() ?? ''
  if (isGestaltOwnerEmail(email)) return true

  const profile = await fetchPortfolioUser(user.id)
  if (profile?.role === 'owner') return true

  return hasProductAccess(user.id, productCode)
}

async function ensureOwnerProductAccess(user) {
  const products = ['deviante', 'milebrick']
  for (const productCode of products) {
    try {
      await grantProductAccess({
        userId: user.id,
        productCode,
        role: 'owner',
        grantedBy: user.id,
      })
      await provisionProductUser(user, productCode, 'owner')
    } catch {
      // Best-effort — SQL seed or RLS may already satisfy access.
    }
  }
}

/**
 * Seeds only the `deviante.users` identity row, matching what the Deviante
 * app itself does (`ui/auth/access.js`).
 *
 * It used to insert into `deviante.managers` instead, which could not work:
 * that table has no `location_enabled` column (the insert failed 42703), and
 * its RLS policy checks `auth.uid() = id` while `id` is `gen_random_uuid()`
 * and ownership actually lives in `user_id` — so the row was rejected twice
 * over. The Manager profile is Kotlin-owned anyway: `ManagerRepository
 * .findOrCreateForSupabaseUser` creates it on the first `/api/manager/me`.
 */
async function provisionDevianteUser(user) {
  const supabase = getSupabase()
  const email = user.email?.toLowerCase() ?? ''

  const { data: existingUser, error: lookupError } = await supabase
    .schema('deviante')
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (lookupError) throw new Error(lookupError.message)
  if (existingUser) return

  const { error: insertError } = await supabase
    .schema('deviante')
    .from('users')
    .insert({
      id: user.id,
      email,
      password_hash: null,
    })

  if (insertError) throw new Error(insertError.message)
}

async function provisionMilebrickUser(user, role = 'member') {
  const supabase = getSupabase()
  const email = user.email?.toLowerCase() ?? ''
  const name = user.user_metadata?.full_name
    ?? user.user_metadata?.name
    ?? email.split('@')[0]
    ?? 'Usuário'

  const { data: existing } = await supabase
    .schema('milebrick')
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return

  const { error } = await supabase
    .schema('milebrick')
    .from('users')
    .insert({
      id: user.id,
      name,
      email,
      roles: role,
      ui_language_code: 'pt',
    })

  if (error) throw new Error(error.message)
}

export async function provisionProductUser(user, productCode, role = 'member') {
  const product = getProductByCode(productCode)
  if (!product || product.comingSoon) return

  if (productCode === 'deviante') {
    await provisionDevianteUser(user)
    return
  }

  if (productCode === 'milebrick') {
    await provisionMilebrickUser(user, role)
  }
}

export async function grantProductAccess({ userId, productCode, role = 'member', grantedBy }) {
  const supabase = getSupabase()
  const { error } = await supabase
    .schema('portfolio')
    .from('product_access')
    .upsert({
      user_id: userId,
      product_code: productCode,
      role,
      granted_by: grantedBy ?? null,
    }, { onConflict: 'user_id,product_code' })

  if (error) throw new Error(error.message)
}

export async function ensureOwnerBootstrap(user) {
  const email = user.email?.toLowerCase() ?? ''
  if (!isGestaltOwnerEmail(email)) return fetchPortfolioUser(user.id)

  const supabase = getSupabase()
  const existing = await fetchPortfolioUser(user.id)
  if (existing?.role === 'owner') {
    await ensureOwnerProductAccess(user)
    return existing
  }

  const { data: byEmail, error: emailLookupError } = await supabase
    .schema('portfolio')
    .from('users')
    .select('id, role')
    .eq('email', email)
    .maybeSingle()

  if (emailLookupError) throw new Error(emailLookupError.message)

  if (byEmail && byEmail.id !== user.id) {
    throw new Error(
      `Owner ${email} está ligado a outro login no banco. `
      + `Atualize portfolio.users com id = ${user.id} (Authentication → Users).`,
    )
  }

  const { data: inserted, error: userError } = await supabase
    .schema('portfolio')
    .from('users')
    .upsert({
      id: user.id,
      email,
      role: 'owner',
    }, { onConflict: 'id' })
    .select('id, role')
    .maybeSingle()

  if (userError) throw new Error(userError.message)
  if (!inserted) {
    throw new Error(
      'Bootstrap owner bloqueado (RLS). Rode data/seed/portfolio/owner_users.sql no Supabase SQL Editor.',
    )
  }

  await ensureOwnerProductAccess(user)

  return fetchPortfolioUser(user.id)
}

export async function submitAccessRequest(user, message = '') {
  const supabase = getSupabase()
  const email = user.email?.toLowerCase() ?? ''

  const { data: existing, error: existingError } = await supabase
    .schema('portfolio')
    .from('access_requests')
    .select('id, status')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)
  if (existing) return existing

  const { data, error } = await supabase
    .schema('portfolio')
    .from('access_requests')
    .insert({
      user_id: user.id,
      email,
      message: message.trim() || null,
      status: 'pending',
    })
    .select('id, status')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function listPendingAccessRequests() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .schema('portfolio')
    .from('access_requests')
    .select('id, email, message, status, created_at, user_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function resolveAccessRequest({ requestId, approve, grantedBy, productCodes = [] }) {
  const supabase = getSupabase()

  const { data: request, error: requestError } = await supabase
    .schema('portfolio')
    .from('access_requests')
    .select('id, email, user_id, status')
    .eq('id', requestId)
    .single()

  if (requestError) throw new Error(requestError.message)
  if (request.status !== 'pending') throw new Error('Solicitação já foi processada.')

  const nextStatus = approve ? 'approved' : 'denied'
  const { error: updateError } = await supabase
    .schema('portfolio')
    .from('access_requests')
    .update({ status: nextStatus })
    .eq('id', requestId)

  if (updateError) throw new Error(updateError.message)

  if (!approve || !request.user_id) return

  const { error: userError } = await supabase
    .schema('portfolio')
    .from('users')
    .upsert({
      id: request.user_id,
      email: request.email,
      role: 'member',
    }, { onConflict: 'id' })

  if (userError) throw new Error(userError.message)

  const authUser = { id: request.user_id, email: request.email, user_metadata: {} }

  for (const productCode of productCodes) {
    await grantProductAccess({
      userId: request.user_id,
      productCode,
      role: 'member',
      grantedBy,
    })
    await provisionProductUser(authUser, productCode, 'member')
  }
}

export async function searchAuthUsersByEmail(emailQuery) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .schema('portfolio')
    .from('users')
    .select('id, email, role')
    .ilike('email', `%${emailQuery.trim()}%`)
    .limit(10)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function ensureProductAccess(user, productCode) {
  if (!user?.id) return false

  if (isGestaltOwnerEmail(user.email)) {
    try {
      await ensureOwnerBootstrap(user)
    } catch {
      // RLS may still block bootstrap — owner e-mail is allowed below.
    }
  }

  const allowed = await hasGestaltProductAccess(user, productCode)
  if (!allowed) return false
  await provisionProductUser(user, productCode)
  return true
}
