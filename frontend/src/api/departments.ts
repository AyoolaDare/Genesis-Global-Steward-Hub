import api from '@/lib/axios'

export interface Department {
  id:              string
  name:            string
  description:     string
  category:        string
  is_active:       boolean
  hod_name?:       string
  assistant_hod_name?: string
  member_count:    number
  created_at:      string
}

export interface CreateDepartmentPayload {
  name: string
  description?: string
  category?: string
  hod?: string
  assistant_hod?: string
}

export interface DepartmentMember {
  id:            string
  person:        string
  person_detail?: { id: string; first_name: string; last_name: string; phone: string }
  role:          string
  is_active:     boolean
  joined_date:   string
}

export interface AttendanceRecord {
  person_id:   string
  person_name: string
  status:      'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE'
}

export interface AttendanceSession {
  id:           string
  session_name: string
  session_date: string
  session_type: string
  notes:        string
  records:      AttendanceRecord[]
  record_count: number
  marked_by:    string
  created_at:   string
}

export interface MarkAttendancePayload {
  session_name: string
  session_date: string
  session_type: 'REGULAR' | 'SPECIAL' | 'TRAINING'
  notes?:       string
  records:      { person_id: string; status: string; excuse_reason?: string }[]
}

export const departmentsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ results: Department[] }>('/depts/', { params }),

  detail: (id: string) =>
    api.get<Department & { members: DepartmentMember[] }>(`/depts/${id}/`),

  create: (payload: CreateDepartmentPayload) =>
    api.post('/depts/', payload),

  addMember: (id: string, person_id: string, role = 'VOLUNTEER') =>
    api.post(`/depts/${id}/add_member/`, { person_id, role }),

  removeMember: (deptId: string, personId: string) =>
    api.delete(`/depts/${deptId}/members/${personId}/`),

  markAttendance: (id: string, data: MarkAttendancePayload) =>
    api.post<AttendanceSession>(`/depts/${id}/mark_attendance/`, data),

  attendanceHistory: (id: string) =>
    api.get<AttendanceSession[]>(`/depts/${id}/attendance_history/`),
}
