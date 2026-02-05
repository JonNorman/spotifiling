export interface SpotifyTokens {
  accessToken: string
  expiresAt: number
}

export interface SpotifyUser {
  id: string
  display_name: string | null
  email: string
  images: { url: string }[]
  product: 'premium' | 'free' | 'open'
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  added_at?: string // ISO date string when added to library
  artists: { id: string; name: string }[]
  album: {
    id: string
    name: string
    images: { url: string; width: number; height: number }[]
  }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  uri: string
  snapshot_id: string
  owner: {
    id: string
  }
  collaborative: boolean
  tracks: {
    total: number
  }
}

export interface SpotifyPaginated<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  next: string | null
}

// Web Playback SDK types
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayer
    }
  }
}

export interface SpotifyPlayer {
  connect: () => Promise<boolean>
  disconnect: () => void
  addListener: (event: string, callback: (state: unknown) => void) => void
  removeListener: (event: string) => void
  getCurrentState: () => Promise<SpotifyPlaybackState | null>
  setVolume: (volume: number) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  togglePlay: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
}

export interface SpotifyPlaybackState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      name: string
      uri: string
      artists: { name: string }[]
      album: { images: { url: string }[] }
    }
  }
}
