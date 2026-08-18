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
  venueLabel,
  coverLabel,
  title,
  excerpt,
  dateLabel,
  readLabel,
  statusLabel,
  detailHref,
  externalHref,
  externalLabel,
}) {
  return (
    <article className="publication-card">
      <Link href={detailHref} className="publication-card__surface publication-card--interactive">
        <WireframeSlot label={coverLabel || venueLabel} className="publication-card__cover" />

        <div className="publication-card__body">
          {venueLabel || dateLabel || readLabel || statusLabel ? (
            <p className="publication-card__meta">
              {venueLabel ? (
                <span className="publication-card__venue">{venueLabel}</span>
              ) : null}
              {dateLabel ? (
                <>
                  {venueLabel ? (
                    <span className="publication-card__dot" aria-hidden="true">·</span>
                  ) : null}
                  <time dateTime={dateLabel.iso}>{dateLabel.text}</time>
                </>
              ) : null}
              {readLabel ? (
                <>
                  {venueLabel || dateLabel ? (
                    <span className="publication-card__dot" aria-hidden="true">·</span>
                  ) : null}
                  <span>{readLabel}</span>
                </>
              ) : null}
              {statusLabel ? (
                <>
                  {venueLabel || dateLabel || readLabel ? (
                    <span className="publication-card__dot" aria-hidden="true">·</span>
                  ) : null}
                  <span className="publication-card__status">{statusLabel}</span>
                </>
              ) : null}
            </p>
          ) : null}

          <h2 className="publication-prose publication-prose--title">{title}</h2>
          <p className="publication-prose publication-prose--excerpt">{excerpt}</p>
        </div>
      </Link>

      {externalHref ? (
        <div className="publication-card__foot">
          <a
            href={externalHref}
            className="publication-card__external"
            target="_blank"
            rel="noreferrer"
          >
            {externalLabel}
          </a>
        </div>
      ) : null}
    </article>
  )
}

export { formatDate }
