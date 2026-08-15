'use client'

import { useEffect, useState } from 'react'
import { fetchExperiences, localizeExperience } from '@gestalt/auth'
import { STATIC_EXPERIENCES } from '../../lib/experience.js'
import ExperienceCard from '../components/ExperienceCard'
import { useLocale } from '../components/LocaleProvider'

function yearRange(entry, presentLabel) {
  const start = entry.start_date?.slice(0, 4)
  if (!start) return null
  const end = entry.end_date ? entry.end_date.slice(0, 4) : presentLabel
  return `${start} – ${end}`
}

export default function WorkPage() {
  const { t, locale } = useLocale()
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let active = true
    fetchExperiences()
      .then((data) => {
        if (active) setRows(data && data.length ? data : STATIC_EXPERIENCES)
      })
      .catch(() => {
        if (active) setRows(STATIC_EXPERIENCES)
      })
    return () => { active = false }
  }, [])

  const source = rows ?? STATIC_EXPERIENCES
  const timeline = [...source]
    .filter((entry) => entry.show_on_page !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((entry) => localizeExperience(entry, locale))

  const current = timeline.find((entry) => entry.is_current) ?? null
  const currentHandle = current?.org_handle ?? null

  return (
    <section className="panel work-page">
      <header className="work-hero">
        {currentHandle ? (
          <h1 className="work-hero__title">
            <span className="work-hero__accent">{t('work.currently')}</span>{' '}
            <span className="work-hero__org">{currentHandle}</span>
          </h1>
        ) : (
          <h1 className="work-hero__title">{t('work.title')}</h1>
        )}
      </header>

      <div className="work-board" role="list">
        {timeline.map((entry) => (
          <ExperienceCard
            key={entry.id}
            periodLabel={yearRange(entry, t('work.now'))}
            isCurrentRole={Boolean(entry.is_current)}
            currentRoleLabel={t('work.currentRoleBadge')}
            headline={entry.title}
            story={entry.description}
            orgHandle={entry.org_handle ?? entry.org}
            location={entry.location}
            detailHref={entry.featured ? entry.href : null}
            span={entry.card_span ?? 'default'}
          />
        ))}
      </div>
    </section>
  )
}
