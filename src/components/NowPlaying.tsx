import { useRef, useCallback } from 'react'
import type { SpotifyTrack } from '@/lib/spotify/types'

interface NowPlayingProps {
  track: SpotifyTrack | null
  isPlaying: boolean
  position: number
  duration: number
  existingPlaylists: string[] // Names of playlists track is already in
  onTogglePlay: () => void
  onSeek: (positionMs: number) => void
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function NowPlaying({
  track,
  isPlaying,
  position,
  duration,
  existingPlaylists,
  onTogglePlay,
  onSeek,
}: NowPlayingProps) {
  const barRef = useRef<HTMLDivElement>(null)

  const seekToPosition = useCallback(
    (clientX: number) => {
      if (!barRef.current || duration === 0) return
      const rect = barRef.current.getBoundingClientRect()
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      onSeek(Math.floor(fraction * duration))
    },
    [duration, onSeek]
  )
  if (!track) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">No song selected</p>
      </div>
    )
  }

  const albumArt = track.album.images[0]?.url
  const progress = duration > 0 ? (position / duration) * 100 : 0

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-4 flex-col sm:flex-row">
        {albumArt && (
          <img
            src={albumArt}
            alt={track.album.name}
            className="w-32 h-32 sm:w-24 sm:h-24 rounded shadow-lg"
          />
        )}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h2 className="text-xl font-semibold truncate">{track.name}</h2>
          <p className="text-gray-400 truncate">
            {track.artists.map((a) => a.name).join(', ')}
          </p>
          <p className="text-gray-500 text-sm truncate mt-1">
            {track.album.name} &middot; {formatTime(track.duration_ms)}
            {track.added_at && <> &middot; Liked {formatDate(track.added_at)}</>}
          </p>
          {existingPlaylists.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">
              Already in: {existingPlaylists.slice(0, 3).join(', ')}
              {existingPlaylists.length > 3 && ` +${existingPlaylists.length - 3} more`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div
            ref={barRef}
            className="flex-1 group cursor-pointer py-2"
            onClick={(e) => seekToPosition(e.clientX)}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId)
              seekToPosition(e.clientX)
            }}
            onPointerMove={(e) => {
              if (e.buttons > 0) seekToPosition(e.clientX)
            }}
          >
            <div className="h-1 group-hover:h-2 bg-gray-700 rounded-full overflow-hidden transition-all">
              <div
                className="h-full bg-green-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <span className="text-sm text-gray-400 tabular-nums">
            {formatTime(position)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
