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

interface DataState {
  likedSongs: SpotifyTrack[]
  playlists: SpotifyPlaylist[]
  playlistTrackIds: Map<string, Set<string>>
  unfiledSongs: SpotifyTrack[]
  isLoading: boolean
  loadingStatus: string
  error: string | null
}

export function useSpotifyData(accessToken: string | null) {
  const [state, setState] = useState<DataState>({
    likedSongs: [],
    playlists: [],
    playlistTrackIds: new Map(),
    unfiledSongs: [],
    isLoading: true,
    loadingStatus: 'Initializing...',
    error: null,
  })

  const loadData = useCallback(async () => {
    if (!accessToken) return

    const api = new SpotifyApi(accessToken)

    try {
      setState((s) => ({ ...s, isLoading: true, loadingStatus: 'Checking library...' }))

      // Step 1: Get liked songs count for cache validation
      const likedCount = await api.getLikedSongsCount()

      // Step 2: Load liked songs (from cache or API)
      let likedSongs = getCachedLikedSongs(likedCount)
      if (!likedSongs) {
        setState((s) => ({ ...s, loadingStatus: 'Loading liked songs...' }))
        likedSongs = await api.getAllLikedSongs((loaded, total) => {
          setState((s) => ({
            ...s,
            loadingStatus: `Loading liked songs... ${loaded}/${total}`,
          }))
        })
        updateCachedLikedSongs(likedSongs, likedCount)
      }

      // Step 3: Load playlists
      setState((s) => ({ ...s, loadingStatus: 'Loading playlists...' }))
      const playlists = await api.getAllPlaylists()

      // Step 4: Load playlist tracks (with smart caching)
      const playlistTrackIds = new Map<string, Set<string>>()

      for (let i = 0; i < playlists.length; i++) {
        const playlist = playlists[i]
        setState((s) => ({
          ...s,
          loadingStatus: `Loading playlist ${i + 1}/${playlists.length}: ${playlist.name}`,
        }))

        // Check cache first
        let trackIds = getCachedPlaylistTracks(playlist.id, playlist.snapshot_id)
        if (!trackIds) {
          trackIds = await api.getPlaylistTracks(playlist.id)
          updateCachedPlaylistTracks(playlist.id, trackIds, playlist.snapshot_id)
        }

        playlistTrackIds.set(playlist.id, new Set(trackIds))
      }

      // Step 5: Compute unfiled songs
      setState((s) => ({ ...s, loadingStatus: 'Computing unfiled songs...' }))

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
        error: null,
      })
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }))
    }
  }, [accessToken])

  useEffect(() => {
    loadData()
  }, [loadData])

  const removeFromUnfiled = useCallback((trackId: string) => {
    setState((s) => ({
      ...s,
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
    resortPlaylists,
    addPlaylist,
    reload: loadData,
  }
}
