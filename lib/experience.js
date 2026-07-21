export function sortExperiences(entries) {
  return [...entries].sort((a, b) => {
    const aDate = a.startDate ?? '0000'
    const bDate = b.startDate ?? '0000'
    return bDate.localeCompare(aDate)
  })
}

export function getCurrentExperience(entries) {
  return entries.find((entry) => entry.currentRole) ?? null
}

export function formatExperienceYearRange(entry, presentLabel) {
  const startYear = entry.startDate?.slice(0, 4)
  if (!startYear) return null

  const endYear = entry.endDate ? entry.endDate.slice(0, 4) : presentLabel
  return `${startYear} – ${endYear}`
}

export function formatExperiencePeriod(entry, locale, presentLabel) {
  const start = formatMonthYear(entry.startDate, locale)
  if (!start) return null

  const end = entry.endDate ? formatMonthYear(entry.endDate, locale) : presentLabel
  return `${start} – ${end}`
}

function formatMonthYear(isoMonth, locale) {
  if (!isoMonth) return null
  const [year, month] = isoMonth.split('-').map(Number)
  if (!year || !month) return null
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(
      new Date(year, month - 1, 1),
    )
  } catch {
    return isoMonth
  }
}
