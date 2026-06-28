import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { nodeAPI, setAccessToken, clearAccessToken } from '@/api/axiosInstance'

export const AuthContext = createContext(null)

// Access token lifetime in ms — refresh 1 minute before expiry
const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000   // 15 min
const REFRESH_BEFORE_EXPIRY_MS =  1 * 60 * 1000   //  1 min
const REFRESH_INTERVAL_MS = ACCESS_TOKEN_LIFETIME_MS - REFRESH_BEFORE_EXPIRY_MS  // 14 min

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // true while attempting silent refresh on mount

  // Holds the setInterval ID for proactive token refresh
  const refreshTimerRef = useRef(null)

  // ─── Proactive Refresh ──────────────────────────────────────────────────────
  // Refreshes the access token every 14 minutes so it never expires mid-session

  const startRefreshTimer = useCallback(() => {
    stopRefreshTimer()
    refreshTimerRef.current = setInterval(async () => {
      try {
        const res = await nodeAPI.post('/auth/refresh')
        setAccessToken(res.data.data.accessToken)
      } catch {
        // If proactive refresh fails, the interceptor will handle 401s reactively
        console.warn('Proactive token refresh failed.')
      }
    }, REFRESH_INTERVAL_MS)
  }, [])

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  // ─── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback((accessToken, userData) => {
    setAccessToken(accessToken)
    setUser(userData)
    startRefreshTimer()
  }, [startRefreshTimer])

  // ─── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await nodeAPI.post('/auth/logout')
    } catch {
      // Proceed with client-side logout even if server call fails
    } finally {
      clearAccessToken()
      setUser(null)
      stopRefreshTimer()
    }
  }, [stopRefreshTimer])

  // ─── Silent Refresh on Mount ────────────────────────────────────────────────
  // On page load/refresh, try to get a new access token using the httpOnly cookie.
  // If it succeeds the user is silently logged back in.
  // If it fails the user sees the login page.

  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const res = await nodeAPI.post('/auth/refresh-token')
        const { accessToken, user: userData } = res.data.data
        setAccessToken(accessToken)
        setUser(userData)
        startRefreshTimer()
      } catch {
        // No valid refresh token — user needs to log in
        clearAccessToken()
      } finally {
        setLoading(false)
      }
    }

    silentRefresh()
  }, [startRefreshTimer])

  // ─── Listen for forced logout events (from interceptor) ────────────────────

  useEffect(() => {
    const handleForcedLogout = () => {
      clearAccessToken()
      setUser(null)
      stopRefreshTimer()
    }

    window.addEventListener('auth:logout', handleForcedLogout)
    return () => window.removeEventListener('auth:logout', handleForcedLogout)
  }, [stopRefreshTimer])

  // ─── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => stopRefreshTimer()
  }, [stopRefreshTimer])

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}