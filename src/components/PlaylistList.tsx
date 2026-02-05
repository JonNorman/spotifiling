import { useState, useMemo, useEffect, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { SpotifyPlaylist } from '@/lib/spotify/types'

interface PlaylistListProps {
  playlists: SpotifyPlaylist[]
  selectedIds: Set<string>
  onToggle: (playlistId: string) => void
  onCreateNew: () => void
  searchFocusKey: string // e.g., '/'
}

export function PlaylistList({
  playlists,
  selectedIds,
  onToggle,
  onCreateNew,
  searchFocusKey,
}: PlaylistListProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredPlaylists = useMemo(() => {
    if (!search.trim()) return playlists
    const lower = search.toLowerCase()
    return playlists.filter((p) => p.name.toLowerCase().includes(lower))
  }, [playlists, search])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Escape') {
          setSearch('')
          inputRef.current?.blur()
        }
        return
      }

      // Focus search
      if (e.key === searchFocusKey) {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }

      // Number keys 1-9 and 0 (for 10)
      if (e.key >= '0' && e.key <= '9') {
        const index = e.key === '0' ? 9 : parseInt(e.key) - 1
        const playlist = filteredPlaylists[index]
        if (playlist) {
          onToggle(playlist.id)
        }
        return
      }

      // N for new playlist
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
        {filteredPlaylists.map((playlist, index) => (
          <label
            key={playlist.id}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer"
          >
            <Checkbox
              checked={selectedIds.has(playlist.id)}
              onCheckedChange={() => onToggle(playlist.id)}
            />
            <span className="text-gray-500 text-sm w-4">
              {index < 10 ? (index + 1) % 10 : ''}
            </span>
            <span className="truncate">{playlist.name}</span>
          </label>
        ))}

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
