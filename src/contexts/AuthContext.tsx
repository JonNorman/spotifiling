import { createContext, useContext, type ReactNode } from 'react'
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth'

type AuthContextType = ReturnType<typeof useSpotifyAuth>

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSpotifyAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
