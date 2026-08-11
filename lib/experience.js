/**
 * Static fallback mirroring `portfolio.experience` — used only when Supabase is
 * unconfigured so the /work gallery still renders. The database row is the
 * source of truth; keep this in sync when the seed changes.
 */
export const STATIC_EXPERIENCES = [
  {
    id: 'tce-pr',
    title: 'Software Engineering Intern',
    org: 'Paraná State Court of Accounts (TCE-PR)',
    org_handle: 'TCE-PR',
    description:
      'Conduct user research and turn findings into high-fidelity Figma prototypes and functional code for government audit systems. Introduced UX methodologies that are now part of the organisation’s processes, and currently building an AI tool to assist auditors with literature review studies during audit planning.',
    location: 'Curitiba, PR — Brazil',
    employment_type: 'Part Time · On Site',
    start_date: '2025-07',
    end_date: null,
    is_current: true,
    featured: true,
    href: '/work/tce-pr',
    card_span: 'wide',
    show_on_page: true,
    sort_order: 1,
  },
  {
    id: 'cnpq',
    title: 'Scientific Researcher & Full-Stack Developer',
    org: 'National Council for Scientific and Technological Development (CNPq)',
    org_handle: 'CNPq',
    description:
      'Design and develop a decision-support system for industrial maintenance management as part of a research and technological innovation project, using process mining and machine learning to detect temporal drifts in manufacturing processes. Built front-end in React, back-end in Kotlin and API services in Python. Scholarship program renewed for 2026/27.',
    location: 'Curitiba, PR — Remote',
    employment_type: 'Part Time · Remote',
    start_date: '2025-07',
    end_date: null,
    is_current: true,
    featured: true,
    href: '/work/cnpq',
    card_span: 'default',
    show_on_page: true,
    sort_order: 2,
  },
  {
    id: 'english-instructor',
    title: 'English Instructor',
    org: 'Self-employed & language schools (Wizard, Skill)',
    org_handle: 'Freelance',
    description:
      'Teach English (A1-C2) and German (A1-B1) to adults in one-on-one private lessons (ongoing since 2015), and taught group classrooms in language schools (until 2017).',
    location: 'Remote · On Site',
    employment_type: 'Full Time',
    start_date: '2015-01',
    end_date: null,
    is_current: true,
    featured: true,
    href: '/work/english-instructor',
    card_span: 'default',
    show_on_page: true,
    sort_order: 3,
  },
  {
    id: 'furia-translator',
    title: 'Portuguese-English Translator',
    org: 'FURIA e-Sports, B&Partners & others',
    org_handle: 'FURIA',
    description:
      'Ran translation services for multiple companies, with FURIA e-Sports as the main client. Localized 100+ videos now live across social media and YouTube for FURIA’s partner brands including Nike, Santander, PokerStars, Red Bull and HyperX.',
    location: 'São Paulo, SP — Remote',
    employment_type: 'Full Time · Remote',
    start_date: '2021-01',
    end_date: '2024-01',
    is_current: false,
    featured: true,
    href: '/work/furia-translator',
    card_span: 'default',
    show_on_page: true,
    sort_order: 4,
  },
  {
    id: 'cei-flora',
    title: 'Editorial Designer',
    org: 'CEI Flora',
    org_handle: 'CEI Flora',
    description:
      'Produced educational materials for ESL classes, supporting teachers with tailored learning resources. Designed the editorial layout of an English-language learning book for children, which was printed and distributed at scale for classroom use.',
    location: 'Goiânia, GO',
    employment_type: 'Full Time · On Site',
    start_date: '2018-01',
    end_date: '2019-01',
    is_current: false,
    featured: false,
    href: null,
    card_span: 'compact',
    show_on_page: true,
    sort_order: 5,
  },
  {
    id: 'graphic-designer',
    title: 'Graphic Designer',
    org: 'Salto, Cicopal & others',
    org_handle: 'Salto · Cicopal',
    description:
      'Designed advertising campaigns and brand identities in Photoshop and Illustrator across the food, language-education and regional-retail sectors; trained new designers on Adobe workflows.',
    location: 'Goiânia, GO',
    employment_type: 'Full Time · On Site',
    start_date: '2013-01',
    end_date: '2018-01',
    is_current: false,
    featured: false,
    href: null,
    card_span: 'compact',
    show_on_page: true,
    sort_order: 6,
  },
]

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
