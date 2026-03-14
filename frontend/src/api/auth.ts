import api from '@/lib/axios'
import { AuthUser } from '@/store/authStore'

export interface LoginPayload {
  identifier: string
  password: string
}

export interface LoginResponse {
  access_token:  string
  refresh_token: string
  user:          AuthUser
  requires_password_reset?: boolean
}

export const authApi = {
  login:  (data: LoginPayload) => api.post<LoginResponse>('/auth/login/', data),
  logout: (refreshToken: string | null) =>
    api.post('/auth/logout/', refreshToken ? { refresh_token: refreshToken } : {}),
  me:     ()                   => api.get<AuthUser>('/auth/me/'),
  resetPassword: (old_password: string, new_password: string) =>
    api.post('/auth/reset-password/', { old_password, new_password }),
}
