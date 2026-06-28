import axios from 'axios'

const BASE_URL         = import.meta.env.VITE_NODE_API_BASE_URL || 'http://localhost:5000/api'
const LARAVEL_BASE_URL = import.meta.env.VITE_LARAVEL_API_BASE_URL || 'http://localhost:8000/api'

// ─── Instances ─────────────────────────────────────────────────────────────────

export const nodeAPI = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,   // ← sends httpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' },
})

export const laravelAPI = axios.create({
  baseURL:         LARAVEL_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ─── In-Memory Token Store ─────────────────────────────────────────────────────
// Never stored in localStorage — lives only in JS memory this session.

let accessToken   = null
let isRefreshing  = false

// Queue of requests that arrived while a refresh was in flight
let refreshQueue  = []

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token)
  })
  refreshQueue = []
}

// ─── Public Setters (called by AuthContext) ────────────────────────────────────

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = ()      => accessToken
export const clearAccessToken = ()    => { accessToken = null }

// ─── Request Interceptor ───────────────────────────────────────────────────────

nodeAPI.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ─── Response Interceptor — Silent Refresh ─────────────────────────────────────

nodeAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only intercept 401s that haven't already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Don't intercept the refresh call itself — avoid infinite loop
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearAccessToken()
      window.dispatchEvent(new Event('auth:logout'))
      return Promise.reject(error)
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return nodeAPI(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    // Start the refresh
    originalRequest._retry = true
    isRefreshing = true

    try {
      // Cookie is sent automatically — no body needed
      const res = await nodeAPI.post('/auth/refresh')
      const newToken = res.data.data.accessToken

      setAccessToken(newToken)
      processQueue(null, newToken)

      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return nodeAPI(originalRequest)

    } catch (refreshError) {
      processQueue(refreshError, null)
      clearAccessToken()
      window.dispatchEvent(new Event('auth:logout'))
      return Promise.reject(refreshError)

    } finally {
      isRefreshing = false
    }
  }
)