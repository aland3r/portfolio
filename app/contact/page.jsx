'use client'

import { useLocale } from '../components/LocaleProvider'

import { CONTACT_EMAIL } from '../../lib/site'

export default function ContactPage() {
  const { t } = useLocale()

  return (
    <section className="panel">
      <p className="eyebrow">{t('contact.eyebrow')}</p>
      <h1>{t('contact.title')}</h1>
      <p className="lead">{t('contact.lead')}</p>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="button">
          {CONTACT_EMAIL}
        </a>
      </p>
    </section>
  )
}
