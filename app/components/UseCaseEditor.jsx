'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { USE_CASE_PRODUCTS } from '@gestalt/auth'
import { classifyStepFlow } from '../../lib/use-case-step-flow'
import AutoGrowTextarea from './AutoGrowTextarea'
import EditorSelect from './EditorSelect'

const STATUS_OPTIONS = ['draft', 'ready', 'shipped', 'deprecated']
const VISIBILITY_OPTIONS = ['owner', 'public', 'member']

export const UC_EDITOR_FORM_ID = 'uc-editor-form'

function emptyStep(index) {
  return {
    stepKey: String(index + 1),
    actorAction: '',
    systemResponse: '',
    sortOrder: index,
  }
}

function normalizeFormState(initial) {
  const { requirements: _requirements, ...rest } = initial
  return {
    ...rest,
    steps: initial.steps?.length ? initial.steps : [emptyStep(0)],
  }
}

function serializeForm(form) {
  const { requirements: _requirements, ...rest } = form
  return JSON.stringify(rest)
}

function InsertStepDivider({ onInsert, label }) {
  return (
    <tr className="uc-editor__insert-row">
      <td colSpan={4} className="uc-editor__insert-cell">
        <button
          type="button"
          className="uc-editor__insert-btn"
          onClick={onInsert}
          aria-label={label}
          title={label}
        >
          <span aria-hidden="true">+</span>
        </button>
      </td>
    </tr>
  )
}

function flowSectionLabel(kind, labels) {
  if (kind === 'alternative') return labels.stepsAlternatives ?? 'Alternatives'
  if (kind === 'exception') return labels.stepsExceptions ?? 'Exceptions'
  return labels.stepsMain ?? labels.steps ?? 'Main path'
}

function syncAbpFields(current, productCode, ucNumber) {
  const product = USE_CASE_PRODUCTS.find((item) => item.code === productCode)
  const prefix = product ? `ABP-${product.gestaltCode}` : 'ABP-IO'
  return {
    ...current,
    productCode,
    ucNumber,
    abpId: `${prefix}-UC${ucNumber}`,
    shortId: `${productCode.toUpperCase().slice(0, 2)}-UC${ucNumber}`,
  }
}

