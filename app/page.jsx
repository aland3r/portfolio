'use client'

import { useEffect, useState } from 'react'
import { useLocale } from './components/LocaleProvider'
import {
  fetchHuman,
  fetchHumanStatements,
  localizeRoleTitle,
  fetchExperiences,
  localizeExperience,
} from '../lib/gestalt-auth'
import { STATIC_EXPERIENCES } from '../lib/experience.js'
import HeroFlowField from './components/HeroFlowField'
import ResumeButton from './components/ResumeButton'
import ExperienceCard from './components/ExperienceCard'

function yearRange(entry, presentLabel) {
  const start = entry.start_date?.slice(0, 4)
  if (!start) return null
  const end = entry.end_date ? entry.end_date.slice(0, 4) : presentLabel
  return `${start} – ${end}`
}

export default function HomePage() {
  const { t, locale } = useLocale()

  // Hero title = the owner's role, sourced only from `portfolio.human`
  // (single source of truth). No hardcoded fallback — see
  // gestalt-kit/partials/portfolio-content-governance.md.
  const [roleTitle, setRoleTitle] = useState(null)

  // Vision / mission / values come from `portfolio.statements` (Model B,
  // language as data) for the active locale — same governance: DB only.
  const [statements, setStatements] = useState(null)

  // Current work experiences (max 3) shown below the art, each linking to its
  // case study. DB-first with the static mirror as fallback.
  const [experiences, setExperiences] = useState(null)

  useEffect(() => {
    let active = true
    fetchHuman()
      .then((human) => {
        if (active) setRoleTitle(localizeRoleTitle(human, locale))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [locale])

  useEffect(() => {
    let active = true
    fetchHumanStatements(locale)
      .then((data) => {
        if (active) setStatements(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [locale])

  useEffect(() => {
    let active = true
    fetchExperiences()
      .then((data) => {
        if (active) setExperiences(data && data.length ? data : STATIC_EXPERIENCES)
      })
      .catch(() => {
        if (active) setExperiences(STATIC_EXPERIENCES)
      })
    return () => {
      active = false
    }
  }, [])

  const currentWork = (experiences ?? STATIC_EXPERIENCES)
    .filter((entry) => entry.is_current && entry.show_on_page !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, 3)
    .map((entry) => localizeExperience(entry, locale))

  return (
    <section className="home-lp">
      <div className="home-lp__copy home-lp__intro panel">
        <h1>{roleTitle}</h1>
        <p className="lead">{t('home.lead')}</p>
      </div>

      <HeroFlowField />

      {(statements?.vision ||
        statements?.mission ||
        statements?.values?.length > 0) && (
        <div className="home-lp__body">
          {(statements?.vision || statements?.mission) && (
            <p className="home-lp__statement">
              {[statements?.vision, statements?.mission]
                .filter(Boolean)
                .join(' ')}
            </p>
          )}

          {statements?.values?.length > 0 && (
            <div className="home-lp__values">
              {/* Title left implicit — the list stands on its own. */}
              <ul>
                {statements.values.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="home-lp__cta">
        <ResumeButton />
      </div>

      {currentWork.length > 0 && (
        <div className="home-lp__work">
          <h2 className="home-lp__work-title">{t('home.currentWork')}</h2>
          <div className="work-board home-lp__work-board" role="list">
            {currentWork.map((entry) => (
              <ExperienceCard
                key={entry.id}
                periodLabel={yearRange(entry, t('work.now'))}
                isCurrentRole={Boolean(entry.is_current)}
                currentRoleLabel={t('work.currentRoleBadge')}
                headline={entry.title}
                story={entry.description}
                orgHandle={entry.org_handle ?? entry.org}
                location={entry.location}
                detailHref={entry.href ?? null}
                span={entry.card_span ?? 'default'}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
