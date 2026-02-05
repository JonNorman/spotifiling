# Spotifiling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web app that helps users organize their Spotify library by identifying and filing "unfiled" liked songs into playlists.

**Architecture:** Single-page React app with client-side Spotify OAuth (PKCE). Fetches liked songs and playlists, computes unfiled songs, presents them one at a time with Web Playback SDK. Batched writes to Spotify API. Smart caching in localStorage.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, shadcn/ui, Spotify Web API, Spotify Web Playback SDK, Cloudflare Pages, GitHub Actions.

---

## Prerequisites (User Tasks)

### Task 0: Set Up Spotify Developer App

**This task must be completed by you (the user) before development can begin.**

**Step 1: Create a Spotify Developer account**

Go to https://developer.spotify.com/dashboard and log in with your Spotify account.

**Step 2: Create a new app**

- Click "Create App"
- App name: `Spotifiling`
- App description: `Organize your Spotify library`
- Redirect URIs: Add both:
  - `https://localhost:5173/callback` (local dev - HTTPS required)
  - `https://your-app.pages.dev/callback` (production - update after deployment)
- Which APIs are you planning to use?: Select "Web API" and "Web Playback SDK"
- Accept the terms and click "Save"

**Step 3: Note your credentials**

- Copy the **Client ID** (you'll need this)
- Note: No Client Secret needed for PKCE flow

**Step 4: Set up Cloudflare account (for deployment)**

- Go to https://dash.cloudflare.com and create an account if needed
- Go to Workers & Pages in the sidebar
- You'll create the Pages project later via GitHub Actions

**Step 5: Get Cloudflare API Token**

- Go to https://dash.cloudflare.com/profile/api-tokens
- Click "Create Token"
- Use template "Edit Cloudflare Workers"
- Or create custom token with permissions: `Account:Cloudflare Pages:Edit`
- Copy the token (you'll need this for GitHub Actions)

**Step 6: Get Cloudflare Account ID**

- Go to any domain in your Cloudflare dashboard, or Workers & Pages
- Your Account ID is shown in the right sidebar
- Copy it (you'll need this for GitHub Actions)

---

## Phase 1: Project Setup

### Task 1: Initialize Vite + React + TypeScript Project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

**Step 1: Create Vite project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

Select: Ignore files and continue (since we have existing files)

**Step 2: Install dependencies**

Run:
```bash
npm install
```

**Step 3: Install HTTPS plugin for local dev**

Run:
```bash
npm install -D @vitejs/plugin-basic-ssl
```

Then update `vite.config.ts` to include the plugin:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
})
```

**Step 5: Verify it works**

Run:
```bash
npm run dev
```

Expected: Dev server starts at https://localhost:5173 (accept the self-signed cert warning), shows Vite + React page

**Step 6: Stop the dev server**

Press `Ctrl+C`

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize vite + react + typescript project"
```

---

### Task 2: Set Up Tailwind CSS

**Files:**
- Modify: `package.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/index.css`

**Step 1: Install Tailwind and dependencies**

Run:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 2: Configure Tailwind**

Replace `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 3: Add Tailwind directives to CSS**

Replace `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Update App.tsx to test Tailwind**

Replace `src/App.tsx`:
```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">Spotifiling</h1>
    </div>
  )
}

export default App
```

**Step 5: Verify Tailwind works**

Run:
```bash
npm run dev
```

Expected: Dark background with white "Spotifiling" text centered

**Step 6: Stop dev server and commit**

```bash
git add -A
git commit -m "feat: add tailwind css"
```

---

### Task 3: Set Up shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`
- Modify: `tailwind.config.js`
- Modify: `tsconfig.json`

**Step 1: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init
```

When prompted:
- Which style would you like to use? → Default
- Which color would you like to use as base color? → Neutral
- Would you like to use CSS variables for colors? → Yes

**Step 2: Add Button component (to verify setup)**

Run:
```bash
npx shadcn@latest add button
```

**Step 3: Test the button**

Update `src/App.tsx`:
```tsx
import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center flex-col gap-4">
      <h1 className="text-4xl font-bold">Spotifiling</h1>
      <Button>Test Button</Button>
    </div>
  )
}

export default App
```

**Step 4: Verify it works**

Run:
```bash
npm run dev
```

Expected: "Spotifiling" heading with a styled button below it

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add shadcn/ui with button component"
```

---

### Task 4: Set Up Environment Variables

**Files:**
- Create: `.env.example`
- Create: `.env`
- Modify: `.gitignore`
- Create: `src/config.ts`

**Step 1: Create .env.example**

Create `.env.example`:
```
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_REDIRECT_URI=https://localhost:5173/callback
```

**Step 2: Create actual .env file**

Create `.env`:
```
VITE_SPOTIFY_CLIENT_ID=<your actual client id from Spotify Dashboard>
VITE_SPOTIFY_REDIRECT_URI=https://localhost:5173/callback
```

**Step 3: Ensure .env is gitignored**

Check `.gitignore` contains:
```
.env
.env.local
```

If not, add these lines.

**Step 4: Create config module**

Create `src/config.ts`:
```typescript
export const config = {
  spotify: {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
    redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string,
    scopes: [
      'user-library-read',
      'playlist-read-private',
      'playlist-modify-private',
      'playlist-modify-public',
      'streaming',
      'user-read-email',
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
```

**Step 5: Import config in App to validate on startup**

