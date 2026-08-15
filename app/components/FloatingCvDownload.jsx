'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { getResumeByLocale, getResumes } from '../../lib/resumes'
import { useLocale } from './LocaleProvider'

const CV_LABEL_KEYS = {
  en: 'nav.cvInEnglish',
  pt: 'nav.cvInPortuguese',
}

function DownloadIcon({ className = '' }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 12 12" width="14" height="14">
      <path fill="currentColor" d="M5 1h2v5h2L6 9 3 6h2V1zm-2 9h8v1H3v-1z" />
    </svg>
  )
}

export default function FloatingCvDownload() {
  const pathname = usePathname()
  const { locale, t } = useLocale()
  const [expanded, setExpanded] = useState(false)

  const hide = pathname === '/login' || pathname === '/auth/callback'
  if (hide) return null

  const resumes = getResumes()
  const current = getResumeByLocale(locale)
  const rootClass = `floating-cv${expanded ? ' floating-cv--expanded' : ' floating-cv--compact'}`

  const chip = (
    <button
      type="button"
      className="floating-cv__chip"
      onClick={() => setExpanded(true)}
      aria-expanded={expanded}
      aria-label={t('resume.openPanel')}
    >
      <span className="floating-cv__chip-label">{t('nav.cv')}</span>
      <DownloadIcon className="floating-cv__chip-icon" />
    </button>
  )

  if (!expanded) {
    return <div className={rootClass}>{chip}</div>
  }

  return (
    <aside className={rootClass} aria-label={t('resume.panelLabel')}>
      <span className="floating-cv__badge" aria-hidden="true">
        {t('nav.cv')}
      </span>

      <div className="floating-cv__meta">
        <p className="floating-cv__title">{t('resume.title')}</p>
        {current?.available ? (
          <p className="floating-cv__hint">{t(`resume.localeHint.${locale}`)}</p>
        ) : (
          <p className="floating-cv__hint">{t('resume.localeHintUnavailable')}</p>
        )}
      </div>

      <div className="floating-cv__controls">
        <ul className="floating-cv__list">
          {resumes.map((item) => {
            const labelKey = CV_LABEL_KEYS[item.locale]
            const label = labelKey ? t(labelKey) : item.locale.toUpperCase()
            const isCurrent = item.locale === locale

            return (
              <li
                key={item.locale}
                className={
                  isCurrent ? 'floating-cv__row floating-cv__row--current' : 'floating-cv__row'
                }
              >
                {item.available ? (
                  <a
                    href={item.href}
                    className="floating-cv__download"
                    download={item.downloadName}
                  >
                    <DownloadIcon className="floating-cv__download-icon" />
                    <span>{label}</span>
                  </a>
                ) : (
                  <span className="floating-cv__download floating-cv__download--disabled">
                    <DownloadIcon className="floating-cv__download-icon" />
                    <span>
                      {label} · {t('nav.soon')}
                    </span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          className="floating-cv__close"
          onClick={() => setExpanded(false)}
          aria-label={t('resume.closePanel')}
        >
          ×
        </button>
      </div>
    </aside>
  )
}
