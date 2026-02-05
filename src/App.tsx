import { useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/components/LoginPage'
import { FilingScreen } from '@/components/FilingScreen'
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
        <button onClick={logout} className="text-blue-400 underline">
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex justify-between items-center mb-6 sm:mb-8 max-w-2xl mx-auto px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold">Spotifiling</h1>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-gray-400 text-sm sm:text-base hidden sm:inline">{user?.display_name}</span>
          <button onClick={logout} className="text-blue-400 underline text-sm">
            Log out
          </button>
        </div>
      </header>

      <main>
        <FilingScreen accessToken={tokens!.accessToken} />
      </main>

      <Toaster />
    </div>
  )
}

export default App
