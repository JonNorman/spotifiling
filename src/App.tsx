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
