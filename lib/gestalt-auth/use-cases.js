import { getSupabase, isSupabaseConfigured } from './supabase.js'

export const USE_CASE_PRODUCTS = [
  { code: 'io', gestaltCode: 'IO', name: 'Portfolio (IO)' },
  { code: 'deviante', gestaltCode: 'DV', name: 'Deviante' },
  { code: 'milebrick', gestaltCode: 'MB', name: 'Milebrick' },
  { code: 'harpia', gestaltCode: 'HA', name: 'Harpia' },
]

const USE_CASE_COLUMNS = `
  id, slug, abp_id, short_id, uc_number, product_code, locale, title, summary,
  description, description_why, description_what, description_bounds,
  actor, object_name, pre_condition, post_condition,
  status, visibility, body_md, vault_path, sort_order, updated_at, metadata
`.replace(/\s+/g, ' ').trim()

function mapStepRow(row) {
  return {
    id: row.id,
    stepKey: row.step_key,
    actorAction: row.actor_action,
    systemResponse: row.system_response,
    sortOrder: row.sort_order,
  }
}

function mapRequirementRow(row) {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    body: row.body,
    sortOrder: row.sort_order,
    status: row.status,
  }
}

const UC_LOCALE_FALLBACK = 'en'

/**
 * Collapse multi-locale rows to one per (product, uc_number): prefer the row in
 * the requested `locale`, else fall back to English, else whatever exists. This
 * keeps products that only have English specs (e.g. io) visible in any UI locale.
 */
function pickByLocale(rows, locale = UC_LOCALE_FALLBACK) {
  const score = (row) =>
    row.locale === locale ? 2 : row.locale === UC_LOCALE_FALLBACK ? 1 : 0
  const byKey = new Map()
  for (const row of rows) {
    const key = `${row.product_code}::${row.uc_number}`
    const current = byKey.get(key)
    if (!current || score(row) > score(current)) byKey.set(key, row)
  }
  return [...byKey.values()].sort((a, b) => {
    if (a.product_code !== b.product_code) return a.product_code.localeCompare(b.product_code)
    return (a.uc_number ?? 0) - (b.uc_number ?? 0)
  })
}

export function mapUseCaseRow(row, { steps = [], requirements = [] } = {}) {
  return {
    id: row.id,
    slug: row.slug,
    abpId: row.abp_id,
    shortId: row.short_id,
    ucNumber: row.uc_number,
    productCode: row.product_code,
    title: row.title,
    summary: row.summary,
    description: row.description,
    descriptionWhy: row.description_why,
    descriptionWhat: row.description_what,
    descriptionBounds: row.description_bounds,
    actor: row.actor,
    objectName: row.object_name,
    preCondition: row.pre_condition,
    postCondition: row.post_condition,
    status: row.status,
    visibility: row.visibility,
    bodyMd: row.body_md ?? '',
    vaultPath: row.vault_path,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    metadata: row.metadata ?? null,
    steps: steps.map(mapStepRow),
    requirements: requirements.map(mapRequirementRow),
  }
}

function buildUseCaseQuery(publicOnly) {
  let query = getSupabase()
    .schema('portfolio')
    .from('use_cases')
    .select(USE_CASE_COLUMNS)

  if (publicOnly) {
    query = query
      .eq('visibility', 'public')
      .in('status', ['ready', 'shipped'])
  }

  // Display order = creation sequence (UC1, UC2, …), not drag sort_order.
  return query.order('uc_number', { ascending: true })
}

export async function fetchUseCasesByProduct(
  productCode,
  { publicOnly = false, withChildren = false, withRequirements = true, locale = UC_LOCALE_FALLBACK } = {},
) {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await buildUseCaseQuery(publicOnly).eq('product_code', productCode)
  if (error) throw new Error(error.message)
  const list = pickByLocale(data ?? [], locale).map((row) => mapUseCaseRow(row))
  if (!withChildren || list.length === 0) return list

  return attachUseCaseChildren(list, { withRequirements })
}

