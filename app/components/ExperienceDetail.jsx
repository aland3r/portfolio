'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  fetchExperiences,
  localizeExperience,
  fetchExperienceCaseStudy,
  localizeCaseStudy,
} from '@gestalt/auth'
import { STATIC_EXPERIENCES } from '../../lib/experience.js'
import WireframeSlot from './WireframeSlot'
import ExperienceCard from './ExperienceCard'
import { useLocale } from './LocaleProvider'

function yearRange(entry, presentLabel) {
  const start = entry.start_date?.slice(0, 4)
  if (!start) return null
  const end = entry.end_date ? entry.end_date.slice(0, 4) : presentLabel
  return `${start} – ${end}`
}

/** Rough month index from an ISO 'YYYY-MM' string, for date-proximity sorting. */
function monthIndex(isoMonth) {
  if (!isoMonth) return 0
  const [year, month] = isoMonth.split('-').map(Number)
  return (year || 0) * 12 + (month || 1)
}

/** An experience is a case study when it is current and has a detail route. */
function hasCaseStudy(entry) {
  return Boolean(entry?.is_current && entry?.href)
}

/** Up to two other case-study experiences, nearest by start date. */
function relatedExperiences(all, current) {
  if (!current) return []
  const target = monthIndex(current.start_date)
  return all
    .filter((entry) => entry.id !== current.id && hasCaseStudy(entry))
    .sort(
      (a, b) =>
        Math.abs(monthIndex(a.start_date) - target) -
        Math.abs(monthIndex(b.start_date) - target),
    )
    .slice(0, 2)
}

export default function ExperienceDetail() {
  const { id } = useParams()
  const { t, locale } = useLocale()
  const [rows, setRows] = useState(null)
  const [caseRow, setCaseRow] = useState(null)

  useEffect(() => {
    let active = true
    fetchExperiences()
      .then((data) => { if (active) setRows(data && data.length ? data : STATIC_EXPERIENCES) })
      .catch(() => { if (active) setRows(STATIC_EXPERIENCES) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    fetchExperienceCaseStudy(String(id ?? ''))
      .then((data) => { if (active) setCaseRow(data) })
      .catch(() => { if (active) setCaseRow(null) })
    return () => { active = false }
  }, [id])

  const source = rows ?? STATIC_EXPERIENCES
  const raw = source.find((item) => item.id === id)

  if (!raw) {
    return (
      <section className="panel">
        <p className="muted">{t('work.notFound')}</p>
        <p>
          <Link href="/work" className="experience-detail__back">
            {t('work.back')}
          </Link>
        </p>
      </section>
    )
  }

  const entry = localizeExperience(raw, locale)
  const periodLabel = yearRange(entry, t('work.now'))
  const caseStudy = localizeCaseStudy(caseRow, locale)
  const intro = caseStudy?.intro || entry.description
  const related = relatedExperiences(source, raw).map((item) =>
    localizeExperience(item, locale),
  )

  const heroImageUrl = caseStudy?.heroUrl ?? null
  const sections = caseStudy?.sections ?? []

  return (
    <article className="experience-detail experience-detail--case">
      <div className="experience-detail__hero">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt=""
            className="experience-detail__hero-media experience-detail__hero-image"
          />
        ) : (
          <WireframeSlot
            label={t('projects.heroImage')}
            className="experience-detail__hero-media"
          />
        )}
      </div>

      <div className="experience-detail__layout">
        <div className="experience-detail__main">
          <Link href="/work" className="experience-detail__back">
            ← {t('work.back')}
          </Link>

          <h1 className="work-prose experience-detail__title">{entry.title}</h1>
          <p className="experience-detail__org">{entry.org}</p>

          <p className="experience-card__meta experience-detail__meta">
            {periodLabel ? <span>{periodLabel}</span> : null}
            {entry.employment_type ? (
              <>
                <span className="experience-card__dot" aria-hidden="true">·</span>
                <span>{entry.employment_type}</span>
              </>
            ) : null}
            {entry.location ? (
              <>
                <span className="experience-card__dot" aria-hidden="true">·</span>
                <span>{entry.location}</span>
              </>
            ) : null}
          </p>

          <div className="experience-detail__sections">
            {sections.map((section) => (
              <section key={section.key} className="experience-detail__section">
                <h2 className="experience-detail__section-title">
                  {t(`work.caseSections.${section.key}`)}
                </h2>
                {section.paragraphs.length > 0 ? (
                  <div className="work-prose experience-detail__section-body">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p className="muted experience-detail__empty">
                    {t('work.sectionSoon')}
                  </p>
                )}
                {section.imageUrl ? (
                  <img
                    src={section.imageUrl}
                    alt=""
                    className="experience-detail__section-media"
                  />
                ) : (
                  <WireframeSlot className="experience-detail__section-media" />
                )}
              </section>
            ))}
          </div>

          {related.length > 0 ? (
            <nav className="experience-detail__related" aria-label={t('work.related')}>
              <h2 className="experience-detail__related-title">{t('work.related')}</h2>
              <div className="work-board experience-detail__related-board" role="list">
                {related.map((item) => (
                  <ExperienceCard
                    key={item.id}
                    periodLabel={yearRange(item, t('work.now'))}
                    isCurrentRole={Boolean(item.is_current)}
                    currentRoleLabel={t('work.currentRoleBadge')}
                    headline={item.title}
                    story={item.description}
                    orgHandle={item.org_handle ?? item.org}
                    location={item.location}
                    detailHref={item.href ?? null}
                    span="default"
                  />
                ))}
              </div>
            </nav>
          ) : null}
        </div>

        <aside className="experience-detail__aside">
          <p className="work-prose work-prose--lead experience-detail__intro">{intro}</p>
        </aside>
      </div>
    </article>
  )
}
