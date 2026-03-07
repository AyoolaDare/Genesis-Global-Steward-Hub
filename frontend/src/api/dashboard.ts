import api from '@/lib/axios'

export interface DashboardStats {
  total_persons:    number
  new_members:      number
  pending_approval: number
  active_workers:   number
  active_cells:     number
  departments:      number
  open_followups:   number
  medical_visits_this_month: number
}

export interface RecentActivity {
  id:          string
  action:      string
  entity_type: string
  target?:     string | null
  target_label?: string | null
  performed_by?: string
  activity_summary?: string
  created_at:  string
  user?:       string
  user_name?:  string
  user_email?: string
}

export interface PendingApproval {
  id:         string
  first_name: string
  last_name:  string
  phone:      string
  source:     string
  created_at: string
}

export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/persons/stats/').catch(() => ({
      data: {
        total_persons: 0, new_members: 0, pending_approval: 0,
        active_workers: 0, active_cells: 0, departments: 0,
        open_followups: 0, medical_visits_this_month: 0,
      },
    })),

  getRecentActivity: () =>
    api.get<{ results: RecentActivity[] }>('/audit/logs/?page_size=10').catch(() => ({ data: { results: [] } })),

  getPendingApprovals: () =>
    api.get<{ results: PendingApproval[] }>('/persons/?status=PENDING_APPROVAL&page_size=10').catch(() => ({ data: { results: [] } })),

  getMemberGrowth: () =>
    api.get<{ month: string; count: number }[]>('/persons/growth/').catch(() => ({ data: [] })),
}