Update `src/App.tsx`:
```tsx
import { Button } from "@/components/ui/button"
import { config } from "./config"

function App() {
  // Config validation happens on import
  console.log('Spotify Client ID configured:', !!config.spotify.clientId)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center flex-col gap-4">
      <h1 className="text-4xl font-bold">Spotifiling</h1>
      <Button>Test Button</Button>
    </div>
  )
}

export default App
```

**Step 6: Verify config loads**

Run:
```bash
npm run dev
```

Expected: Console shows "Spotify Client ID configured: true"

**Step 7: Commit**

```bash
git add .env.example .gitignore src/config.ts src/App.tsx
git commit -m "feat: add environment variable configuration"
```

---

## Phase 2: Spotify Authentication

### Task 5: Create PKCE Auth Utilities

**Files:**
- Create: `src/lib/spotify/auth.ts`
- Create: `src/lib/spotify/types.ts`

**Step 1: Create Spotify types**

Create `src/lib/spotify/types.ts`:
```typescript
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
```

**Step 2: Create auth utilities**

Create `src/lib/spotify/auth.ts`:
```typescript
import { config } from '@/config'
import type { SpotifyTokens } from './types'

// Generate random string for PKCE
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (x) => possible[x % possible.length]).join('')
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

// Start the OAuth flow
export async function startAuthFlow(): Promise<void> {
  const codeVerifier = generateRandomString(64)
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Store verifier for token exchange
  sessionStorage.setItem('spotify_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: 'code',
    redirect_uri: config.spotify.redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: config.spotify.scopes.join(' '),
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

// Exchange auth code for tokens
export async function exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
  const codeVerifier = sessionStorage.getItem('spotify_code_verifier')
  if (!codeVerifier) {
    throw new Error('No code verifier found')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.spotify.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.spotify.redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens')
  }

  const data = await response.json()

  // Clean up
  sessionStorage.removeItem('spotify_code_verifier')

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

// Check if we have a valid auth code in URL
export function getAuthCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('code')
}

// Clear auth code from URL without reload
export function clearAuthCodeFromUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  window.history.replaceState({}, '', url.pathname)
}
```

**Step 3: Commit**

```bash
git add src/lib/spotify
git commit -m "feat: add spotify PKCE auth utilities"
```

---

### Task 6: Create Auth Hook and Context

**Files:**
- Create: `src/hooks/useSpotifyAuth.ts`
- Create: `src/contexts/AuthContext.tsx`

**Step 1: Create auth hook**

Create `src/hooks/useSpotifyAuth.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react'
import type { SpotifyTokens, SpotifyUser } from '@/lib/spotify/types'
import {
  startAuthFlow,
  exchangeCodeForTokens,
  getAuthCodeFromUrl,
  clearAuthCodeFromUrl,
} from '@/lib/spotify/auth'

interface AuthState {
  tokens: SpotifyTokens | null
  user: SpotifyUser | null
  isLoading: boolean
  error: string | null
}

export function useSpotifyAuth() {
  const [state, setState] = useState<AuthState>({
    tokens: null,
    user: null,
    isLoading: true,
    error: null,
  })

  // Fetch user profile
  const fetchUser = useCallback(async (accessToken: string): Promise<SpotifyUser> => {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch user profile')
    }
    return response.json()
  }, [])

  // Handle OAuth callback
  useEffect(() => {
    async function handleAuth() {
      const code = getAuthCodeFromUrl()

      if (code) {
        try {
          clearAuthCodeFromUrl()
          const tokens = await exchangeCodeForTokens(code)
          const user = await fetchUser(tokens.accessToken)

          setState({
            tokens,
            user,
            isLoading: false,
            error: null,
          })
        } catch (err) {
          setState({
            tokens: null,
            user: null,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Auth failed',
          })
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }))
      }
    }

    handleAuth()
  }, [fetchUser])

  const login = useCallback(() => {
    startAuthFlow()
  }, [])

  const logout = useCallback(() => {
    setState({
      tokens: null,
      user: null,
      isLoading: false,
      error: null,
    })
  }, [])

  const isAuthenticated = !!state.tokens && Date.now() < state.tokens.expiresAt
  const isPremium = state.user?.product === 'premium'

  return {
    ...state,
    isAuthenticated,
    isPremium,
    login,
    logout,
  }
}
```

**Step 2: Create auth context**

Create `src/contexts/AuthContext.tsx`:
```typescript
import { createContext, useContext, type ReactNode } from 'react'
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth'

type AuthContextType = ReturnType<typeof useSpotifyAuth>

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSpotifyAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**Step 3: Commit**

```bash
git add src/hooks src/contexts
git commit -m "feat: add spotify auth hook and context"
```

---

### Task 7: Create Login Page and Auth Flow

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Create: `src/components/LoginPage.tsx`

**Step 1: Create login page component**

Create `src/components/LoginPage.tsx`:
```typescript
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const { login, error, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center flex-col gap-6">
      <h1 className="text-4xl font-bold">Spotifiling</h1>
      <p className="text-gray-400 max-w-md text-center">
        Organize your Spotify library by finding unfiled liked songs and adding them to playlists.
      </p>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <Button onClick={login} size="lg">
        Login with Spotify
      </Button>

      <p className="text-gray-500 text-sm">
        Requires Spotify Premium for playback
      </p>
    </div>
  )
}
```

**Step 2: Update App.tsx**

Replace `src/App.tsx`:
```tsx
import { useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/components/LoginPage'

function App() {
  const { isAuthenticated, isPremium, user, logout } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">Premium Required</h1>
        <p className="text-gray-400">Spotifiling requires Spotify Premium for playback.</p>
        <button onClick={logout} className="text-blue-400 underline">
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Spotifiling</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">{user?.display_name}</span>
          <button onClick={logout} className="text-blue-400 underline">
            Log out
          </button>
        </div>
      </header>

      <main>
        <p className="text-gray-400">Main app coming soon...</p>
      </main>
    </div>
  )
}