async function attachUseCaseChildren(list, { withRequirements = true } = {}) {
  const ids = list.map((item) => item.id)
  const supabase = getSupabase()

  const stepsPromise = supabase
    .schema('portfolio')
    .from('use_case_steps')
    .select('id, use_case_id, step_key, actor_action, system_response, sort_order')
    .in('use_case_id', ids)
    .order('sort_order', { ascending: true })

  const requirementsPromise = withRequirements
    ? supabase
        .schema('portfolio')
        .from('requirements')
        .select('id, use_case_id, code, title, body, sort_order, status')
        .in('use_case_id', ids)
        .order('sort_order', { ascending: true })
    : Promise.resolve({ data: [], error: null })

  const [stepsResult, requirementsResult] = await Promise.all([stepsPromise, requirementsPromise])

  if (stepsResult.error) throw new Error(stepsResult.error.message)
  if (requirementsResult.error) throw new Error(requirementsResult.error.message)

  const stepsByCase = new Map()
  for (const row of stepsResult.data ?? []) {
    const bucket = stepsByCase.get(row.use_case_id) ?? []
    bucket.push(row)
    stepsByCase.set(row.use_case_id, bucket)
  }

  const requirementsByCase = new Map()
  for (const row of requirementsResult.data ?? []) {
    const bucket = requirementsByCase.get(row.use_case_id) ?? []
    bucket.push(row)
    requirementsByCase.set(row.use_case_id, bucket)
  }

  return list.map((item) =>
    mapUseCaseRow(
      {
        id: item.id,
        slug: item.slug,
        abp_id: item.abpId,
        short_id: item.shortId,
        uc_number: item.ucNumber,
        product_code: item.productCode,
        title: item.title,
        summary: item.summary,
        description: item.description,
        description_why: item.descriptionWhy,
        description_what: item.descriptionWhat,
        description_bounds: item.descriptionBounds,
        actor: item.actor,
        object_name: item.objectName,
        pre_condition: item.preCondition,
        post_condition: item.postCondition,
        status: item.status,
        visibility: item.visibility,
        body_md: item.bodyMd,
        vault_path: item.vaultPath,
        sort_order: item.sortOrder,
        updated_at: item.updatedAt,
        metadata: item.metadata,
      },
      {
        steps: stepsByCase.get(item.id) ?? [],
        requirements: requirementsByCase.get(item.id) ?? [],
      },
    ),
  )
}

export async function fetchAllUseCases({ publicOnly = false, locale = UC_LOCALE_FALLBACK } = {}) {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await buildUseCaseQuery(publicOnly)
  if (error) throw new Error(error.message)
  const list = pickByLocale(data ?? [], locale).map((row) => mapUseCaseRow(row))
  if (list.length === 0) return list

  return attachUseCaseChildren(list, { withRequirements: false })
}

export async function fetchUseCaseBySlug(
  productCode,
  slug,
  { publicOnly = false, locale = UC_LOCALE_FALLBACK } = {},
) {
  if (!isSupabaseConfigured()) return null

  let query = getSupabase()
    .schema('portfolio')
    .from('use_cases')
    .select(USE_CASE_COLUMNS)
    .eq('product_code', productCode)
    .eq('slug', slug)

  if (publicOnly) {
    query = query.eq('visibility', 'public').in('status', ['ready', 'shipped'])
  }

  // slug is shared across locales; pick the requested locale (fallback English).
  const { data: rows, error } = await query
  if (error) throw new Error(error.message)
  const row = pickByLocale(rows ?? [], locale)[0]
  if (!row) return null

  const [stepsResult, requirementsResult] = await Promise.all([
    getSupabase()
      .schema('portfolio')
      .from('use_case_steps')
      .select('id, step_key, actor_action, system_response, sort_order')
      .eq('use_case_id', row.id)
      .order('sort_order', { ascending: true }),
    getSupabase()
      .schema('portfolio')
      .from('requirements')
      .select('id, code, title, body, sort_order, status')
      .eq('use_case_id', row.id)
      .order('sort_order', { ascending: true }),
  ])

  if (stepsResult.error) throw new Error(stepsResult.error.message)
  if (requirementsResult.error) throw new Error(requirementsResult.error.message)

  return mapUseCaseRow(row, {
    steps: stepsResult.data ?? [],
    requirements: requirementsResult.data ?? [],
  })
}

export async function reorderUseCases(productCode, orderedIds) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.')

  const updates = orderedIds.map((id, index) =>
    getSupabase()
      .schema('portfolio')
      .from('use_cases')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('product_code', productCode),
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)
}

export async function deleteUseCase(id) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.')

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('use_cases')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    throw new Error('Excluir bloqueado: sem permissão owner em portfolio.users (RLS).')
  }
}

function slugifyTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'use-case'
}

function abpPrefix(productCode) {
  const product = USE_CASE_PRODUCTS.find((item) => item.code === productCode)
  return product ? `ABP-${product.gestaltCode}` : 'ABP-IO'
}

