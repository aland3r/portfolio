'use client'

import { useEffect, useState } from 'react'
import { useLocale } from './components/LocaleProvider'
import { fetchHuman, fetchHumanStatements } from '../lib/gestalt-auth'
import HeroFlowField from './components/HeroFlowField'
import ResumeButton from './components/ResumeButton'

export default function HomePage() {
  const { t, locale } = useLocale()

  // Hero title = the owner's role, sourced only from `portfolio.human`
  // (single source of truth). No hardcoded fallback — see
  // gestalt-kit/partials/portfolio-content-governance.md.
  const [roleTitle, setRoleTitle] = useState(null)

  // Vision / mission / values come from `portfolio.statements` (Model B,
  // language as data) for the active locale — same governance: DB only.
  const [statements, setStatements] = useState(null)

  useEffect(() => {
    let active = true
    fetchHuman()
      .then((human) => {
        if (active && human?.roleTitle) setRoleTitle(human.roleTitle)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

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

  return (
    <section className="home-lp">
      <div className="home-lp__copy home-lp__intro panel">
        <h1>{roleTitle}</h1>
        <p className="lead">{t('home.lead')}</p>
      </div>

      <HeroFlowField />

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

      <div className="home-lp__cta">
        <ResumeButton />
      </div>
    </section>
  )
}
