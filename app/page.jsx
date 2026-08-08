'use client'

import Link from 'next/link'
import { useLocale } from './components/LocaleProvider'
import WelcomeDinoScene from './components/WelcomeDinoScene'

export default function HomePage() {
  const { t, locale } = useLocale()

  // Hero title = the role being pursued (not the personal name, which stays the
  // brand in the header). Easy to reword here.
  const roleTitle = locale === 'pt' ? 'Engenheiro UX' : 'UX Engineer'

  return (
    <section className="home-lp">
      <WelcomeDinoScene />
      <div className="home-lp__copy panel">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1>{roleTitle}</h1>
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
