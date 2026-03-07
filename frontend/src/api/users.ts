import api from '@/lib/axios'

export type AppRole =
  | 'ADMIN'
  | 'MEDICAL'
  | 'FOLLOWUP'
  | 'CELL_ADMIN'
  | 'DEPT_LEADER'
  | 'DEPT_ASST'
  | 'HR'

export interface AppUser {
  id: string
  email: string
  username: string
  role: AppRole
  department?: string | null
  department_name?: string
  must_reset_password?: boolean
  module_access: string[]
  is_active: boolean
  last_login: string | null
  created_at: string
}

export interface PaginatedResponse<T> {
  results: T[]
  next: string | null
  previous: string | null
}

export interface CreateUserPayload {
  email: string
  username: string
  role: AppRole
  department?: string
  module_access?: string[]
  password: string
}

export interface UpdateUserPayload {
  email?: string
  username?: string
  role?: AppRole
  department?: string | null
  module_access?: string[]
  is_active?: boolean
  password?: string
}

export const usersApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<AppUser>>('/auth/users/', { params }),

  detail: (id: string) =>
    api.get<AppUser>(`/auth/users/${id}/`),

  create: (payload: CreateUserPayload) =>
    api.post<AppUser>('/auth/users/', payload),

  update: (id: string, payload: UpdateUserPayload) =>
    api.patch<AppUser>(`/auth/users/${id}/`, payload),
}
