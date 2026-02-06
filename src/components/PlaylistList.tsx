import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { ListMusic } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { SpotifyApi } from '@/lib/spotify/api'
import { getPendingWrites } from '@/lib/cache'
import type { SpotifyPlaylist, SpotifyTrack } from '@/lib/spotify/types'

interface TrackDetail {
  name: string
  artists: string
}

interface PlaylistListProps {
  playlists: SpotifyPlaylist[]
  selectedIds: Set<string>
  existingIds: Set<string>
  onToggle: (playlistId: string) => void
  onCreateNew: () => void
  searchFocusKey: string
  accessToken: string
  likedSongs: SpotifyTrack[]
  flushedPlaylistIds?: Set<string>
}

export function PlaylistList({
  playlists,
  selectedIds,
  existingIds,
  onToggle,
  onCreateNew,
  searchFocusKey,
  accessToken,
  likedSongs,
  flushedPlaylistIds,
}: PlaylistListProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const trackCacheRef = useRef<Map<string, TrackDetail[]>>(new Map())
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null)
  const [errorPlaylistId, setErrorPlaylistId] = useState<string | null>(null)
  const [, forceUpdate] = useState(0)

  const filteredPlaylists = useMemo(() => {
    if (!search.trim()) return playlists
    const lower = search.toLowerCase()
    return playlists.filter((p) => p.name.toLowerCase().includes(lower))
  }, [playlists, search])

  // Invalidate cache for playlists that were just flushed
  useEffect(() => {
    if (flushedPlaylistIds && flushedPlaylistIds.size > 0) {
      for (const id of flushedPlaylistIds) {
        trackCacheRef.current.delete(id)
      }
    }
  }, [flushedPlaylistIds])

  // Pre-fetch track details for top 10 visible playlists
  useEffect(() => {
    const api = new SpotifyApi(accessToken)
    const toFetch = playlists.slice(0, 10).filter((p) => !trackCacheRef.current.has(p.id))

    for (const playlist of toFetch) {
      api.getPlaylistTrackDetails(playlist.id).then((tracks) => {
        trackCacheRef.current.set(playlist.id, tracks)
      }).catch(() => {
        // Silently fail pre-fetch
      })
    }
  }, [playlists, accessToken])

  // Fetch tracks for a playlist on popover open
  const handlePopoverOpen = useCallback(async (playlistId: string, isOpen: boolean) => {
    if (!isOpen) return
    if (trackCacheRef.current.has(playlistId)) return

    setLoadingPlaylistId(playlistId)
    setErrorPlaylistId(null)
    try {
      const api = new SpotifyApi(accessToken)
      const tracks = await api.getPlaylistTrackDetails(playlistId)
      trackCacheRef.current.set(playlistId, tracks)
    } catch {
      setErrorPlaylistId(playlistId)
    }
    setLoadingPlaylistId(null)
    forceUpdate((n) => n + 1)
  }, [accessToken])

  // Resolve pending writes for a playlist into track details
  const getPendingTracksForPlaylist = useCallback((playlistId: string): TrackDetail[] => {
    const writes = getPendingWrites()
    const pendingUris = writes
      .filter((w) => w.playlistId === playlistId)
      .map((w) => w.trackUri)

    if (pendingUris.length === 0) return []

    const uriSet = new Set(pendingUris)
    return likedSongs
      .filter((s) => uriSet.has(s.uri))
      .map((s) => ({
        name: s.name,
        artists: s.artists.map((a) => a.name).join(', '),
      }))
  }, [likedSongs])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Escape') {
          setSearch('')
          inputRef.current?.blur()
        }
        return
      }

      if (e.key === searchFocusKey) {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }

      if (e.key >= '0' && e.key <= '9') {
        const index = e.key === '0' ? 9 : parseInt(e.key) - 1
        const playlist = filteredPlaylists[index]
        if (playlist) {
          onToggle(playlist.id)
        }
        return
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        onCreateNew()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredPlaylists, onToggle, onCreateNew, searchFocusKey])

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="mb-4">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search playlists... (press /)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-700 border-gray-600"
        />
      </div>

      <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto">
        {filteredPlaylists.map((playlist, index) => {
          const isExisting = existingIds.has(playlist.id)
          const cachedTracks = trackCacheRef.current.get(playlist.id)
          const pendingTracks = getPendingTracksForPlaylist(playlist.id)
          const isLoading = loadingPlaylistId === playlist.id

          return (
            <div
              key={playlist.id}
              className={`flex items-center gap-3 p-2 rounded hover:bg-gray-700 ${
                isExisting ? 'bg-gray-700/50' : ''
              }`}
            >
              <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                <Checkbox
                  checked={selectedIds.has(playlist.id)}
                  onCheckedChange={() => onToggle(playlist.id)}
                />
                <span className="text-gray-500 text-sm w-4">
                  {index < 10 ? (index + 1) % 10 : ''}
                </span>
                <span className="truncate flex-1">{playlist.name}</span>
              </label>
              {isExisting && (
                <span className="text-xs text-green-500 shrink-0">already in</span>
              )}
              <Popover onOpenChange={(open) => handlePopoverOpen(playlist.id, open)}>
                <PopoverTrigger asChild>
                  <button
                    className="text-gray-500 hover:text-gray-300 shrink-0 p-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ListMusic className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="left"
                  align="start"
                  className="w-80 bg-gray-800 border-gray-700 p-0"
                >
                  <div className="p-3 border-b border-gray-700">
                    <p className="font-medium text-sm text-gray-200 truncate">{playlist.name}</p>
                    <p className="text-xs text-gray-400">
                      {playlist.tracks.total} tracks
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2">
                    {isLoading && !cachedTracks && (
                      <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
                    )}
                    {pendingTracks.length > 0 && (
                      <>
                        {pendingTracks.map((track, i) => (
                          <div key={`pending-${i}`} className="px-2 py-1.5 text-sm">
                            <span className="text-yellow-400">{track.name}</span>
                            <span className="text-gray-500"> — {track.artists}</span>
                            <span className="text-xs text-yellow-600 ml-1">(pending)</span>
                          </div>
                        ))}
                        {cachedTracks && cachedTracks.length > 0 && (
                          <div className="border-t border-gray-700 my-1" />
                        )}
                      </>
                    )}
                    {cachedTracks?.map((track, i) => (
                      <div key={i} className="px-2 py-1.5 text-sm">
                        <span className="text-gray-200">{track.name}</span>
                        <span className="text-gray-500"> — {track.artists}</span>
                      </div>
                    ))}
                    {!isLoading && errorPlaylistId === playlist.id && !cachedTracks && (
                      <p className="text-red-400 text-sm text-center py-4">Failed to load tracks</p>
                    )}
                    {!isLoading && !errorPlaylistId && cachedTracks?.length === 0 && pendingTracks.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">Empty playlist</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )
        })}

        {filteredPlaylists.length === 0 && (
          <p className="text-gray-500 text-center py-4">No playlists found</p>
        )}
      </div>

      <button
        onClick={onCreateNew}
        className="mt-4 w-full p-2 text-left text-gray-400 hover:text-white hover:bg-gray-700 rounded flex items-center gap-2"
      >
        <span className="text-sm bg-gray-600 px-1.5 py-0.5 rounded">N</span>
        <span>+ New playlist</span>
      </button>
    </div>
  )
}
