import gestaltRoadmap from '../content/gestalt-roadmap.json'
import portfolioRoadmap from '../content/roadmap.json'

export const GESTALT_ROADMAP = gestaltRoadmap

/** @deprecated IO-only slice; prefer getGestaltProduct('IO') */
export const PORTFOLIO_ROADMAP = portfolioRoadmap

/** Active build scope — Portfolio (IO) + Deviante (DV). See gestalt-kit/partials/active-scope.md */
export const ACTIVE_GESTALT_PRODUCT_CODES = ['IO', 'DV']

export function getGestaltProducts() {
  return gestaltRoadmap.products
}

/** Products shown in /cases filters and similar owner chrome. */
export function getActiveGestaltProducts() {
  return gestaltRoadmap.products.filter((product) =>
    ACTIVE_GESTALT_PRODUCT_CODES.includes(product.code),
  )
}

export function getGestaltProduct(code) {
  return gestaltRoadmap.products.find((product) => product.code === code) ?? null
}

const SPEC_TO_GESTALT_CODE = {
  io: 'IO',
  deviante: 'DV',
  milebrick: 'MB',
  harpia: 'HA',
}

const PRODUCT_ORDER = ['io', 'deviante', 'milebrick', 'harpia']

/**
 * Rebuilds the same shape as content/gestalt-roadmap.json from flat
 * `portfolio.quests` rows (+ `portfolio.products` for name/lifecycle), so
 * every function below keeps working unchanged whether the data came from
 * the static JSON or from Supabase.
 */
export function buildRoadmapFromRows(questRows = [], productRows = []) {
  const productMetaByCode = new Map(productRows.map((row) => [row.code, row]))
  const phasesByProduct = new Map()

  for (const row of questRows) {
    if (!phasesByProduct.has(row.product_code)) phasesByProduct.set(row.product_code, new Map())
    const phases = phasesByProduct.get(row.product_code)

    if (!phases.has(row.phase_id)) {
      phases.set(row.phase_id, {
        id: row.phase_id,
        codename: row.phase_codename,
        label: row.phase_label,
        sortOrder: row.phase_sort_order,
        quests: [],
      })
    }

    phases.get(row.phase_id).quests.push({
      id: row.quest_id,
      uc: row.uc_number,
      label: row.label,
      status: row.status,
    })
  }

  const products = PRODUCT_ORDER
    .filter((code) => phasesByProduct.has(code))
    .map((code) => {
      const meta = productMetaByCode.get(code)
      const phases = [...phasesByProduct.get(code).values()]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ sortOrder, ...phase }) => phase)

      return {
        code: SPEC_TO_GESTALT_CODE[code] ?? code.toUpperCase(),
        name: meta?.name ?? code,
        lifecycle: meta?.status ?? 'developing',
        phases,
        v1ApprovedAt: meta?.metadata?.v1_approved_at ?? null,
      }
    })

  return { version: '1.0', products }
}

function questUcNumber(quest) {
  if (quest.uc == null) return null
  if (typeof quest.uc === 'number') return quest.uc
  const match = String(quest.uc).match(/(\d+)/)
  return match ? Number(match[1]) : null
}

export function allQuests(phases) {
  if (!phases) return []
  return phases.flatMap((phase) =>
    phase.quests.map((quest) => ({
      ...quest,
      uc: questUcNumber(quest),
      phaseId: phase.id,
      phaseCodename: phase.codename,
    })),
  )
}

export function allGestaltQuests(productCode = null, roadmapData = gestaltRoadmap) {
  const products = productCode
    ? roadmapData.products.filter((product) => product.code === productCode)
    : roadmapData.products

  return products.flatMap((product) =>
    allQuests(product.phases).map((quest) => ({
      ...quest,
      productCode: product.code,
      productName: product.name,
      lifecycle: product.lifecycle,
    })),
  )
}

export function getRoadmapProgress(phases) {
  const quests = allQuests(phases)
  const done = quests.filter((quest) => quest.status === 'done').length
  const total = quests.length
  return {
    done,
    total,
    percent: total === 0 ? null : Math.round((done / total) * 100),
  }
}

