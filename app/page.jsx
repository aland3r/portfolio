'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLocale } from './components/LocaleProvider'
import { fetchHuman } from '../lib/gestalt-auth'

export default function HomePage() {
  const { t } = useLocale()

  // Hero title = the owner's role, sourced only from `portfolio.human`
  // (single source of truth). No hardcoded fallback — see
  // gestalt-kit/partials/portfolio-content-governance.md.
  const [roleTitle, setRoleTitle] = useState(null)

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

  return (
    <section className="home-lp">
      <div className="home-lp__copy panel">
        <h1>{roleTitle}</h1>
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <p className="lead">{t('home.lead')}</p>

        <div className="actions">
          <Link href="/apps" className="button">
            {t('nav.products')}
          </Link>
        </div>
      </div>
    </section>
  )
}
