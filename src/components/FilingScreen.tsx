import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { NowPlaying } from '@/components/NowPlaying'
import { PlaylistList } from '@/components/PlaylistList'
import { NewPlaylistDialog } from '@/components/NewPlaylistDialog'
import { KeyboardHelp } from '@/components/KeyboardHelp'
import { Button } from '@/components/ui/button'
import { useSpotifyData } from '@/hooks/useSpotifyData'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { useBatchWriter } from '@/hooks/useBatchWriter'
import { SpotifyApi } from '@/lib/spotify/api'
import type { SpotifyTrack } from '@/lib/spotify/types'

interface FilingScreenProps {
  accessToken: string
}

function pickRandomSong(songs: SpotifyTrack[]): SpotifyTrack | null {
  if (songs.length === 0) return null
  const index = Math.floor(Math.random() * songs.length)
  return songs[index]
}

export function FilingScreen({ accessToken }: FilingScreenProps) {
  const data = useSpotifyData(accessToken)
  const player = useSpotifyPlayer(accessToken)
  const writer = useBatchWriter(accessToken)

  const [currentSong, setCurrentSong] = useState<SpotifyTrack | null>(null)
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set())
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Pick initial song when data loads
  useEffect(() => {
    if (!data.isLoading && data.unfiledSongs.length > 0 && !currentSong) {
      const song = pickRandomSong(data.unfiledSongs)
      setCurrentSong(song)
    }
  }, [data.isLoading, data.unfiledSongs, currentSong])

  // Play song when it changes
  useEffect(() => {
    if (currentSong && player.isReady) {
      player.play(currentSong)
    }
  }, [currentSong, player.isReady, player.play])

  // Handle next song
  const handleNext = useCallback(() => {
    if (!currentSong) return

    // Queue writes for selected playlists
    for (const playlistId of selectedPlaylistIds) {
      writer.queueWrite(currentSong.uri, playlistId)
    }

    // Remove from unfiled if added to any playlist
    if (selectedPlaylistIds.size > 0) {
      data.removeFromUnfiled(currentSong.id)
      data.resortPlaylists()
      toast('Song filed', {
        description: `Added to ${selectedPlaylistIds.size} playlist(s)`,
      })
    }

    // Reset selection and pick next song
    setSelectedPlaylistIds(new Set())
    const nextSong = pickRandomSong(
      data.unfiledSongs.filter((s) => s.id !== currentSong.id)
    )
    setCurrentSong(nextSong)
  }, [currentSong, selectedPlaylistIds, data, writer])

  // Toggle playlist selection
  const handleTogglePlaylist = useCallback((playlistId: string) => {
    setSelectedPlaylistIds((prev) => {
      const next = new Set(prev)
      if (next.has(playlistId)) {
        next.delete(playlistId)
      } else {
        next.add(playlistId)
      }
      return next
    })
  }, [])

  // Create new playlist
  const handleCreatePlaylist = useCallback(async (name: string) => {
    const api = new SpotifyApi(accessToken)
    const playlist = await api.createPlaylist(name)
    data.addPlaylist(playlist)
    // Automatically select the new playlist
    setSelectedPlaylistIds((prev) => new Set([...prev, playlist.id]))
  }, [accessToken, data])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) return

      if (e.key === 'Enter') {
        e.preventDefault()
        handleNext()
        return
      }

      if (e.key === ' ') {
        e.preventDefault()
        player.togglePlay()
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        setShowHelp(true)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, player])

  // Loading state
  if (data.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">{data.loadingStatus}</p>
      </div>
    )
  }

  // Error state
  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400">{data.error}</p>
        <Button onClick={data.reload}>Retry</Button>
      </div>
    )
  }

  // All done state
  if (data.unfiledSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">All Done!</h2>
        <p className="text-gray-400">
          Every liked song is in at least one playlist.
        </p>
      </div>
    )
  }

  const totalUnfiled = data.unfiledSongs.length
  const remaining = currentSong
    ? data.unfiledSongs.filter((s) => s.id !== currentSong.id).length + 1
    : totalUnfiled

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <NowPlaying
        track={currentSong}
        isPlaying={player.isPlaying}
        position={player.position}
        duration={player.duration}
        onTogglePlay={player.togglePlay}
      />

      <p className="text-center text-gray-400">
        {remaining} of {totalUnfiled} unfiled songs remaining
      </p>

      <PlaylistList
        playlists={data.playlists}
        selectedIds={selectedPlaylistIds}
        onToggle={handleTogglePlaylist}
        onCreateNew={() => setShowNewPlaylist(true)}
        searchFocusKey="/"
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {writer.pendingCount > 0 && (
            <span>{writer.pendingCount} changes pending...</span>
          )}
          {writer.lastError && (
            <span className="text-red-400 ml-2">{writer.lastError}</span>
          )}
        </div>
        <Button onClick={handleNext} size="lg">
          Next (Enter)
        </Button>
      </div>

      <NewPlaylistDialog
        open={showNewPlaylist}
        onOpenChange={setShowNewPlaylist}
        onCreate={handleCreatePlaylist}
      />

      <KeyboardHelp open={showHelp} onOpenChange={setShowHelp} />
    </div>
  )
}