export default App
```

**Step 3: Update main.tsx to include AuthProvider**

Replace `src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@/contexts/AuthContext'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
```

**Step 4: Test the login flow**

Run:
```bash
npm run dev
```

Expected:
- See login page with "Login with Spotify" button
- Click button → redirects to Spotify
- After authorizing → redirects back and shows main app skeleton

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add login page and complete auth flow"
```

---

## Phase 3: Spotify API Client

### Task 8: Create Spotify API Client

**Files:**
- Create: `src/lib/spotify/api.ts`

**Step 1: Create API client**

Create `src/lib/spotify/api.ts`:
```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/spotify/api.ts
git commit -m "feat: add spotify API client with pagination"
```

---

### Task 9: Create Caching Layer

**Files:**
- Create: `src/lib/cache.ts`

**Step 1: Create cache utilities**

Create `src/lib/cache.ts`:
```typescript
import type { SpotifyTrack, SpotifyPlaylist } from '@/lib/spotify/types'

const CACHE_KEY = 'spotifiling_cache'
const FILING_COUNTS_KEY = 'spotifiling_filing_counts'
const PENDING_WRITES_KEY = 'spotifiling_pending_writes'

interface CachedData {
  likedSongs: {
    tracks: SpotifyTrack[]
    total: number
    fetchedAt: number
  } | null
  playlists: Record<string, {
    trackIds: string[]
    snapshotId: string
  }>
}

interface PendingWrite {
  trackUri: string
  playlistId: string
}

// Cache management
export function getCache(): CachedData {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // Ignore parse errors
  }
  return { likedSongs: null, playlists: {} }
}

export function setCache(data: CachedData): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

export function updateCachedLikedSongs(tracks: SpotifyTrack[], total: number): void {
  const cache = getCache()
  cache.likedSongs = {
    tracks,
    total,
    fetchedAt: Date.now(),
  }
  setCache(cache)
}

export function updateCachedPlaylistTracks(
  playlistId: string,
  trackIds: string[],
  snapshotId: string
): void {
  const cache = getCache()
  cache.playlists[playlistId] = { trackIds, snapshotId }
  setCache(cache)
}

export function getCachedPlaylistTracks(
  playlistId: string,
  currentSnapshotId: string
): string[] | null {
  const cache = getCache()
  const cached = cache.playlists[playlistId]
  if (cached && cached.snapshotId === currentSnapshotId) {
    return cached.trackIds
  }
  return null
}

export function getCachedLikedSongs(currentTotal: number): SpotifyTrack[] | null {
  const cache = getCache()
  if (cache.likedSongs && cache.likedSongs.total === currentTotal) {
    return cache.likedSongs.tracks
  }
  return null
}

// Filing counts (for playlist sorting)
export function getFilingCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(FILING_COUNTS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // Ignore
  }
  return {}
}

export function incrementFilingCount(playlistId: string): void {
  const counts = getFilingCounts()
  counts[playlistId] = (counts[playlistId] || 0) + 1
  localStorage.setItem(FILING_COUNTS_KEY, JSON.stringify(counts))
}

// Pending writes (survives refresh)
export function getPendingWrites(): PendingWrite[] {
  try {
    const raw = localStorage.getItem(PENDING_WRITES_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // Ignore
  }
  return []
}

export function addPendingWrite(trackUri: string, playlistId: string): void {
  const writes = getPendingWrites()
  // Avoid duplicates
  if (!writes.some((w) => w.trackUri === trackUri && w.playlistId === playlistId)) {
    writes.push({ trackUri, playlistId })
    localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(writes))
  }
}

export function removePendingWrites(toRemove: PendingWrite[]): void {
  const writes = getPendingWrites()
  const remaining = writes.filter(
    (w) => !toRemove.some((r) => r.trackUri === w.trackUri && r.playlistId === w.playlistId)
  )
  localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(remaining))
}

export function clearAllPendingWrites(): void {
  localStorage.removeItem(PENDING_WRITES_KEY)
}
```

**Step 2: Commit**

```bash
git add src/lib/cache.ts
git commit -m "feat: add localStorage caching layer"
```

---

## Phase 4: Core Data Loading

### Task 10: Create Data Loading Hook

**Files:**
- Create: `src/hooks/useSpotifyData.ts`

**Step 1: Create data loading hook**

