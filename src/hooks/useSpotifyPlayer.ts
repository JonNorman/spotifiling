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
