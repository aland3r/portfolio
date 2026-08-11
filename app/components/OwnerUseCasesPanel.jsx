'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  fetchAllUseCases,
  fetchUseCasesByProduct,
  isSupabaseConfigured,
  updateUseCaseStatus,
} from '@gestalt/auth'
import BuildProgress from './BuildProgress'
import UseCaseFolioDetail from './UseCaseFolioDetail'
import { useAuth } from './AuthProvider'
import { useLocale } from './LocaleProvider'

const FILTER_TO_SPEC = {
  IO: 'io',
  DV: 'deviante',
  MB: 'milebrick',
  HA: 'harpia',
}

function productFilterFromParams(searchParams) {
  const fromUrl = searchParams.get('product')
  if (!fromUrl) return 'all'
  const roadmapCode = Object.entries(FILTER_TO_SPEC).find(([, code]) => code === fromUrl)?.[0]
  if (!roadmapCode) return 'all'
  // Active UC scope: Deviante + Milebrick (portfolio dropped 11/08/2026)
  if (roadmapCode !== 'DV' && roadmapCode !== 'MB') return 'all'
  return roadmapCode
}

export default function OwnerUseCasesPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLocale()
  const { isOwner, isAuthenticated, authReady } = useAuth()
  const [productFilter, setProductFilter] = useState(() => productFilterFromParams(searchParams))
  const [useCases, setUseCases] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [selectedUc, setSelectedUc] = useState(null)
  const [selectedAllRow, setSelectedAllRow] = useState(null)
  const [editingKey, setEditingKey] = useState(null)

  const ownerDbAccess = authReady && isAuthenticated && isOwner
  const publicOnly = !ownerDbAccess

  const specProductCode = useMemo(() => {
    if (productFilter === 'all') return null
    return FILTER_TO_SPEC[productFilter] ?? null
  }, [productFilter])

  const selectedUcFromUrl = useMemo(() => {
    const raw = searchParams.get('uc')
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }, [searchParams])

  useEffect(() => {
    setSelectedUc(selectedUcFromUrl)
    if (productFilterFromParams(searchParams) !== 'all') {
      setSelectedAllRow(null)
    }
  }, [selectedUcFromUrl, searchParams])

  const selectedUcKey = useMemo(() => {
    if (productFilter === 'all') {
      if (!selectedAllRow) return null
      return `${selectedAllRow.gestaltCode}-${selectedAllRow.uc}`
    }
    return selectedUc != null ? String(selectedUc) : null
  }, [productFilter, selectedAllRow, selectedUc])

  const isCreating = searchParams.get('new') === '1'

  const nextUcNumber = useMemo(
    () => useCases.reduce((max, item) => Math.max(max, item.ucNumber), 0) + 1,
    [useCases],
  )

  useEffect(() => {
    setProductFilter(productFilterFromParams(searchParams))
  }, [searchParams])

  const loadUseCases = useCallback(async () => {
    if (!isSupabaseConfigured() || !authReady) {
      setUseCases([])
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError('')
    try {
      if (productFilter === 'all') {
        const rows = await fetchAllUseCases({ publicOnly, locale })
        setUseCases(rows ?? [])
      } else if (specProductCode) {
        const rows = await fetchUseCasesByProduct(specProductCode, {
          publicOnly,
          withChildren: true,
          withRequirements: false,
          locale,
        })
        setUseCases(rows ?? [])
      } else {
        setUseCases([])
      }
    } catch (err) {
      setUseCases([])
      setLoadError(err instanceof Error ? err.message : t('useCasesSpec.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [authReady, productFilter, publicOnly, specProductCode, t, locale])

  useEffect(() => {
    loadUseCases()
  }, [loadUseCases])

  function syncCasesUrl(params) {
    const query = params.toString()
    const href = query ? `/cases?${query}` : '/cases'
    router.replace(href, { scroll: false })
  }

  function handleProductFilterChange(next) {
    setProductFilter(next)
    setSelectedUc(null)
    setSelectedAllRow(null)
    setEditingKey(null)
    const params = new URLSearchParams()
    const specCode = next === 'all' ? null : FILTER_TO_SPEC[next]
    if (specCode) params.set('product', specCode)
    syncCasesUrl(params)
  }

  function handleStartCreate() {
    setSelectedUc(null)
    setSelectedAllRow(null)
    setEditingKey(null)
    const params = new URLSearchParams()
    if (specProductCode) params.set('product', specProductCode)
    params.set('new', '1')
    syncCasesUrl(params)
  }

  function resolveSpecProductCode(gestaltProductCode = null) {
    if (specProductCode) return specProductCode
    if (!gestaltProductCode) return null
    return FILTER_TO_SPEC[gestaltProductCode] ?? null
  }

  function handleSelectUc(ucNumber, gestaltProductCode = null) {
    // Row / chevron always opens view — never edit.
    setEditingKey(null)

    if (productFilter === 'all') {
      if (!gestaltProductCode) return
      if (
        selectedAllRow?.gestaltCode === gestaltProductCode
        && selectedAllRow?.uc === ucNumber
      ) {
        setSelectedAllRow(null)
      } else {
        setSelectedAllRow({ gestaltCode: gestaltProductCode, uc: ucNumber })
      }
      syncCasesUrl(new URLSearchParams())
      return
    }

    setSelectedAllRow(null)
    if (!specProductCode) return
    const params = new URLSearchParams()
    params.set('product', specProductCode)
    if (selectedUc === ucNumber) {
      setSelectedUc(null)
      syncCasesUrl(params)
      return
    }
    params.set('uc', String(ucNumber))
    setSelectedUc(ucNumber)
    syncCasesUrl(params)
  }

  function handleEditUc(ucNumber, gestaltProductCode = null) {
    const productCode = resolveSpecProductCode(gestaltProductCode)
    if (!productCode) return

    setEditingKey(`${productCode}:${ucNumber}`)

    if (productFilter === 'all') {
      if (!gestaltProductCode) return
      setSelectedAllRow({ gestaltCode: gestaltProductCode, uc: ucNumber })
    } else {
      setSelectedAllRow(null)
      setSelectedUc(ucNumber)
    }

    const params = new URLSearchParams()
    params.set('product', productCode)
    params.set('uc', String(ucNumber))
    syncCasesUrl(params)
  }

  function handleEditEnd() {
    setEditingKey(null)
  }

  async function handleUpdateUcStatus(ucId, { status, visibility }) {
    await updateUseCaseStatus(ucId, { status, visibility })
    await loadUseCases()
  }

  const toolbarActions = ownerDbAccess && !isCreating ? (
    <button
      type="button"
      className="app-hub__action app-hub__action--primary build-progress__new-uc"
      onClick={handleStartCreate}
    >
      {t('useCasesSpec.new')}
    </button>
  ) : null

  const ucListPrefix = (
    <>
      {!loading && loadError ? (
        <p className="alert uc-folio-panel__hint">{loadError}</p>
      ) : null}
      {ownerDbAccess && isCreating ? (
        <div className="build-progress__uc-expand build-progress__uc-expand--create">
          <UseCaseFolioDetail
            useCase={null}
            productCode={specProductCode}
            ownerDbAccess={ownerDbAccess}
            onRefresh={loadUseCases}
            nextUcNumber={nextUcNumber}
          />
        </div>
      ) : null}
      {specProductCode && !loading && !loadError && useCases.length === 0 ? (
        !isSupabaseConfigured() ? (
          <p className="muted uc-folio-panel__hint">{t('useCasesSpec.noDb')}</p>
        ) : authReady && !isAuthenticated ? (
          <p className="muted uc-folio-panel__hint">{t('useCasesSpec.signInHint')}</p>
        ) : authReady && isAuthenticated && !isOwner ? (
          <p className="muted uc-folio-panel__hint">{t('useCasesSpec.ownerOnlyHint')}</p>
        ) : (
          <p className="muted uc-folio-panel__hint">{t('useCasesSpec.empty')}</p>
        )
      ) : null}
    </>
  )

  function renderUcFolio(ucNumber, spec, gestaltProductCode = null) {
    const productCode = resolveSpecProductCode(gestaltProductCode)
    if (!productCode) return null
    const editMode = editingKey === `${productCode}:${ucNumber}`
    return (
      <UseCaseFolioDetail
        useCase={spec}
        productCode={productCode}
        ownerDbAccess={ownerDbAccess}
        onRefresh={loadUseCases}
        nextUcNumber={nextUcNumber}
        embedded
        editMode={editMode}
        onEditEnd={handleEditEnd}
      />
    )
  }

  return (
    <BuildProgress
      detailed
      productFilter={productFilter}
      onProductFilterChange={handleProductFilterChange}
      useCases={useCases}
      selectedUcKey={selectedUcKey}
      onSelectUc={handleSelectUc}
      onEditUc={ownerDbAccess ? handleEditUc : null}
      onUpdateUcStatus={ownerDbAccess ? handleUpdateUcStatus : null}
      useCasesLoading={loading}
      toolbarActions={toolbarActions}
      ucListPrefix={ucListPrefix}
      renderUcFolio={renderUcFolio}
      ownerDbAccess={ownerDbAccess}
    />
  )
}