export function getProductProgress(product) {
  if (product.lifecycle === 'designing' && product.phases.length === 0) {
    return { done: 0, total: 0, percent: null, lifecycle: product.lifecycle }
  }
  const progress = getRoadmapProgress(product.phases)
  return { ...progress, lifecycle: product.lifecycle }
}

export function getAllProductsProgress() {
  return gestaltRoadmap.products.map((product) => ({
    code: product.code,
    name: product.name,
    lifecycle: product.lifecycle,
    ...getProductProgress(product),
  }))
}

export function getActiveQuest(phases) {
  return allQuests(phases).find((quest) => quest.status === 'active') ?? null
}

export function getActivePhase(phases) {
  const activeQuest = getActiveQuest(phases)
  if (!activeQuest) {
    return phases[phases.length - 1] ?? null
  }
  return phases.find((phase) => phase.quests.some((quest) => quest.id === activeQuest.id)) ?? phases[0]
}

export function getUseCaseProgress(phases) {
  const byUc = new Map()

  for (const quest of allQuests(phases)) {
    const uc = quest.uc
    if (uc == null) continue
    const entry = byUc.get(uc) ?? { uc, done: 0, total: 0 }
    entry.total += 1
    if (quest.status === 'done') entry.done += 1
    byUc.set(uc, entry)
  }

  return [...byUc.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, entry]) => ({
      ...entry,
      percent: entry.total === 0 ? 0 : Math.round((entry.done / entry.total) * 100),
    }))
}

export function getAllProductsUseCaseProgress(roadmapData = gestaltRoadmap) {
  const byKey = new Map()

  for (const quest of allGestaltQuests(null, roadmapData)) {
    const uc = quest.uc
    if (uc == null) continue
    const key = `${quest.productCode}-${uc}`
    const entry = byKey.get(key) ?? { uc, productCode: quest.productCode, done: 0, total: 0 }
    entry.total += 1
    if (quest.status === 'done') entry.done += 1
    byKey.set(key, entry)
  }

  return [...byKey.values()]
    .sort((a, b) => {
      if (a.productCode !== b.productCode) return a.productCode.localeCompare(b.productCode)
      return a.uc - b.uc
    })
    .map((entry) => ({
      ...entry,
      percent: entry.total === 0 ? 0 : Math.round((entry.done / entry.total) * 100),
    }))
}

const SPEC_TO_GESTALT = {
  io: 'IO',
  deviante: 'DV',
  milebrick: 'MB',
  harpia: 'HA',
}

function ucProgressKey(entry, productFilter) {
  if (productFilter === 'all') return `${entry.productCode}-${entry.uc}`
  return String(entry.uc)
}

/**
 * Merge roadmap UC progress with DB specs. Display order is creation sequence
 * (UC1, UC2, …) — product first when viewing all products.
 */
export function mergeUseCaseProgressWithSpecs(ucProgress, useCases, productFilter = 'all') {
  const existing = new Set(ucProgress.map((entry) => ucProgressKey(entry, productFilter)))
  const merged = [...ucProgress]

  for (const item of useCases) {
    const gestaltCode = SPEC_TO_GESTALT[item.productCode] ?? item.productCode?.toUpperCase?.()
    if (!gestaltCode) continue
    if (productFilter !== 'all' && productFilter !== gestaltCode) continue

    const entry =
      productFilter === 'all'
        ? { uc: item.ucNumber, productCode: gestaltCode, done: 0, total: 0 }
        : { uc: item.ucNumber, done: 0, total: 0 }

    const key = ucProgressKey(entry, productFilter)
    if (existing.has(key)) continue
    existing.add(key)
    merged.push({
      ...entry,
      percent: 0,
    })
  }

  return merged.sort((a, b) => {
    if (productFilter === 'all' && a.productCode !== b.productCode) {
      return a.productCode.localeCompare(b.productCode)
    }
    return a.uc - b.uc
  })
}

export function getFilteredRoadmap(productCode, roadmapData = gestaltRoadmap) {
  if (!productCode || productCode === 'all') {
    return {
      phases: roadmapData.products.flatMap((product) => product.phases),
      productCode: 'all',
    }
  }

  const product = roadmapData.products.find((item) => item.code === productCode) ?? null
  return {
    phases: product?.phases ?? [],
    productCode,
    lifecycle: product?.lifecycle,
  }
}
