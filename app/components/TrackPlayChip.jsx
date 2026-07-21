'use client'

import { getTrackById, getTracksForPlacement } from '../../lib/tracks-catalog'
import { useLocale } from './LocaleProvider'
import { useSoundCloudPlayer } from './SoundCloudPlayerProvider'

export default function TrackPlayChip({ trackId, className = '' }) {
  const { t } = useLocale()
  const { tracks, playTrack, activeTrack, isPlaying, togglePlayPause } = useSoundCloudPlayer()
  const track = getTrackById(tracks, trackId)

  if (!track) return null

  const isActive = activeTrack?.id === track.id
  const showPause = isActive && isPlaying

  return (
    <button
      type="button"
      className={`track-play-chip ${className}`.trim()}
      onClick={() => (isActive ? togglePlayPause() : playTrack(track))}
      aria-label={showPause ? t('tracks.pause') : `${t('tracks.play')} — ${track.title}`}
      title={track.title}
    >
      <span className="track-play-chip__icon" aria-hidden="true">
        {showPause ? '❚❚' : '▶'}
      </span>
      <span className="track-play-chip__label">{track.title}</span>
    </button>
  )
}

export function TrackPlacement({ placement, className = '', hubOnly = false }) {
  const { tracks } = useSoundCloudPlayer()
  const assigned = getTracksForPlacement(tracks, placement, { hubOnly })

  if (assigned.length === 0) return null

  return (
    <div className={`track-placement ${className}`.trim()}>
      {assigned.map((track) => (
        <TrackPlayChip key={track.id} trackId={track.id} />
      ))}
    </div>
  )
}