export function buildDefaultUseCase(productCode, ucNumber) {
  const prefix = abpPrefix(productCode)
  return {
    slug: '',
    abpId: `${prefix}-UC${ucNumber}`,
    shortId: `${productCode.toUpperCase().slice(0, 2)}-UC${ucNumber}`,
    ucNumber,
    productCode,
    title: '',
    summary: '',
    description: '',
    descriptionWhy: '',
    descriptionWhat: '',
    descriptionBounds: '',
    actor: '',
    objectName: '',
    preCondition: '',
    postCondition: '',
    status: 'draft',
    visibility: 'owner',
    bodyMd: '',
    vaultPath: null,
    steps: [{ stepKey: '1', actorAction: '', systemResponse: '', sortOrder: 0 }],
    requirements: [],
  }
}

async function replaceSteps(useCaseId, steps) {
  const supabase = getSupabase()
  const { error: deleteError } = await supabase
    .schema('portfolio')
    .from('use_case_steps')
    .delete()
    .eq('use_case_id', useCaseId)

  if (deleteError) throw new Error(deleteError.message)
  if (!steps.length) return

  const rows = steps.map((step, index) => ({
    use_case_id: useCaseId,
    step_key: step.stepKey || String(index + 1),
    actor_action: step.actorAction ?? '',
    system_response: step.systemResponse ?? '',
    sort_order: index,
  }))

  const { error } = await supabase.schema('portfolio').from('use_case_steps').insert(rows)
  if (error) throw new Error(error.message)
}

async function replaceRequirements(useCaseId, requirements) {
  const supabase = getSupabase()
  const { error: deleteError } = await supabase
    .schema('portfolio')
    .from('requirements')
    .delete()
    .eq('use_case_id', useCaseId)

  if (deleteError) throw new Error(deleteError.message)
  if (!requirements.length) return

  const rows = requirements.map((req, index) => ({
    use_case_id: useCaseId,
    code: req.code,
    title: req.title ?? req.code,
    body: req.body ?? '',
    sort_order: index,
    status: req.status ?? 'open',
  }))

  const { error } = await supabase.schema('portfolio').from('requirements').insert(rows)
  if (error) throw new Error(error.message)
}

function buildUseCasePayload(input) {
  const slug = input.slug?.trim() || slugifyTitle(input.title)
  return {
    slug,
    abp_id: input.abpId,
    short_id: input.shortId || null,
    uc_number: input.ucNumber,
    product_code: input.productCode,
    title: input.title,
    summary: input.summary || null,
    description: input.description || null,
    description_why: input.descriptionWhy || null,
    description_what: input.descriptionWhat || null,
    description_bounds: input.descriptionBounds || null,
    actor: input.actor || null,
    object_name: input.objectName || null,
    pre_condition: input.preCondition || null,
    post_condition: input.postCondition || null,
    status: input.status ?? 'draft',
    visibility: input.visibility ?? 'owner',
    body_md: input.bodyMd ?? '',
    vault_path: input.vaultPath || null,
    sort_order: input.sortOrder ?? input.ucNumber ?? 0,
    updated_at: new Date().toISOString(),
  }
}

export async function createUseCase(input) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.')

  const payload = buildUseCasePayload(input)
  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('use_cases')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await replaceSteps(data.id, input.steps ?? [])
  await replaceRequirements(data.id, input.requirements ?? [])

  return fetchUseCaseBySlug(payload.product_code, payload.slug)
}

export async function updateUseCase(id, input) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.')

  const payload = buildUseCasePayload(input)
  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('use_cases')
    .update(payload)
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    throw new Error(
      'Salvar bloqueado: sua conta não tem role owner em portfolio.users (RLS). '
      + 'Rode data/seed/portfolio/owner_users.sql com o UUID do Authentication → Users.',
    )
  }

  await replaceSteps(id, input.steps ?? [])
  if (Array.isArray(input.requirements)) {
    await replaceRequirements(id, input.requirements)
  }

  return fetchUseCaseBySlug(payload.product_code, payload.slug)
}

/**
 * Partial update for just status/visibility (publication beacon quick menu).
 * Does NOT touch title/description/steps — updateUseCase's payload builder
 * requires the full form and would null those out if reused here.
 */
export async function updateUseCaseStatus(id, { status, visibility }) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.')

  const payload = { updated_at: new Date().toISOString() }
  if (status != null) payload.status = status
  if (visibility != null) payload.visibility = visibility

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('use_cases')
    .update(payload)
    .eq('id', id)
    .select('id, status, visibility')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    throw new Error(
      'Salvar bloqueado: sua conta não tem role owner em portfolio.users (RLS).',
    )
  }
  return data
}
