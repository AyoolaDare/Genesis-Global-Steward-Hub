import api from '@/lib/axios'
import type { PersonListItem, PaginatedResponse } from './persons'

export type CampaignStatus  = 'PENDING' | 'APPROVED' | 'REJECTED'
export type CampaignChannel = 'SMS' | 'WHATSAPP'

export interface CampaignUser {
  id:       string
  username: string
}

export interface Campaign {
  id:              string
  title:           string
  message:         string
  channel:         CampaignChannel
  status:          CampaignStatus
  recipient_count: number
  recipients?:     PersonListItem[]
  created_by:      CampaignUser
  reviewed_by:     CampaignUser | null
  review_note:     string
  sent_count:      number
  failed_count:    number
  created_at:      string
  reviewed_at:     string | null
}

export interface CreateCampaignPayload {
  title:         string
  message:       string
  channel:       CampaignChannel
  recipient_ids: string[]
}

export const messagingApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Campaign>>('/messaging/campaigns/', { params }),

  detail: (id: string) =>
    api.get<Campaign>(`/messaging/campaigns/${id}/`),

  create: (data: CreateCampaignPayload) =>
    api.post<Campaign>('/messaging/campaigns/', data),

  approve: (id: string) =>
    api.post<Campaign>(`/messaging/campaigns/${id}/approve/`),

  reject: (id: string, review_note: string) =>
    api.post<Campaign>(`/messaging/campaigns/${id}/reject/`, { review_note }),
}
