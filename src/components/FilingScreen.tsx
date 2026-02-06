import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { NowPlaying } from '@/components/NowPlaying'
import { PlaylistList } from '@/components/PlaylistList'
import { NewPlaylistDialog } from '@/components/NewPlaylistDialog'
import { KeyboardHelp } from '@/components/KeyboardHelp'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useSpotifyData } from '@/hooks/useSpotifyData'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { useBatchWriter } from '@/hooks/useBatchWriter'
import { SpotifyApi } from '@/lib/spotify/api'
import type { SpotifyTrack } from '@/lib/spotify/types'

interface FilingScreenProps {
  accessToken: string
  userId: string
}

function pickRandomSong(songs: SpotifyTrack[]): SpotifyTrack | null {
  if (songs.length === 0) return null
  const index = Math.floor(Math.random() * songs.length)
  return songs[index]
}

export function FilingScreen({ accessToken, userId }: FilingScreenProps) {
  const data = useSpotifyData(accessToken, userId)
  const player = useSpotifyPlayer(accessToken)
  const writer = useBatchWriter(accessToken)

  const [currentSong, setCurrentSong] = useState<SpotifyTrack | null>(null)
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set())
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)

  // Pick initial song when data loads
  useEffect(() => {
    if (!data.isLoading && data.unfiledSongs.length > 0 && !currentSong) {
      const song = pickRandomSong(data.unfiledSongs)
      setCurrentSong(song)
    }
  }, [data.isLoading, data.unfiledSongs, currentSong])

  // Auto-play song when it changes (if enabled)
  useEffect(() => {
    if (autoPlay && currentSong && player.isReady) {
      player.play(currentSong)
    }
  }, [autoPlay, currentSong, player.isReady, player.play])

  // Handle next song
  const handleNext = useCallback(() => {
    if (!currentSong) return

    // Stop playback of current song
    player.pause()

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
  }, [currentSong, selectedPlaylistIds, data, writer, player])

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

  // Toggle play - start playback if no active session, otherwise toggle
  const handleTogglePlay = useCallback(() => {
    if (currentSong && !player.isPlaying && player.duration === 0) {
      player.play(currentSong)
    } else {
      player.togglePlay()
    }
  }, [currentSong, player])

  // Unlike current song
  const handleUnlike = useCallback(async () => {
    if (!currentSong) return

    // Stop playback of current song
    player.pause()

    try {
      const api = new SpotifyApi(accessToken)
      await api.unlikeSong(currentSong.id)

      // Remove from unfiled and pick next song
      data.removeFromUnfiled(currentSong.id)
      setSelectedPlaylistIds(new Set())
      const nextSong = pickRandomSong(
        data.unfiledSongs.filter((s) => s.id !== currentSong.id)
      )
      setCurrentSong(nextSong)

      toast('Song unliked', {
        description: `Removed "${currentSong.name}" from your library`,
      })
    } catch {
      toast.error('Failed to unlike song')
    }
  }, [currentSong, accessToken, data, player])

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
        handleTogglePlay()
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        setShowHelp(true)
        return
      }

      if (e.key.toLowerCase() === 'u') {
        e.preventDefault()
        handleUnlike()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handleUnlike, handleTogglePlay, player])

  // Loading state
  if (data.isLoading) {
    const { loadingProgress } = data
    const hasProgress = loadingProgress.total > 0
    const percent = hasProgress ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100) : 0

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-sm text-gray-400">
            <span>{loadingProgress.label}</span>
            {hasProgress && <span>{percent}%</span>}
          </div>
          {hasProgress ? (
            <Progress value={percent} className="h-2 bg-gray-700" />
          ) : (
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-green-500 animate-pulse rounded-full" />
            </div>
          )}
          {hasProgress && (
            <p className="text-center text-gray-500 text-sm">
              {loadingProgress.loaded.toLocaleString()} / {loadingProgress.total.toLocaleString()}
            </p>
          )}
        </div>
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

  const totalLiked = data.likedSongs.length
  const unfiled = data.unfiledSongs.length
  const filedPercent = totalLiked > 0 ? Math.round(((totalLiked - unfiled) / totalLiked) * 100) : 100

  // Find playlists the current song is already in
  const existingPlaylistIds = new Set<string>()
  const existingPlaylistNames: string[] = []
  if (currentSong) {
    data.playlistTrackIds.forEach((trackIds, playlistId) => {
      if (trackIds.has(currentSong.id)) {
        existingPlaylistIds.add(playlistId)
        const playlist = data.playlists.find((p) => p.id === playlistId)
        if (playlist) {
          existingPlaylistNames.push(playlist.name)
        }
      }
    })
  }

  // Sort playlists: existing ones first, then by filing frequency
  const sortedPlaylists = [...data.playlists].sort((a, b) => {
    const aExists = existingPlaylistIds.has(a.id)
    const bExists = existingPlaylistIds.has(b.id)
    if (aExists && !bExists) return -1
    if (!aExists && bExists) return 1
    return 0 // Maintain existing order (by filing frequency)
  })

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <NowPlaying
        track={currentSong}
        isPlaying={player.isPlaying}
        position={player.position}
        duration={player.duration}
        existingPlaylists={existingPlaylistNames}
        onTogglePlay={handleTogglePlay}
        onSeek={player.seek}
      />

      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          {unfiled} of {totalLiked} liked songs unfiled ({filedPercent}% filed)
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={autoPlay}
            onCheckedChange={(checked) => setAutoPlay(checked === true)}
            className="border-gray-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />
          <span className="text-sm text-gray-400">Auto-play</span>
        </label>
      </div>

      <PlaylistList
        playlists={sortedPlaylists}
        selectedIds={selectedPlaylistIds}
        existingIds={existingPlaylistIds}
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
        <div className="flex gap-2">
          <Button onClick={handleUnlike} size="lg" className="bg-gray-700 text-white hover:bg-gray-600">
            Unlike (U)
          </Button>
          <Button onClick={handleNext} size="lg" className="bg-green-600 text-white hover:bg-green-500">
            Next (Enter)
          </Button>
        </div>
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
