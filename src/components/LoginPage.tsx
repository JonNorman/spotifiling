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
      <img src="/logo-header.png" alt="Spotifiling logo" className="w-24 h-24" />
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
