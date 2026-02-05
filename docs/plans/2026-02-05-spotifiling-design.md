# Spotifiling Design Document

A web app to organize Spotify liked songs into playlists.

## Overview

Spotifiling helps users organize their Spotify library by identifying "unfiled" songs - tracks in Liked Songs that don't appear in any other playlist. It presents these songs one at a time with playback, making it easy to file them into the right playlists using a keyboard-driven interface.

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Vite + React + TypeScript | Fast dev experience, familiar, right-sized for scope |
| UI | Tailwind CSS + shadcn/ui | Lightweight, accessible components, customizable |
| Auth | OAuth 2.0 PKCE (client-side) | No backend needed, secure for SPAs |
| Playback | Spotify Web Playback SDK | Full control, native browser playback |
| Deployment | Cloudflare Pages | Free, fast, edge functions available if needed later |

## Authentication

- OAuth 2.0 Authorization Code flow with PKCE (client-side only)
- Required scopes:
  - `user-library-read` - read Liked Songs
  - `playlist-read-private` - read user's playlists
  - `playlist-modify-private` - add songs to private playlists
  - `playlist-modify-public` - add songs to public playlists
  - `streaming` - Web Playback SDK
  - `user-read-email`, `user-read-private` - user identity
- Access token stored in memory (not localStorage)
- Session lasts until token expires (1 hour) or tab closes
- Requires Spotify Premium for playback

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Spotifiling                      [User] [Logout]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌───────────────────────────────────────────┐     │
│   │  Song Title                               │     │
│   │  Artist Name                              │     │
│   │  ▶ advancement bar ─────●───────  3:24   │     │
│   └───────────────────────────────────────────┘     │
│                                                     │
│   Progress: 42 of 156 unfiled songs remaining       │
│                                                     │
│   ┌─ File to playlists ───────────────────────┐     │
│   │  [/] Search playlists...                  │     │
│   │                                           │     │
│   │  ☑ 1. Chill Vibes                        │     │
│   │  ☐ 2. Workout Mix                        │     │
│   │  ☐ 3. Focus Music                        │     │
│   │  ☐ 4. Road Trip                          │     │
│   │  ...                                      │     │
│   │                                           │     │
│   │  [N] + New playlist                       │     │
│   └───────────────────────────────────────────┘     │
│                                                     │
│              [ Next (Enter) ]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Responsive/mobile-friendly layout
- Song auto-plays from ~30% into the track
- Playlists sorted by filing frequency (most used at top)
- Progress indicator shows remaining unfiled songs

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search/filter |
| `1-0` | Toggle playlists 1-10 (contextual to visible list) |
| `Enter` | Next song (or add to single filtered playlist) |
| `Space` | Pause/resume playback |
| `N` | Create new playlist |
| `Esc` | Clear search/filter |
| `?` | Show shortcut help |

Number keys map to the currently visible playlists - if search filter is active, they target the filtered results.

## Core User Flow

1. User logs in with Spotify (OAuth PKCE)
2. App loads and caches liked songs + all playlists
3. App computes "unfiled" songs (liked songs not in any playlist)
4. App presents one random unfiled song, auto-playing from ~30%
5. User sees playlists sorted by filing frequency
6. User checks one or more playlists (keyboard or click)
7. User presses Enter to advance to next random unfiled song
8. Writes are batched and flushed to Spotify API periodically
9. Repeat until all songs filed or user quits

## State Management

### React State

```typescript
interface AppState {
  // Core data
  unfiledSongs: Track[];
  currentSong: Track | null;
  playlists: Playlist[];

  // UI state
  selectedPlaylistIds: Set<string>;
  searchFilter: string;

  // Sync state
  pendingWrites: Map<string, string[]>; // songId -> playlistIds
}
```

### localStorage Persisted

```typescript
interface PersistedState {
  // For playlist sorting
  playlistFilingCounts: Record<string, number>;

  // Survives accidental refresh
  pendingWrites: Array<{ songId: string; playlistIds: string[] }>;

  // Cache
  cache: {
    likedSongs: {
      tracks: Track[];
      total: number;
      fetchedAt: number;
    };
    playlists: Record<string, {
      tracks: Track[];
      snapshotId: string;
    }>;
  };
}
```

## Caching Strategy

### Smart Refresh on Load

1. Fetch playlist list (~1 request) to get current `snapshot_id` for each
2. For each playlist:
   - If `snapshot_id` matches cache → use cached tracks
   - If changed → refetch that playlist's tracks
3. For Liked Songs:
   - Fetch first page (limit=1) to get total count
   - If total matches cache → use cached
   - If different → refetch all

### Freshness Approach

- **Optimistic**: Trust the cache, show songs immediately
- **Lazy validation**: If song already in target playlist, Spotify API is idempotent - detect and show "already filed" message
- **Background refresh**: Periodically refresh cache while user is filing

## API Strategy

### Batched Writes

Spotify allows ~180 requests/minute. Batching writes avoids rate limits.

**Flush triggers:**
- Every 10 seconds if pending writes exist
- On `beforeunload` (user closing tab)
- When pending queue hits 20 items

**Write handling:**
- Optimistic UI: song marked as filed immediately
- API catches up in background
- Failed writes stay in queue, retry on next flush
- Surface persistent failures to user after 3 retries

## Error Handling

### Authentication Errors
- Token expired → prompt re-login modal
- User revokes access → same as above
- PKCE flow fails → clear error message, retry button

### API Errors
- Rate limited (429) → exponential backoff, keep writes queued
- Playlist write fails → retry up to 3 times, then surface error
- Network offline → detect via `navigator.onLine`, pause flushing, resume when back

### Edge Cases
- **No Liked Songs** → empty state: "No liked songs found"
- **All songs filed** → celebration: "All done!"
- **Song no longer exists** → skip silently
- **Playlist deleted** → remove from list, pending writes fail gracefully
- **Very large library** → progress indicator during load
- **Premium check fails** → clear message about requirement

### User Feedback
- Toast notifications for: batch flush success, errors, "already filed"
- Subtle pending indicator: "3 changes syncing..."
- Never block UI on API calls

## File Structure (Proposed)

```
src/
├── main.tsx
├── App.tsx
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── NowPlaying.tsx   # Song display + playback controls
│   ├── PlaylistList.tsx # Checkbox list with search
│   ├── ProgressBar.tsx  # Filing progress indicator
│   └── KeyboardHelp.tsx # Shortcut overlay
├── hooks/
│   ├── useSpotifyAuth.ts
│   ├── useSpotifyPlayer.ts
│   ├── usePlaylistFiling.ts
│   └── useKeyboardShortcuts.ts
├── lib/
│   ├── spotify.ts       # API client
│   ├── cache.ts         # localStorage cache logic
│   └── utils.ts
├── types/
│   └── spotify.ts       # Type definitions
└── index.css            # Tailwind imports
```

## Future Considerations (Out of Scope)

These are explicitly not part of v1, but noted for potential future work:

- Folder-based playlist selection (API support is limited)
- Non-Premium fallback (open in Spotify app)
- Playlist folder creation
- Undo last filing action
- Filing history/statistics
- Collaborative filing sessions
