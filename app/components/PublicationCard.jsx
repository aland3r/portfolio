import Link from 'next/link'
import WireframeSlot from './WireframeSlot'

function formatDate(iso, locale) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function PublicationCard({
  id,
  venueLabel,
  title,
  excerpt,
  dateLabel,
  readLabel,
  statusLabel,
  detailHref,
  externalHref,
  externalLabel,
  readLabelText,
}) {
  return (
    <article className="publication-card">
      <WireframeSlot label={venueLabel} className="publication-card__cover" />

      <div className="publication-card__body">
        <p className="publication-card__meta">
          <span className="publication-card__venue">{venueLabel}</span>
          {dateLabel ? (
            <>
              <span className="publication-card__dot" aria-hidden="true">·</span>
              <time dateTime={dateLabel.iso}>{dateLabel.text}</time>
            </>
          ) : null}
          {readLabel ? (
            <>
              <span className="publication-card__dot" aria-hidden="true">·</span>
              <span>{readLabel}</span>
            </>
          ) : null}
          {statusLabel ? (
            <>
              <span className="publication-card__dot" aria-hidden="true">·</span>
              <span className="publication-card__status">{statusLabel}</span>
            </>
          ) : null}
        </p>

        <h2 className="publication-prose publication-prose--title">
          <Link href={detailHref} className="publication-card__title-link">
            {title}
          </Link>
        </h2>
        <p className="publication-prose publication-prose--excerpt">{excerpt}</p>

        <div className="publication-card__foot">
          <Link href={detailHref} className="publication-card__read">
            {readLabelText}
          </Link>
          {externalHref ? (
            <a
              href={externalHref}
              className="publication-card__external"
              target="_blank"
              rel="noreferrer"
            >
              {externalLabel}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export { formatDate }
