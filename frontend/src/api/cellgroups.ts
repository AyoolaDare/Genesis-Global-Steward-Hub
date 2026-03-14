import api from '@/lib/axios'

export type GroupStatus = 'ACTIVE' | 'SUSPENDED' | 'DISBANDED'

export interface CellGroup {
  id:               string
  name:             string
  description:      string
  purpose:          string
  status:           GroupStatus
  admin:            string | null
  admin_name:       string
  member_count:     number
  meeting_schedule: string
  meeting_location: string
  disbanded_reason: string
  created_at:       string
}

export interface CellGroupMember {
  id:           string
  person:       string
  person_detail?: { id: string; first_name: string; last_name: string; phone: string }
  is_active:    boolean
  joined_date:  string
  role:         string
  added_via:    string
}

export interface CreateGroupPayload {
  name:             string
  description?:     string
  purpose?:         string
  meeting_schedule?: string
  meeting_location?: string
  admin?:           string | null
}

export const cellGroupsApi = {
  list:   (params?: Record<string, string>) =>
    api.get<{ results: CellGroup[] }>('/cells/groups/', { params }),

  detail: (id: string) =>
    api.get<CellGroup & { members: CellGroupMember[] }>(`/cells/groups/${id}/`),

  create: (data: CreateGroupPayload) =>
    api.post<CellGroup>('/cells/groups/', data),

  update: (id: string, data: Partial<CreateGroupPayload>) =>
    api.patch<CellGroup>(`/cells/groups/${id}/`, data),

  disband: (id: string, reason: string) =>
    api.post(`/cells/groups/${id}/disband/`, { reason }),

  addMembers: (id: string, person_ids: string[]) =>
    api.post(`/cells/groups/${id}/add_members/`, { person_ids }),

  removeMember: (groupId: string, personId: string) =>
    api.delete(`/cells/groups/${groupId}/members/${personId}/`),

  updateMemberRole: (groupId: string, personId: string, role: 'MEMBER' | 'LEADER' | 'ASSISTANT') =>
    api.patch<{ person_id: string; role: string }>(`/cells/groups/${groupId}/members/${personId}/role/`, { role }),
}
