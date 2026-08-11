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

function spanClass(span) {
  if (span === 'wide') return 'experience-card experience-card--wide'
  if (span === 'compact') return 'experience-card experience-card--compact'
  return 'experience-card'
}

export default function ExperienceCard({
  periodLabel,
  isCurrentRole,
  currentRoleLabel,
  headline,
  story,
  orgHandle,
  location,
  detailHref,
  span = 'default',
}) {
  const isLinked = Boolean(detailHref)

  const body = (
    <>
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
        {location ? <span className="experience-card__location">{location}</span> : null}
        {isLinked ? (
          <span className="experience-card__arrow" aria-hidden="true">
            <StoryArrowIcon />
          </span>
        ) : null}
      </div>
    </>
  )

  return (
    <article className={spanClass(span)} role="listitem">
      {isLinked ? (
        <Link href={detailHref} className="experience-card__link">
          {body}
        </Link>
      ) : (
        <div className="experience-card__link experience-card__link--static">{body}</div>
      )}
    </article>
  )
}
