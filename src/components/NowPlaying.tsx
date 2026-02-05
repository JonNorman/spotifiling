import type { SpotifyTrack } from '@/lib/spotify/types'

interface NowPlayingProps {
  track: SpotifyTrack | null
  isPlaying: boolean
  position: number
  duration: number
  onTogglePlay: () => void
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function NowPlaying({
  track,
  isPlaying,
  position,
  duration,
  onTogglePlay,
}: NowPlayingProps) {
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
      <div className="flex items-center gap-4">
        {albumArt && (
          <img
            src={albumArt}
            alt={track.album.name}
            className="w-24 h-24 rounded shadow-lg"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate">{track.name}</h2>
          <p className="text-gray-400 truncate">
            {track.artists.map((a) => a.name).join(', ')}
          </p>
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

          <div className="flex-1">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-1000"
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
