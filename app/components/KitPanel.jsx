'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { fetchKitDocs, updateKitDoc, isSupabaseConfigured } from '@gestalt/auth'
import {
  applyPlaceholders,
  assembleSectionSlots,
  buildRelationIndex,
  docKey,
  kitDocHref,
  kitListHref,
  listPlaceholders,
  parseSectionSlots,
  resolveDocMarkdown,
} from '../../lib/kit-doc-utils'
import { useAuth } from './AuthProvider'
import { useLocale } from './LocaleProvider'
import AutoGrowTextarea from './AutoGrowTextarea'
import EditorSelect from './EditorSelect'
import { PublicationBeacon, PublicationBeaconLegend } from './PublicationBeacon'

const STATUS_OPTIONS = ['draft', 'ready', 'shipped', 'deprecated']
const VISIBILITY_OPTIONS = ['public', 'owner', 'member']

const KIND_ORDER = ['agent', 'skill', 'command', 'partial', 'architecture']
const CARD_KINDS = new Set(['agent', 'skill', 'partial'])

function kindLabel(kind, t) {
  return t(`kit.kinds.${kind}`) || kind
}

function cardShapeClass(kind) {
  if (kind === 'skill') return 'kit-card kit-card--skill'
  if (kind === 'command') return 'kit-card kit-card--command'
  if (kind === 'agent') return 'kit-card kit-card--agent'
  if (kind === 'partial') return 'kit-card kit-card--partial'
  return 'kit-card kit-card--rect'
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
      <rect x="5.5" y="5.5" width="8" height="8" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10.5 5.5V3.5H2.5v8H4.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Dark code panel: JetBrains Mono body + icon-only copy in the top-right inside the frame. */
function KitCodeFrame({
  children,
  onCopy,
  copied,
  copyLabel,
  copiedLabel,
  className = '',
}) {
  return (
    <div className={`kit-code-frame${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="kit-code-frame__copy"
        onClick={onCopy}
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <div className="kit-code-frame__body">{children}</div>
    </div>
  )
}

function SaveIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="22" height="22" fill="none">
      <path
        d="M4.5 3.5h9.2L16.5 6.3V16.5H4.5V3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M7 3.5V7h6V3.5M7 16.5v-5h6v5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function renderMarkdownLite(md) {
  if (!md) return null
  const lines = String(md).replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0
  let listBuf = []

  function flushList() {
    if (!listBuf.length) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="kit-md__list">
        {listBuf.map((item, idx) => (
          <li key={idx}>{renderInline(item)}</li>
        ))}
      </ul>,
    )
    listBuf = []
  }

  function renderInline(text) {
    const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="kit-md__code">{part.slice(1, -1)}</code>
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        return (
          <a key={index} href={link[2]} className="kit-md__link">
            {link[1]}
          </a>
        )
      }
      return part
    })
  }

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      flushList()
      i += 1
      continue
    }
    if (line.startsWith('```')) {
      flushList()
      const code = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i])
        i += 1
      }
      i += 1
      blocks.push(
        <pre key={`pre-${blocks.length}`} className="kit-md__pre">
          <code>{code.join('\n')}</code>
        </pre>,
      )
      continue
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      flushList()
      const level = heading[1].length
      const Tag = level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5'
      blocks.push(
        <Tag key={`h-${blocks.length}`} className={`kit-md__h kit-md__h--${level}`}>
          {renderInline(heading[2])}
        </Tag>,
      )
      i += 1
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      listBuf.push(line.replace(/^[-*]\s+/, ''))
      i += 1
      continue
    }
    flushList()
    blocks.push(
      <p key={`p-${blocks.length}`} className="kit-md__p">
        {renderInline(line)}
      </p>,
    )
    i += 1
  }
  flushList()
  return blocks
}

