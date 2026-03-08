import api from '@/lib/axios'

export type PersonStatus = 'NEW_MEMBER' | 'PENDING_APPROVAL' | 'MEMBER' | 'WORKER' | 'INACTIVE'
export type PersonSource = 'WALK_IN' | 'CELL' | 'MEDICAL' | 'FOLLOWUP' | 'DEPARTMENT' | 'ADMIN'

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

export interface MemberBoard {
  member: Person
  cell_groups: Array<{
    id: string
    group_id: string
    group_name: string
    role: string
    is_active: boolean
    joined_date: string
  }>
  departments: Array<{
    id: string
    department_id: string
    department_name: string
    role: string
    is_active: boolean
    joined_date: string
  }>
  attendance_summary: Record<'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE', number>
  recent_attendance: Array<{
    id: string
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE'
    session_name: string
    session_date: string
    department_name: string
  }>
  medical_record: null | {
    id: string
    blood_group: string
    genotype: string
    allergies: string[]
    chronic_conditions: string[]
    disabilities: string[]
    current_medications: string[]
    preferred_hospital: string
    health_insurance_provider: string
    health_insurance_number: string
  }
  medical_visits: Array<{
    id: string
    visit_date: string
    visit_type: string
    complaint: string
    diagnosis: string
    treatment: string
    notes: string
  }>
  worker_profile: null | {
    id: string
    worker_id: string
    job_title: string
    employment_type: string
    employment_status: string
    onboarding_status: string
    department_name: string
    hire_date: string | null
  }
}

export const personsApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<PersonListItem>>('/persons/', { params }),

  detail: (id: string) =>
    api.get<Person>(`/persons/${id}/`),

  board: (id: string) =>
    api.get<MemberBoard>(`/persons/${id}/board/`),

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
