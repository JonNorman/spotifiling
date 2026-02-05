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
