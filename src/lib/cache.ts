import type { SpotifyTrack } from '@/lib/spotify/types'

const CACHE_KEY = 'spotifiling_cache'
const FILING_COUNTS_KEY = 'spotifiling_filing_counts'
const PENDING_WRITES_KEY = 'spotifiling_pending_writes'

interface CachedData {
  likedSongs: {
    tracks: SpotifyTrack[]
    total: number
    fetchedAt: number
  } | null
  playlists: Record<string, {
    trackIds: string[]
    snapshotId: string
  }>
}

interface PendingWrite {
  trackUri: string
  playlistId: string
}

// Cache management
export function getCache(): CachedData {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // Ignore parse errors
  }
  return { likedSongs: null, playlists: {} }
}

export function setCache(data: CachedData): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

export function updateCachedLikedSongs(tracks: SpotifyTrack[], total: number): void {
  const cache = getCache()
  cache.likedSongs = {
    tracks,
    total,
    fetchedAt: Date.now(),
  }
  setCache(cache)
}

export function updateCachedPlaylistTracks(
  playlistId: string,
  trackIds: string[],
  snapshotId: string
): void {
  const cache = getCache()
  cache.playlists[playlistId] = { trackIds, snapshotId }
  setCache(cache)
}

export function getCachedPlaylistTracks(
  playlistId: string,
  currentSnapshotId: string
): string[] | null {
  const cache = getCache()
  const cached = cache.playlists[playlistId]
  if (cached && cached.snapshotId === currentSnapshotId) {
    return cached.trackIds
  }
  return null
}

export function getCachedLikedSongs(currentTotal: number): SpotifyTrack[] | null {
  const cache = getCache()
  if (cache.likedSongs && cache.likedSongs.total === currentTotal) {
    return cache.likedSongs.tracks
  }
  return null
}

// Filing counts (for playlist sorting)
export function getFilingCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(FILING_COUNTS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // Ignore
  }
  return {}
}

export function incrementFilingCount(playlistId: string): void {
  const counts = getFilingCounts()
  counts[playlistId] = (counts[playlistId] || 0) + 1
  localStorage.setItem(FILING_COUNTS_KEY, JSON.stringify(counts))
}

// Pending writes (survives refresh)
export function getPendingWrites(): PendingWrite[] {
  try {
    const raw = localStorage.getItem(PENDING_WRITES_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // Ignore
  }
  return []
}

export function addPendingWrite(trackUri: string, playlistId: string): void {
  const writes = getPendingWrites()
  // Avoid duplicates
  if (!writes.some((w) => w.trackUri === trackUri && w.playlistId === playlistId)) {
    writes.push({ trackUri, playlistId })
    localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(writes))
  }
}

export function removePendingWrites(toRemove: PendingWrite[]): void {
  const writes = getPendingWrites()
  const remaining = writes.filter(
    (w) => !toRemove.some((r) => r.trackUri === w.trackUri && r.playlistId === w.playlistId)
  )
  localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(remaining))
}

export function clearAllPendingWrites(): void {
  localStorage.removeItem(PENDING_WRITES_KEY)
}
