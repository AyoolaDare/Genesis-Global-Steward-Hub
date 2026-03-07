import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Edit2, Trash2, GitMerge } from 'lucide-react'
import toast from 'react-hot-toast'
import { personsApi } from '@/api/persons'
import StatusBadge from '@/components/ui/StatusBadge'
import PersonForm from './PersonForm'
import MergeDialog from './MergeDialog'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'

interface Props {
  personId: string
  onClose:  () => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) 0',
        borderBottom: '1px solid var(--color-border)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--color-text-body)' }}>{value ?? '—'}</span>
    </div>
  )
}

export default function PersonDetail({ personId, onClose }: Props) {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [merging, setMerging] = useState(false)

  const { data: person, isLoading } = useQuery({
    queryKey: ['persons', personId],
    queryFn:  () => personsApi.detail(personId),
    select:   (res) => res.data,
  })

  const approveMutation = useMutation({
    mutationFn: () => personsApi.approve(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      toast.success('Profile approved')
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to approve'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => personsApi.softDelete(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      toast.success('Person removed')
      onClose()
    },
    onError: () => toast.error('Failed to delete'),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 20 }} />
        ))}
      </div>
    )
  }

  if (!person) return <div>Person not found</div>

  if (editing) {
    return <PersonForm person={person} onClose={() => setEditing(false)} />
  }

  return (
    <>
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {person.first_name[0]?.toUpperCase()}
          </div>
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'var(--text-lg)',
                color: 'var(--color-text-primary)',
                margin: '0 0 4px',
              }}
            >
              {person.first_name} {person.other_names} {person.last_name}
            </h3>
            <StatusBadge status={person.status} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {person.status === 'PENDING_APPROVAL' && isAdmin && (
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              title="Approve"
              style={{
                height: 34, padding: '0 12px',
                background: 'var(--color-success-bg)', color: 'var(--color-success)',
                border: '1.5px solid var(--color-success)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 'var(--text-sm)', fontWeight: 600,
              }}
            >
              <CheckCircle size={14} />
              Approve
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setMerging(true)}
              title="Merge with duplicate"
              style={{
                height: 34, width: 34,
                background: 'none', border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <GitMerge size={15} />
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            title="Edit"
            style={{
              height: 34, width: 34,
              background: 'none', border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <Edit2 size={15} />
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                if (confirm('Soft-delete this person? They can be restored by an admin.')) {
                  deleteMutation.mutate()
                }
              }}
              title="Delete"
              style={{
                height: 34, width: 34,
                background: 'none', border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-danger)',
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div>
        <Row label="Phone"        value={person.phone} />
        <Row label="Email"        value={person.email || '—'} />
        <Row label="Gender"       value={person.gender} />
        <Row label="Date of Birth" value={person.date_of_birth ? format(new Date(person.date_of_birth), 'PPP') : '—'} />
        <Row label="Source"       value={person.source?.replace('_', ' ')} />
        <Row label="Address"      value={person.address || '—'} />
        <Row label="Occupation"   value={person.occupation || '—'} />
        <Row label="Marital Status" value={person.marital_status || '—'} />
        <Row
          label="Baptism"
          value={
            [
              person.water_baptism       && 'Water',
              person.holy_ghost_baptism  && 'Holy Ghost',
            ].filter(Boolean).join(', ') || '—'
          }
        />
        <Row label="Medical Record" value={person.has_medical_record ? 'Yes' : 'No'} />
        <Row label="Joined"       value={format(new Date(person.created_at), 'PPP')} />
      </div>

      {merging && (
        <MergeDialog
          primaryId={personId}
          primaryName={`${person.first_name} ${person.last_name}`}
          onClose={() => setMerging(false)}
        />
      )}
    </>
  )
}
