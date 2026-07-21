let scriptPromise = null

export function loadSoundCloudWidgetApi() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.SC?.Widget) return Promise.resolve(window.SC)

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://w.soundcloud.com/player/api.js'
      script.async = true
      script.onload = () => resolve(window.SC ?? null)
      script.onerror = () => reject(new Error('SoundCloud Widget API failed to load'))
      document.body.appendChild(script)
    })
  }

  return scriptPromise
}

export function buildSoundCloudEmbedSrc(trackUrl) {
  const params = new URLSearchParams({
    url: trackUrl,
    color: '413c49',
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'false',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
    buying: 'false',
    sharing: 'false',
    download: 'false',
  })
  return `https://w.soundcloud.com/player/?${params.toString()}`
}

export const SOUND_CLOUD_WIDGET_OPTIONS = {
  auto_play: true,
  hide_related: true,
  show_comments: false,
  show_user: false,
  show_reposts: false,
  show_teaser: false,
  visual: false,
  buying: false,
  sharing: false,
  download: false,
}

export function formatPlayerTime(ms) {
  if (!ms || ms < 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
