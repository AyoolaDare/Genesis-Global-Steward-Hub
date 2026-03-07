import api from '@/lib/axios'

export type PersonStatus = 'NEW_MEMBER' | 'PENDING_APPROVAL' | 'MEMBER' | 'WORKER' | 'INACTIVE'
export type PersonSource = 'WALK_IN' | 'CELL' | 'MEDICAL' | 'FOLLOWUP' | 'DEPARTMENT'

export interface Person {
  id:                  string
  first_name:          string
  last_name:           string
  other_names:         string
  phone:               string
  email:               string
  gender:              string
  date_of_birth:       string | null
  status:              PersonStatus
  source:              PersonSource
  address:             string
  occupation:          string
  marital_status:      string
  water_baptism:       boolean
  holy_ghost_baptism:  boolean
  created_at:          string
  updated_at:          string
  has_medical_record?: boolean
}

export interface PersonListItem {
  id:         string
  first_name: string
  last_name:  string
  phone:      string
  status:     PersonStatus
  source:     PersonSource
  created_at: string
}

export interface PaginatedResponse<T> {
  results:  T[]
  next:     string | null
  previous: string | null
  count?:   number
}

export interface CreatePersonPayload {
  first_name:         string
  last_name:          string
  other_names?:       string
  phone:              string
  email?:             string
  gender:             string
  date_of_birth?:     string
  source:             PersonSource
  address?:           string
  occupation?:        string
  marital_status?:    string
  water_baptism?:     boolean
  holy_ghost_baptism?: boolean
}

export const personsApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<PersonListItem>>('/persons/', { params }),

  detail: (id: string) =>
    api.get<Person>(`/persons/${id}/`),

  create: (data: CreatePersonPayload) =>
    api.post<Person>('/persons/', data),

  update: (id: string, data: Partial<CreatePersonPayload>) =>
    api.patch<Person>(`/persons/${id}/`, data),

  softDelete: (id: string) =>
    api.delete(`/persons/${id}/`),

  approve: (id: string) =>
    api.post(`/persons/${id}/approve/`),

  merge: (primaryId: string, duplicateId: string) =>
    api.post(`/persons/${primaryId}/merge/`, { duplicate_id: duplicateId }),

  phoneLookup: (phones: string[]) =>
    api.post<{ results: { phone: string; person: PersonListItem | null }[] }>(
      '/persons/phone_lookup/',
      { phones },
    ),
}
