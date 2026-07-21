import { getSupabase, isSupabaseConfigured } from './supabase.js'

export function mapTrackRow(row) {
  return {
    id: row.slug,
    slug: row.slug,
    title: row.title,
    soundcloudUrl: row.soundcloud_url,
    artworkUrl: row.artwork_url ?? null,
    artist: row.artist_name,
    artistUrl: row.artist_url ?? null,
    productCode: row.product_code ?? null,
    isDefault: row.is_default,
    isPublic: row.is_public,
    sortOrder: row.sort_order,
    placements: Array.isArray(row.placements) ? row.placements : [],
    source: 'db',
  }
}

export function mapJsonTrack(row) {
  return {
    id: row.id,
    slug: row.id,
    title: row.title,
    soundcloudUrl: row.soundcloudUrl,
    artworkUrl: row.artworkUrl ?? null,
    artist: row.artist,
    artistUrl: row.artistUrl ?? null,
    productCode: row.productCode ?? null,
    isDefault: row.isDefault === true,
    isPublic: row.isPublic !== false,
    sortOrder: row.sortOrder ?? 0,
    placements: Array.isArray(row.placements) ? row.placements : [],
    source: 'json',
  }
}

export async function fetchPublicTracks() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('tracks')
    .select(
      'slug, title, soundcloud_url, artist_name, artist_url, product_code, is_default, is_public, sort_order, placements',
    )
    .eq('is_public', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapTrackRow)
}

export async function fetchAllTracks() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await getSupabase()
    .schema('portfolio')
    .from('tracks')
    .select(
      'slug, title, soundcloud_url, artist_name, artist_url, product_code, is_default, is_public, sort_order, placements',
    )
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapTrackRow)
}