Create `src/hooks/useSpotifyData.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react'
import { SpotifyApi } from '@/lib/spotify/api'
import type { SpotifyTrack, SpotifyPlaylist } from '@/lib/spotify/types'
import {
  getCachedLikedSongs,
  getCachedPlaylistTracks,
  updateCachedLikedSongs,
  updateCachedPlaylistTracks,
  getFilingCounts,
} from '@/lib/cache'

interface DataState {
  likedSongs: SpotifyTrack[]
  playlists: SpotifyPlaylist[]
  playlistTrackIds: Map<string, Set<string>>
  unfiledSongs: SpotifyTrack[]
  isLoading: boolean
  loadingStatus: string
  error: string | null
}

export function useSpotifyData(accessToken: string | null) {
  const [state, setState] = useState<DataState>({
    likedSongs: [],
    playlists: [],
    playlistTrackIds: new Map(),
    unfiledSongs: [],
    isLoading: true,
    loadingStatus: 'Initializing...',
    error: null,
  })

  const loadData = useCallback(async () => {
    if (!accessToken) return

    const api = new SpotifyApi(accessToken)

    try {
      setState((s) => ({ ...s, isLoading: true, loadingStatus: 'Checking library...' }))

      // Step 1: Get liked songs count for cache validation
      const likedCount = await api.getLikedSongsCount()

      // Step 2: Load liked songs (from cache or API)
      let likedSongs = getCachedLikedSongs(likedCount)
      if (!likedSongs) {
        setState((s) => ({ ...s, loadingStatus: 'Loading liked songs...' }))
        likedSongs = await api.getAllLikedSongs((loaded, total) => {
          setState((s) => ({
            ...s,
            loadingStatus: `Loading liked songs... ${loaded}/${total}`,
          }))
        })
        updateCachedLikedSongs(likedSongs, likedCount)
      }

      // Step 3: Load playlists
      setState((s) => ({ ...s, loadingStatus: 'Loading playlists...' }))
      const playlists = await api.getAllPlaylists()

      // Step 4: Load playlist tracks (with smart caching)
      const playlistTrackIds = new Map<string, Set<string>>()

      for (let i = 0; i < playlists.length; i++) {
        const playlist = playlists[i]
        setState((s) => ({
          ...s,
          loadingStatus: `Loading playlist ${i + 1}/${playlists.length}: ${playlist.name}`,
        }))

        // Check cache first
        let trackIds = getCachedPlaylistTracks(playlist.id, playlist.snapshot_id)
        if (!trackIds) {
          trackIds = await api.getPlaylistTracks(playlist.id)
          updateCachedPlaylistTracks(playlist.id, trackIds, playlist.snapshot_id)
        }

        playlistTrackIds.set(playlist.id, new Set(trackIds))
      }

      // Step 5: Compute unfiled songs
      setState((s) => ({ ...s, loadingStatus: 'Computing unfiled songs...' }))

      const allFiledTrackIds = new Set<string>()
      playlistTrackIds.forEach((trackIds) => {
        trackIds.forEach((id) => allFiledTrackIds.add(id))
      })

      const unfiledSongs = likedSongs.filter(
        (track) => !allFiledTrackIds.has(track.id)
      )

      // Sort playlists by filing frequency
      const filingCounts = getFilingCounts()
      const sortedPlaylists = [...playlists].sort((a, b) => {
        const countA = filingCounts[a.id] || 0
        const countB = filingCounts[b.id] || 0
        return countB - countA
      })

      setState({
        likedSongs,
        playlists: sortedPlaylists,
        playlistTrackIds,
        unfiledSongs,
        isLoading: false,
        loadingStatus: '',
        error: null,
      })
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }))
    }
  }, [accessToken])

  useEffect(() => {
    loadData()
  }, [loadData])

  const removeFromUnfiled = useCallback((trackId: string) => {
    setState((s) => ({
      ...s,
      unfiledSongs: s.unfiledSongs.filter((t) => t.id !== trackId),
    }))
  }, [])

  const resortPlaylists = useCallback(() => {
    const filingCounts = getFilingCounts()
    setState((s) => ({
      ...s,
      playlists: [...s.playlists].sort((a, b) => {
        const countA = filingCounts[a.id] || 0
        const countB = filingCounts[b.id] || 0
        return countB - countA
      }),
    }))
  }, [])

  const addPlaylist = useCallback((playlist: SpotifyPlaylist) => {
    setState((s) => ({
      ...s,
      playlists: [playlist, ...s.playlists],
      playlistTrackIds: new Map(s.playlistTrackIds).set(playlist.id, new Set()),
    }))
  }, [])

  return {
    ...state,
    removeFromUnfiled,
    resortPlaylists,
    addPlaylist,
    reload: loadData,
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useSpotifyData.ts
git commit -m "feat: add spotify data loading hook with caching"
```

---

## Phase 5: Web Playback SDK

### Task 11: Create Spotify Player Hook

**Files:**
- Create: `src/hooks/useSpotifyPlayer.ts`
- Modify: `index.html`

**Step 1: Add Spotify SDK script to index.html**

Add before closing `</body>` in `index.html`:
```html
    <script src="https://sdk.scdn.co/spotify-player.js"></script>
  </body>
</html>
```

**Step 2: Create player types**

Add to `src/lib/spotify/types.ts`:
```typescript
// Add these types to the existing file

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
```

**Step 3: Create player hook**

