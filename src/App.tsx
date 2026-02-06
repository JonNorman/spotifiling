import { useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/components/LoginPage'
import { FilingScreen } from '@/components/FilingScreen'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'

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
        <Button onClick={logout} size="sm" className="bg-gray-700 text-white hover:bg-gray-600">
          Log out
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex items-center mb-6 sm:mb-8 max-w-2xl mx-auto px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold">Spotifiling</h1>
        <img src="/logo-header.png" alt="Spotifiling logo" className="w-10 h-10 sm:w-12 sm:h-12 mx-auto" />
        <div className="flex flex-col items-end gap-1">
          <Button onClick={logout} size="sm" className="bg-gray-700 text-white hover:bg-gray-600">
            Log out
          </Button>
          <span className="text-gray-400 text-xs">{user?.display_name}</span>
        </div>
      </header>

      <main>
        <FilingScreen accessToken={tokens!.accessToken} userId={user!.id} />
      </main>

      <Toaster />
    </div>
  )
}

export default App
