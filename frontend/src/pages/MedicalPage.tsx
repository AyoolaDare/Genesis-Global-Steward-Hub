import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { medicalApi, type MedicalRecord, type MedicalVisit } from '@/api/medical'
import { personsApi } from '@/api/persons'
import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useDebounce } from '@/hooks/useDebounce'

/* ─── Visit Form ─────────────────────────────────────── */
const visitSchema = z.object({
  complaint:      z.string().min(1, 'Required'),
  diagnosis:      z.string().optional(),
  treatment:      z.string().optional(),
  blood_pressure: z.string().optional(),
  temperature:    z.string().optional(),
  weight:         z.string().optional(),
  height:         z.string().optional(),
  pulse:          z.string().optional(),
  notes:          z.string().optional(),
  attended_by:    z.string().optional(),
})

type VisitForm = z.infer<typeof visitSchema>

function NewVisitModal({
  record,
  onClose,
}: {
  record: MedicalRecord
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VisitForm>({
    resolver: zodResolver(visitSchema),
    defaultValues: { complaint: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: VisitForm) =>
      medicalApi.createVisit({
        medical_record: record.id,
        visit_date:     new Date().toISOString().split('T')[0],
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-visits', record.id] })
      toast.success('Visit recorded')
      onClose()
    },
    onError: () => toast.error('Failed to record visit'),
  })

  const inputStyle = { height: 40, padding: '0 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', font: `400 var(--text-base) var(--font-body)`, color: 'var(--color-text-body)', background: 'var(--color-surface)', width: '100%', boxSizing: 'border-box' as const }
  const label = { display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 6, color: 'var(--color-text-primary)' }

  return (
    <Modal open onClose={onClose} title="Record Visit" width={560}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Complaint *</label>
          <textarea
            {...register('complaint')}
            rows={3}
            style={{ ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical' }}
            placeholder="Chief complaint…"
          />
          {errors.complaint && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.complaint.message}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Diagnosis</label>
          <input {...register('diagnosis')} style={inputStyle} placeholder="Diagnosis…" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Treatment</label>
          <textarea {...register('treatment')} rows={2} style={{ ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical' }} placeholder="Treatment given…" />
        </div>

        {/* Vitals row */}
        <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', margin: '0 0 12px' }}>Vitals</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          {(['blood_pressure', 'temperature', 'pulse', 'weight', 'height'] as const).map((f) => (
            <div key={f}>
              <label style={label}>{f.replace('_', ' ')}</label>
              <input {...register(f)} style={inputStyle} placeholder={f === 'blood_pressure' ? '120/80' : f === 'temperature' ? '36.5°C' : f === 'weight' ? 'kg' : f === 'height' ? 'cm' : 'bpm'} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Attended By</label>
          <input {...register('attended_by')} style={inputStyle} placeholder="Dr. / Nurse name" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={label}>Notes</label>
          <textarea {...register('notes')} rows={2} style={{ ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ height: 40, padding: '0 20px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || mutation.isPending} style={{ height: 40, padding: '0 24px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            {mutation.isPending ? 'Saving…' : 'Record Visit'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── Record View ────────────────────────────────────── */
function RecordView({ record }: { record: MedicalRecord }) {
  const [visitOpen, setVisitOpen] = useState(false)

  const { data: visits } = useQuery({
    queryKey: ['medical-visits', record.id],
    queryFn:  () => medicalApi.getVisits(record.id),
    select:   (res) => res.data.results,
  })

  const tag = (text: string) => (
    <span key={text} style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 'var(--text-xs)', color: 'var(--color-text-body)' }}>
      {text}
    </span>
  )

  return (
    <div>
      {/* Record header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          ['Blood Group', record.blood_group || '—'],
          ['Genotype',    record.genotype    || '—'],
          ['Emergency Contact', record.emergency_name  || '—'],
          ['Emergency Phone',   record.emergency_phone || '—'],
        ].map(([k, v]) => (
          <div key={k} style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{k}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>

      {record.allergies.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 8px' }}>Allergies</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{record.allergies.map(tag)}</div>
        </div>
      )}
      {record.conditions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 8px' }}>Conditions</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{record.conditions.map(tag)}</div>
        </div>
      )}
      {record.medications.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 8px' }}>Current Medications</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{record.medications.map(tag)}</div>
        </div>
      )}

      {/* Visits */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 600 }}>Visit History</h3>
        <button
          onClick={() => setVisitOpen(true)}
          style={{ height: 34, padding: '0 14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={14} /> New Visit
        </button>
      </div>

      {visits && visits.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visits.map((v: MedicalVisit) => (
            <div
              key={v.id}
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {format(new Date(v.visit_date), 'PPP')}
                </span>
                {v.attended_by && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    by {v.attended_by}
                  </span>
                )}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{v.complaint}</p>
              {v.diagnosis && <p style={{ margin: '0 0 4px', fontSize: 'var(--text-sm)', color: 'var(--color-text-body)' }}><strong>Dx:</strong> {v.diagnosis}</p>}
              {v.treatment && <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-body)' }}><strong>Rx:</strong> {v.treatment}</p>}
              {(v.blood_pressure || v.temperature || v.pulse) && (
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                  {v.blood_pressure && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>BP: {v.blood_pressure}</span>}
                  {v.temperature    && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Temp: {v.temperature}</span>}
                  {v.pulse          && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Pulse: {v.pulse}</span>}
                  {v.weight         && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Wt: {v.weight}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
          <ClipboardList size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
          No visit history
        </div>
      )}

      {visitOpen && <NewVisitModal record={record} onClose={() => setVisitOpen(false)} />}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────── */
export default function MedicalPage() {
  const [phone, setPhone]           = useState('')
  const [foundPerson, setFoundPerson] = useState<any>(null)
  const [record, setRecord]         = useState<MedicalRecord | null>(null)
  const [notFound, setNotFound]     = useState(false)
  const queryClient = useQueryClient()

  const lookupMutation = useMutation({
    mutationFn: () => personsApi.phoneLookup([phone]),
    onSuccess: async (res) => {
      setNotFound(false)
      setRecord(null)
      setFoundPerson(null)
      const person = res.data.results[0]?.person
      if (!person) {
        setNotFound(true)
        return
      }
      setFoundPerson(person)
      // Try to load their medical record
      try {
        const recRes = await medicalApi.getByPerson(person.id)
        setRecord(recRes.data)
      } catch {
        setRecord(null)
      }
    },
    onError: () => toast.error('Lookup failed'),
  })

  const createRecordMutation = useMutation({
    mutationFn: () => medicalApi.createRecord({ person: foundPerson!.id }),
    onSuccess: (res) => {
      setRecord(res.data)
      toast.success('Medical record created')
    },
    onError: () => toast.error('Failed to create record'),
  })

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Medical
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 'var(--text-sm)' }}>
          Look up a member's medical record by phone number
        </p>
      </div>

      {/* Phone lookup */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          Phone Number Lookup
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="tel"
            className="input"
            placeholder="080XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && phone) lookupMutation.mutate() }}
            style={{ flex: 1 }}
          />
          <button
            onClick={() => lookupMutation.mutate()}
            disabled={!phone || lookupMutation.isPending}
            style={{
              height: 40, padding: '0 20px',
              background: 'var(--accent-medical)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: phone ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: 'var(--text-sm)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Search size={15} />
            {lookupMutation.isPending ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {/* Not found */}
      {notFound && (
        <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-warning)', fontWeight: 500 }}>
            No person found with phone number "{phone}". Ask them to register first.
          </p>
        </div>
      )}

      {/* Found person + record */}
      {foundPerson && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {/* Person banner */}
          <div
            style={{
              padding: 'var(--space-5) var(--space-6)',
              background: `var(--accent-medical)18`,
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'var(--accent-medical)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
              {foundPerson.first_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}>
                {foundPerson.first_name} {foundPerson.last_name}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {foundPerson.phone}
              </div>
            </div>
          </div>

          <div style={{ padding: 'var(--space-6)' }}>
            {record ? (
              <RecordView record={record} />
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <ClipboardList size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.4, display: 'block', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
                  No medical record yet for {foundPerson.first_name}.
                </p>
                <button
                  onClick={() => createRecordMutation.mutate()}
                  disabled={createRecordMutation.isPending}
                  style={{
                    height: 40, padding: '0 24px',
                    background: 'var(--accent-medical)', color: '#fff',
                    border: 'none', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Plus size={16} />
                  {createRecordMutation.isPending ? 'Creating…' : 'Create Medical Record'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
