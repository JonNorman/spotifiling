import { useState, useEffect, useCallback } from 'react'
import { SpotifyApi } from '@/lib/spotify/api'
import type { SpotifyTrack, SpotifyPlaylist } from '@/lib/spotify/types'
import {
  getCachedLikedSongs,
  getCachedPlaylistTracks,
  updateCachedLikedSongs,
  updateCachedPlaylistTracks,
  getFilingCounts,
} from '@/lib/cache'

interface LoadingProgress {
  phase: 'idle' | 'liked-songs' | 'playlists' | 'computing'
  loaded: number
  total: number
  label: string
}

interface DataState {
  likedSongs: SpotifyTrack[]
  playlists: SpotifyPlaylist[]
  playlistTrackIds: Map<string, Set<string>>
  unfiledSongs: SpotifyTrack[]
  isLoading: boolean
  loadingStatus: string
  loadingProgress: LoadingProgress
  error: string | null
}

export function useSpotifyData(accessToken: string | null, userId: string | null) {
  const [state, setState] = useState<DataState>({
    likedSongs: [],
    playlists: [],
    playlistTrackIds: new Map(),
    unfiledSongs: [],
    isLoading: true,
    loadingStatus: 'Initializing...',
    loadingProgress: { phase: 'idle', loaded: 0, total: 0, label: '' },
    error: null,
  })

  const loadData = useCallback(async () => {
    if (!accessToken || !userId) return

    const api = new SpotifyApi(accessToken)

    try {
      setState((s) => ({
        ...s,
        isLoading: true,
        loadingStatus: 'Checking library...',
        loadingProgress: { phase: 'idle', loaded: 0, total: 0, label: 'Checking library...' },
      }))

      // Step 1: Get liked songs count for cache validation
      const likedCount = await api.getLikedSongsCount()

      // Step 2: Load liked songs (from cache or API)
      let likedSongs = await getCachedLikedSongs(likedCount)
      if (!likedSongs) {
        setState((s) => ({
          ...s,
          loadingStatus: 'Loading liked songs...',
          loadingProgress: { phase: 'liked-songs', loaded: 0, total: likedCount, label: 'Loading liked songs' },
        }))
        likedSongs = await api.getAllLikedSongs((loaded, total) => {
          setState((s) => ({
            ...s,
            loadingStatus: `Loading liked songs... ${loaded}/${total}`,
            loadingProgress: { phase: 'liked-songs', loaded, total, label: 'Loading liked songs' },
          }))
        })
        await updateCachedLikedSongs(likedSongs, likedCount)
      }

      // Step 3: Load playlists (only owned or collaborative)
      setState((s) => ({
        ...s,
        loadingStatus: 'Loading playlists...',
        loadingProgress: { phase: 'playlists', loaded: 0, total: 0, label: 'Loading playlists...' },
      }))
      const allPlaylists = await api.getAllPlaylists()
      // Filter to playlists the user can add tracks to
      const playlists = allPlaylists.filter(
        (p) => p.owner.id === userId || p.collaborative
      )

      // Step 4: Load playlist tracks (with smart caching)
      const playlistTrackIds = new Map<string, Set<string>>()

      for (let i = 0; i < playlists.length; i++) {
        const playlist = playlists[i]
        setState((s) => ({
          ...s,
          loadingStatus: `Loading playlist ${i + 1}/${playlists.length}: ${playlist.name}`,
          loadingProgress: {
            phase: 'playlists',
            loaded: i,
            total: playlists.length,
            label: `Loading playlist: ${playlist.name}`,
          },
        }))

        // Check cache first
        let trackIds = await getCachedPlaylistTracks(playlist.id, playlist.snapshot_id)
        if (!trackIds) {
          trackIds = await api.getPlaylistTracks(playlist.id)
          await updateCachedPlaylistTracks(playlist.id, trackIds, playlist.snapshot_id)
        }

        playlistTrackIds.set(playlist.id, new Set(trackIds))
      }

      // Step 5: Compute unfiled songs
      setState((s) => ({
        ...s,
        loadingStatus: 'Computing unfiled songs...',
        loadingProgress: { phase: 'computing', loaded: 0, total: 0, label: 'Computing unfiled songs...' },
      }))

      const allFiledTrackIds = new Set<string>()
      playlistTrackIds.forEach((trackIds) => {
        trackIds.forEach((id) => allFiledTrackIds.add(id))
      })

      const unfiledSongs = likedSongs.filter(
        (track) => !allFiledTrackIds.has(track.id)
      )

      // Sort playlists by filing frequency
      const filingCounts = getFilingCounts()
      const sortedPlaylists = [...playlists].sort((a, b) => {
        const countA = filingCounts[a.id] || 0
        const countB = filingCounts[b.id] || 0
        return countB - countA
      })

      setState({
        likedSongs,
        playlists: sortedPlaylists,
        playlistTrackIds,
        unfiledSongs,
        isLoading: false,
        loadingStatus: '',
        loadingProgress: { phase: 'idle', loaded: 0, total: 0, label: '' },
        error: null,
      })
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }))
    }
  }, [accessToken, userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const removeFromUnfiled = useCallback((trackId: string) => {
    setState((s) => ({
      ...s,
      unfiledSongs: s.unfiledSongs.filter((t) => t.id !== trackId),
    }))
  }, [])

  const removeFromLiked = useCallback((trackId: string) => {
    setState((s) => ({
      ...s,
      likedSongs: s.likedSongs.filter((t) => t.id !== trackId),
      unfiledSongs: s.unfiledSongs.filter((t) => t.id !== trackId),
    }))
  }, [])

  const resortPlaylists = useCallback(() => {
    const filingCounts = getFilingCounts()
    setState((s) => ({
      ...s,
      playlists: [...s.playlists].sort((a, b) => {
        const countA = filingCounts[a.id] || 0
        const countB = filingCounts[b.id] || 0
        return countB - countA
      }),
    }))
  }, [])

  const addPlaylist = useCallback((playlist: SpotifyPlaylist) => {
    setState((s) => ({
      ...s,
      playlists: [playlist, ...s.playlists],
      playlistTrackIds: new Map(s.playlistTrackIds).set(playlist.id, new Set()),
    }))
  }, [])

  return {
    ...state,
    removeFromUnfiled,
    removeFromLiked,
    resortPlaylists,
    addPlaylist,
    reload: loadData,
  }
}
