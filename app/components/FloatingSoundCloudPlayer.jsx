'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPlayerTime } from '../../lib/soundcloud-player'
import { useLocale } from './LocaleProvider'
import { useSoundCloudPlayer } from './SoundCloudPlayerProvider'

function progressMsFromPointer(clientX, element, durationMs) {
  if (!element || durationMs <= 0) return 0
  const { left, width } = element.getBoundingClientRect()
  if (width <= 0) return 0
  const ratio = Math.min(1, Math.max(0, (clientX - left) / width))
  return ratio * durationMs
}

function PlayPauseIcon({ playing }) {
  if (playing) {
    return (
      <svg className="floating-sc-player__icon" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
        <path fill="currentColor" d="M2 1h2v10H2V1zm6 0h2v10H8V1z" />
      </svg>
    )
  }

  return (
    <svg className="floating-sc-player__icon" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      <path fill="currentColor" d="M2 1.5v9l8-4.5-8-4.5z" />
    </svg>
  )
}

export default function FloatingSoundCloudPlayer() {
  const { t } = useLocale()
  const {
    activeTrack,
    isPlaying,
    isVisible,
    progressMs,
    durationMs,
    playlistLength,
    togglePlayPause,
    playNext,
    playPrevious,
    dismiss,
    getTrackArtwork,
    pause,
    seekToMs,
  } = useSoundCloudPlayer()

  const progressRef = useRef(null)
  const draggingRef = useRef(false)
  const [scrubMs, setScrubMs] = useState(null)

  useEffect(() => {
    setScrubMs(null)
    draggingRef.current = false
  }, [activeTrack?.id])

  const finishScrub = useCallback((clientX) => {
    const bar = progressRef.current
    if (!bar || durationMs <= 0) return

    draggingRef.current = false
    const nextMs = progressMsFromPointer(clientX, bar, durationMs)
    setScrubMs(null)
    seekToMs(nextMs)
  }, [durationMs, seekToMs])

  const handleProgressPointerDown = useCallback((event) => {
    if (durationMs <= 0) return

    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    setScrubMs(progressMsFromPointer(event.clientX, event.currentTarget, durationMs))
  }, [durationMs])

  const handleProgressPointerMove = useCallback((event) => {
    if (!draggingRef.current || durationMs <= 0) return
    setScrubMs(progressMsFromPointer(event.clientX, event.currentTarget, durationMs))
  }, [durationMs])

  const handleProgressPointerUp = useCallback((event) => {
    if (!draggingRef.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    finishScrub(event.clientX)
  }, [finishScrub])

  const handleProgressLostPointerCapture = useCallback((event) => {
    if (!draggingRef.current) return
    finishScrub(event.clientX)
  }, [finishScrub])

  const handleProgressKeyDown = useCallback((event) => {
    if (durationMs <= 0) return

    const stepMs = event.shiftKey ? 10_000 : 5_000
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      seekToMs(progressMs - stepMs)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      seekToMs(progressMs + stepMs)
    } else if (event.key === 'Home') {
      event.preventDefault()
      seekToMs(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      seekToMs(durationMs)
    }
  }, [durationMs, progressMs, seekToMs])

  if (!isVisible || !activeTrack) return null

  const displayProgressMs = scrubMs ?? progressMs
  const progress = durationMs > 0 ? Math.min(100, (displayProgressMs / durationMs) * 100) : 0
  const isScrubbing = scrubMs != null
  const showPlaylistControls = playlistLength > 1
  const artworkUrl = getTrackArtwork(activeTrack)

  return (
    <aside className="floating-sc-player" aria-label={t('tracks.playerLabel')}>
      {artworkUrl ? (
        <img className="floating-sc-player__artwork" src={artworkUrl} alt="" />
      ) : (
        <span className="floating-sc-player__artwork floating-sc-player__artwork--fallback" aria-hidden="true">
          {activeTrack.title.slice(0, 1)}
        </span>
      )}

      <div className="floating-sc-player__content">
        <div className="floating-sc-player__meta">
          <p className="floating-sc-player__title">{activeTrack.title}</p>
        </div>

        <div className="floating-sc-player__controls">
          {showPlaylistControls ? (
            <button
              type="button"
              className="floating-sc-player__nav"
              onClick={playPrevious}
              aria-label={t('tracks.previous')}
            >
              ‹
            </button>
          ) : null}
          <button
            type="button"
            className="floating-sc-player__toggle"
            onClick={togglePlayPause}
            aria-label={isPlaying ? t('tracks.pause') : t('tracks.play')}
          >
            <PlayPauseIcon playing={isPlaying} />
          </button>
          {showPlaylistControls ? (
            <button
              type="button"
              className="floating-sc-player__nav"
              onClick={playNext}
              aria-label={t('tracks.next')}
            >
              ›
            </button>
          ) : null}
          <span className="floating-sc-player__time" aria-hidden="true">
            {formatPlayerTime(displayProgressMs)}
            {durationMs > 0 ? ` · ${formatPlayerTime(durationMs)}` : null}
          </span>
          <button
            type="button"
            className="floating-sc-player__close"
            onClick={dismiss}
            aria-label={t('tracks.closePlayer')}
          >
            ×
          </button>
        </div>
      </div>

      <div
        ref={progressRef}
        className={`floating-sc-player__progress${isScrubbing ? ' floating-sc-player__progress--scrubbing' : ''}${durationMs > 0 ? ' floating-sc-player__progress--seekable' : ''}`}
        role="slider"
        tabIndex={durationMs > 0 ? 0 : -1}
        aria-label={t('tracks.seek')}
        aria-valuemin={0}
        aria-valuemax={durationMs}
        aria-valuenow={Math.round(displayProgressMs)}
        aria-valuetext={`${formatPlayerTime(displayProgressMs)} / ${formatPlayerTime(durationMs)}`}
        onPointerDown={handleProgressPointerDown}
        onPointerMove={handleProgressPointerMove}
        onPointerUp={handleProgressPointerUp}
        onPointerCancel={handleProgressPointerUp}
        onLostPointerCapture={handleProgressLostPointerCapture}
        onKeyDown={handleProgressKeyDown}
      >
        <span className="floating-sc-player__progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </aside>
  )
}
