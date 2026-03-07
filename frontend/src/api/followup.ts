import api from '@/lib/axios'

export type TaskStatus   = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskType     = 'FIRST_VISIT' | 'NEW_MEMBER' | 'MEDICAL_REF' | 'GENERAL'

export interface FollowUpTask {
  id:           string
  person:       string
  person_name?: string
  task_type:    TaskType
  priority:     TaskPriority
  status:       TaskStatus
  title:        string
  description:  string
  due_date:     string | null
  assigned_to:  string | null
  assigned_name?: string
  outcome:      string
  created_at:   string
  updated_at:   string
}

export interface CreateTaskPayload {
  person:      string
  task_type:   TaskType
  priority?:   TaskPriority
  title:       string
  description?: string
  due_date?:   string
}

export interface AssignPayload { assigned_to: string }
export interface CompletePayload { outcome: string }

export const followupApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ results: FollowUpTask[] }>('/followup/tasks/', { params }),

  create: (data: CreateTaskPayload) =>
    api.post<FollowUpTask>('/followup/tasks/', data),

  assign: (id: string, data: AssignPayload) =>
    api.post<FollowUpTask>(`/followup/tasks/${id}/assign/`, data),

  complete: (id: string, data: CompletePayload) =>
    api.post<FollowUpTask>(`/followup/tasks/${id}/complete/`, data),
}
