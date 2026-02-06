import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
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

      player.addListener('ready', (state) => {
        const { device_id } = state as { device_id: string }
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

      player.addListener('player_state_changed', (state) => {
        const playbackState = state as SpotifyPlaybackState | null
        if (isMounted && playbackState) {
          setState((s) => ({
            ...s,
            isPlaying: !playbackState.paused,
            position: playbackState.position,
            duration: playbackState.duration,
          }))
        }
      })

      player.addListener('initialization_error', (state) => {
        const { message } = state as { message: string }
        if (isMounted) {
          setState((s) => ({ ...s, error: `Init error: ${message}` }))
          toast.error('Player initialization failed', { description: message })
        }
      })

      player.addListener('authentication_error', (state) => {
        const { message } = state as { message: string }
        if (isMounted) {
          setState((s) => ({ ...s, error: `Auth error: ${message}` }))
          toast.error('Player authentication failed — try logging out and back in', { description: message })
        }
      })

      player.addListener('playback_error', (state) => {
        const { message } = state as { message: string }
        if (isMounted) {
          setState((s) => ({ ...s, error: `Playback error: ${message}` }))
          toast.error('Playback error', { description: message })
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
    if (!deviceIdRef.current || !accessToken) {
      console.warn('[Spotifiling] play() skipped: no device or token', {
        hasDevice: !!deviceIdRef.current,
        hasToken: !!accessToken,
      })
      return
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
    const deviceId = deviceIdRef.current

    // Start playback at 30% into the track
    const startPosition = Math.floor(track.duration_ms * 0.3)

    try {
      let response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            uris: [track.uri],
            position_ms: startPosition,
          }),
        }
      )

      // Device not yet active — transfer playback to it first, then retry
      if (response.status === 404) {
        const transferRes = await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ device_ids: [deviceId] }),
        })

        if (!transferRes.ok) {
          console.error('[Spotifiling] transfer playback failed:', transferRes.status)
        }

        // Retry with increasing delays until device is active
        for (const delay of [500, 1000, 2000]) {
          await new Promise((r) => setTimeout(r, delay))
          response = await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                uris: [track.uri],
                position_ms: startPosition,
              }),
            }
          )
          if (response.status !== 404) break
        }
      }

      if (!response.ok) {
        const body = await response.text()
        console.error('[Spotifiling] play() API error:', response.status, body)
        let detail = ''
        try {
          const parsed = JSON.parse(body)
          detail = parsed?.error?.message || ''
        } catch {
          detail = body.slice(0, 200)
        }
        const msg = `Playback failed (${response.status})`
        setState((s) => ({ ...s, error: msg }))
        toast.error(msg, { description: detail || undefined })
      }
    } catch (err) {
      console.error('[Spotifiling] play() network error:', err)
      const msg = err instanceof Error ? err.message : 'Playback failed'
      setState((s) => ({ ...s, error: msg }))
      toast.error(msg)
    }
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

  const seek = useCallback(async (positionMs: number) => {
    await playerRef.current?.seek(positionMs)
  }, [])

  return {
    ...state,
    play,
    togglePlay,
    pause,
    resume,
    seek,
  }
}
