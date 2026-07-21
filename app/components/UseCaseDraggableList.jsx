'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { reorderUseCases } from '@gestalt/auth'
import UseCaseVaultView from './UseCaseVaultView'
import UseCaseEditor from './UseCaseEditor'
import { PublicationBeacon } from './PublicationBeacon'

function statusClass(status) {
  if (status === 'shipped') return 'uc-list__status uc-list__status--shipped'
  if (status === 'ready') return 'uc-list__status uc-list__status--ready'
  if (status === 'deprecated') return 'uc-list__status uc-list__status--deprecated'
  return 'uc-list__status uc-list__status--draft'
}

export default function UseCaseDraggableList({
  productCode,
  items,
  labels,
  isOwner,
  selectedSlug,
  editingSlug,
  onReorder,
  buildHref,
  onSave,
  onDelete,
  onCancelEdit,
  saving = false,
  editLabels,
}) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleDrop = useCallback(async (targetIndex) => {
    if (!isOwner || dragIndex == null || dragIndex === targetIndex) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }

    const next = [...items]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(targetIndex, 0, moved)

    setDragIndex(null)
    setOverIndex(null)
    setBusy(true)
    setError('')

    try {
      await reorderUseCases(productCode, next.map((item) => item.id))
      onReorder(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.reorderFailed)
    } finally {
      setBusy(false)
    }
  }, [dragIndex, isOwner, items, labels.reorderFailed, onReorder, productCode])

  if (!items.length) {
    return <p className="muted">{labels.empty}</p>
  }

  return (
    <div className="uc-list">
      {isOwner ? (
        <p className="muted uc-list__hint">{labels.dragHint}</p>
      ) : null}
      {error ? <p className="alert">{error}</p> : null}
      {busy ? <p className="muted">{labels.reordering}</p> : null}

      <ol className="uc-list__cards">
        {items.map((item, index) => {
          const isActive = selectedSlug === item.slug
          const isEditing = editingSlug === item.slug
          const isDragging = dragIndex === index
          const isOver = overIndex === index

          return (
            <li
              key={item.id}
              id={`uc-${item.slug}`}
              className={[
                'uc-list__card',
                isActive ? 'uc-list__card--active' : '',
                isDragging ? 'uc-list__card--dragging' : '',
                isOver ? 'uc-list__card--over' : '',
              ].filter(Boolean).join(' ')}
              draggable={isOwner && !busy && !isEditing}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
              onDragOver={(event) => {
                if (!isOwner || isEditing) return
                event.preventDefault()
                setOverIndex(index)
              }}
              onDrop={(event) => {
                event.preventDefault()
                handleDrop(index)
              }}
            >
              <header className="uc-list__card-head">
                <div className="uc-list__card-head-left">
                  {isOwner ? (
                    <span className="uc-list__handle" aria-hidden="true">⋮⋮</span>
                  ) : (
                    <span className="uc-list__rank">{index + 1}</span>
                  )}
                  <div>
                    <p className="uc-list__id">{item.abpId}</p>
                    <h3 className="uc-list__title">{item.title}</h3>
                  </div>
                </div>

                <div className="uc-list__card-head-right">
                  <PublicationBeacon
                    status={item.status}
                    visibility={item.visibility}
                    showLabel={isOwner}
                  />
                  {isOwner ? (
                    <span className={statusClass(item.status)}>{item.status}</span>
                  ) : null}
                  {isOwner && item.visibility !== 'public' ? (
                    <span className="uc-list__visibility">{item.visibility}</span>
                  ) : null}
                  {isOwner ? (
                    <div className="uc-list__card-actions">
                      {isEditing ? (
                        <Link href={buildHref(item.slug)} className="button">
                          {editLabels.view}
                        </Link>
                      ) : (
                        <Link href={buildHref(item.slug, { edit: true })} className="button button--primary">
                          {editLabels.edit}
                        </Link>
                      )}
                      <button
                        type="button"
                        className="button button--danger"
                        disabled={saving}
                        onClick={() => onDelete(item)}
                      >
                        {editLabels.delete}
                      </button>
                    </div>
                  ) : null}
                </div>
              </header>

              {isEditing ? (
                <UseCaseEditor
                  initial={item}
                  labels={labels}
                  saving={saving}
                  onSave={onSave}
                  onCancel={() => onCancelEdit(item.slug)}
                />
              ) : (
                <UseCaseVaultView useCase={item} labels={labels} />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
