# Spotifiling

A web app for organizing Spotify libraries. Finds "unfiled" liked songs (songs not in any playlist) and makes it easy to file them into playlists one at a time with playback preview.

## Tech Stack

- **Vite + React 19 + TypeScript** (strict mode)
- **Tailwind CSS v4** - uses `@import "tailwindcss"` syntax (not v3 `@tailwind` directives)
- **shadcn/ui** - component library (components in `src/components/ui/`)
- **Spotify Web API** - OAuth 2.0 with PKCE (client-side only, no backend)
- **Spotify Web Playback SDK** - loaded via `<script>` in `index.html`, requires Premium
- **IndexedDB** (via `idb` library) - caching liked songs and playlist tracks
- **Cloudflare Pages** - static hosting, deployed via GitHub Actions

## Architecture

No routing library. Conditional rendering based on auth state:
- Not authenticated -> `LoginPage`
- Not Premium -> error message
- Authenticated + Premium -> `FilingScreen`

### Data flow

```
AuthContext (global)
  -> FilingScreen
       -> useSpotifyData (loads & caches all data)
       -> useSpotifyPlayer (Web Playback SDK)
       -> useBatchWriter (queues track additions, flushes periodically)
```

### Caching strategy

- **IndexedDB** (`spotifiling` db): liked songs (invalidated by total count), playlist tracks (invalidated by `snapshot_id`)
- **localStorage**: filing counts (playlist sort order), pending writes (survives refresh)
- **sessionStorage**: PKCE code verifier (temporary, during OAuth flow)

## Key Files

| File | Purpose |
|------|---------|
| `src/config.ts` | Environment config, validates env vars at startup |
| `src/lib/spotify/auth.ts` | OAuth2 PKCE flow (no backend needed) |
| `src/lib/spotify/api.ts` | `SpotifyApi` class - paginated fetching, CRUD |
| `src/lib/spotify/types.ts` | All Spotify TypeScript interfaces |
| `src/lib/cache.ts` | IndexedDB + localStorage caching layer |
| `src/hooks/useSpotifyAuth.ts` | Auth state, token management, user profile |
| `src/hooks/useSpotifyData.ts` | Loads liked songs, playlists, computes unfiled |
| `src/hooks/useSpotifyPlayer.ts` | Web Playback SDK wrapper |
| `src/hooks/useBatchWriter.ts` | Batches playlist additions (flushes at 20 items or 10s) |
| `src/components/FilingScreen.tsx` | Main UI - song display, playlist selection, actions |

## Commands

```sh
npm run dev       # Start dev server on http://127.0.0.1:5173
npm run build     # TypeScript check + Vite build (output: dist/)
npm run lint      # ESLint
npm run preview   # Preview built output
```

## Environment Variables

```sh
VITE_SPOTIFY_CLIENT_ID=...       # From Spotify Developer Dashboard
VITE_SPOTIFY_REDIRECT_URI=...    # http://127.0.0.1:5173/callback (local) or production URL
```

## Development Notes

### Spotify OAuth on localhost
- Use `http://127.0.0.1:5173/callback` (not `localhost`, not HTTPS)
- `127.0.0.1` is treated as a secure context by browsers even over HTTP
- Spotify allows HTTP redirect URIs for loopback addresses
- No SSL plugin needed for local dev

### Pagination
- All paginated API calls use the `next` URL from the response (not offset counting)
- When `next` is `null`, pagination is complete
- The `next` URL is absolute; we strip the base URL prefix before passing to `this.fetch()`

### Playlist filtering
- Only playlists where `owner.id === userId` or `collaborative === true` are loaded
- This prevents showing playlists the user can't add tracks to

### Batch writing
- Track additions are queued to localStorage, not sent immediately
- Flushed every 10 seconds or when 20 writes accumulate
- Grouped by playlist ID to minimize API calls
- Persists across page reloads

### Web Playback SDK
- Requires Spotify Premium
- SDK script loaded in `index.html`, initialized when `window.Spotify` is available
- Songs auto-play from 30% into the track
- Play button falls back to starting playback if no active session exists

### IndexedDB vs localStorage
- localStorage has a 5MB limit, insufficient for large libraries (1000+ songs)
- IndexedDB handles arbitrarily large data
- Small data (filing counts, pending writes) stays in localStorage

## Deployment

GitHub Actions deploys to Cloudflare Pages on push to `master`.

**Required secrets/variables:**
- `VITE_SPOTIFY_CLIENT_ID` (repository secret)
- `VITE_SPOTIFY_REDIRECT_URI` (repository variable)
- `CLOUDFLARE_API_TOKEN` (repository secret - needs Cloudflare Pages edit permission)
- `CLOUDFLARE_ACCOUNT_ID` (repository secret)

After first deploy, update the Spotify app's redirect URI in the Developer Dashboard to include the production callback URL.
