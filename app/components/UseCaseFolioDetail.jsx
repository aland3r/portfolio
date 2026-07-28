'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  buildDefaultUseCase,
  createUseCase,
  deleteUseCase,
  updateUseCase,
} from '@gestalt/auth'
import UseCaseEditor, { UC_EDITOR_FORM_ID } from './UseCaseEditor'
import UseCaseVaultView from './UseCaseVaultView'
import { getUseCaseLabels } from './UseCasesSpecPanel'
import { useLocale } from './LocaleProvider'

function UcEditorSaveButton({ saving, saveLabel, savingLabel, ready = false }) {
  return (
    <button
      type="submit"
      form={UC_EDITOR_FORM_ID}
      className={
        ready
          ? 'button uc-editor-save uc-editor-save--ready'
          : 'button uc-editor-save'
      }
      disabled={saving}
      aria-busy={saving || undefined}
    >
      {saving ? savingLabel : saveLabel}
    </button>
  )
}

function TrashGlyph({ className = 'button__glyph' }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none">
        <path
          d="M3.5 4.5h9M6 4.5V3.25A.75.75 0 0 1 6.75 2.5h2.5a.75.75 0 0 1 .75.75V4.5m-5.5 0 .6 8.1a1 1 0 0 0 1 .9h3.3a1 1 0 0 0 1-.9l.6-8.1M6.75 7v4.5M9.25 7v4.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function EditGlyph({ className = 'button__glyph' }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M10.8 2.4 13.6 5.2 6.2 12.6 3.1 13.5 4 10.4 10.8 2.4zM2 14h12v1.2H2V14z" />
      </svg>
    </span>
  )
}

function EditingShell({
  saveReady,
  saving,
  error,
  children,
  saveLabel,
  savingLabel,
  embedded = false,
  onDelete,
  deleteLabel,
}) {
  // Embedded accordion already pins the UC row (sticky top: 0). Keep the
  // SAVE toolbar in normal flow there — a second sticky offset overlaps the
  // identity row. Standalone folio may still use sticky chrome.
  const panelClass = [
    'uc-folio-panel',
    'uc-folio-panel--editing',
    embedded ? 'uc-folio-panel--embedded' : '',
    saveReady ? 'uc-folio-panel--dirty' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={panelClass}>
      <div className="uc-folio-panel__toolbar uc-folio-panel__toolbar--sticky">
        <div
          className="uc-folio-panel__actions uc-folio-panel__actions--toolbar"
          aria-live="polite"
        >
          {onDelete ? (
            <button
              type="button"
              className="button button--danger"
              disabled={saving}
              aria-label={deleteLabel}
              title={deleteLabel}
              onClick={onDelete}
            >
              <TrashGlyph />
              <span>{deleteLabel}</span>
            </button>
          ) : null}
          <UcEditorSaveButton
            saving={saving}
            saveLabel={saveLabel}
            savingLabel={savingLabel}
            ready={saveReady}
          />
        </div>
      </div>
      {error ? <p className="alert" role="alert">{error}</p> : null}
      {children}
    </div>
  )
}

