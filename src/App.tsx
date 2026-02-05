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
