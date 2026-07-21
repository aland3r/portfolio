'use client'

import experienceCatalog from '../../content/experience.json'
import {
  formatExperienceYearRange,
  getCurrentExperience,
  sortExperiences,
} from '../../lib/experience.js'
import ExperienceCard from '../components/ExperienceCard'
import { useLocale } from '../components/LocaleProvider'

export default function WorkPage() {
  const { t } = useLocale()
  const timeline = sortExperiences(experienceCatalog).filter((entry) => entry.showOnPage)
  const current = getCurrentExperience(experienceCatalog)
  const currentHandle = current ? t(`work.items.${current.id}.orgHandle`) : null

  return (
    <section className="panel work-page">
      <header className="work-hero">
        <p className="work-hero__eyebrow">{t('work.eyebrow')}</p>
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
            periodLabel={formatExperienceYearRange(entry, t('work.now'))}
            isCurrentRole={Boolean(entry.currentRole)}
            currentRoleLabel={t('work.currentRoleBadge')}
            headline={t(`work.items.${entry.id}.headline`)}
            story={t(`work.items.${entry.id}.story`)}
            orgHandle={t(`work.items.${entry.id}.orgHandle`)}
            detailHref={`/work/${entry.id}`}
            span={entry.cardSpan === 'wide' ? 'wide' : 'compact'}
          />
        ))}
      </div>
    </section>
  )
}
