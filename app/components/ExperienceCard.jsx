import Link from 'next/link'

function StoryArrowIcon() {
  return (
    <svg className="experience-card__arrow-icon" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
        d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6"
      />
    </svg>
  )
}

export default function ExperienceCard({
  periodLabel,
  isCurrentRole,
  currentRoleLabel,
  headline,
  story,
  orgHandle,
  detailHref,
  span = 'compact',
}) {
  return (
    <article className={span === 'wide' ? 'experience-card experience-card--wide' : 'experience-card'}>
      <Link href={detailHref} className="experience-card__link">
        <div className="experience-card__top">
          {periodLabel ? <p className="experience-card__period">{periodLabel}</p> : null}
          {isCurrentRole ? (
            <span className="experience-card__badge">{currentRoleLabel}</span>
          ) : null}
        </div>

        <h2 className="experience-card__headline">{headline}</h2>
        <p className="experience-card__story">{story}</p>

        <div className="experience-card__foot">
          <span className="experience-card__org">{orgHandle}</span>
          <span className="experience-card__arrow" aria-hidden="true">
            <StoryArrowIcon />
          </span>
        </div>
      </Link>
    </article>
  )
}
