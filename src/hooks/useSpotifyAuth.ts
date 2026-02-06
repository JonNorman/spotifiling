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

const STORAGE_KEY = 'spotifiling_auth'
const MIN_REMAINING_MS = 10 * 60 * 1000 // 10 minutes

function saveAuth(tokens: SpotifyTokens, user: SpotifyUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tokens, user }))
}

function loadAuth(): { tokens: SpotifyTokens; user: SpotifyUser } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { tokens, user } = JSON.parse(raw)
    if (!tokens?.accessToken || !tokens?.expiresAt) return null
    if (tokens.expiresAt - Date.now() < MIN_REMAINING_MS) return null
    return { tokens, user }
  } catch {
    return null
  }
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
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
      throw new Error(`Failed to fetch user profile (${response.status})`)
    }
    return response.json()
  }, [])

  // Handle OAuth callback or restore from localStorage
  useEffect(() => {
    async function handleAuth() {
      const code = getAuthCodeFromUrl()

      if (code) {
        try {
          clearAuthCodeFromUrl()
          const tokens = await exchangeCodeForTokens(code)
          const user = await fetchUser(tokens.accessToken)
          saveAuth(tokens, user)

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
        // Try restoring from localStorage
        const saved = loadAuth()
        if (saved) {
          setState({
            tokens: saved.tokens,
            user: saved.user,
            isLoading: false,
            error: null,
          })
        } else {
          clearAuth()
          setState((s) => ({ ...s, isLoading: false }))
        }
      }
    }

    handleAuth()
  }, [fetchUser])

  const login = useCallback(() => {
    startAuthFlow()
  }, [])

  const logout = useCallback(() => {
    clearAuth()
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