Create `src/hooks/useSpotifyPlayer.ts`:
```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import type { SpotifyPlayer, SpotifyPlaybackState, SpotifyTrack } from '@/lib/spotify/types'

interface PlayerState {
  isReady: boolean
  isPlaying: boolean
  position: number
  duration: number
  error: string | null
}

export function useSpotifyPlayer(accessToken: string | null) {
  const [state, setState] = useState<PlayerState>({
    isReady: false,
    isPlaying: false,
    position: 0,
    duration: 0,
    error: null,
  })

  const playerRef = useRef<SpotifyPlayer | null>(null)
  const deviceIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!accessToken) return

    let isMounted = true

    const initPlayer = () => {
      const player = new window.Spotify.Player({
        name: 'Spotifiling',
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      })

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        if (isMounted) {
          deviceIdRef.current = device_id
          setState((s) => ({ ...s, isReady: true }))
        }
      })

      player.addListener('not_ready', () => {
        if (isMounted) {
          deviceIdRef.current = null
          setState((s) => ({ ...s, isReady: false }))
        }
      })

      player.addListener('player_state_changed', (playbackState: SpotifyPlaybackState | null) => {
        if (isMounted && playbackState) {
          setState((s) => ({
            ...s,
            isPlaying: !playbackState.paused,
            position: playbackState.position,
            duration: playbackState.duration,
          }))
        }
      })

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        if (isMounted) {
          setState((s) => ({ ...s, error: `Init error: ${message}` }))
        }
      })

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        if (isMounted) {
          setState((s) => ({ ...s, error: `Auth error: ${message}` }))
        }
      })

      player.addListener('playback_error', ({ message }: { message: string }) => {
        if (isMounted) {
          setState((s) => ({ ...s, error: `Playback error: ${message}` }))
        }
      })

      player.connect()
      playerRef.current = player
    }

    // Wait for SDK to load
    if (window.Spotify) {
      initPlayer()
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer
    }

    return () => {
      isMounted = false
      playerRef.current?.disconnect()
    }
  }, [accessToken])

  // Poll for position updates while playing
  useEffect(() => {
    if (!state.isPlaying || !playerRef.current) return

    const interval = setInterval(async () => {
      const playbackState = await playerRef.current?.getCurrentState()
      if (playbackState) {
        setState((s) => ({ ...s, position: playbackState.position }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [state.isPlaying])

  const play = useCallback(async (track: SpotifyTrack) => {
    if (!deviceIdRef.current || !accessToken) return

    // Start playback at 30% into the track
    const startPosition = Math.floor(track.duration_ms * 0.3)

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [track.uri],
        position_ms: startPosition,
      }),
    })
  }, [accessToken])

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay()
  }, [])

  const pause = useCallback(async () => {
    await playerRef.current?.pause()
  }, [])

  const resume = useCallback(async () => {
    await playerRef.current?.resume()
  }, [])

  return {
    ...state,
    play,
    togglePlay,
    pause,
    resume,
  }
}
```

**Step 4: Commit**

```bash
git add index.html src/hooks/useSpotifyPlayer.ts src/lib/spotify/types.ts
git commit -m "feat: add spotify web playback SDK integration"
```

---

## Phase 6: UI Components

### Task 12: Create Now Playing Component

**Files:**
- Create: `src/components/NowPlaying.tsx`

**Step 1: Create NowPlaying component**

Create `src/components/NowPlaying.tsx`:
```typescript
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
              <svg className="w-5 h-5\" fill="currentColor" viewBox="0 0 24 24">
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
```

**Step 2: Commit**

```bash
git add src/components/NowPlaying.tsx
git commit -m "feat: add now playing component"
```

---

### Task 13: Add shadcn/ui Components

**Files:**
- Create: `src/components/ui/checkbox.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/dialog.tsx`

**Step 1: Add checkbox component**

Run:
```bash
npx shadcn@latest add checkbox
```

**Step 2: Add input component**

Run:
```bash
npx shadcn@latest add input
```

**Step 3: Add dialog component**

Run:
```bash
npx shadcn@latest add dialog
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add shadcn checkbox, input, and dialog components"
```

---

### Task 14: Create Playlist List Component

**Files:**
- Create: `src/components/PlaylistList.tsx`

**Step 1: Create PlaylistList component**

Create `src/components/PlaylistList.tsx`:
```typescript
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

      <div className="space-y-2 max-h-80 overflow-y-auto">
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
```

**Step 2: Commit**

```bash
git add src/components/PlaylistList.tsx
git commit -m "feat: add playlist list component with search and shortcuts"
```

---

### Task 15: Create New Playlist Dialog

**Files:**
- Create: `src/components/NewPlaylistDialog.tsx`

**Step 1: Create NewPlaylistDialog component**

Create `src/components/NewPlaylistDialog.tsx`:
```typescript
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface NewPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => Promise<void>
}

export function NewPlaylistDialog({
  open,
  onOpenChange,
  onCreate,
}: NewPlaylistDialogProps) {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isCreating) return

    setIsCreating(true)
    try {
      await onCreate(name.trim())
      setName('')
      onOpenChange(false)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
            placeholder="Playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-700 border-gray-600"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/NewPlaylistDialog.tsx
git commit -m "feat: add new playlist dialog"
```

---

### Task 16: Create Keyboard Help Component

**Files:**
- Create: `src/components/KeyboardHelp.tsx`

**Step 1: Create KeyboardHelp component**

Create `src/components/KeyboardHelp.tsx`:
```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  { key: '/', description: 'Search playlists' },
  { key: '1-0', description: 'Toggle playlists 1-10' },
  { key: 'Enter', description: 'Next song' },
  { key: 'Space', description: 'Pause / Resume' },
  { key: 'N', description: 'New playlist' },
  { key: 'Esc', description: 'Clear search' },
  { key: '?', description: 'Show this help' },
]

export function KeyboardHelp({ open, onOpenChange }: KeyboardHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex items-center gap-4">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-sm font-mono min-w-[4rem] text-center">
                {key}
              </kbd>
              <span className="text-gray-300">{description}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/KeyboardHelp.tsx
git commit -m "feat: add keyboard help dialog"
```

---

## Phase 7: Batch Write System

### Task 17: Create Batch Writer Hook

**Files:**
- Create: `src/hooks/useBatchWriter.ts`

