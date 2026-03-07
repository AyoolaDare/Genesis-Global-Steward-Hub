import api from '@/lib/axios'

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED'
export type EmploymentType   = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VOLUNTEER_STAFF'
export type OnboardingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export interface WorkerProfile {
  id:                string
  person:            string
  person_name?:      string
  person_phone?:     string
  worker_id:         string
  job_title:         string
  employment_type:   EmploymentType
  employment_status: EmploymentStatus
  onboarding_status: OnboardingStatus
  department:        string | null
  department_name?:  string
  salary_amount:     string | null
  salary_currency?:  string
  pay_frequency?:    string
  bank_name?:        string
  account_number?:   string
  account_name?:     string
  hire_date:         string
  probation_end:     string | null
  termination_date:  string | null
  exit_reason:       string
  contract_url?:     string
  id_document_url?:  string
  created_at:        string
}

export interface PromotePayload {
  job_title:       string
  employment_type: EmploymentType
  hire_date:       string
  salary_amount?:  string
  pay_frequency?:  string
  probation_end?:  string
  bank_name?:      string
  account_number?: string
  account_name?:   string
  department?:     string
}

export interface OnboardingPayload {
  salary_amount?: string
  salary_currency?: string
  pay_frequency?: string
  bank_name?: string
  account_number?: string
  account_name?: string
  contract_url?: string
  id_document_url?: string
  probation_end?: string
  onboarding_status?: OnboardingStatus
}

export const hrApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ results: WorkerProfile[] }>('/hr/workers/', { params }),

  detail: (id: string) =>
    api.get<WorkerProfile>(`/hr/workers/${id}/`),

  promote: (personId: string, data: PromotePayload) =>
    api.post<WorkerProfile>('/hr/workers/promote/', { person_id: personId, ...data }),

  updateStatus: (id: string, status: EmploymentStatus, reason?: string) =>
    api.patch(`/hr/workers/${id}/update_status/`, { employment_status: status, reason }),

  onboard: (id: string, data: OnboardingPayload) =>
    api.patch<WorkerProfile>(`/hr/workers/${id}/onboard/`, data),

  terminate: (id: string, payload: { termination_date?: string; exit_reason?: string }) =>
    api.post<WorkerProfile>(`/hr/workers/${id}/terminate/`, payload),
}
