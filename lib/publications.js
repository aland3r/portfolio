import staticProjects from '../content/projects.json'
import { getMessage } from './i18n.js'

export const PUBLICATION_FILTERS = ['all', 'social', 'academic', 'scientific']

function isPdfVenue(venue) {
  return venue === 'academic' || venue === 'scientific'
}

export function mapStaticPublication(entry, messages, locale = 'en') {
  const bodyRaw = getMessage(messages, `publications.items.${entry.id}.body`)
  return {
    id: entry.id,
    slug: entry.id,
    productCode: entry.productCode ?? null,
    venue: entry.venue,
    platform: entry.platform ?? null,
    title: getMessage(messages, `publications.items.${entry.id}.title`) ?? entry.id,
    excerpt: getMessage(messages, `publications.items.${entry.id}.excerpt`) ?? '',
    body: Array.isArray(bodyRaw) ? bodyRaw : bodyRaw ? [bodyRaw] : [],
    status: entry.status,
    readMinutes: entry.readMinutes ?? null,
    externalUrl: entry.externalUrl ?? null,
    publishedAt: entry.publishedAt ?? null,
    sortOrder: 0,
    source: 'static',
  }
}

export function loadStaticPublications(messages, { productCode } = {}) {
  let catalog = staticProjects
  if (productCode) {
    catalog = catalog.filter(
      (entry) => entry.productCode === productCode || entry.id === productCode,
    )
  }
  return catalog.map((entry) => mapStaticPublication(entry, messages))
}

export function getPublicationVenueLabel(entry, t) {
  if (entry.venue === 'social' && entry.platform) {
    return t(`publications.platforms.${entry.platform}`)
  }
  return t(`publications.venues.${entry.venue}`)
}

export function getPublicationExternal(entry, t) {
  const href = entry.externalUrl ?? null
  if (!href) return null

  if (entry.venue === 'social' && entry.platform) {
    const platform = t(`publications.platforms.${entry.platform}`)
    return {
      href,
      label: t('publications.openOnPlatform').replace('{0}', platform),
    }
  }

  if (isPdfVenue(entry.venue)) {
    return {
      href,
      label: t('publications.downloadPdf'),
    }
  }

  return {
    href,
    label: t('publications.openExternal'),
  }
}

export function getPublicationExternalSoon(entry, t) {
  if (entry.externalUrl || entry.status === 'published') return null

  if (entry.venue === 'social' && entry.platform) {
    const platform = t(`publications.platforms.${entry.platform}`)
    return t('publications.externalSoon').replace('{0}', platform)
  }

  if (entry.venue === 'scientific') {
    return t('publications.scientificSoon')
  }

  if (entry.venue === 'academic') {
    return t('publications.academicSoon')
  }

  return null
}
