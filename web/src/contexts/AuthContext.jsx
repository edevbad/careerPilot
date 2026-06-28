import { createContext, useState, useEffect, useCallback } from 'react'
import { getProfile } from '@/api/auth.api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while verifying token

  // On mount, try to restore session from stored token
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      getProfile()
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('accessToken'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback((token, userData) => {
    localStorage.setItem('accessToken', token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}