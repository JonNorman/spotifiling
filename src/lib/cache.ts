import { openDB, type IDBPDatabase } from 'idb'
import type { SpotifyTrack } from '@/lib/spotify/types'

const DB_NAME = 'spotifiling'
const DB_VERSION = 1
const LIKED_SONGS_STORE = 'likedSongs'
const PLAYLIST_TRACKS_STORE = 'playlistTracks'

const FILING_COUNTS_KEY = 'spotifiling_filing_counts'
const PENDING_WRITES_KEY = 'spotifiling_pending_writes'

interface LikedSongsEntry {
  id: 'liked'
  tracks: SpotifyTrack[]
  total: number
  fetchedAt: number
}

interface PlaylistTracksEntry {
  playlistId: string
  trackIds: string[]
  snapshotId: string
}

interface PendingWrite {
  trackUri: string
  playlistId: string
}

// IndexedDB setup
let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(LIKED_SONGS_STORE)) {
          db.createObjectStore(LIKED_SONGS_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(PLAYLIST_TRACKS_STORE)) {
          db.createObjectStore(PLAYLIST_TRACKS_STORE, { keyPath: 'playlistId' })
        }
      },
    })
  }
  return dbPromise
}

// Liked songs cache (IndexedDB)
export async function updateCachedLikedSongs(tracks: SpotifyTrack[], total: number): Promise<void> {
  try {
    const db = await getDB()
    const entry: LikedSongsEntry = {
      id: 'liked',
      tracks,
      total,
      fetchedAt: Date.now(),
    }
    await db.put(LIKED_SONGS_STORE, entry)
  } catch {
    // Ignore cache errors
  }
}

export async function getCachedLikedSongs(currentTotal: number): Promise<SpotifyTrack[] | null> {
  try {
    const db = await getDB()
    const entry = await db.get(LIKED_SONGS_STORE, 'liked') as LikedSongsEntry | undefined
    if (entry && entry.total === currentTotal) {
      return entry.tracks
    }
  } catch {
    // Ignore cache errors
  }
  return null
}

// Playlist tracks cache (IndexedDB)
export async function updateCachedPlaylistTracks(
  playlistId: string,
  trackIds: string[],
  snapshotId: string
): Promise<void> {
  try {
    const db = await getDB()
    const entry: PlaylistTracksEntry = { playlistId, trackIds, snapshotId }
    await db.put(PLAYLIST_TRACKS_STORE, entry)
  } catch {
    // Ignore cache errors
  }
}

export async function getCachedPlaylistTracks(
  playlistId: string,
  currentSnapshotId: string
): Promise<string[] | null> {
  try {
    const db = await getDB()
    const entry = await db.get(PLAYLIST_TRACKS_STORE, playlistId) as PlaylistTracksEntry | undefined
    if (entry && entry.snapshotId === currentSnapshotId) {
      return entry.trackIds
    }
  } catch {
    // Ignore cache errors
  }
  return null
}

// Filing counts (localStorage - small data)
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

// Pending writes (localStorage - small data, survives refresh)
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
