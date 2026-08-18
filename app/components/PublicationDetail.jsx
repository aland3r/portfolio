'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  fetchProjectDetail,
  fetchPublicationDetail,
  isSupabaseConfigured,
} from '@gestalt/auth'
import {
  getPublicationExternal,
  getPublicationExternalSoon,
  loadStaticPublications,
} from '../../lib/publications.js'
import {
  loadStaticProjectAsPublication,
  mapProjectAsPublication,
  resolveProjectCode,
} from '../../lib/project-publication.js'
import ProjectHero from './ProjectHero'
import { useLocale } from './LocaleProvider'
import { formatDate } from './PublicationCard'

export default function PublicationDetail() {
  const { id } = useParams()
  const { t, locale, messages } = useLocale()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    let cancelled = false
    const slug = String(id ?? '')
    const projectCode = resolveProjectCode(slug)

    async function load() {
      setLoading(true)
      setResolved(false)

      if (isSupabaseConfigured()) {
        try {
          const project = await fetchProjectDetail(projectCode, locale)
          if (!cancelled && project) {
            setEntry(mapProjectAsPublication(project))
            setResolved(true)
            setLoading(false)
            return
          }
        } catch {
          // fall through
        }

        try {
          const row = await fetchPublicationDetail(slug, locale)
          if (!cancelled && row) {
            setEntry({ ...row, detailKind: 'publication' })
            setResolved(true)
            setLoading(false)
            return
          }
        } catch {
          // fall through
        }
      }

      if (!cancelled) {
        const staticProject = loadStaticProjectAsPublication(projectCode, locale)
        if (staticProject) {
          setEntry(staticProject)
          setResolved(true)
          setLoading(false)
          return
        }

        const staticEntry = loadStaticPublications(messages).find((item) => item.id === slug) ?? null
        setEntry(staticEntry ? { ...staticEntry, detailKind: 'publication' } : null)
        setResolved(Boolean(staticEntry))
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, locale, messages])

  const copyNs = entry?.detailKind === 'publication' ? 'publications' : 'projects'
  const isProject = entry?.detailKind !== 'publication'

  if (loading) {
    return (
      <section className="panel panel--publications">
        <p className="muted">{t('misc.loading')}</p>
      </section>
    )
  }

  if (!resolved || !entry) {
    return (
      <section className="panel panel--publications">
        <p className="muted">{t(`${copyNs}.notFound`)}</p>
        <p>
          <Link href="/projects" className="publication-detail__back">
            {t(`${copyNs}.back`)}
          </Link>
        </p>
      </section>
    )
  }

  const dateText = formatDate(entry.publishedAt, locale)
  const isPublished = entry.status === 'published'
  const external = getPublicationExternal(entry, t)
  const externalSoon = getPublicationExternalSoon(entry, t)

  return (
    <article className={`publication-detail${isProject ? ' publication-detail--project' : ''}`}>
      {isProject ? (
        <ProjectHero
          coverUrl={entry.coverUrl}
          label={t('projects.heroImage')}
        />
      ) : null}

      <div className="panel panel--publications publication-detail__content">
      <Link href="/projects" className="publication-detail__back">
        ← {t(`${copyNs}.back`)}
      </Link>

      <h1 className="publication-prose publication-detail__title">{entry.title}</h1>

      <p className="publication-card__meta publication-detail__meta">
        {dateText ? (
          <>
            <time dateTime={entry.publishedAt}>{dateText}</time>
            <span className="publication-card__dot" aria-hidden="true">·</span>
          </>
        ) : null}
        {entry.readMinutes ? (
          <span>{t('publications.readTime').replace('{0}', String(entry.readMinutes))}</span>
        ) : null}
        {!isPublished ? (
          <>
            <span className="publication-card__dot" aria-hidden="true">·</span>
            <span className="publication-card__status">{t(`${copyNs}.statusLabel.draft`)}</span>
          </>
        ) : null}
      </p>

      <p className="publication-prose publication-prose--lead">{entry.excerpt}</p>

      {entry.body.length > 0 ? (
        <div className="publication-prose publication-prose--body">
          {entry.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="muted publication-detail__empty">{t(`${copyNs}.bodySoon`)}</p>
      )}

      {external ? (
        <p className="publication-detail__external-wrap">
          <a
            href={external.href}
            className="publication-detail__external"
            target="_blank"
            rel="noreferrer"
          >
            {external.label}
          </a>
        </p>
      ) : externalSoon ? (
        <p className="publication-detail__external-soon">{externalSoon}</p>
      ) : null}
      </div>
    </article>
  )
}
