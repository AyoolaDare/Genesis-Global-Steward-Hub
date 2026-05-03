import api from '@/lib/axios'

export type SponsorType    = 'INDIVIDUAL' | 'ORGANIZATION'
export type SponsorStatus  = 'ACTIVE' | 'INACTIVE' | 'LAPSED'
export type PaymentMethod  = 'PAYSTACK' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER'
export type PaymentStatus  = 'PENDING' | 'CONFIRMED' | 'FAILED'
export type Frequency      = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
export type MessageType    = 'THANK_YOU' | 'GREETING' | 'PRAYER' | 'CUSTOM'

export interface SponsorPayment {
  id:                 string
  sponsor:            string
  commitment:         string | null
  commitment_project: string
  amount:             number
  currency:           string
  payment_method:     PaymentMethod
  payment_date:       string
  reference:          string
  status:             PaymentStatus
  notes:              string
  recorded_by_name:   string | null
  created_at:         string
}

export interface SponsorCommitment {
  id:         string
  sponsor:    string
  project:    string
  amount:     number
  currency:   string
  frequency:  Frequency
  start_date: string
  end_date:   string | null
  is_active:  boolean
  notes:      string
  total_paid: number
  outstanding:number
  created_at: string
}

export interface SponsorMessage {
  id:           string
  sponsor:      string
  payment:      string | null
  message_type: MessageType
  body:         string
  phone:        string
  success:      boolean
  sent_by_name: string | null
  sent_at:      string
}

export interface PersonDetails {
  id:             string
  full_name:      string
  phone:          string
  email:          string | null
  date_of_birth:  string | null
  gender:         string
  address:        string
  landmark:       string
  state:          string
  occupation:     string
  marital_status: string
  status:         string
  baptized:       boolean
  baptism_date:   string | null
  joined_date:    string | null
  profile_photo:  string | null
}

export interface SponsorListItem {
  id:              string
  sponsor_id:      string
  name:            string
  email:           string
  phone:           string
  sponsor_type:    SponsorType
  status:          SponsorStatus
  person_name:     string | null
  total_committed: number
  total_paid:      number
  outstanding:     number
  last_payment:    string | null
  created_at:      string
}

export interface SponsorDetail extends SponsorListItem {
  person:         string | null
  person_phone:   string | null
  person_details: PersonDetails | null
  notes:          string
  commitments:    SponsorCommitment[]
  payments:       SponsorPayment[]
  messages:       SponsorMessage[]
  updated_at:     string
}

export interface SponsorStats {
  total_sponsors:  number
  active_sponsors: number
  total_committed: number
  total_paid:      number
  outstanding:     number
}

export interface PipelineSponsor {
  id:          string
  sponsor_id:  string
  name:        string
  phone:       string
  person_name: string | null
  total_paid:  number
  outstanding: number
  status:      SponsorStatus
}

export interface PipelineBucket {
  count:    number
  sponsors: PipelineSponsor[]
}

export interface SponsorPipeline {
  paid_this_month: PipelineBucket
  pending:         PipelineBucket
  overdue:         PipelineBucket
}

export interface CreateSponsorPayload {
  name:         string
  email?:       string
  phone?:       string
  sponsor_type: SponsorType
  status:       SponsorStatus
  notes?:       string
  person?:      string | null
}

export interface AddPaymentPayload {
  commitment?:    string | null
  amount:         number
  currency?:      string
  payment_method: PaymentMethod
  payment_date:   string
  reference?:     string
  status?:        PaymentStatus
  notes?:         string
}

export interface AddCommitmentPayload {
  project?:   string
  amount:     number
  currency?:  string
  frequency:  Frequency
  start_date: string
  end_date?:  string | null
  notes?:     string
}

export const sponsorsApi = {
  list: (params?: { search?: string; status?: string; sponsor_type?: string }) =>
    api.get<{ results: SponsorListItem[]; count: number }>('/sponsors/sponsors/', { params }),

  get: (id: string) =>
    api.get<SponsorDetail>(`/sponsors/sponsors/${id}/`),

  create: (data: CreateSponsorPayload) =>
    api.post<SponsorDetail>('/sponsors/sponsors/', data),

  update: (id: string, data: Partial<CreateSponsorPayload>) =>
    api.patch<SponsorDetail>(`/sponsors/sponsors/${id}/`, data),

  stats: () =>
    api.get<SponsorStats>('/sponsors/sponsors/stats/'),

  pipeline: () =>
    api.get<SponsorPipeline>('/sponsors/sponsors/pipeline/'),

  addPayment: (id: string, data: AddPaymentPayload) =>
    api.post<SponsorPayment>(`/sponsors/sponsors/${id}/add_payment/`, data),

  addCommitment: (id: string, data: AddCommitmentPayload) =>
    api.post<SponsorCommitment>(`/sponsors/sponsors/${id}/add_commitment/`, data),

  payments: (id: string) =>
    api.get<SponsorPayment[]>(`/sponsors/sponsors/${id}/payments/`),

  messages: (id: string) =>
    api.get<SponsorMessage[]>(`/sponsors/sponsors/${id}/messages/`),

  sendMessage: (id: string, message_type: 'GREETING' | 'PRAYER') =>
    api.post<{ success: boolean; message_type: string }>(
      `/sponsors/sponsors/${id}/send_message/`,
      { message_type },
    ),

  bulkPrayers: () =>
    api.post<{ sent: number; failed: number; skipped: number }>('/sponsors/sponsors/bulk_prayers/'),

  bulkGreetings: () =>
    api.post<{ sent: number; failed: number; skipped: number }>('/sponsors/sponsors/bulk_greetings/'),
}