export default function UseCaseFolioDetail({
  useCase,
  productCode,
  basePath = '/cases',
  ownerDbAccess = false,
  onRefresh,
  nextUcNumber = 1,
  embedded = false,
  editMode = false,
  onEditEnd,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const labels = getUseCaseLabels(t)
  const createParam = searchParams.get('new') === '1'
  // Expand: editor only via pencil (editMode). Standalone: also allow ?edit=1.
  const editingThisUc = Boolean(
    ownerDbAccess
    && (editMode === true || (!embedded && searchParams.get('edit') === '1')),
  )
  const [saving, setSaving] = useState(false)
  const [formDirty, setFormDirty] = useState(false)
  const [error, setError] = useState('')
  const saveReady = createParam || formDirty

  function buildHref({ uc, slug, edit = false, create = false, product = productCode } = {}) {
    const params = new URLSearchParams()
    const resolvedProduct = product ?? productCode
    if (resolvedProduct) params.set('product', resolvedProduct)
    if (create) params.set('new', '1')
    else if (uc != null) params.set('uc', String(uc))
    else if (slug) params.set('slug', slug)
    if (edit) params.set('edit', '1')
    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  async function handleSave(form) {
    setSaving(true)
    setError('')
    try {
      const saved = form.id ? await updateUseCase(form.id, form) : await createUseCase(form)
      await onRefresh?.()
      onEditEnd?.()
      router.replace(buildHref({ uc: saved.ucNumber, product: saved.productCode }))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('useCasesSpec.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!useCase?.id || !window.confirm(t('useCasesSpec.deleteConfirm'))) return
    setSaving(true)
    setError('')
    try {
      await deleteUseCase(useCase.id)
      await onRefresh?.()
      onEditEnd?.()
      const params = new URLSearchParams()
      params.set('product', productCode)
      router.replace(`${basePath}?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('useCasesSpec.deleteFailed'))
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    onEditEnd?.()
    if (useCase?.ucNumber != null) {
      router.replace(buildHref({ uc: useCase.ucNumber }))
    } else {
      router.replace(buildHref())
    }
  }

  if (createParam && ownerDbAccess) {
    const draft = buildDefaultUseCase(productCode ?? 'deviante', nextUcNumber)
    return (
      <EditingShell
        saveReady={saveReady}
        saving={saving}
        error={error}
        saveLabel={t('useCasesSpec.save')}
        savingLabel={t('useCasesSpec.saving')}
        embedded={embedded}
      >
        <UseCaseEditor
          initial={draft}
          labels={labels}
          saving={saving}
          allowProductPick={!productCode}
          onDirtyChange={setFormDirty}
          onSave={handleSave}
          onCancel={handleCancelEdit}
        />
      </EditingShell>
    )
  }

  if (!useCase) {
    return (
      <p className="muted uc-folio-panel__hint">{t('useCasesSpec.pickUc')}</p>
    )
  }

  if (editingThisUc) {
    return (
      <EditingShell
        saveReady={saveReady}
        saving={saving}
        error={error}
        saveLabel={t('useCasesSpec.save')}
        savingLabel={t('useCasesSpec.saving')}
        embedded={embedded}
        onDelete={handleDelete}
        deleteLabel={t('useCasesSpec.delete')}
      >
        <UseCaseEditor
          initial={useCase}
          labels={labels}
          saving={saving}
          onDirtyChange={setFormDirty}
          onSave={handleSave}
          onCancel={handleCancelEdit}
        />
      </EditingShell>
    )
  }

  return (
    <div className={embedded ? 'uc-folio-panel uc-folio-panel--embedded' : 'uc-folio-panel'}>
      {!embedded ? (
        <div className="uc-folio-panel__toolbar">
          <div>
            <p className="uc-folio-panel__id">{useCase.abpId}</p>
            <h3 className="uc-folio-panel__title">{useCase.title}</h3>
          </div>
          {ownerDbAccess ? (
            <div className="uc-folio-panel__actions uc-folio-panel__actions--toolbar">
              <Link
                href={buildHref({ uc: useCase.ucNumber, edit: true })}
                className="button button--primary"
                aria-label={t('useCasesSpec.edit')}
                title={t('useCasesSpec.edit')}
              >
                <EditGlyph />
                <span>{t('useCasesSpec.edit')}</span>
              </Link>
              <button
                type="button"
                className="button button--danger"
                disabled={saving}
                aria-label={t('useCasesSpec.delete')}
                title={t('useCasesSpec.delete')}
                onClick={handleDelete}
              >
                <TrashGlyph />
                <span>{t('useCasesSpec.delete')}</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="alert">{error}</p> : null}
      <UseCaseVaultView useCase={useCase} labels={labels} layout="folio" compact={embedded} />
    </div>
  )
}
