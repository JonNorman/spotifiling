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
    const tracks: SpotifyTrack[] = []
    let offset = 0
    const limit = 50

    // First request to get total
    const first = await this.fetch<SpotifyPaginated<{ track: SpotifyTrack }>>(
      `/me/tracks?limit=${limit}&offset=0`
    )

    tracks.push(...first.items.map((i) => i.track))
    onProgress?.(tracks.length, first.total)

    // Fetch remaining pages
    while (tracks.length < first.total) {
      offset += limit
      const page = await this.fetch<SpotifyPaginated<{ track: SpotifyTrack }>>(
        `/me/tracks?limit=${limit}&offset=${offset}`
      )
      tracks.push(...page.items.map((i) => i.track))
      onProgress?.(tracks.length, first.total)
    }

    return tracks
  }

  // Get all user playlists (handles pagination)
  async getAllPlaylists(): Promise<SpotifyPlaylist[]> {
    const playlists: SpotifyPlaylist[] = []
    let offset = 0
    const limit = 50

    const first = await this.fetch<SpotifyPaginated<SpotifyPlaylist>>(
      `/me/playlists?limit=${limit}&offset=0`
    )
    playlists.push(...first.items)

    while (playlists.length < first.total) {
      offset += limit
      const page = await this.fetch<SpotifyPaginated<SpotifyPlaylist>>(
        `/me/playlists?limit=${limit}&offset=${offset}`
      )
      playlists.push(...page.items)
    }

    return playlists
  }

  // Get tracks in a playlist
  async getPlaylistTracks(playlistId: string): Promise<string[]> {
    const trackIds: string[] = []
    let offset = 0
    const limit = 100

    const first = await this.fetch<SpotifyPaginated<{ track: SpotifyTrack | null }>>(
      `/playlists/${playlistId}/tracks?limit=${limit}&offset=0&fields=items(track(id)),total`
    )
    trackIds.push(...first.items.filter((i) => i.track).map((i) => i.track!.id))

    while (trackIds.length < first.total) {
      offset += limit
      const page = await this.fetch<SpotifyPaginated<{ track: SpotifyTrack | null }>>(
        `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=items(track(id)),total`
      )
      trackIds.push(...page.items.filter((i) => i.track).map((i) => i.track!.id))
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
}
