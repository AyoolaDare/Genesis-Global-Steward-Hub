import api from '@/lib/axios'

export interface MedicalRecord {
  id:              string
  person:          string
  blood_group:     string
  genotype:        string
  allergies:       string[]
  conditions:      string[]
  medications:     string[]
  emergency_name:  string
  emergency_phone: string
  notes:           string
  created_at:      string
  updated_at:      string
}

export interface MedicalVisit {
  id:              string
  medical_record:  string
  visit_date:      string
  visit_type?:     string
  complaint:       string
  diagnosis:       string
  treatment:       string
  prescription?:   string
  blood_pressure:  string
  blood_sugar_level?: string
  temperature_c?:  string
  weight_kg?:      string
  height_cm?:      string
  pulse_rate?:     string
  notes:           string
  attended_by:     string
  created_at:      string
}

export interface CreateRecordPayload {
  person:          string
  blood_group?:    string
  genotype?:       string
  allergies?:      string[]
  conditions?:     string[]
  medications?:    string[]
  emergency_name?: string
  emergency_phone?: string
  notes?:          string
}

export interface CreateVisitPayload {
  medical_record: string
  person?:        string
  visit_date:     string
  complaint:      string
  visit_type?:    string
  diagnosis?:     string
  treatment?:     string
  prescription?:  string
  blood_pressure?: string
  blood_sugar_level?: string
  temperature_c?: string
  weight_kg?:     string
  height_cm?:     string
  pulse_rate?:    string
  notes?:         string
  attended_by?:   string
}

export const medicalApi = {
  getRecord:    (id: string)       => api.get<MedicalRecord>(`/medical/records/${id}/`),
  getByPerson:  (personId: string) => api.get<MedicalRecord>(`/medical/records/by_person/?person_id=${personId}`),
  createRecord: (data: CreateRecordPayload)  => api.post<MedicalRecord>('/medical/records/', data),
  updateRecord: (id: string, data: Partial<CreateRecordPayload>) => api.patch<MedicalRecord>(`/medical/records/${id}/`, data),

  getVisits:   (recordId: string) =>
    api.get<{ results: MedicalVisit[] }>(`/medical/visits/?medical_record=${recordId}`),
  createVisit: (data: CreateVisitPayload)  => api.post<MedicalVisit>('/medical/visits/', data),
  phoneLookup: (phones: string[]) =>
    api.post<{ results: { phone: string; person: { id: string; first_name: string; last_name: string; phone: string } | null }[] }>('/persons/phone_lookup/', { phones }),
}
