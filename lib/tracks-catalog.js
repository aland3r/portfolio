import fallbackTracks from '../content/tracks.json'
import { mapJsonTrack } from './gestalt-auth/tracks.js'

export function normalizeJsonTracks(rows = fallbackTracks) {
  return rows.map(mapJsonTrack)
}

export function enrichTracksWithJsonArtwork(tracks) {
  const jsonById = Object.fromEntries(fallbackTracks.map((row) => [row.id, row]))

  return tracks.map((track) => {
    const json = jsonById[track.id] ?? jsonById[track.slug]
    return {
      ...track,
      artworkUrl: track.artworkUrl ?? json?.artworkUrl ?? null,
    }
  })
}

export function sortPlaylist(tracks) {
  return [...tracks]
    .filter((track) => track.isPublic !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title))
}

export function getDefaultTrack(tracks) {
  const list = sortPlaylist(tracks)
  return list.find((track) => track.isDefault) ?? list[0] ?? null
}

export function getTrackById(tracks, id) {
  if (!id) return null
  return tracks.find((track) => track.id === id || track.slug === id) ?? null
}

export function getTracksForPlacement(tracks, placement, { productCode = undefined, hubOnly = false } = {}) {
  return sortPlaylist(tracks).filter((track) => {
    if (!Array.isArray(track.placements) || !track.placements.includes(placement)) {
      return false
    }
    if (productCode !== undefined) {
      return track.productCode === productCode
    }
    if (hubOnly && track.productCode) {
      return false
    }
    return true
  })
}

export function getTrackForProduct(tracks, productCode) {
  if (!productCode) return null
  return tracks.find((track) => track.productCode === productCode) ?? null
}

export function getPlaylistIndex(tracks, activeTrack) {
  if (!activeTrack) return -1
  const playlist = sortPlaylist(tracks)
  return playlist.findIndex((track) => track.id === activeTrack.id)
}

export function getAdjacentTrack(tracks, activeTrack, direction) {
  const playlist = sortPlaylist(tracks)
  if (playlist.length === 0) return null

  const currentIndex = getPlaylistIndex(tracks, activeTrack)
  if (currentIndex === -1) {
    return direction === 'next' ? playlist[0] : playlist[playlist.length - 1]
  }

  const delta = direction === 'next' ? 1 : -1
  const nextIndex = (currentIndex + delta + playlist.length) % playlist.length
  return playlist[nextIndex] ?? null
}
