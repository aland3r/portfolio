'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  fetchPublicationsCatalog,
  getProductByCode,
  isSupabaseConfigured,
} from '@gestalt/auth'
import {
  getPublicationExternal,
  getPublicationVenueLabel,
  loadStaticPublications,
  PUBLICATION_FILTERS,
} from '../../lib/publications.js'
import PublicationCard, { formatDate } from '../components/PublicationCard'
import { useLocale } from '../components/LocaleProvider'

function PublicationsPageContent() {
  const { t, locale, messages } = useLocale()
  const searchParams = useSearchParams()
  const productCode = searchParams.get('product')?.trim() ?? ''
  const product = productCode ? getProductByCode(productCode) : null
  const [filter, setFilter] = useState('all')
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('static')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const filterOpts = productCode ? { productCode } : {}

      if (isSupabaseConfigured()) {
        try {
          const rows = await fetchPublicationsCatalog(locale, filterOpts)
          if (!cancelled && rows && rows.length > 0) {
            setCatalog(rows)
            setSource('db')
            setLoading(false)
            return
          }
        } catch {
          // fall through to static JSON
        }
      }

      if (!cancelled) {
        setCatalog(loadStaticPublications(messages, filterOpts))
        setSource('static')
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [locale, messages, productCode])

  const visible = useMemo(
    () => (filter === 'all' ? catalog : catalog.filter((entry) => entry.venue === filter)),
    [catalog, filter],
  )

  return (
    <section className="panel panel--publications">
      <p className="eyebrow">
        {product ? t('publications.productEyebrow').replace('{0}', product.name) : t('publications.eyebrow')}
      </p>
      <h1>{product ? t('publications.productTitle').replace('{0}', product.name) : t('publications.title')}</h1>
      <p className="publication-prose publication-prose--lead">
        {product ? t('publications.productLead').replace('{0}', product.name) : t('publications.lead')}
      </p>

      <div className="article-filter" role="tablist" aria-label={t('publications.filterLabel')}>
        {PUBLICATION_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={filter === key ? 'article-filter__btn article-filter__btn--active' : 'article-filter__btn'}
            onClick={() => setFilter(key)}
          >
            {t(`publications.filters.${key}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">{t('misc.loading')}</p>
      ) : (
        <div className="article-feed" role="list">
          {visible.length === 0 ? (
            <p className="muted">{t('publications.empty')}</p>
          ) : null}
          {visible.map((entry) => {
            const venueLabel = getPublicationVenueLabel(entry, t)
            const dateText = formatDate(entry.publishedAt, locale)
            const external = getPublicationExternal(entry, t)

            return (
              <PublicationCard
                key={entry.id}
                id={entry.id}
                venueLabel={venueLabel}
                title={entry.title}
                excerpt={entry.excerpt}
                dateLabel={dateText ? { iso: entry.publishedAt, text: dateText } : null}
                readLabel={
                  entry.readMinutes
                    ? t('publications.readTime').replace('{0}', String(entry.readMinutes))
                    : null
                }
                statusLabel={entry.status === 'draft' ? t('publications.statusLabel.draft') : null}
                detailHref={`/projects/${entry.id}`}
                externalHref={external?.href ?? null}
                externalLabel={external?.label ?? null}
                readLabelText={t('publications.open')}
              />
            )
          })}
        </div>
      )}

      {source === 'db' ? (
        <p className="muted publication-feed__source">{t('publications.fromDb')}</p>
      ) : null}
    </section>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<section className="panel panel--publications"><p className="muted">…</p></section>}>
      <PublicationsPageContent />
    </Suspense>
  )
}