function RelationChips({ title, items, emptyLabel }) {
  if (!items?.length) {
    return (
      <div className="kit-relations__group">
        <p className="kit-relations__label">{title}</p>
        <p className="muted kit-relations__empty">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <div className="kit-relations__group">
      <p className="kit-relations__label">{title}</p>
      <ul className="kit-relations__chips">
        {items.map((doc) => (
          <li key={doc.id}>
            <Link
              href={kitDocHref({ kind: doc.kind, slug: doc.slug })}
              className={`kit-rel-chip kit-rel-chip--${doc.kind}`}
            >
              <span className="kit-rel-chip__kind">{doc.kind}</span>
              <span className="kit-rel-chip__title">{doc.title || doc.slug}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function useKitLabels() {
  const { t } = useLocale()
  return useMemo(() => ({
    save: t('kit.save'),
    saving: t('kit.saving'),
    cancel: t('kit.cancel'),
    title: t('kit.titleField'),
    summary: t('kit.summary'),
    body: t('kit.body'),
    status: t('kit.status'),
    visibility: t('kit.visibility'),
    source: t('kit.source'),
    edit: t('kit.edit'),
    empty: t('kit.empty'),
    search: t('kit.search'),
    filterAll: t('kit.filterAll'),
    uses: t('kit.uses'),
    usedBy: t('kit.usedBy'),
    noRelations: t('kit.noRelations'),
    placeholders: t('kit.placeholders'),
    placeholdersHint: t('kit.placeholdersHint'),
    preview: t('kit.preview'),
    copy: t('kit.copy'),
    copied: t('kit.copied'),
    showSource: t('kit.showSource'),
    hideSource: t('kit.hideSource'),
    back: t('kit.back'),
    notFound: t('kit.notFound'),
  }), [t])
}

function KitDocEditor({
  doc,
  labels,
  saving,
  onSave,
  onCancel,
}) {
  const [title, setTitle] = useState(doc.title)
  const [summary, setSummary] = useState(doc.summary)
  const [status, setStatus] = useState(doc.status)
  const [visibility, setVisibility] = useState(doc.visibility)
  const [showSource, setShowSource] = useState(true)
  const [copied, setCopied] = useState(false)

  const placeholderDefs = useMemo(() => listPlaceholders(doc.bodyMd), [doc.bodyMd])
  const usesPlaceholders = placeholderDefs.length > 0

  const [placeholderValues, setPlaceholderValues] = useState(() => {
    const stored = doc.metadata?.placeholders ?? {}
    const next = {}
    for (const { key, defaultValue } of listPlaceholders(doc.bodyMd)) {
      next[key] = stored[key] ?? defaultValue ?? ''
    }
    return next
  })

  const [sectionSlots, setSectionSlots] = useState(() => (
    usesPlaceholders ? [] : parseSectionSlots(doc.bodyMd)
  ))

  useEffect(() => {
    setTitle(doc.title)
    setSummary(doc.summary)
    setStatus(doc.status)
    setVisibility(doc.visibility)
    const defs = listPlaceholders(doc.bodyMd)
    if (defs.length) {
      const stored = doc.metadata?.placeholders ?? {}
      const next = {}
      for (const { key, defaultValue } of defs) {
        next[key] = stored[key] ?? defaultValue ?? ''
      }
      setPlaceholderValues(next)
      setSectionSlots([])
    } else {
      setSectionSlots(parseSectionSlots(doc.bodyMd))
      setPlaceholderValues({})
    }
  }, [doc])

  const resolvedBody = useMemo(() => {
    if (usesPlaceholders) return applyPlaceholders(doc.bodyMd, placeholderValues)
    return assembleSectionSlots(sectionSlots)
  }, [usesPlaceholders, doc.bodyMd, placeholderValues, sectionSlots])

  const dirty = useMemo(() => {
    if (title !== doc.title || summary !== doc.summary || status !== doc.status || visibility !== doc.visibility) {
      return true
    }
    if (usesPlaceholders) {
      const stored = doc.metadata?.placeholders ?? {}
      return placeholderDefs.some(({ key, defaultValue }) => {
        const current = placeholderValues[key] ?? ''
        const original = stored[key] ?? defaultValue ?? ''
        return current !== original
      })
    }
    return assembleSectionSlots(sectionSlots) !== (doc.bodyMd ?? '').trim()
  }, [
    title, summary, status, visibility, doc, usesPlaceholders,
    placeholderDefs, placeholderValues, sectionSlots,
  ])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(resolvedBody)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  async function handleSubmit(event) {
    event?.preventDefault?.()
    if (usesPlaceholders) {
      await onSave({
        title,
        summary,
        status,
        visibility,
        bodyMd: doc.bodyMd,
        metadata: {
          ...(doc.metadata ?? {}),
          placeholders: placeholderValues,
        },
      })
      return
    }
    await onSave({
      title,
      summary,
      status,
      visibility,
      bodyMd: assembleSectionSlots(sectionSlots),
      metadata: doc.metadata ?? {},
    })
  }

  return (
    <>
      <form id="kit-doc-editor-form" className="kit-doc-editor" onSubmit={handleSubmit}>
        <div className="kit-doc-editor__toolbar kit-doc-editor__toolbar--mobile">
          <button type="submit" className="button uc-editor-save uc-editor-save--ready" disabled={saving || !dirty}>
            {saving ? labels.saving : labels.save}
          </button>
          <button type="button" className="button" disabled={saving} onClick={onCancel}>
            {labels.cancel}
          </button>
        </div>

        <div className="kit-doc-editor__meta-row">
          <div className="kit-doc-editor__beacon-preview">
            <PublicationBeacon status={status} visibility={visibility} showLabel size="md" />
          </div>
          <label className="kit-doc-editor__field">
            <span>{labels.title}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={saving} />
          </label>
          <label className="kit-doc-editor__field">
            <span>{labels.status}</span>
            <EditorSelect
              value={status}
              onChange={setStatus}
              aria-label={labels.status}
              disabled={saving}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </label>
          <label className="kit-doc-editor__field">
            <span>{labels.visibility}</span>
            <EditorSelect
              value={visibility}
              onChange={setVisibility}
              aria-label={labels.visibility}
              disabled={saving}
              options={VISIBILITY_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </label>
        </div>

        <label className="kit-doc-editor__field">
          <span>{labels.summary}</span>
          <AutoGrowTextarea value={summary} onChange={(e) => setSummary(e.target.value)} disabled={saving} rows={2} />
        </label>

        <section className="kit-placeholders" aria-label={labels.placeholders}>
          <header className="kit-placeholders__header">
            <h3 className="kit-placeholders__title">{labels.placeholders}</h3>
            <p className="kit-placeholders__hint">{labels.placeholdersHint}</p>
          </header>

          {usesPlaceholders ? (
            <div className="kit-placeholders__grid">
              {placeholderDefs.map(({ key }) => (
                <label key={key} className="kit-doc-editor__field kit-placeholders__field">
                  <span className="kit-placeholders__key">{key}</span>
                  <AutoGrowTextarea
                    value={placeholderValues[key] ?? ''}
                    onChange={(e) => setPlaceholderValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    disabled={saving}
                    rows={2}
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="kit-placeholders__grid">
              {sectionSlots.map((slot, index) => (
                <label key={slot.id} className="kit-doc-editor__field kit-placeholders__field">
                  <span className="kit-placeholders__key">{slot.label}</span>
                  <AutoGrowTextarea
                    value={slot.content}
                    onChange={(e) => {
                      const value = e.target.value
                      setSectionSlots((prev) => prev.map((s, i) => (i === index ? { ...s, content: value } : s)))
                    }}
                    disabled={saving}
                    rows={slot.heading ? 4 : 3}
                  />
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="kit-preview-panel">
          <header className="kit-preview-panel__toolbar">
            <h3 className="kit-preview-panel__title">{labels.preview}</h3>
            <div className="kit-preview-panel__actions">
              <button
                type="button"
                className={`button${showSource ? ' kit-preview-panel__toggle--on' : ''}`}
                onClick={() => setShowSource((v) => !v)}
                aria-pressed={showSource}
              >
                {showSource ? labels.hideSource : labels.showSource}
              </button>
            </div>
          </header>

          {showSource ? (
            <KitCodeFrame
              onCopy={handleCopy}
              copied={copied}
              copyLabel={labels.copy}
              copiedLabel={labels.copied}
            >
              <pre className="kit-code-frame__pre">{resolvedBody}</pre>
            </KitCodeFrame>
          ) : (
            <div className="kit-doc-reader kit-doc-reader__body kit-md">
              {renderMarkdownLite(resolvedBody)}
            </div>
          )}
        </section>

        {doc.sourcePath ? (
          <p className="muted kit-doc__source">{labels.source}: {doc.sourcePath}</p>
        ) : null}
      </form>

      {dirty ? (
        <button
          type="submit"
          form="kit-doc-editor-form"
          className="floating-save-fab"
          disabled={saving}
          aria-label={saving ? labels.saving : labels.save}
          title={labels.save}
        >
          <SaveIcon />
          <span className="floating-save-fab__label">{saving ? labels.saving : labels.save}</span>
        </button>
      ) : null}
    </>
  )
}

function KitDocView({
  doc,
  labels,
  relations,
}) {
  const [copied, setCopied] = useState(false)
  const [showSource, setShowSource] = useState(true)
  const resolved = useMemo(
    () => resolveDocMarkdown(doc, doc.metadata?.placeholders),
    [doc],
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(resolved)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const uses = [
    ...(relations?.outgoing?.agent ?? []),
    ...(relations?.outgoing?.skill ?? []),
    ...(relations?.outgoing?.command ?? []),
    ...(relations?.outgoing?.partial ?? []),
  ]
  const usedBy = [
    ...(relations?.incoming?.agent ?? []),
    ...(relations?.incoming?.skill ?? []),
    ...(relations?.incoming?.command ?? []),
    ...(relations?.incoming?.partial ?? []),
  ]

  return (
    <article className="kit-doc-view">
      <header className="kit-doc-view__header">
        <div className="kit-doc-view__header-top">
          <p className="kit-doc-view__kind">{doc.kind}</p>
          <PublicationBeacon status={doc.status} visibility={doc.visibility} showLabel size="md" />
        </div>
        <h2 className="kit-doc-view__title">{doc.title}</h2>
        {doc.summary ? <p className="kit-doc-view__summary">{doc.summary}</p> : null}
        {doc.sourcePath ? (
          <p className="muted kit-doc__source">{labels.source}: {doc.sourcePath}</p>
        ) : null}
      </header>

      <div className="kit-relations">
        <RelationChips
          title={labels.uses}
          items={uses}
          emptyLabel={labels.noRelations}
        />
        <RelationChips
          title={labels.usedBy}
          items={usedBy}
          emptyLabel={labels.noRelations}
        />
      </div>

      <div className="kit-preview-panel__toolbar kit-preview-panel__toolbar--view">
        <div className="kit-preview-panel__actions">
          <button
            type="button"
            className="button"
            onClick={() => setShowSource((v) => !v)}
            aria-pressed={showSource}
          >
            {showSource ? labels.hideSource : labels.showSource}
          </button>
        </div>
      </div>

      {showSource ? (
        <KitCodeFrame
          onCopy={handleCopy}
          copied={copied}
          copyLabel={labels.copy}
          copiedLabel={labels.copied}
        >
          <pre className="kit-code-frame__pre">{resolved}</pre>
        </KitCodeFrame>
      ) : (
        <div className="kit-doc-reader kit-doc-reader__body kit-md">
          {renderMarkdownLite(resolved)}
        </div>
      )}
    </article>
  )
}

export default function KitPanel() {
  const { t } = useLocale()
  const { isOwner, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const kindFilter = searchParams.get('kind') || 'all'
  const legacyDoc = searchParams.get('doc')
  const editing = searchParams.get('edit') === '1'
  const qParam = searchParams.get('q') || ''

  const [docs, setDocs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(qParam)

  const ownerDbAccess = isOwner && isSupabaseConfigured()
  const publicOnly = !ownerDbAccess
  const labels = useKitLabels()

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError(t('kit.needSupabase'))
      setDocs([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const rows = await fetchKitDocs({ publicOnly })
      setDocs(rows)
    } catch (err) {
      setError(err?.message || String(err))
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [publicOnly, t])

  useEffect(() => {
    if (authLoading) return
    refresh()
  }, [authLoading, refresh])

  useEffect(() => {
    setSearch(qParam)
  }, [qParam])

  /* Legacy `/kit?kind=&doc=` → full-page detail route */
  useEffect(() => {
    if (!legacyDoc || loading) return
    const match = kindFilter !== 'all'
      ? docs.find((d) => d.kind === kindFilter && d.slug === legacyDoc)
      : docs.find((d) => d.slug === legacyDoc)
    if (!match) return
    router.replace(kitDocHref({
      kind: match.kind,
      slug: match.slug,
      edit: editing,
      q: qParam,
    }))
  }, [legacyDoc, kindFilter, docs, loading, editing, qParam, router])

  const relationIndex = useMemo(() => buildRelationIndex(docs), [docs])

  const byKind = useMemo(() => {
    const map = Object.fromEntries(KIND_ORDER.map((k) => [k, []]))
    for (const doc of docs) {
      if (!map[doc.kind]) map[doc.kind] = []
      map[doc.kind].push(doc)
    }
    return map
  }, [docs])

  const filteredDocs = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return docs.filter((doc) => {
      if (kindFilter !== 'all' && doc.kind !== kindFilter) return false
      if (!needle) return true
      return (
        doc.title?.toLowerCase().includes(needle)
        || doc.slug?.toLowerCase().includes(needle)
        || doc.summary?.toLowerCase().includes(needle)
      )
    })
  }, [docs, kindFilter, search])

  function commitSearch(next) {
    setSearch(next)
    router.replace(kitListHref({ kind: kindFilter, q: next }))
  }

  if (authLoading || loading) {
    return <p className="muted">{t('misc.loading')}</p>
  }

  if (legacyDoc) {
    return <p className="muted">{t('misc.loading')}</p>
  }

  return (
    <div className="kit-panel kit-panel--list kit-stack kit-stack--gap-24">
      <header className="kit-panel__intro kit-stack kit-stack--gap-16">
        <h1 className="kit-panel__heading">{t('kit.heading')}</h1>
        <p className="kit-panel__lede">{t('kit.lede')}</p>
        {ownerDbAccess ? <PublicationBeaconLegend /> : null}
      </header>

      <div className="kit-panel__toolbar kit-stack kit-stack--gap-16">
        <nav className="kit-filter kit-cluster kit-cluster--gap-8" aria-label={t('kit.kindsNav')}>
          <Link
            href={kitListHref({ kind: 'all', q: search })}
            className={kindFilter === 'all' ? 'kit-filter__btn kit-filter__btn--active' : 'kit-filter__btn'}
          >
            {labels.filterAll}
            <span className="kit-filter__count">{docs.length}</span>
          </Link>
          {KIND_ORDER.map((kind) => {
            const count = byKind[kind]?.length ?? 0
            if (!count && !CARD_KINDS.has(kind)) return null
            return (
              <Link
                key={kind}
                href={kitListHref({ kind, q: search })}
                className={
                  kind === kindFilter
                    ? `kit-filter__btn kit-filter__btn--${kind} kit-filter__btn--active`
                    : `kit-filter__btn kit-filter__btn--${kind}`
                }
              >
                {kindLabel(kind, t)}
                <span className="kit-filter__count">{count}</span>
              </Link>
            )
          })}
        </nav>

        <label className="kit-panel__search">
          <span className="visually-hidden">{labels.search}</span>
          <input
            type="search"
            value={search}
            placeholder={labels.search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={(e) => commitSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitSearch(e.currentTarget.value)
              }
            }}
          />
        </label>
      </div>

      {error ? <p className="alert" role="alert">{error}</p> : null}

      <div className="kit-panel__list">
        <ul className="kit-card-grid">
          {filteredDocs.map((doc) => {
            const key = docKey(doc.kind, doc.slug)
            const out = relationIndex.outgoing.get(key)
            const inc = relationIndex.incoming.get(key)
            const relCount = (
              (out?.agent?.length ?? 0)
              + (out?.skill?.length ?? 0)
              + (out?.partial?.length ?? 0)
              + (inc?.agent?.length ?? 0)
              + (inc?.skill?.length ?? 0)
              + (inc?.partial?.length ?? 0)
            )
            return (
              <li key={doc.id} className={`kit-card-grid__item kit-card-grid__item--${doc.kind}`}>
                <Link
                  href={kitDocHref({ kind: doc.kind, slug: doc.slug })}
                  className={cardShapeClass(doc.kind)}
                >
                  <PublicationBeacon
                    status={doc.status}
                    visibility={doc.visibility}
                    className="kit-card__beacon"
                  />
                  {doc.kind === 'skill' || doc.kind === 'command' ? null : (
                    <span className="kit-card__kind">{doc.kind}</span>
                  )}
                  <span className="kit-card__title">{doc.title}</span>
                  {doc.summary ? (
                    <span className="kit-card__summary">{doc.summary}</span>
                  ) : null}
                  {relCount > 0 ? (
                    <span className="kit-card__rels">
                      {out?.skill?.slice(0, 2).map((s) => (
                        <span key={`s-${s.id}`} className="kit-card__rel kit-card__rel--skill" title={s.slug}>{s.slug}</span>
                      ))}
                      {out?.partial?.slice(0, 2).map((p) => (
                        <span key={`p-${p.id}`} className="kit-card__rel kit-card__rel--partial" title={p.slug}>{p.slug}</span>
                      ))}
                      {inc?.agent?.slice(0, 2).map((a) => (
                        <span key={`a-${a.id}`} className="kit-card__rel kit-card__rel--agent" title={a.slug}>{a.slug}</span>
                      ))}
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
          {filteredDocs.length === 0 ? (
            <li className="muted kit-card-grid__empty">{labels.empty}</li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}

/** Full-page kit doc — `/kit/[kind]/[slug]`. */
export function KitDetailPanel() {
  const { t } = useLocale()
  const { isOwner, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const kind = typeof params?.kind === 'string' ? params.kind : ''
  const slug = typeof params?.slug === 'string' ? params.slug : ''
  const editing = searchParams.get('edit') === '1'

  const [docs, setDocs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const ownerDbAccess = isOwner && isSupabaseConfigured()
  const publicOnly = !ownerDbAccess
  const labels = useKitLabels()

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError(t('kit.needSupabase'))
      setDocs([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const rows = await fetchKitDocs({ publicOnly })
      setDocs(rows)
    } catch (err) {
      setError(err?.message || String(err))
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [publicOnly, t])

  useEffect(() => {
    if (authLoading) return
    refresh()
  }, [authLoading, refresh])

  const relationIndex = useMemo(() => buildRelationIndex(docs), [docs])

  const activeDoc = useMemo(
    () => docs.find((d) => d.kind === kind && d.slug === slug) ?? null,
    [docs, kind, slug],
  )

  const activeRelations = useMemo(() => {
    if (!activeDoc) return null
    const key = docKey(activeDoc.kind, activeDoc.slug)
    return {
      outgoing: relationIndex.outgoing.get(key),
      incoming: relationIndex.incoming.get(key),
    }
  }, [activeDoc, relationIndex])

  const listReturnHref = kitListHref({ kind: kind || 'all' })

  async function handleSave(fields) {
    if (!activeDoc) return
    setSaving(true)
    setError('')
    try {
      await updateKitDoc(activeDoc.id, fields)
      await refresh()
      router.replace(kitDocHref({ kind: activeDoc.kind, slug: activeDoc.slug, edit: false }))
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return <p className="muted">{t('misc.loading')}</p>
  }

  if (!activeDoc) {
    return (
      <div className="kit-panel kit-panel--detail kit-stack kit-stack--gap-16">
        <Link href={listReturnHref} className="kit-detail__back">
          ← {labels.back}
        </Link>
        <p className="muted">{labels.notFound}</p>
        {error ? <p className="alert" role="alert">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="kit-panel kit-panel--detail kit-stack kit-stack--gap-24">
      <div className="kit-detail__nav kit-cluster kit-cluster--gap-8">
        <Link href={listReturnHref} className="kit-detail__back">
          ← {labels.back}
        </Link>
        {ownerDbAccess && !editing ? (
          <Link
            href={kitDocHref({ kind: activeDoc.kind, slug: activeDoc.slug, edit: true })}
            className="button kit-detail__edit"
          >
            {labels.edit}
          </Link>
        ) : null}
      </div>

      {error ? <p className="alert" role="alert">{error}</p> : null}

      <div className="kit-detail__body">
        {editing && ownerDbAccess ? (
          <KitDocEditor
            doc={activeDoc}
            labels={labels}
            saving={saving}
            onSave={handleSave}
            onCancel={() => router.replace(kitDocHref({ kind: activeDoc.kind, slug: activeDoc.slug }))}
          />
        ) : (
          <KitDocView
            doc={activeDoc}
            labels={labels}
            relations={activeRelations}
          />
        )}
      </div>
    </div>
  )
}