**Step 1: Create batch writer hook**

Create `src/hooks/useBatchWriter.ts`:
```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import { SpotifyApi } from '@/lib/spotify/api'
import {
  getPendingWrites,
  addPendingWrite,
  removePendingWrites,
  incrementFilingCount,
} from '@/lib/cache'

interface PendingWrite {
  trackUri: string
  playlistId: string
}

interface BatchWriterState {
  pendingCount: number
  isFlushing: boolean
  lastError: string | null
}

const FLUSH_INTERVAL_MS = 10_000
const FLUSH_THRESHOLD = 20

export function useBatchWriter(accessToken: string | null) {
  const [state, setState] = useState<BatchWriterState>({
    pendingCount: getPendingWrites().length,
    isFlushing: false,
    lastError: null,
  })

  const flushingRef = useRef(false)

  const flush = useCallback(async () => {
    if (!accessToken || flushingRef.current) return

    const writes = getPendingWrites()
    if (writes.length === 0) return

    flushingRef.current = true
    setState((s) => ({ ...s, isFlushing: true, lastError: null }))

    const api = new SpotifyApi(accessToken)

    // Group writes by playlist
    const byPlaylist = new Map<string, string[]>()
    for (const write of writes) {
      const uris = byPlaylist.get(write.playlistId) || []
      uris.push(write.trackUri)
      byPlaylist.set(write.playlistId, uris)
    }

    const successfulWrites: PendingWrite[] = []
    let lastError: string | null = null

    for (const [playlistId, trackUris] of byPlaylist) {
      try {
        await api.addTracksToPlaylist(playlistId, trackUris)
        // Mark these writes as successful
        for (const uri of trackUris) {
          successfulWrites.push({ trackUri: uri, playlistId })
          incrementFilingCount(playlistId)
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Remove successful writes from pending
    if (successfulWrites.length > 0) {
      removePendingWrites(successfulWrites)
    }

    flushingRef.current = false
    setState({
      pendingCount: getPendingWrites().length,
      isFlushing: false,
      lastError,
    })
  }, [accessToken])

  // Queue a write
  const queueWrite = useCallback((trackUri: string, playlistId: string) => {
    addPendingWrite(trackUri, playlistId)
    setState((s) => ({ ...s, pendingCount: getPendingWrites().length }))
  }, [])

  // Periodic flush
  useEffect(() => {
    const interval = setInterval(() => {
      const writes = getPendingWrites()
      if (writes.length > 0) {
        flush()
      }
    }, FLUSH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [flush])

  // Flush when threshold reached
  useEffect(() => {
    if (state.pendingCount >= FLUSH_THRESHOLD) {
      flush()
    }
  }, [state.pendingCount, flush])

  // Flush on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Synchronous flush attempt using sendBeacon if possible
      const writes = getPendingWrites()
      if (writes.length > 0 && accessToken) {
        // Best effort - sendBeacon for reliability
        // Note: This won't work well with Spotify API, so we rely on localStorage persistence
        flush()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [accessToken, flush])

  return {
    ...state,
    queueWrite,
    flush,
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useBatchWriter.ts
git commit -m "feat: add batch writer hook for queued API writes"
```

---

## Phase 8: Main App Integration

### Task 18: Wire Up Main App

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/FilingScreen.tsx`

**Step 1: Create FilingScreen component**

Create `src/components/FilingScreen.tsx`:
```typescript
import { useState, useEffect, useCallback } from 'react'
import { NowPlaying } from '@/components/NowPlaying'
import { PlaylistList } from '@/components/PlaylistList'
import { NewPlaylistDialog } from '@/components/NewPlaylistDialog'
import { KeyboardHelp } from '@/components/KeyboardHelp'
import { Button } from '@/components/ui/button'
import { useSpotifyData } from '@/hooks/useSpotifyData'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { useBatchWriter } from '@/hooks/useBatchWriter'
import { SpotifyApi } from '@/lib/spotify/api'
import type { SpotifyTrack } from '@/lib/spotify/types'

interface FilingScreenProps {
  accessToken: string
}

function pickRandomSong(songs: SpotifyTrack[]): SpotifyTrack | null {
  if (songs.length === 0) return null
  const index = Math.floor(Math.random() * songs.length)
  return songs[index]
}

