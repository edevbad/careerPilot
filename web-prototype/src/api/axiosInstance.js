import axios from 'axios'

const NODE_BASE_URL    = import.meta.env.VITE_NODE_API_BASE_URL    || 'http://localhost:5000/api'
const LARAVEL_BASE_URL = import.meta.env.VITE_LARAVEL_API_BASE_URL || 'http://localhost:8000/api'

// ── Axios Instances ────────────────────────────────────────────────────────────

export const nodeAPI = axios.create({
  baseURL:         NODE_BASE_URL,
  withCredentials: true,   // sends httpOnly refresh-token cookie
  headers:         { 'Content-Type': 'application/json' },
})

export const laravelAPI = axios.create({
  baseURL:         LARAVEL_BASE_URL,
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
})

// ── In-Memory Token Store (never persisted to localStorage) ───────────────────

let accessToken  = null
let isRefreshing = false
let refreshQueue = []   // requests queued while refresh is in flight

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  refreshQueue = []
}

export const setAccessToken   = (token) => { accessToken = token }
export const getAccessToken   = ()      => accessToken
export const clearAccessToken = ()      => { accessToken = null }

// ── Request Interceptor — attach bearer token ──────────────────────────────────

nodeAPI.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ── Response Interceptor — silent token refresh on 401 ────────────────────────

nodeAPI.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Never retry the refresh endpoint itself
    if (original.url?.includes('/auth/refresh')) {
      clearAccessToken()
      window.dispatchEvent(new Event('auth:logout'))
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return nodeAPI(original)
        })
        .catch(Promise.reject)
    }

    original._retry = true
    isRefreshing    = true

    try {
      const res      = await nodeAPI.post('/auth/refresh-token')
      const newToken = res.data.data.accessToken
      setAccessToken(newToken)
      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return nodeAPI(original)
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
