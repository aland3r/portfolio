'use client'

import { getTrackForProduct } from '../../lib/tracks-catalog'
import TrackPlayChip from './TrackPlayChip'
import { useSoundCloudPlayer } from './SoundCloudPlayerProvider'

export default function AppIcon({ product, className = '' }) {
  const maskClass =
    product.iconMask === 'android'
      ? 'app-icon-mask app-icon-mask--android'
      : 'app-icon-mask app-icon-mask--ios'

  return (
    <span className={`app-hub__icon ${className}`.trim()} aria-hidden="true">
      <span className={maskClass}>
        {product.icon ? (
          <img src={product.icon} alt="" width={82} height={82} />
        ) : (
          <span className="app-icon-mask__fallback">{product.name.slice(0, 1)}</span>
        )}
      </span>
    </span>
  )
}

export function AppTrackChip({ productCode }) {
  const { tracks } = useSoundCloudPlayer()
  const track = getTrackForProduct(tracks, productCode)
  if (!track) return null
  return <TrackPlayChip trackId={track.id} className="track-play-chip--compact" />
}
