import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { nodeAPI, setAccessToken, clearAccessToken } from '@/api/axiosInstance'
import * as authAPI from '@/api/auth.api'

export const AuthContext = createContext(null)

const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000  // 15 min
const REFRESH_BEFORE_EXPIRY_MS =  1 * 60 * 1000  //  1 min
const REFRESH_INTERVAL_MS = ACCESS_TOKEN_LIFETIME_MS - REFRESH_BEFORE_EXPIRY_MS  // 14 min

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  // ── Proactive token refresh every 14 min ──────────────────────────────────
  const stopTimer  = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = setInterval(async () => {
      try {
        const res = await nodeAPI.post('/auth/refresh-token')
        setAccessToken(res.data.data.accessToken)
      } catch {
        console.warn('[AuthContext] Proactive refresh failed.')
      }
    }, REFRESH_INTERVAL_MS)
  }, [stopTimer])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { accessToken, user: userData } = await authAPI.login(email, password)
    setAccessToken(accessToken)
    setUser(userData)
    startTimer()
    return userData
  }, [startTimer])

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password, confirmPassword) => {
    const { accessToken, user: userData } = await authAPI.register(name, email, password, confirmPassword)
    setAccessToken(accessToken)
    setUser(userData)
    startTimer()
    return userData
  }, [startTimer])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch { /* best-effort */ }
    clearAccessToken()
    setUser(null)
    stopTimer()
  }, [stopTimer])

  // ── Update user in context (after profile edit) ───────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }))
  }, [])

  // ── Silent refresh on mount (handles page refresh) ────────────────────────
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const { accessToken, user: userData } = await authAPI.refreshToken()
        setAccessToken(accessToken)
        setUser(userData)
        startTimer()
      } catch {
        clearAccessToken()
      } finally {
        setLoading(false)
      }
    }
    silentRefresh()
  }, [startTimer])

  // ── Forced logout from interceptor ───────────────────────────────────────
  useEffect(() => {
    const handle = () => { clearAccessToken(); setUser(null); stopTimer() }
    window.addEventListener('auth:logout', handle)
    return () => window.removeEventListener('auth:logout', handle)
  }, [stopTimer])

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => stopTimer(), [stopTimer])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
