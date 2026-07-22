'use client'

import Link from 'next/link'
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
  items,
  labels,
  isOwner,
  selectedSlug,
  editingSlug,
  buildHref,
  onSave,
  onDelete,
  onCancelEdit,
  saving = false,
  editLabels,
}) {
  if (!items.length) {
    return <p className="muted">{labels.empty}</p>
  }

  return (
    <div className="uc-list">
      <ol className="uc-list__cards">
        {items.map((item) => {
          const isActive = selectedSlug === item.slug
          const isEditing = editingSlug === item.slug

          return (
            <li
              key={item.id}
              id={`uc-${item.slug}`}
              className={[
                'uc-list__card',
                isActive ? 'uc-list__card--active' : '',
              ].filter(Boolean).join(' ')}
            >
              <header className="uc-list__card-head">
                <div className="uc-list__card-head-left">
                  <span className="uc-list__rank">UC{item.ucNumber}</span>
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
