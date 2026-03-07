import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, MapPin, Calendar, UserPlus, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { cellGroupsApi, type CellGroup } from '@/api/cellgroups'
import { personsApi } from '@/api/persons'
import Modal from '@/components/ui/Modal'
import Drawer from '@/components/ui/Drawer'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'

/* ─── Create Group Modal ─────────────────────────────── */
const createSchema = z.object({
  name:             z.string().min(2, 'Required'),
  description:      z.string().optional(),
  purpose:          z.string().optional(),
  meeting_schedule: z.string().optional(),
  meeting_location: z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  const mutation = useMutation({
    mutationFn: (data: CreateForm) => cellGroupsApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cells'] }); toast.success('Cell group created'); onClose() },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to create'),
  })

  const inputStyle = { height: 40, padding: '0 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', font: `400 var(--text-base) var(--font-body)`, color: 'var(--color-text-body)', background: 'var(--color-surface)', width: '100%', boxSizing: 'border-box' as const }
  const label = { display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 6 }
  const err = { color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }

  return (
    <Modal open onClose={onClose} title="Create Cell Group">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Group Name *</label>
          <input {...register('name')} style={{ ...inputStyle, ...(errors.name ? { borderColor: 'var(--color-danger)' } : {}) }} placeholder="e.g. Alpha Cell" />
          {errors.name && <p style={err}>{errors.name.message}</p>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Purpose</label>
          <input {...register('purpose')} style={inputStyle} placeholder="Purpose of this group…" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Description</label>
          <textarea {...register('description')} rows={3} style={{ ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={label}>Meeting Schedule</label>
            <input {...register('meeting_schedule')} style={inputStyle} placeholder="Every Sunday 3pm" />
          </div>
          <div>
            <label style={label}>Location</label>
            <input {...register('meeting_location')} style={inputStyle} placeholder="123 Church St" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ height: 40, padding: '0 20px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
          <button type="submit" disabled={mutation.isPending} style={{ height: 40, padding: '0 24px', background: 'var(--accent-cell)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            {mutation.isPending ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── Phone-Add Flow (6-step batch lookup) ───────────── */
function AddMembersDialog({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [rawPhones, setRawPhones] = useState('')
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [results, setResults] = useState<{ phone: string; person: { id: string; first_name: string; last_name: string } | null }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  type FoundLookupResult = { phone: string; person: { id: string; first_name: string; last_name: string } }

  const lookupMutation = useMutation({
    mutationFn: () => {
      const phones = rawPhones.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean)
      return personsApi.phoneLookup(phones)
    },
    onSuccess: (res) => {
      setResults(res.data.results)
      const found = new Set(res.data.results.flatMap((r) => (r.person ? [r.person.id] : [])))
      setSelected(found)
      setStep('preview')
    },
    onError: () => toast.error('Lookup failed'),
  })

  const addMutation = useMutation({
    mutationFn: () => cellGroupsApi.addMembers(groupId, Array.from(selected)),
    onSuccess: (res: { data: { count: number } }) => {
      queryClient.invalidateQueries({ queryKey: ['cells', groupId] })
      toast.success(`${res.data.count} member(s) added`)
      onClose()
    },
    onError: () => toast.error('Failed to add members'),
  })

  const found    = results.filter((r): r is FoundLookupResult => r.person !== null)
  const notFound = results.filter((r) => !r.person)

  return (
    <Modal open onClose={onClose} title="Add Members by Phone" width={540}>
      {step === 'input' ? (
        <>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 0 }}>
            Enter phone numbers separated by commas or new lines (up to 50 at a time).
          </p>
          <textarea
            rows={6}
            className="input"
            value={rawPhones}
            onChange={(e) => setRawPhones(e.target.value)}
            placeholder={"08012345678\n08098765432\n07011112222"}
            style={{ height: 'auto', padding: '8px 12px', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={onClose} style={{ height: 40, padding: '0 20px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
            <button onClick={() => lookupMutation.mutate()} disabled={!rawPhones.trim() || lookupMutation.isPending} style={{ height: 40, padding: '0 24px', background: 'var(--accent-cell)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={14} />
              {lookupMutation.isPending ? 'Looking up…' : 'Look Up'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {found.length} found · {notFound.length} not found
            </p>
            {found.length > 0 && (
              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                {found.map((r) => (
                  <label key={r.person.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(r.person.id)}
                      onChange={(e) => {
                        const next = new Set(selected)
                        if (e.target.checked) next.add(r.person.id)
                        else next.delete(r.person.id)
                        setSelected(next)
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{r.person.first_name} {r.person.last_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{r.phone}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {notFound.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', fontWeight: 500, margin: '0 0 6px' }}>Not found in system:</p>
                {notFound.map((r) => (
                  <span key={r.phone} style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', marginRight: 8 }}>{r.phone}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => setStep('input')} style={{ height: 40, padding: '0 20px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Back</button>
            <button onClick={() => addMutation.mutate()} disabled={selected.size === 0 || addMutation.isPending} style={{ height: 40, padding: '0 24px', background: 'var(--accent-cell)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
              {addMutation.isPending ? 'Adding…' : `Add ${selected.size} Member${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ─── Group Detail Drawer ────────────────────────────── */
function GroupDetail({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const [addMembers, setAddMembers] = useState(false)

  const { data: group, isLoading } = useQuery({
    queryKey: ['cells', groupId],
    queryFn:  () => cellGroupsApi.detail(groupId),
    select:   (res) => res.data,
  })

  const removeMutation = useMutation({
    mutationFn: (personId: string) => cellGroupsApi.removeMember(groupId, personId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cells', groupId] }); toast.success('Member removed') },
    onError: () => toast.error('Failed to remove'),
  })

  const disbandMutation = useMutation({
    mutationFn: (reason: string) => cellGroupsApi.disband(groupId, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cells'] }); toast.success('Group disbanded'); onClose() },
    onError: () => toast.error('Failed to disband'),
  })

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 20 }} />)}</div>
  if (!group) return null

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>{group.name}</h3>
            <span style={{ fontSize: 'var(--text-xs)', background: group.status === 'ACTIVE' ? 'var(--color-success-bg)' : 'var(--color-surface-alt)', color: group.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-muted)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600, textTransform: 'uppercase' }}>{group.status}</span>
          </div>
          {isAdmin && group.status === 'ACTIVE' && (
            <button
              onClick={() => { const r = prompt('Reason for disbanding?'); if (r) disbandMutation.mutate(r) }}
              style={{ height: 32, padding: '0 12px', background: 'none', border: '1.5px solid var(--color-danger)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-danger)', fontSize: 'var(--text-xs)', fontWeight: 600 }}
            >
              Disband
            </button>
          )}
        </div>

        {group.purpose && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: '12px 0 0' }}>{group.purpose}</p>}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          {group.meeting_schedule && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{group.meeting_schedule}</span>}
          {group.meeting_location && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{group.meeting_location}</span>}
        </div>
      </div>

      {/* Members */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-base)' }}>
          Members ({group.member_count})
        </h4>
        {group.status === 'ACTIVE' && (
          <button
            onClick={() => setAddMembers(true)}
            style={{ height: 32, padding: '0 12px', background: 'var(--accent-cell)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <UserPlus size={12} /> Add
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(group as any).members?.filter((m: any) => m.is_active).map((m: any) => (
          <div
            key={m.id}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}
          >
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                {m.person_detail?.first_name} {m.person_detail?.last_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{m.person_detail?.phone}</div>
            </div>
            <button
              onClick={() => removeMutation.mutate(m.person)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {addMembers && <AddMembersDialog groupId={groupId} onClose={() => setAddMembers(false)} />}
    </>
  )
}

/* ─── Group Card ─────────────────────────────────────── */
function GroupCard({ group, onClick }: { group: CellGroup; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        cursor: 'pointer',
        transition: 'box-shadow 150ms',
      }}
      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>{group.name}</h3>
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase',
          padding: '2px 8px', borderRadius: 'var(--radius-full)',
          background: group.status === 'ACTIVE' ? 'var(--color-success-bg)' : 'var(--color-surface-alt)',
          color: group.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-muted)',
        }}>
          {group.status}
        </span>
      </div>
      {group.purpose && <p style={{ margin: '0 0 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{group.purpose}</p>}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={11} /> {group.member_count} members
        </span>
        {group.admin_name && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Admin: {group.admin_name}</span>}
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────── */
export default function CellGroupsPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: groups, isLoading } = useQuery({
    queryKey: ['cells'],
    queryFn:  () => cellGroupsApi.list(),
    select:   (res) => res.data.results,
  })

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Cell Groups</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 'var(--text-sm)' }}>
            {groups?.length ?? 0} active groups
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            style={{ height: 40, padding: '0 18px', background: 'var(--accent-cell)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> New Group
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 130 }} />)}
        </div>
      ) : groups?.length === 0 ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <Users size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
          No cell groups yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {groups?.map((g) => <GroupCard key={g.id} group={g} onClick={() => setSelectedId(g.id)} />)}
        </div>
      )}

      {createOpen && <CreateGroupModal onClose={() => setCreateOpen(false)} />}

      <Drawer open={!!selectedId} onClose={() => setSelectedId(null)} title="Cell Group" width={480}>
        {selectedId && <GroupDetail groupId={selectedId} onClose={() => setSelectedId(null)} />}
      </Drawer>
    </div>
  )
}
