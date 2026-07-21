'use client'

import Link from 'next/link'
import { useLocale } from './components/LocaleProvider'
import WelcomeDinoScene from './components/WelcomeDinoScene'
import { SITE_NAME } from '../lib/site'

export default function HomePage() {
  const { t } = useLocale()

  return (
    <section className="home-lp">
      <WelcomeDinoScene />
      <div className="home-lp__copy panel">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1>{SITE_NAME}</h1>
        <p className="lead">{t('home.lead')}</p>

        <div className="actions">
          <Link href="/apps" className="button">
            {t('home.apps')}
          </Link>
        </div>
      </div>
    </section>
  )
}
