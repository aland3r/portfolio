import catalog from '../content/resumes.json'

/** @typedef {{ locale: string, href: string, downloadName: string, available: boolean }} ResumeEntry */

/** @returns {ResumeEntry[]} */
export function getResumes() {
  return catalog
}

/** @param {string} locale */
export function getResumeByLocale(locale) {
  return catalog.find((entry) => entry.locale === locale) ?? null
}

export function hasAvailableResume() {
  return catalog.some((entry) => entry.available)
}
