/**
 * Publication beacon tones for portfolio.use_cases and portfolio.kit_docs.
 * live = anonymous-visible (public + ready/shipped)
 * private = owner/member or not yet public
 * offline = draft / deprecated
 */
export function getPublicationBeacon({ status, visibility }) {
  const st = status ?? 'draft'
  const vis = visibility ?? 'owner'

  if (st === 'draft' || st === 'deprecated') {
    return { tone: 'offline', status: st, visibility: vis }
  }

  if (vis === 'public' && (st === 'ready' || st === 'shipped')) {
    return { tone: 'live', status: st, visibility: vis }
  }

  return { tone: 'private', status: st, visibility: vis }
}

export function publicationBeaconLabelKey(tone) {
  if (tone === 'live') return 'publicationBeacon.live'
  if (tone === 'private') return 'publicationBeacon.private'
  return 'publicationBeacon.offline'
}
