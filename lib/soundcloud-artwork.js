const PLACEHOLDER_THUMB = 'soundcloud.com/images/fb_placeholder.png'

export const DEFAULT_SOUND_CLOUD_ARTWORK_URL =
  'https://i1.sndcdn.com/avatars-t0B6ejLBqgiJ5D0R-DaUsxw-t500x500.jpg'

export function isUsableSoundCloudThumbnail(url) {
  return Boolean(url && !url.includes(PLACEHOLDER_THUMB))
}

export function resolveTrackArtworkUrl(track, cachedArtworkUrl = null) {
  if (cachedArtworkUrl) return cachedArtworkUrl
  if (track?.artworkUrl) return track.artworkUrl
  return DEFAULT_SOUND_CLOUD_ARTWORK_URL
}

export async function fetchSoundCloudThumbnail(soundcloudUrl) {
  if (!soundcloudUrl) return null

  try {
    const endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(soundcloudUrl)}`
    const response = await fetch(endpoint)
    if (!response.ok) return null

    const payload = await response.json()
    const thumbnail = payload?.thumbnail_url ?? null
    return isUsableSoundCloudThumbnail(thumbnail) ? thumbnail : null
  } catch {
    return null
  }
}

export async function prefetchTrackArtworks(tracks, { onArtwork } = {}) {
  if (!Array.isArray(tracks) || tracks.length === 0) return

  await Promise.all(
    tracks.map(async (track) => {
      if (!track?.id) return

      const thumbnail = track.soundcloudUrl
        ? await fetchSoundCloudThumbnail(track.soundcloudUrl)
        : null
      const artworkUrl = resolveTrackArtworkUrl(track, thumbnail)
      onArtwork?.(track.id, artworkUrl)
    }),
  )
}
