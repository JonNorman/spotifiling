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
