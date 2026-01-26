'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, verifyToken, logout } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    const { valid, user } = await verifyToken()
    if (valid && user) {
      setUser(user)
    } else {
      setUser(null)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const handleLogout = () => {
    setUser(null)
    logout()
  }

  const refreshAuth = async () => {
    setIsLoading(true)
    await checkAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout: handleLogout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}