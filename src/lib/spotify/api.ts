import type {
  SpotifyTrack,
  SpotifyPlaylist,
  SpotifyPaginated,
} from './types'

export class SpotifyApi {
  constructor(private accessToken: string) {}

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new Error(`Rate limited. Retry after ${retryAfter}s`)
      }
      throw new Error(`API error: ${response.status}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  // Get all liked songs (handles pagination)
  async getAllLikedSongs(
    onProgress?: (loaded: number, total: number) => void
  ): Promise<SpotifyTrack[]> {
    type PageType = SpotifyPaginated<{ added_at: string; track: SpotifyTrack }>
    const tracks: SpotifyTrack[] = []
    let url: string | null = `/me/tracks?limit=50`
    let total = 0

    while (url) {
      const page: PageType = await this.fetch<PageType>(url)
      total = page.total
      tracks.push(...page.items.map((i) => ({ ...i.track, added_at: i.added_at })))
      onProgress?.(tracks.length, total)
      url = page.next ? page.next.replace('https://api.spotify.com/v1', '') : null
    }

    return tracks
  }

  // Get all user playlists (handles pagination)
  async getAllPlaylists(): Promise<SpotifyPlaylist[]> {
    type PageType = SpotifyPaginated<SpotifyPlaylist>
    const playlists: SpotifyPlaylist[] = []
    let url: string | null = `/me/playlists?limit=50`

    while (url) {
      const page: PageType = await this.fetch<PageType>(url)
      playlists.push(...page.items)
      url = page.next ? page.next.replace('https://api.spotify.com/v1', '') : null
    }

    return playlists
  }

  // Get tracks in a playlist
  async getPlaylistTracks(playlistId: string): Promise<string[]> {
    type PageType = SpotifyPaginated<{ track: SpotifyTrack | null }>
    const trackIds: string[] = []
    let url: string | null = `/playlists/${playlistId}/tracks?limit=100&fields=items(track(id)),total,next`

    while (url) {
      const page: PageType = await this.fetch<PageType>(url)
      trackIds.push(...page.items.filter((i) => i.track).map((i) => i.track!.id))
      url = page.next ? page.next.replace('https://api.spotify.com/v1', '') : null
    }

    return trackIds
  }

  // Add tracks to a playlist
  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    await this.fetch(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: trackUris }),
    })
  }

  // Create a new playlist
  async createPlaylist(name: string): Promise<SpotifyPlaylist> {
    const user = await this.fetch<{ id: string }>('/me')
    return this.fetch(`/users/${user.id}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        public: false,
        description: 'Created by Spotifiling',
      }),
    })
  }

  // Get playlist by ID (to check snapshot_id)
  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    return this.fetch(`/playlists/${playlistId}?fields=id,name,uri,snapshot_id,tracks(total)`)
  }

  // Get liked songs count (for cache validation)
  async getLikedSongsCount(): Promise<number> {
    const result = await this.fetch<SpotifyPaginated<unknown>>(
      '/me/tracks?limit=1&offset=0'
    )
    return result.total
  }

  // Remove a track from the user's saved tracks (unlike)
  async unlikeSong(trackId: string): Promise<void> {
    await this.fetch(`/me/tracks?ids=${trackId}`, {
      method: 'DELETE',
    })
  }
}
