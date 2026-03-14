import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true, // Send httpOnly cookies for refresh token
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — inject access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401 with refresh token flow
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else if (token) p.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) {
          useAuthStore.getState().clearAuth()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL ?? '/api/v1'}/auth/refresh/`,
          { refresh: refreshToken },
          { withCredentials: true },
        )
        const newToken = response.data.access ?? response.data.access_token
        const newRefreshToken = response.data.refresh
        if (!newToken) {
          throw new Error('No access token returned by refresh endpoint')
        }
        useAuthStore.getState().setToken(newToken)
        if (newRefreshToken) {
          useAuthStore.getState().setRefreshToken(newRefreshToken)
        }
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