export function FilingScreen({ accessToken }: FilingScreenProps) {
  const data = useSpotifyData(accessToken)
  const player = useSpotifyPlayer(accessToken)
  const writer = useBatchWriter(accessToken)

  const [currentSong, setCurrentSong] = useState<SpotifyTrack | null>(null)
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set())
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Pick initial song when data loads
  useEffect(() => {
    if (!data.isLoading && data.unfiledSongs.length > 0 && !currentSong) {
      const song = pickRandomSong(data.unfiledSongs)
      setCurrentSong(song)
    }
  }, [data.isLoading, data.unfiledSongs, currentSong])

  // Play song when it changes
  useEffect(() => {
    if (currentSong && player.isReady) {
      player.play(currentSong)
    }
  }, [currentSong, player.isReady, player.play])

  // Handle next song
  const handleNext = useCallback(() => {
    if (!currentSong) return

    // Queue writes for selected playlists
    for (const playlistId of selectedPlaylistIds) {
      writer.queueWrite(currentSong.uri, playlistId)
    }

    // Remove from unfiled if added to any playlist
    if (selectedPlaylistIds.size > 0) {
      data.removeFromUnfiled(currentSong.id)
      data.resortPlaylists()
    }

    // Reset selection and pick next song
    setSelectedPlaylistIds(new Set())
    const nextSong = pickRandomSong(
      data.unfiledSongs.filter((s) => s.id !== currentSong.id)
    )
    setCurrentSong(nextSong)
  }, [currentSong, selectedPlaylistIds, data, writer])

  // Toggle playlist selection
  const handleTogglePlaylist = useCallback((playlistId: string) => {
    setSelectedPlaylistIds((prev) => {
      const next = new Set(prev)
      if (next.has(playlistId)) {
        next.delete(playlistId)
      } else {
        next.add(playlistId)
      }
      return next
    })
  }, [])

  // Create new playlist
  const handleCreatePlaylist = useCallback(async (name: string) => {
    const api = new SpotifyApi(accessToken)
    const playlist = await api.createPlaylist(name)
    data.addPlaylist(playlist)
    // Automatically select the new playlist
    setSelectedPlaylistIds((prev) => new Set([...prev, playlist.id]))
  }, [accessToken, data])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) return

      if (e.key === 'Enter') {
        e.preventDefault()
        handleNext()
        return
      }

      if (e.key === ' ') {
        e.preventDefault()
        player.togglePlay()
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        setShowHelp(true)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, player])

  // Loading state
  if (data.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">{data.loadingStatus}</p>
      </div>
    )
  }

  // Error state
  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400">{data.error}</p>
        <Button onClick={data.reload}>Retry</Button>
      </div>
    )
  }

  // All done state
  if (data.unfiledSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">All Done!</h2>
        <p className="text-gray-400">
          Every liked song is in at least one playlist.
        </p>
      </div>
    )
  }

  const totalUnfiled = data.unfiledSongs.length
  const remaining = currentSong
    ? data.unfiledSongs.filter((s) => s.id !== currentSong.id).length + 1
    : totalUnfiled

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <NowPlaying
        track={currentSong}
        isPlaying={player.isPlaying}
        position={player.position}
        duration={player.duration}
        onTogglePlay={player.togglePlay}
      />

      <p className="text-center text-gray-400">
        {remaining} of {data.likedSongs.length - (data.likedSongs.length - totalUnfiled)} unfiled songs remaining
      </p>

      <PlaylistList
        playlists={data.playlists}
        selectedIds={selectedPlaylistIds}
        onToggle={handleTogglePlaylist}
        onCreateNew={() => setShowNewPlaylist(true)}
        searchFocusKey="/"
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {writer.pendingCount > 0 && (
            <span>{writer.pendingCount} changes pending...</span>
          )}
          {writer.lastError && (
            <span className="text-red-400 ml-2">{writer.lastError}</span>
          )}
        </div>
        <Button onClick={handleNext} size="lg">
          Next (Enter)
        </Button>
      </div>

      <NewPlaylistDialog
        open={showNewPlaylist}
        onOpenChange={setShowNewPlaylist}
        onCreate={handleCreatePlaylist}
      />

      <KeyboardHelp open={showHelp} onOpenChange={setShowHelp} />
    </div>
  )
}
```

**Step 2: Update App.tsx to use FilingScreen**

Replace `src/App.tsx`:
```tsx
import { useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/components/LoginPage'
import { FilingScreen } from '@/components/FilingScreen'

function App() {
  const { isAuthenticated, isPremium, user, logout, tokens } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">Premium Required</h1>
        <p className="text-gray-400">Spotifiling requires Spotify Premium for playback.</p>
        <button onClick={logout} className="text-blue-400 underline">
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex justify-between items-center mb-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Spotifiling</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">{user?.display_name}</span>
          <button onClick={logout} className="text-blue-400 underline text-sm">
            Log out
          </button>
        </div>
      </header>

      <main>
        <FilingScreen accessToken={tokens!.accessToken} />
      </main>
    </div>
  )
}

export default App
```

**Step 3: Test the full flow**

Run:
```bash
npm run dev
```

Expected: Full app works - login, load data, see unfiled songs, play audio, check playlists, next song

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire up main app with filing screen"
```

---

## Phase 9: Mobile Responsiveness

### Task 19: Add Mobile Styles

**Files:**
- Modify: `src/components/NowPlaying.tsx`
- Modify: `src/components/PlaylistList.tsx`
- Modify: `src/components/FilingScreen.tsx`
- Modify: `src/App.tsx`

**Step 1: Update NowPlaying for mobile**

In `src/components/NowPlaying.tsx`, update the container div classes:
```tsx
// Change the flex container from:
<div className="flex items-center gap-4">

// To:
<div className="flex items-center gap-4 flex-col sm:flex-row">

// And the album art from:
className="w-24 h-24 rounded shadow-lg"

// To:
className="w-32 h-32 sm:w-24 sm:h-24 rounded shadow-lg"

// And center text on mobile:
<div className="flex-1 min-w-0 text-center sm:text-left">
```

**Step 2: Update PlaylistList for mobile**

In `src/components/PlaylistList.tsx`, update max-height:
```tsx
// Change:
<div className="space-y-2 max-h-80 overflow-y-auto">

// To:
<div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto">
```

**Step 3: Update FilingScreen spacing**

In `src/components/FilingScreen.tsx`, update the container:
```tsx
// Change:
<div className="max-w-2xl mx-auto space-y-6">

// To:
<div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
```

**Step 4: Update App header for mobile**

