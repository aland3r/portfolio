'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  buildDefaultUseCase,
  createUseCase,
  deleteUseCase,
  fetchUseCasesByProduct,
  isSupabaseConfigured,
  updateUseCase,
  USE_CASE_PRODUCTS,
} from '@gestalt/auth'
import { useAuth } from './AuthProvider'
import { useLocale } from './LocaleProvider'
import UseCaseDraggableList from './UseCaseDraggableList'
import UseCaseEditor from './UseCaseEditor'

export function getUseCaseLabels(t) {
  return {
    description: t('useCasesSpec.description'),
    why: t('useCasesSpec.why'),
    what: t('useCasesSpec.what'),
    bounds: t('useCasesSpec.bounds'),
    useCaseId: t('useCasesSpec.useCaseId'),
    useCaseName: t('useCasesSpec.useCaseName'),
    actor: t('useCasesSpec.actor'),
    object: t('useCasesSpec.object'),
    preCondition: t('useCasesSpec.preCondition'),
    postCondition: t('useCasesSpec.postCondition'),
    step: t('useCasesSpec.step'),
    stepsMain: t('useCasesSpec.stepsMain'),
    stepsAlternatives: t('useCasesSpec.stepsAlternatives'),
    stepsExceptions: t('useCasesSpec.stepsExceptions'),
    actorAction: t('useCasesSpec.actorAction'),
    systemResponse: t('useCasesSpec.systemResponse'),
    acceptanceCriteria: t('useCasesSpec.acceptanceCriteria'),
    fieldTitle: t('useCasesSpec.fieldTitle'),
    product: t('useCasesSpec.fieldProduct'),
    abpId: t('useCasesSpec.abpId'),
    ucNumber: t('useCasesSpec.ucNumber'),
    status: t('useCasesSpec.status'),
    visibility: t('useCasesSpec.visibility'),
    metadata: t('useCasesSpec.metadata'),
    steps: t('useCasesSpec.steps'),
    stepsHint: t('useCasesSpec.stepsHint'),
    addStep: t('useCasesSpec.addStep'),
    removeStep: t('useCasesSpec.removeStep'),
    removeStepConfirm: t('useCasesSpec.removeStepConfirm'),
    addRequirement: t('useCasesSpec.addRequirement'),
    removeRequirement: t('useCasesSpec.removeRequirement'),
    reqCode: t('useCasesSpec.reqCode'),
    reqTitle: t('useCasesSpec.reqTitle'),
    reqBody: t('useCasesSpec.reqBody'),
    bodyMd: t('useCasesSpec.bodyMd'),
    bodyMdHint: t('useCasesSpec.bodyMdHint'),
    save: t('useCasesSpec.save'),
    saving: t('useCasesSpec.saving'),
    saveFailed: t('useCasesSpec.saveFailed'),
    cancel: t('useCasesSpec.cancel'),
    preview: t('useCasesSpec.preview'),
    empty: t('useCasesSpec.empty'),
    dragHint: t('useCasesSpec.dragHint'),
    reorderFailed: t('useCasesSpec.reorderFailed'),
    reordering: t('useCasesSpec.reordering'),
  }
}

export default function UseCasesSpecPanel({ productCode, basePath = '/cases' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const { isOwner, isAuthenticated, authReady } = useAuth()
  const labels = useMemo(() => getUseCaseLabels(t), [t])
  const editLabels = useMemo(() => ({
    edit: t('useCasesSpec.edit'),
    view: t('useCasesSpec.view'),
    delete: t('useCasesSpec.delete'),
  }), [t])

  const slugParam = searchParams.get('slug')
  const editParam = searchParams.get('edit') === '1'
  const createParam = searchParams.get('new') === '1'

  const product = USE_CASE_PRODUCTS.find((item) => item.code === productCode)
  const ownerDbAccess = authReady && isAuthenticated && isOwner
  const publicOnly = !ownerDbAccess

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const buildHref = useCallback((slug, { edit = false, create = false } = {}) => {
    const params = new URLSearchParams()
    params.set('product', productCode)
    if (create) params.set('new', '1')
    else if (slug) params.set('slug', slug)
    if (edit) params.set('edit', '1')
    return `${basePath}?${params.toString()}`
  }, [basePath, productCode])

  const loadList = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setList([])
      setLoading(false)
      return
    }

    if (!authReady) return

    setLoading(true)
    setError('')
    try {
      const rows = await fetchUseCasesByProduct(productCode, { publicOnly, withChildren: true })
      setList(rows ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('useCasesSpec.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [authReady, productCode, publicOnly, t])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (!slugParam || createParam) return
    const target = document.getElementById(`uc-${slugParam}`)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [createParam, slugParam, list.length])

  async function handleSave(form) {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const payload = form.id ? form : { ...form, sortOrder: list.length }
      const saved = form.id
        ? await updateUseCase(form.id, payload)
        : await createUseCase(payload)
      setMessage(t('useCasesSpec.saved'))
      await loadList()
      router.replace(buildHref(saved.slug))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('useCasesSpec.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!item?.id || !window.confirm(t('useCasesSpec.deleteConfirm'))) return

    setSaving(true)
    setError('')
    try {
      await deleteUseCase(item.id)
      setMessage(t('useCasesSpec.deleted'))
      await loadList()
      router.replace(buildHref())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('useCasesSpec.deleteFailed'))
    } finally {
      setSaving(false)
    }
  }

  const createDraft = useMemo(() => {
    if (!createParam || !ownerDbAccess) return null
    const nextNumber = list.reduce((max, item) => Math.max(max, item.ucNumber), 0) + 1
    return buildDefaultUseCase(productCode, nextNumber)
  }, [createParam, list, ownerDbAccess, productCode])

  if (!product) return null

  return (
    <section className="uc-spec-panel">
      <div className="uc-spec-panel__head">
        <h2>{t('useCasesSpec.sectionTitle').replace('{0}', product.name)}</h2>
        <p className="muted uc-spec-panel__count">
          {loading ? t('misc.loading') : t('useCasesSpec.count').replace('{0}', String(list.length))}
        </p>
        {ownerDbAccess ? (
          <Link href={buildHref(null, { create: true })} className="button button--primary">
            {t('useCasesSpec.new')}
          </Link>
        ) : null}
      </div>

      {!isSupabaseConfigured() ? (
        <p className="muted">{t('useCasesSpec.noDb')}</p>
      ) : null}

      {isOwner && authReady && !isAuthenticated ? (
        <p className="muted">{t('useCasesSpec.signInHint')}</p>
      ) : null}

      {error ? <p className="alert">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      {createDraft ? (
        <div className="uc-spec-panel__create">
          <h3>{t('useCasesSpec.newTitle')}</h3>
          <UseCaseEditor
            initial={createDraft}
            labels={labels}
            saving={saving}
            onSave={handleSave}
            onCancel={() => router.replace(buildHref())}
          />
        </div>
      ) : null}

      {loading || !authReady ? (
        <p className="muted">{t('misc.loading')}</p>
      ) : (
        <UseCaseDraggableList
          productCode={productCode}
          items={list}
          labels={labels}
          editLabels={editLabels}
          isOwner={ownerDbAccess}
          selectedSlug={slugParam}
          editingSlug={editParam ? slugParam : null}
          onReorder={setList}
          buildHref={(slug, opts) => buildHref(slug, opts)}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancelEdit={(slug) => router.replace(buildHref(slug))}
          saving={saving}
        />
      )}
    </section>
  )
}
