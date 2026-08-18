'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  fetchProjectsCatalog,
  getProductByCode,
  isSupabaseConfigured,
} from '@gestalt/auth'
import PublicationCard from '../components/PublicationCard'
import { useLocale } from '../components/LocaleProvider'

function ProjectsPageContent() {
  const { t, locale } = useLocale()
  const searchParams = useSearchParams()
  const productCode = searchParams.get('product')?.trim() ?? ''
  const product = productCode ? getProductByCode(productCode) : null
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const filterOpts = productCode ? { productCode } : {}

      if (isSupabaseConfigured()) {
        try {
          const rows = await fetchProjectsCatalog(locale, filterOpts)
          if (!cancelled && rows && rows.length > 0) {
            setCatalog(rows.filter((entry) => entry.status === 'published'))
            setLoading(false)
            return
          }
        } catch {
          // fall through to empty state
        }
      }

      if (!cancelled) {
        setCatalog([])
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [locale, productCode])

  const visible = useMemo(
    () => catalog.filter((entry) => entry.status === 'published'),
    [catalog],
  )

  return (
    <section className="panel panel--publications">
      <h1>{product ? t('projects.productTitle').replace('{0}', product.name) : t('projects.title')}</h1>
      <p className="publication-prose publication-prose--lead">
        {product ? t('projects.productLead').replace('{0}', product.name) : t('projects.lead')}
      </p>

      {loading ? (
        <p className="muted">{t('misc.loading')}</p>
      ) : (
        <div className="article-feed" role="list">
          {visible.length === 0 ? (
            <p className="muted">{t('projects.empty')}</p>
          ) : null}
          {visible.map((entry) => (
            <PublicationCard
              key={entry.id}
              id={entry.id}
              venueLabel={null}
              coverLabel={t('projects.eyebrow')}
              title={entry.title}
              excerpt={entry.excerpt}
              dateLabel={null}
              readLabel={null}
              statusLabel={entry.status === 'draft' ? t('projects.statusLabel.draft') : null}
              detailHref={`/projects/${entry.id}`}
              externalHref={entry.externalUrl ?? null}
              externalLabel={entry.externalUrl ? t('projects.openExternal') : null}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<section className="panel panel--publications"><p className="muted">…</p></section>}>
      <ProjectsPageContent />
    </Suspense>
  )
}