export default function UseCaseEditor({
  initial,
  labels,
  onSave,
  onCancel,
  onDirtyChange,
  saving = false,
  allowProductPick = false,
}) {
  const [form, setForm] = useState(() => normalizeFormState(initial))
  const [error, setError] = useState('')
  const baselineRef = useRef(serializeForm(normalizeFormState(initial)))

  useEffect(() => {
    const normalized = normalizeFormState(initial)
    baselineRef.current = serializeForm(normalized)
    setForm(normalized)
    onDirtyChange?.(false)
  }, [initial, onDirtyChange])

  useEffect(() => {
    onDirtyChange?.(serializeForm(form) !== baselineRef.current)
  }, [form, onDirtyChange])

  const hasBranchSteps = form.steps.some((step) => classifyStepFlow(step.stepKey) !== 'main')

  function patch(field, value) {
    setForm((current) => {
      if (field === 'productCode' || field === 'ucNumber') {
        const productCode = field === 'productCode' ? value : current.productCode
        const ucNumber = field === 'ucNumber' ? Number(value) : current.ucNumber
        return syncAbpFields(current, productCode, ucNumber)
      }
      return { ...current, [field]: value }
    })
  }

  function patchStep(index, field, value) {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step,
      ),
    }))
  }

  function addStep() {
    setForm((current) => ({
      ...current,
      steps: [...current.steps, emptyStep(current.steps.length)],
    }))
  }

  function insertStepAt(index) {
    setForm((current) => {
      const steps = [...current.steps]
      steps.splice(index, 0, emptyStep(index))
      return {
        ...current,
        steps: steps.map((step, stepIndex) => ({ ...step, sortOrder: stepIndex })),
      }
    })
  }

  function removeStep(index) {
    if (!window.confirm(labels.removeStepConfirm ?? labels.removeStep ?? 'Remove this step?')) {
      return
    }
    setForm((current) => ({
      ...current,
      steps: current.steps.filter((_, stepIndex) => stepIndex !== index),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const { requirements: _requirements, ...savePayload } = form
    try {
      await onSave(savePayload)
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.saveFailed)
    }
  }

  return (
    <div className="uc-editor">
      <form id={UC_EDITOR_FORM_ID} className="uc-editor__form" onSubmit={handleSubmit}>
        {error ? <p className="alert">{error}</p> : null}

        <div className="uc-editor__table-wrap">
          <table className="uc-editor__table uc-editor__table--identity">
            <thead>
              <tr>
                {allowProductPick ? <th scope="col">{labels.product}</th> : null}
                <th scope="col">{labels.fieldTitle}</th>
                <th scope="col">{labels.abpId}</th>
                <th scope="col" className="uc-editor__col--num">#</th>
                <th scope="col" className="uc-editor__col--status">{labels.status}</th>
                <th scope="col" className="uc-editor__col--status">{labels.visibility}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {allowProductPick ? (
                  <td>
                    <EditorSelect
                      value={form.productCode}
                      onChange={(next) => patch('productCode', next)}
                      aria-label={labels.product}
                      options={USE_CASE_PRODUCTS.map((product) => ({
                        value: product.code,
                        label: product.gestaltCode,
                      }))}
                    />
                  </td>
                ) : null}
                <td>
                  <input
                    value={form.title}
                    onChange={(e) => patch('title', e.target.value)}
                    required
                    spellCheck={false}
                  />
                </td>
                <td>
                  <input
                    className="uc-editor__abp-id"
                    value={form.abpId}
                    onChange={(e) => patch('abpId', e.target.value)}
                    required
                    spellCheck={false}
                  />
                </td>
                <td className="uc-editor__col--num">
                  <input
                    type="number"
                    min="1"
                    value={form.ucNumber}
                    onChange={(e) => patch('ucNumber', Number(e.target.value))}
                    required
                    spellCheck={false}
                  />
                </td>
                <td className="uc-editor__col--status">
                  <EditorSelect
                    value={form.status}
                    onChange={(next) => patch('status', next)}
                    aria-label={labels.status}
                    options={STATUS_OPTIONS.map((option) => ({
                      value: option,
                      label: option,
                    }))}
                  />
                </td>
                <td className="uc-editor__col--status">
                  <EditorSelect
                    value={form.visibility}
                    onChange={(next) => patch('visibility', next)}
                    aria-label={labels.visibility}
                    options={VISIBILITY_OPTIONS.map((option) => ({
                      value: option,
                      label: option,
                    }))}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <aside className="uc-editor__description" aria-label={labels.description}>
          <p className="uc-editor__description-label">{labels.description}</p>
          <div className="uc-editor__description-fields">
            <label className="uc-editor__description-row">
              <span className="uc-editor__description-key">{labels.why}</span>
              <AutoGrowTextarea
                value={form.descriptionWhy ?? ''}
                onChange={(e) => patch('descriptionWhy', e.target.value)}
              />
            </label>
            <label className="uc-editor__description-row">
              <span className="uc-editor__description-key">{labels.what}</span>
              <AutoGrowTextarea
                value={form.descriptionWhat ?? ''}
                onChange={(e) => patch('descriptionWhat', e.target.value)}
              />
            </label>
            <label className="uc-editor__description-row">
              <span className="uc-editor__description-key">{labels.bounds}</span>
              <AutoGrowTextarea
                value={form.descriptionBounds ?? ''}
                onChange={(e) => patch('descriptionBounds', e.target.value)}
              />
            </label>
          </div>
        </aside>

        <div className="uc-editor__table-wrap">
          <table className="uc-editor__table uc-editor__table--meta">
            <colgroup>
              <col className="uc-editor__col--meta-key" />
              <col />
              <col className="uc-editor__col--meta-inline-key" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">{labels.actor}</th>
                <td>
                  <input
                    value={form.actor ?? ''}
                    onChange={(e) => patch('actor', e.target.value)}
                    spellCheck={false}
                  />
                </td>
                <th scope="row">{labels.object}</th>
                <td>
                  <input
                    value={form.objectName ?? ''}
                    onChange={(e) => patch('objectName', e.target.value)}
                    spellCheck={false}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">{labels.preCondition}</th>
                <td colSpan={3}>
                  <AutoGrowTextarea
                    value={form.preCondition ?? ''}
                    onChange={(e) => patch('preCondition', e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">{labels.postCondition}</th>
                <td colSpan={3}>
                  <AutoGrowTextarea
                    value={form.postCondition ?? ''}
                    onChange={(e) => patch('postCondition', e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="uc-editor__table-wrap">
          <table className="uc-editor__table uc-editor__table--steps">
            <colgroup>
              <col className="uc-editor__col--step" />
              <col />
              <col />
              <col className="uc-editor__col--action" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{labels.step}</th>
                <th scope="col">{labels.actorAction}</th>
                <th scope="col">{labels.systemResponse}</th>
                <th scope="col">
                  <span className="visually-hidden">{labels.removeStep}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {form.steps.map((step, index) => {
                const flow = classifyStepFlow(step.stepKey)
                const prevFlow = index > 0
                  ? classifyStepFlow(form.steps[index - 1].stepKey)
                  : null
                const showBand = hasBranchSteps && flow !== prevFlow

                return (
                  <Fragment key={`step-${index}`}>
                    <InsertStepDivider
                      onInsert={() => insertStepAt(index)}
                      label={labels.insertStep ?? 'Insert step here'}
                    />
                    {showBand ? (
                      <tr className={`uc-editor__flow-band uc-editor__flow-band--${flow}`}>
                        <th scope="colgroup" colSpan={4}>
                          {flowSectionLabel(flow, labels)}
                        </th>
                      </tr>
                    ) : null}
                    <tr className={`uc-editor__step-row uc-editor__step-row--${flow}`}>
                      <td className="uc-editor__col--step">
                        <input
                          value={step.stepKey}
                          onChange={(e) => patchStep(index, 'stepKey', e.target.value)}
                          aria-label={labels.step}
                          spellCheck={false}
                        />
                      </td>
                      <td>
                        <AutoGrowTextarea
                          value={step.actorAction}
                          onChange={(e) => patchStep(index, 'actorAction', e.target.value)}
                          aria-label={labels.actorAction}
                        />
                      </td>
                      <td>
                        <AutoGrowTextarea
                          value={step.systemResponse}
                          onChange={(e) => patchStep(index, 'systemResponse', e.target.value)}
                          aria-label={labels.systemResponse}
                        />
                      </td>
                      <td className="uc-editor__col--action">
                        {form.steps.length > 1 ? (
                          <button
                            type="button"
                            className="uc-editor__row-remove"
                            onClick={() => removeStep(index)}
                            aria-label={labels.removeStep}
                            title={labels.removeStep}
                          >
                            ×
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
              <InsertStepDivider
                onInsert={() => insertStepAt(form.steps.length)}
                label={labels.insertStep ?? 'Insert step here'}
              />
            </tbody>
          </table>
        </div>

        <div className="uc-editor__footer">
          <p className="uc-editor__steps-hint">
            {labels.stepsHint
              ?? 'Main: 1, 2 · Alternatives: 1a, 2b · Exceptions: 2.1, 2.2'}
          </p>
          <div className="uc-editor__footer-actions">
            <button type="button" className="button" onClick={addStep}>
              {labels.addStep}
            </button>
            {onCancel ? (
              <button type="button" className="button" onClick={onCancel} disabled={saving}>
                {labels.cancel}
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  )
}
