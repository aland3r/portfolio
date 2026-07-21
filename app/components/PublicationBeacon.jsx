'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getPublicationBeacon, publicationBeaconLabelKey } from '../../lib/publication-beacon'
import { useLocale } from './LocaleProvider'

export function PublicationBeacon({
  status,
  visibility,
  showLabel = false,
  size = 'sm',
  className = '',
}) {
  const { t } = useLocale()
  const { tone } = getPublicationBeacon({ status, visibility })
  const label = t(publicationBeaconLabelKey(tone))

  return (
    <span
      className={[
        'publication-beacon',
        `publication-beacon--${tone}`,
        `publication-beacon--${size}`,
        showLabel ? 'publication-beacon--labeled' : '',
        className,
      ].filter(Boolean).join(' ')}
      title={label}
      aria-label={label}
    >
      <span className="publication-beacon__core" aria-hidden="true" />
      {showLabel ? <span className="publication-beacon__text">{label}</span> : null}
    </span>
  )
}

const QUICK_PRESETS = [
  { key: 'shipPublic', status: 'shipped', visibility: 'public' },
  { key: 'readyOwner', status: 'ready', visibility: 'owner' },
  { key: 'draft', status: 'draft', visibility: 'owner' },
  { key: 'deprecated', status: 'deprecated', visibility: 'owner' },
]

/**
 * Clickable beacon — owner-only quick menu to publish/queue/draft/deprecate
 * without opening the full editor. `onChange({status, visibility})` persists
 * (caller owns the actual DB write); this component only picks the preset.
 * Available on every item in the list, open or collapsed.
 */
export function PublicationBeaconMenu({
  status,
  visibility,
  size = 'sm',
  className = '',
  onChange,
}) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setMenuStyle(null)
      return
    }
    const rect = rootRef.current.getBoundingClientRect()
    // Opens to the LEFT of the beacon, not below — below covered the next
    // row(s) in a dense list.
    setMenuStyle({
      top: `${rect.top}px`,
      right: `${window.innerWidth - rect.left + 6}px`,
    })
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function pick(preset) {
    setOpen(false)
    if (preset.status === status && preset.visibility === visibility) return
    setSaving(true)
    try {
      await onChange({ status: preset.status, visibility: preset.visibility })
    } finally {
      setSaving(false)
    }
  }

  return (
    <span ref={rootRef} className="publication-beacon-menu">
      <button
        type="button"
        className="publication-beacon-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-busy={saving || undefined}
        disabled={saving}
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          setOpen((current) => !current)
        }}
      >
        <PublicationBeacon status={status} visibility={visibility} size={size} className={className} />
      </button>
      {open && menuStyle ? (
        <ul
          className="publication-beacon-menu__list"
          role="menu"
          style={menuStyle}
          onClick={(event) => event.stopPropagation()}
        >
          {QUICK_PRESETS.map((preset) => (
            <li key={preset.key}>
              <button
                type="button"
                role="menuitem"
                className="publication-beacon-menu__item"
                onClick={() => pick(preset)}
              >
                <PublicationBeacon status={preset.status} visibility={preset.visibility} size="sm" />
                <span>{t(`publicationBeacon.menu.${preset.key}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </span>
  )
}

export function PublicationBeaconLegend({ className = '' }) {
  const { t } = useLocale()
  const items = [
    { tone: 'live', key: 'publicationBeacon.live' },
    { tone: 'private', key: 'publicationBeacon.private' },
    { tone: 'offline', key: 'publicationBeacon.offline' },
  ]

  return (
    <ul className={['publication-beacon-legend', className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <li key={item.tone} className="publication-beacon-legend__item">
          <span
            className={`publication-beacon publication-beacon--${item.tone} publication-beacon--sm`}
            aria-hidden="true"
          >
            <span className="publication-beacon__core" />
          </span>
          <span>{t(item.key)}</span>
        </li>
      ))}
    </ul>
  )
}