In `src/App.tsx`, update header:
```tsx
// Change:
<header className="flex justify-between items-center mb-8 max-w-2xl mx-auto">

// To:
<header className="flex justify-between items-center mb-4 sm:mb-8 max-w-2xl mx-auto px-2 sm:px-0">
```

**Step 5: Test on mobile viewport**

Open browser dev tools, toggle device toolbar, test on mobile sizes

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add mobile responsive styles"
```

---

## Phase 10: Deployment

### Task 20: Set Up GitHub Actions for Cloudflare Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Create GitHub Actions workflow**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SPOTIFY_CLIENT_ID: ${{ secrets.VITE_SPOTIFY_CLIENT_ID }}
          VITE_SPOTIFY_REDIRECT_URI: ${{ vars.VITE_SPOTIFY_REDIRECT_URI }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=spotifiling
```

**Step 2: Document required GitHub secrets**

The following secrets/variables need to be set in GitHub repository settings:

**Secrets** (Settings > Secrets and variables > Actions > Secrets):
- `VITE_SPOTIFY_CLIENT_ID` - Your Spotify app Client ID
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

**Variables** (Settings > Secrets and variables > Actions > Variables):
- `VITE_SPOTIFY_REDIRECT_URI` - Production callback URL (e.g., `https://spotifiling.pages.dev/callback`)

**Step 3: Commit**

```bash
mkdir -p .github/workflows
git add .github/workflows/deploy.yml
git commit -m "feat: add github actions workflow for cloudflare pages deployment"
```

---

### Task 21: Configure Cloudflare Pages SPA Routing

**Files:**
- Create: `public/_redirects`

**Step 1: Create redirects file for SPA routing**

Create `public/_redirects`:
```
/*    /index.html   200
```

This ensures all routes return index.html for client-side routing (the OAuth callback).

**Step 2: Commit**

```bash
git add public/_redirects
git commit -m "feat: add cloudflare pages SPA routing config"
```

---

### Task 22: Update Spotify App Redirect URI (User Task)

**This task must be completed by you after first deployment.**

**Step 1: Deploy and note the URL**

After the GitHub Actions workflow runs, Cloudflare will give you a URL like:
- `https://spotifiling.pages.dev` (or similar)

**Step 2: Update Spotify Dashboard**

Go to https://developer.spotify.com/dashboard, select your app, click "Edit Settings", and add the production callback URL:
- `https://spotifiling.pages.dev/callback`

**Step 3: Update GitHub variable**

In GitHub repo settings, update the `VITE_SPOTIFY_REDIRECT_URI` variable to match.

---

## Phase 11: Final Polish

### Task 23: Add Toast Notifications

**Files:**
- Add: `src/components/ui/toast.tsx` (via shadcn)
- Modify: `src/components/FilingScreen.tsx`

**Step 1: Add toast component**

Run:
```bash
npx shadcn@latest add toast
```

**Step 2: Add Toaster to App**

In `src/App.tsx`, add at the end of the component, before the closing `</div>`:
```tsx
import { Toaster } from '@/components/ui/toaster'

// ... inside return, at the end:
      <Toaster />
    </div>
```

**Step 3: Use toast in FilingScreen**

In `src/components/FilingScreen.tsx`, add toast feedback:
```tsx
import { useToast } from '@/hooks/use-toast'

// Inside component:
const { toast } = useToast()

// In handleNext, after queueing writes:
if (selectedPlaylistIds.size > 0) {
  toast({
    title: 'Song filed',
    description: `Added to ${selectedPlaylistIds.size} playlist(s)`,
  })
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add toast notifications for filing feedback"
```

---

### Task 24: Final Testing and Cleanup

**Step 1: Run build to check for errors**

Run:
```bash
npm run build
```

Expected: Build completes without errors

**Step 2: Test production build locally**

Run:
```bash
npm run preview
```

Expected: App works at http://localhost:4173

**Step 3: Remove any console.logs**

Search for and remove any debugging console.log statements.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and production build verification"
```

---

## Summary

### User Setup Tasks Checklist

Before development:
- [ ] Create Spotify Developer app at https://developer.spotify.com/dashboard
- [ ] Note the Client ID
- [ ] Add redirect URIs: `http://localhost:5173/callback`
- [ ] Create Cloudflare account at https://dash.cloudflare.com
- [ ] Get Cloudflare API token with Pages permissions
- [ ] Get Cloudflare Account ID

After first deployment:
- [ ] Add production redirect URI to Spotify app
- [ ] Set GitHub secrets/variables:
  - `VITE_SPOTIFY_CLIENT_ID` (secret)
  - `CLOUDFLARE_API_TOKEN` (secret)
  - `CLOUDFLARE_ACCOUNT_ID` (secret)
  - `VITE_SPOTIFY_REDIRECT_URI` (variable)

### Implementation Phases

1. **Project Setup** (Tasks 1-4): Vite, Tailwind, shadcn/ui, env vars
2. **Authentication** (Tasks 5-7): PKCE auth flow
3. **API Client** (Tasks 8-9): Spotify API + caching
4. **Data Loading** (Task 10): Fetch and compute unfiled songs
5. **Playback** (Task 11): Web Playback SDK
6. **UI Components** (Tasks 12-16): NowPlaying, PlaylistList, dialogs
7. **Batch Writing** (Task 17): Queued API writes
8. **Integration** (Task 18): Wire everything together
9. **Mobile** (Task 19): Responsive styles
10. **Deployment** (Tasks 20-22): GitHub Actions + Cloudflare Pages
11. **Polish** (Tasks 23-24): Toasts + final testing
