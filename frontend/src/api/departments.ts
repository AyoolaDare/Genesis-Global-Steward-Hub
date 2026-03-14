import api from '../lib/axios'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExecRole    = 'HOD' | 'ASST_HOD' | 'WELFARE' | 'PRO'
export type MemberRole  = 'MEMBER' | 'VOLUNTEER'
export type SessionType = 'REGULAR' | 'TRAINING' | 'SPECIAL' | 'REHEARSAL'
export type AttStatus   = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE'
export type ApprovalStage =
  | 'DRAFT' | 'PENDING_LEVEL1' | 'PENDING_ADMIN'
  | 'APPROVED' | 'SENT' | 'REJECTED_L1' | 'REJECTED_ADMIN'
export type MessageType =
  | 'ANNOUNCEMENT' | 'REMINDER' | 'WELFARE_CHECK' | 'PRAYER_REQUEST' | 'URGENT'
export type Priority       = 'NORMAL' | 'HIGH' | 'URGENT'
export type RecipientScope = 'ALL' | 'SPECIFIC' | 'ABSENTEES'

export interface Executive {
  id: string
  department: string
  person: string
  person_detail: { id: string; full_name: string; phone: string }
  role: ExecRole
  granted_at: string
  revoked_at: string | null
  is_active: boolean
}

export interface DepartmentMember {
  id: string
  department: string
  person: string
  person_detail: { id: string; full_name: string; phone: string; gender?: string }
  role: MemberRole
  joined_date: string
  left_date: string | null
  is_active: boolean
  notes: string
}

export interface Department {
  id: string
  name: string
  category: string
  description: string
  is_active: boolean
  member_count: number
  session_count?: number
  executives: { role: ExecRole; name: string; person_id: string }[]
  created_at: string
}

export interface AttendanceRecord {
  person_id: string
  person_name: string
  status: AttStatus
  excuse_reason: string
}

export interface DepartmentSession {
  id: string
  department: string
  session_name: string
  session_date: string
  session_type: SessionType
  notes: string
  created_at: string
  record_count: number
  present_count: number
  absent_count: number
  records: AttendanceRecord[]
}

export interface DepartmentMessage {
  id: string
  department: string
  subject: string
  body: string
  message_type: MessageType
  priority: Priority
  recipient_scope: RecipientScope
  approval_stage: ApprovalStage
  level1_reviewed_by: string | null
  level1_reviewed_by_name: string | null
  level1_reviewed_at: string | null
  level1_rejection_reason: string
  admin_reviewed_by: string | null
  admin_reviewed_by_name: string | null
  admin_reviewed_at: string | null
  admin_rejection_reason: string
  sent_at: string | null
  created_by: string | null
  created_by_name: string | null
  created_at: string
  recipient_count: number
}

export interface AttendanceTrendPoint {
  label: string; date: string; type: SessionType
  total: number; present: number; absent: number; excused: number; late: number
}

export interface DashboardData {
  member_count: number
  new_this_month: number
  last_session: {
    id: string; name: string; date: string; type: SessionType
    total: number; present: number; rate: number
  } | null
  absences_this_month: number
  critical_absences: number
  session_count: number
  attendance_trend: AttendanceTrendPoint[]
  attendance_donut: {
    present: number; late: number; excused: number; absent: number; total: number; rate: number
  }
  member_growth: { month: string; count: number }[]
  gender_breakdown: Record<string, number>
  session_type_breakdown: Record<string, number>
  executives: { role: ExecRole; name: string; person_id: string }[]
}

export interface LeaderboardEntry {
  rank: number; person_id: string; full_name: string
  profile_photo: string | null; attended: number; total: number; rate: number; streak: number
}

export interface AbsenceAlert {
  person_id: string; full_name: string; phone: string; missed: number; last_seen: string | null
}

// ── Display config ────────────────────────────────────────────────────────────

export const EXEC_ROLES: Record<ExecRole, { label: string; color: string; bg: string }> = {
  HOD:      { label: 'Head of Department',       color: '#7c3aed', bg: '#ede9fe' },
  ASST_HOD: { label: 'Assistant HOD',            color: '#2563eb', bg: '#dbeafe' },
  WELFARE:  { label: 'Welfare Officer',          color: '#059669', bg: '#d1fae5' },
  PRO:      { label: 'Public Relations Officer', color: '#d97706', bg: '#fef3c7' },
}

export const SESSION_TYPES: Record<SessionType, { label: string; color: string }> = {
  REGULAR:   { label: 'Regular',   color: '#2563eb' },
  TRAINING:  { label: 'Training',  color: '#059669' },
  SPECIAL:   { label: 'Special',   color: '#d97706' },
  REHEARSAL: { label: 'Rehearsal', color: '#7c3aed' },
}

