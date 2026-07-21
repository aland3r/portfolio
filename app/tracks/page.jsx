'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'
import { useLocale } from '../components/LocaleProvider'
import { useSoundCloudPlayer } from '../components/SoundCloudPlayerProvider'

export default function TracksPage() {
  const router = useRouter()
  const { loading, isAuthenticated, isOwner } = useAuth()
  const { t } = useLocale()
  const {
    tracks,
    playlist,
    playlistIndex,
    activeTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    getTrackArtwork,
  } = useSoundCloudPlayer()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) router.replace('/login')
    else if (!isOwner) router.replace('/')
  }, [loading, isAuthenticated, isOwner, router])

  if (loading || !isOwner) {
    return (
      <section className="panel">
        <p className="muted">{t('misc.loading')}</p>
      </section>
    )
  }

  return (
    <section className="panel tracks-page">
      <p className="eyebrow">{t('tracks.eyebrow')}</p>
      <h1>{t('tracks.title')}</h1>
      <p className="lead">{t('tracks.lead')}</p>
      <p className="muted tracks-note">{t('tracks.playerHint')}</p>

      <ul className="track-list">
        {tracks.map((track, index) => {
          const isActive = activeTrack?.id === track.id
          const showPause = isActive && isPlaying
          const order = playlist.findIndex((item) => item.id === track.id)
          const artworkUrl = getTrackArtwork(track)

          return (
            <li key={track.id} className={isActive ? 'track-row track-row--active' : 'track-row'}>
              <span className="track-row__index" aria-hidden="true">
                {order >= 0 ? order + 1 : index + 1}
              </span>

              <button
                type="button"
                className="track-row__artwork"
                onClick={() => (isActive ? togglePlayPause() : playTrack(track))}
                aria-label={showPause ? t('tracks.pause') : `${t('tracks.play')} — ${track.title}`}
              >
                {artworkUrl ? (
                  <img className="track-row__artwork-img" src={artworkUrl} alt="" loading="lazy" />
                ) : (
                  <span className="track-row__artwork-fallback" aria-hidden="true">
                    {track.title.slice(0, 1)}
                  </span>
                )}
                <span className="track-row__artwork-play" aria-hidden="true">
                  {showPause ? '❚❚' : '▶'}
                </span>
              </button>

              <div className="track-row__body">
                <p className="track-row__title">
                  {track.title}
                  {track.isDefault ? (
                    <span className="track-row__badge">{t('tracks.defaultBadge')}</span>
                  ) : null}
                </p>
                <p className="track-row__artist">{track.artist}</p>
              </div>
            </li>
          )
        })}
      </ul>

      {playlist.length > 1 && activeTrack ? (
        <p className="muted tracks-note">
          {t('tracks.playlistPosition')
            .replace('{0}', String(playlistIndex + 1))
            .replace('{1}', String(playlist.length))}
        </p>
      ) : null}
    </section>
  )
}
