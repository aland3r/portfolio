'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import experienceCatalog from '../../content/experience.json'
import { getMessage } from '../../lib/i18n'
import { formatExperiencePeriod } from '../../lib/experience.js'
import { useLocale } from './LocaleProvider'

export default function ExperienceDetail() {
  const { id } = useParams()
  const { t, locale, messages } = useLocale()
  const entry = experienceCatalog.find((item) => item.id === id)

  if (!entry) {
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

  const roleLabel = t(`work.items.${entry.id}.role`)
  const orgLabel = t(`work.items.${entry.id}.org`)
  const headline = t(`work.items.${entry.id}.headline`)
  const teaser = t(`work.items.${entry.id}.teaser`)
  const kindLabel = t(`work.kinds.${entry.kind}`)
  const periodLabel = formatExperiencePeriod(entry, locale, t('work.present'))
  const presenceLabel = entry.presence ? t(`work.presence.${entry.presence}`) : null
  const locationLabel = entry.locationKey ? t(`work.locations.${entry.locationKey}`) : null
  const bodyRaw = getMessage(messages, `work.items.${entry.id}.body`)
  const bodyParagraphs = Array.isArray(bodyRaw) ? bodyRaw : bodyRaw ? [bodyRaw] : []

  return (
    <article className="panel experience-detail">
      <Link href="/work" className="experience-detail__back">
        ← {t('work.back')}
      </Link>

      <p className="eyebrow">{kindLabel}</p>
      <h1 className="work-prose experience-detail__title">{headline}</h1>
      <p className="experience-detail__org">{orgLabel} · {roleLabel}</p>

      <p className="experience-card__meta experience-detail__meta">
        {periodLabel ? <span>{periodLabel}</span> : null}
        {presenceLabel ? (
          <>
            <span className="experience-card__dot" aria-hidden="true">
              ·
            </span>
            <span>{presenceLabel}</span>
          </>
        ) : null}
        {locationLabel ? (
          <>
            <span className="experience-card__dot" aria-hidden="true">
              ·
            </span>
            <span>{locationLabel}</span>
          </>
        ) : null}
      </p>

      <p className="work-prose work-prose--lead">{teaser}</p>

      {bodyParagraphs.length > 0 ? (
        <div className="work-prose work-prose--body">
          {bodyParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="muted experience-detail__empty">{t('work.bodySoon')}</p>
      )}
    </article>
  )
}
