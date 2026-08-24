'use client'

import { getResumeByLocale } from '../../lib/resumes'
import { useLocale } from './LocaleProvider'

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="M7 10.5 12 15.5l5-5" />
      <path d="M4 20.5h16" />
    </svg>
  )
}

// CTA estático de download do CV — usado na home, após o texto (não é mais
// flutuante em todas as páginas). Estilo Carbonot geral, borda fina, sem
// sublinhado.
export default function ResumeButton() {
  const { locale, t } = useLocale()

  const current = getResumeByLocale(locale)
  if (!current?.available) return null

  const alt = getResumeByLocale(locale === 'pt' ? 'en' : 'pt')

  return (
    <>
      <a
        href={current.href}
        download={current.downloadName}
        className="resume-btn"
        aria-label={t('nav.resume')}
      >
        <span className="resume-btn__label">{t('nav.resume')}</span>
        <DownloadIcon />
      </a>
      {alt?.available && (
        <a
          href={alt.href}
          download={alt.downloadName}
          className="resume-btn__alt"
        >
          {t('resume.altLink')}
        </a>
      )}
    </>
  )
}
