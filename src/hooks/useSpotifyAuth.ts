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
