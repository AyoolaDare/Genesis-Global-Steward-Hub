import { useEffect } from 'react'

const PING_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes — Render free tier sleeps after 15 min idle

/**
 * Pings the backend health endpoint on a regular interval to prevent
 * Render free-tier instances from spinning down during active sessions.
 */
export function useKeepAlive() {
  useEffect(() => {
    const url = `${import.meta.env.VITE_API_URL ?? '/api/v1'}/health/`

    const ping = () => {
      fetch(url, { method: 'GET', credentials: 'include' }).catch(() => {
        // Silently ignore network errors — this is a best-effort keep-alive
      })
    }

    ping() // Immediate ping on app load
    const id = setInterval(ping, PING_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])
}