export const ATT_STATUS: Record<AttStatus, { label: string; color: string; bg: string }> = {
  PRESENT: { label: 'Present', color: '#059669', bg: '#d1fae5' },
  ABSENT:  { label: 'Absent',  color: '#dc2626', bg: '#fee2e2' },
  EXCUSED: { label: 'Excused', color: '#d97706', bg: '#fef3c7' },
  LATE:    { label: 'Late',    color: '#2563eb', bg: '#dbeafe' },
}

export const STAGE_INFO: Record<ApprovalStage, { label: string; color: string }> = {
  DRAFT:          { label: 'Draft',            color: '#6b7280' },
  PENDING_LEVEL1: { label: 'Pending L1',       color: '#d97706' },
  PENDING_ADMIN:  { label: 'Pending Admin',    color: '#7c3aed' },
  APPROVED:       { label: 'Approved',         color: '#059669' },
  SENT:           { label: 'Sent',             color: '#2563eb' },
  REJECTED_L1:    { label: 'Rejected (L1)',    color: '#dc2626' },
  REJECTED_ADMIN: { label: 'Rejected (Admin)', color: '#dc2626' },
}

// ── API ───────────────────────────────────────────────────────────────────────

export const departmentsApi = {
  list:   ()         => api.get<{ results: Department[] }>('/depts/'),
  detail: (id: string) => api.get<Department>(`/depts/${id}/`),
  create: (data: { name: string; description?: string; category?: string }) =>
    api.post('/depts/', data),

  // Executives (Admin only)
  grantExecutive:  (id: string, data: { person_id: string; role: ExecRole }) =>
    api.post<Executive>(`/depts/${id}/grant_executive/`, data),
  revokeExecutive: (id: string, data: { person_id: string }) =>
    api.post(`/depts/${id}/revoke_executive/`, data),

  // Members
  listMembers:  (id: string) =>
    api.get<DepartmentMember[]>(`/depts/${id}/members/`),
  addMember:    (id: string, data: { person_id: string; role?: MemberRole; notes?: string }) =>
    api.post<DepartmentMember>(`/depts/${id}/add_member/`, data),
  removeMember: (id: string, personId: string, reason: string) =>
    api.delete(`/depts/${id}/members/${personId}/`, { data: { reason } }),

  // Sessions
  listSessions:  (id: string) => api.get<DepartmentSession[]>(`/depts/${id}/sessions/`),
  createSession: (
    id: string,
    data: {
      session_name: string; session_date: string; session_type: SessionType
      notes?: string
      records: { person_id: string; status: AttStatus; excuse_reason?: string }[]
    },
  ) => api.post<DepartmentSession>(`/depts/${id}/sessions/`, data),

  // Dashboard & analytics
  dashboard:           (id: string)           => api.get<DashboardData>(`/depts/${id}/dashboard/`),
  leaderboardRegular:  (id: string, months = 3) =>
    api.get<LeaderboardEntry[]>(`/depts/${id}/leaderboard/regular/`, { params: { months } }),
  leaderboardTraining: (id: string, months = 3) =>
    api.get<LeaderboardEntry[]>(`/depts/${id}/leaderboard/training/`, { params: { months } }),
  alerts:              (id: string)           => api.get<AbsenceAlert[]>(`/depts/${id}/alerts/`),

  // Messaging
  listMessages:  (id: string) => api.get<DepartmentMessage[]>(`/depts/${id}/messages/`),
  createMessage: (id: string, data: {
    subject: string; body: string; message_type: MessageType
    priority?: Priority; recipient_scope?: RecipientScope
  }) => api.post<DepartmentMessage>(`/depts/${id}/messages/`, data),
  submitMessage: (id: string, msgId: string) =>
    api.post<DepartmentMessage>(`/depts/${id}/messages/${msgId}/submit/`),
  approveL1:     (id: string, msgId: string) =>
    api.post<DepartmentMessage>(`/depts/${id}/messages/${msgId}/approve_l1/`),
  rejectL1:      (id: string, msgId: string, reason: string) =>
    api.post<DepartmentMessage>(`/depts/${id}/messages/${msgId}/reject_l1/`, { reason }),
  approveAdmin:  (id: string, msgId: string) =>
    api.post<DepartmentMessage>(`/depts/${id}/messages/${msgId}/approve_admin/`),
  rejectAdmin:   (id: string, msgId: string, reason: string) =>
    api.post<DepartmentMessage>(`/depts/${id}/messages/${msgId}/reject_admin/`, { reason }),
}
