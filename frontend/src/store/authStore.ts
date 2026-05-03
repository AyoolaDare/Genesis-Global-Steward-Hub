import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type UserRole =
  | 'ADMIN' | 'MEDICAL' | 'FOLLOWUP' | 'CELL_LEADER' | 'CELL_ASST'
  | 'HOD' | 'ASST_HOD' | 'WELFARE' | 'PRO'
  | 'HR'

export interface AuthUser {
  id:              string
  email:           string
  username:        string
  role:            UserRole
  module_access:   string[]
  department?:     string | null
  department_name?: string
  person?:         string | null   // UUID of linked Person record
  person_name?:    string | null
  must_reset_password?: boolean
  is_active:       boolean
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
        sessionStorage.removeItem('cms-auth')
      },

      setToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
    }),
    {
      name: 'cms-auth',
      storage: createJSONStorage(() => sessionStorage),
      // Persist user + refreshToken so sessions survive page reloads.
      // sessionStorage scopes tokens to the browser tab — they are cleared
      // on tab close and are not accessible to other origins or tabs.
      // The access token stays short-lived (15 min) in memory only.
      partialize: (state) => ({
        user:         state.user,
        refreshToken: state.refreshToken,
      }),
    },
  ),
)
