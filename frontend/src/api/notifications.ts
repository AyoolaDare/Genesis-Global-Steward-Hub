import api from '@/lib/axios'

export interface Notification {
  id:              string
  notification_type: string
  title:           string
  message:         string
  entity_type:     string
  entity_id:       string
  is_read:         boolean
  read_at:         string | null
  created_at:      string
}

export const notificationsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ results: Notification[]; next: string | null }>('/notifications/', { params }),

  markRead: (id: string) =>
    api.post(`/notifications/${id}/mark_read/`),

  markAllRead: () =>
    api.post('/notifications/mark_all_read/'),

  unreadCount: () =>
    api.get<{ unread_count: number }>('/notifications/unread_count/'),
}
