'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchExperiences, localizeExperience } from '@gestalt/auth'
import { STATIC_EXPERIENCES } from '../../lib/experience.js'
import { useLocale } from './LocaleProvider'

function yearRange(entry, presentLabel) {
  const start = entry.start_date?.slice(0, 4)
  if (!start) return null
  const end = entry.end_date ? entry.end_date.slice(0, 4) : presentLabel
  return `${start} – ${end}`
}

export default function ExperienceDetail() {
  const { id } = useParams()
  const { t, locale } = useLocale()
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let active = true
    fetchExperiences()
      .then((data) => { if (active) setRows(data && data.length ? data : STATIC_EXPERIENCES) })
      .catch(() => { if (active) setRows(STATIC_EXPERIENCES) })
    return () => { active = false }
  }, [])

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

  return (
    <article className="panel experience-detail">
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

      <p className="work-prose work-prose--lead">{entry.description}</p>

      <p className="muted experience-detail__empty">{t('work.bodySoon')}</p>
    </article>
  )
}
