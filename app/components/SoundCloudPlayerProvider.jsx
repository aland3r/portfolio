'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
import { fetchAllTracks } from '../../lib/gestalt-auth/tracks.js'
import {
  buildSoundCloudEmbedSrc,
  loadSoundCloudWidgetApi,
  SOUND_CLOUD_WIDGET_OPTIONS,
} from '../../lib/soundcloud-player'
import { prefetchTrackArtworks, resolveTrackArtworkUrl } from '../../lib/soundcloud-artwork'
import {
  enrichTracksWithJsonArtwork,
  getAdjacentTrack,
  getDefaultTrack,
  getPlaylistIndex,
  getTrackById,
  normalizeJsonTracks,
  sortPlaylist,
} from '../../lib/tracks-catalog'
import fallbackTracks from '../../content/tracks.json'
import { useAuth } from './AuthProvider'

const SoundCloudPlayerContext = createContext(null)

export function SoundCloudPlayerProvider({ children }) {
  const pathname = usePathname()
  const { isOwner } = useAuth()
  const iframeRef = useRef(null)
  const widgetRef = useRef(null)
  const activeTrackRef = useRef(null)
  const tracksRef = useRef([])
  const isVisibleRef = useRef(false)
  const embedSrcRef = useRef(null)

  const [tracks, setTracks] = useState(() => normalizeJsonTracks(fallbackTracks))
  const [trackSource, setTrackSource] = useState('json')
  const [tracksLoading, setTracksLoading] = useState(true)
  const [activeTrack, setActiveTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [progressMs, setProgressMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const [artworkByTrackId, setArtworkByTrackId] = useState({})

  const rememberArtwork = useCallback((trackId, artworkUrl) => {
    if (!trackId || !artworkUrl) return
    setArtworkByTrackId((current) =>
      current[trackId] === artworkUrl ? current : { ...current, [trackId]: artworkUrl },
    )
  }, [])

  const syncWidgetArtwork = useCallback(() => {
    const widget = widgetRef.current
    const track = activeTrackRef.current
    if (!widget || !track) return

    widget.getCurrentSound((sound) => {
      if (sound?.artwork_url) rememberArtwork(track.id, sound.artwork_url)
    })
  }, [rememberArtwork])

  activeTrackRef.current = activeTrack
  tracksRef.current = tracks
  isVisibleRef.current = isVisible

  const playlist = useMemo(() => sortPlaylist(tracks), [tracks])
  const playlistIndex = useMemo(
    () => getPlaylistIndex(tracks, activeTrack),
    [tracks, activeTrack],
  )
  const defaultTrack = useMemo(() => getDefaultTrack(tracks), [tracks])

  useEffect(() => {
    let cancelled = false

    async function loadTracks() {
      if (!isOwner) {
        // Tracks are owner-only for now — keep the player/chips inert for everyone else.
        setTracks([])
        setTracksLoading(false)
        return
      }

      setTracksLoading(true)
      try {
        const rows = await fetchAllTracks()
        if (cancelled) return
        if (rows && rows.length > 0) {
          setTracks(enrichTracksWithJsonArtwork(rows))
          setTrackSource('db')
        } else {
          setTracks(normalizeJsonTracks(fallbackTracks))
          setTrackSource('json')
        }
      } catch {
        if (!cancelled) {
          setTracks(normalizeJsonTracks(fallbackTracks))
          setTrackSource('json')
        }
      } finally {
        if (!cancelled) setTracksLoading(false)
      }
    }

    loadTracks()
  }, [isOwner])

  useEffect(() => {
    const current = activeTrackRef.current
    if (!current) return

    const synced = getTrackById(tracks, current.id)
    if (synced && synced !== current) {
      setActiveTrack(synced)
    }
  }, [tracks])

  useEffect(() => {
    const seeded = {}
    for (const track of tracks) {
      if (track.artworkUrl) seeded[track.id] = track.artworkUrl
    }
    if (Object.keys(seeded).length > 0) {
      setArtworkByTrackId((current) => ({ ...seeded, ...current }))
    }
  }, [tracks])

  useEffect(() => {
    let cancelled = false

    prefetchTrackArtworks(tracks, {
      onArtwork: (trackId, artworkUrl) => {
        if (!cancelled) rememberArtwork(trackId, artworkUrl)
      },
    }).catch(() => {})

    return () => {
      cancelled = true
    }
  }, [tracks, rememberArtwork])

  useEffect(() => {
    let cancelled = false

    async function initWidget() {
      const SC = await loadSoundCloudWidgetApi()
      if (cancelled || !SC || !iframeRef.current) return

      const widget = SC.Widget(iframeRef.current)
      widgetRef.current = widget

      widget.bind(SC.Widget.Events.READY, () => {
        if (!cancelled) {
          setIsReady(true)
          syncWidgetArtwork()
        }
      })

      widget.bind(SC.Widget.Events.PLAY, () => {
        if (!cancelled) {
          setIsPlaying(true)
          setIsVisible(true)
          syncWidgetArtwork()
        }
      })

      widget.bind(SC.Widget.Events.PAUSE, () => {
        if (!cancelled) setIsPlaying(false)
      })

      widget.bind(SC.Widget.Events.FINISH, () => {
        if (!cancelled) {
          setIsPlaying(false)
          const nextTrack = getAdjacentTrack(tracksRef.current, activeTrackRef.current, 'next')
          if (nextTrack && nextTrack.id !== activeTrackRef.current?.id) {
            playTrackRef.current?.(nextTrack)
          }
        }
      })

      widget.bind(SC.Widget.Events.PLAY_PROGRESS, (payload) => {
        if (!cancelled) {
          setProgressMs(payload.currentPosition ?? 0)
        }
      })
    }

    initWidget().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [syncWidgetArtwork])

  const resumeIfNeeded = useCallback(() => {
    const widget = widgetRef.current
    if (!widget || !isVisibleRef.current || !activeTrackRef.current) return

    window.requestAnimationFrame(() => {
      widget.isPaused((paused) => {
        if (paused) {
          widget.play()
          setIsPlaying(true)
        }
      })
    })
  }, [])

  useEffect(() => {
    resumeIfNeeded()
  }, [pathname, resumeIfNeeded])

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') resumeIfNeeded()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [resumeIfNeeded])

  const playTrackRef = useRef(null)

  const syncDuration = useCallback(() => {
    const widget = widgetRef.current
    if (!widget) return
    widget.getDuration((ms) => setDurationMs(ms ?? 0))
  }, [])

  const playTrack = useCallback(
    (track) => {
      if (!track?.soundcloudUrl) return

      const widget = widgetRef.current
      if (!widget) return

      const isSameTrack = activeTrackRef.current?.id === track.id
      setActiveTrack(track)
      setIsVisible(true)

      if (isSameTrack && isReady) {
        widget.play()
        setIsPlaying(true)
        syncDuration()
        return
      }

      widget.load(track.soundcloudUrl, {
        ...SOUND_CLOUD_WIDGET_OPTIONS,
        callback: () => {
          widget.play()
          setIsPlaying(true)
          syncDuration()
          syncWidgetArtwork()
        },
      })
    },
    [isReady, syncDuration, syncWidgetArtwork],
  )

  playTrackRef.current = playTrack

  const playNext = useCallback(() => {
    const nextTrack = getAdjacentTrack(tracksRef.current, activeTrackRef.current, 'next')
    if (nextTrack) playTrack(nextTrack)
  }, [playTrack])

  const playPrevious = useCallback(() => {
    const previousTrack = getAdjacentTrack(tracksRef.current, activeTrackRef.current, 'previous')
    if (previousTrack) playTrack(previousTrack)
  }, [playTrack])

  const togglePlayPause = useCallback(() => {
    const widget = widgetRef.current
    if (!widget || !activeTrack) return
    widget.isPaused((paused) => {
      if (paused) {
        widget.play()
        setIsPlaying(true)
      } else {
        widget.pause()
        setIsPlaying(false)
      }
    })
  }, [activeTrack])

  const pause = useCallback(() => {
    const widget = widgetRef.current
    if (!widget) return
    widget.pause()
    setIsPlaying(false)
  }, [])

  const seekToMs = useCallback((ms) => {
    const widget = widgetRef.current
    if (!widget || !Number.isFinite(ms)) return

    const clampedMs = Math.max(0, Math.min(ms, durationMs || ms))
    widget.seekTo(clampedMs)
    setProgressMs(clampedMs)
  }, [durationMs])

  const dismiss = useCallback(() => {
    pause()
    setIsVisible(false)
  }, [pause])

  if (!embedSrcRef.current && defaultTrack?.soundcloudUrl) {
    embedSrcRef.current = buildSoundCloudEmbedSrc(defaultTrack.soundcloudUrl)
  }

  const initialEmbedSrc = embedSrcRef.current ?? 'about:blank'

  const getTrackArtwork = useCallback(
    (track) => {
      if (!track) return null
      return resolveTrackArtworkUrl(track, artworkByTrackId[track.id])
    },
    [artworkByTrackId],
  )

  const value = useMemo(
    () => ({
      tracks,
      playlist,
      playlistIndex,
      playlistLength: playlist.length,
      trackSource,
      tracksLoading,
      activeTrack,
      isPlaying,
      isVisible,
      progressMs,
      durationMs,
      artworkByTrackId,
      getTrackArtwork,
      playTrack,
      playNext,
      playPrevious,
      togglePlayPause,
      pause,
      seekToMs,
      dismiss,
    }),
    [
      activeTrack,
      artworkByTrackId,
      dismiss,
      durationMs,
      getTrackArtwork,
      isPlaying,
      isVisible,
      pause,
      playNext,
      playPrevious,
      playTrack,
      playlist,
      playlistIndex,
      progressMs,
      seekToMs,
      togglePlayPause,
      trackSource,
      tracks,
      tracksLoading,
    ],
  )

  return (
    <SoundCloudPlayerContext.Provider value={value}>
      {children}
      <iframe
        ref={iframeRef}
        title="SoundCloud player"
        className="floating-sc-player__iframe"
        allow="autoplay"
        src={initialEmbedSrc}
      />
    </SoundCloudPlayerContext.Provider>
  )
}

export function useSoundCloudPlayer() {
  const context = useContext(SoundCloudPlayerContext)
  if (!context) {
    throw new Error('useSoundCloudPlayer must be used within SoundCloudPlayerProvider')
  }
  return context
}
