export const config = {
  spotify: {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
    redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string,
    scopes: [
      'user-library-read',
      'user-library-modify',
      'playlist-read-private',
      'playlist-modify-private',
      'playlist-modify-public',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-private',
    ],
  },
} as const

// Validate config at startup
if (!config.spotify.clientId) {
  throw new Error('VITE_SPOTIFY_CLIENT_ID is not set')
}
if (!config.spotify.redirectUri) {
  throw new Error('VITE_SPOTIFY_REDIRECT_URI is not set')
}
