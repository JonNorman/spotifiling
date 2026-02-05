import { useState, useEffect, useCallback, useRef } from 'react'
import { SpotifyApi } from '@/lib/spotify/api'
import {
  getPendingWrites,
  addPendingWrite,
  removePendingWrites,
  incrementFilingCount,
} from '@/lib/cache'

interface PendingWrite {
  trackUri: string
  playlistId: string
}

interface BatchWriterState {
  pendingCount: number
  isFlushing: boolean
  lastError: string | null
}

const FLUSH_INTERVAL_MS = 10_000
const FLUSH_THRESHOLD = 20

export function useBatchWriter(accessToken: string | null) {
  const [state, setState] = useState<BatchWriterState>({
    pendingCount: getPendingWrites().length,
    isFlushing: false,
    lastError: null,
  })

  const flushingRef = useRef(false)

  const flush = useCallback(async () => {
    if (!accessToken || flushingRef.current) return

    const writes = getPendingWrites()
    if (writes.length === 0) return

    flushingRef.current = true
    setState((s) => ({ ...s, isFlushing: true, lastError: null }))

    const api = new SpotifyApi(accessToken)

    // Group writes by playlist
    const byPlaylist = new Map<string, string[]>()
    for (const write of writes) {
      const uris = byPlaylist.get(write.playlistId) || []
      uris.push(write.trackUri)
      byPlaylist.set(write.playlistId, uris)
    }

    const successfulWrites: PendingWrite[] = []
    let lastError: string | null = null

    for (const [playlistId, trackUris] of byPlaylist) {
      try {
        await api.addTracksToPlaylist(playlistId, trackUris)
        // Mark these writes as successful
        for (const uri of trackUris) {
          successfulWrites.push({ trackUri: uri, playlistId })
          incrementFilingCount(playlistId)
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Remove successful writes from pending
    if (successfulWrites.length > 0) {
      removePendingWrites(successfulWrites)
    }

    flushingRef.current = false
    setState({
      pendingCount: getPendingWrites().length,
      isFlushing: false,
      lastError,
    })
  }, [accessToken])

  // Queue a write
  const queueWrite = useCallback((trackUri: string, playlistId: string) => {
    addPendingWrite(trackUri, playlistId)
    setState((s) => ({ ...s, pendingCount: getPendingWrites().length }))
  }, [])

  // Periodic flush
  useEffect(() => {
    const interval = setInterval(() => {
      const writes = getPendingWrites()
      if (writes.length > 0) {
        flush()
      }
    }, FLUSH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [flush])

  // Flush when threshold reached
  useEffect(() => {
    if (state.pendingCount >= FLUSH_THRESHOLD) {
      flush()
    }
  }, [state.pendingCount, flush])

  // Flush on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Synchronous flush attempt using sendBeacon if possible
      const writes = getPendingWrites()
      if (writes.length > 0 && accessToken) {
        // Best effort - sendBeacon for reliability
        // Note: This won't work well with Spotify API, so we rely on localStorage persistence
        flush()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [accessToken, flush])

  return {
    ...state,
    queueWrite,
    flush,
  }
}
