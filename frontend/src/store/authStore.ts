import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id:           string
  email:        string
  username:     string
  role:         string
  module_access: string[]
  department?:   string | null
  department_name?: string
  must_reset_password?: boolean
  is_active:    boolean
}

interface AuthState {
  user:        AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  setAuth:     (user: AuthUser, accessToken: string, refreshToken: string) => void
  clearAuth:   () => void
  setToken:    (token: string) => void
  setRefreshToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),

      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null })
        localStorage.removeItem('cms-auth')
      },

      setToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
    }),
    {
      name: 'cms-auth',
      // Only persist the user profile — tokens stay in memory only.
      // Persisting JWTs in localStorage exposes them to XSS attacks.
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
)
