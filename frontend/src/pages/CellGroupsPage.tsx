/**
 * CellGroupsPage — admin card grid + full-portal view.
 * Design mirrors DepartmentsPage for visual consistency.
 *
 * Access model:
 *  - Admin: sees all groups as a card grid; clicks to open the full portal.
 *  - CELL_LEADER / CELL_ASST: lands directly in their own group portal.
 */
import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import {
  ArrowLeft, Users, MapPin, Calendar, UserPlus, Trash2,
  Search, Shield, TrendingUp, ChevronRight, Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cellGroupsApi, type CellGroup, type CellGroupMember } from '@/api/cellgroups'
import { personsApi } from '@/api/persons'
import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'

// ── Helpers ────────────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

function extractApiErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data
  if (!data || typeof data !== 'object') return fallback
  if (typeof data.error === 'string' && data.error.trim()) return data.error
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
  return fallback
}

// ── Role config ────────────────────────────────────────────────────────────────

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  LEADER:    { label: 'Cell Leader',      color: '#7c3aed', bg: '#ede9fe' },
  ASSISTANT: { label: 'Assistant Leader', color: '#2563eb', bg: '#dbeafe' },
  MEMBER:    { label: 'Member',           color: '#6b7280', bg: 'var(--color-surface-alt)' },
}

// ── KPI Card (mirrors DepartmentsPage) ─────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; accent?: string
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      borderTop: `3px solid ${accent ?? 'var(--accent-cell)'}`,
      flex: 1, minWidth: 150,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: accent ?? 'var(--accent-cell)', opacity: 0.8 }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Create Group Modal ─────────────────────────────────────────────────────────

const createSchema = z.object({
  name:             z.string().min(2, 'Required'),
  description:      z.string().optional(),
  purpose:          z.string().optional(),
  meeting_schedule: z.string().optional(),
  meeting_location: z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  const mutation = useMutation({
    mutationFn: (data: CreateForm) => cellGroupsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cells'] }); toast.success('Cell group created'); onClose() },
    onError: (err: any) => toast.error(extractApiErrorMessage(err, 'Failed to create')),
  })

  const inp = {
    padding: '8px 12px', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
    color: 'var(--color-text-primary)', width: '100%', boxSizing: 'border-box' as const,
  }
  const lbl = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 } as const

  return (
    <Modal open onClose={onClose} title="Create Cell Group">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label>
            <span style={lbl}>Group Name *</span>
            <input {...register('name')} style={{ ...inp, ...(errors.name ? { borderColor: 'var(--color-danger)' } : {}) }} placeholder="e.g. Alpha Cell" />
            {errors.name && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.name.message}</p>}
          </label>
          <label>
            <span style={lbl}>Purpose</span>
            <input {...register('purpose')} style={inp} placeholder="Purpose of this group…" />
          </label>
          <label>
            <span style={lbl}>Description</span>
            <textarea {...register('description')} rows={2} style={{ ...inp, height: 'auto', padding: '8px 12px', resize: 'vertical' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span style={lbl}>Meeting Schedule</span>
              <input {...register('meeting_schedule')} style={inp} placeholder="Every Sunday 3pm" />
            </label>
            <label>
              <span style={lbl}>Location</span>
              <input {...register('meeting_location')} style={inp} placeholder="123 Church St" />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={onClose} style={{
            padding: '8px 16px', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
          }}>Cancel</button>
          <button type="submit" disabled={mutation.isPending} style={{
            padding: '8px 18px', background: 'var(--accent-cell)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600,
          }}>
            {mutation.isPending ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Phone-Add Flow (batch lookup) ──────────────────────────────────────────────

function AddMembersDialog({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [rawPhones, setRawPhones] = useState('')
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [results, setResults] = useState<{ phone: string; person: { id: string; first_name: string; last_name: string } | null }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  type FoundResult = { phone: string; person: { id: string; first_name: string; last_name: string } }

  const lookupMutation = useMutation({
    mutationFn: () => {
      const phones = rawPhones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean)
      return personsApi.phoneLookup(phones)
    },
    onSuccess: (res) => {
      setResults(res.data.results)
      const found = new Set(res.data.results.flatMap((r: any) => (r.person ? [r.person.id] : [])))
      setSelected(found)
      setStep('preview')
    },
    onError: () => toast.error('Lookup failed'),
  })

  const addMutation = useMutation({
    mutationFn: () => cellGroupsApi.addMembers(groupId, Array.from(selected)),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['cells', groupId] })
      toast.success(`${res.data.count} member(s) added`)
      onClose()
    },
    onError: () => toast.error('Failed to add members'),
  })

  const found    = results.filter((r): r is FoundResult => r.person !== null)
  const notFound = results.filter(r => !r.person)

  return (
    <Modal open onClose={onClose} title="Add Members by Phone" width={540}>
      {step === 'input' ? (
        <>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 0 }}>
            Enter phone numbers separated by commas or new lines (up to 50 at a time).
          </p>
          <textarea
            rows={6}
            value={rawPhones}
            onChange={e => setRawPhones(e.target.value)}
            placeholder={'08012345678\n08098765432'}
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-mono)',
              resize: 'vertical', background: 'var(--color-bg)', color: 'var(--color-text-primary)',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => lookupMutation.mutate()} disabled={!rawPhones.trim() || lookupMutation.isPending} style={{ padding: '8px 16px', background: 'var(--accent-cell)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={14} /> {lookupMutation.isPending ? 'Looking up…' : 'Look Up'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
            {found.length} found · {notFound.length} not found
          </p>
          {found.length > 0 && (
            <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
              {found.map(r => (
                <label key={r.person.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selected.has(r.person.id)}
                    onChange={e => {
                      const next = new Set(selected)
                      if (e.target.checked) next.add(r.person.id)
                      else next.delete(r.person.id)
                      setSelected(next)
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.person.first_name} {r.person.last_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{r.phone}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
          {notFound.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-warning)', marginBottom: 12 }}>
              Not found: {notFound.map(r => r.phone).join(', ')}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setStep('input')} style={{ padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer' }}>Back</button>
            <button onClick={() => addMutation.mutate()} disabled={selected.size === 0 || addMutation.isPending} style={{ padding: '8px 16px', background: 'var(--accent-cell)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>
              {addMutation.isPending ? 'Adding…' : `Add ${selected.size} Member${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

// ── Group Card (mirrors DeptCard) ──────────────────────────────────────────────

function GroupCard({ group, onClick }: { group: CellGroup; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: '20px', cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        borderTop: '3px solid var(--accent-cell)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLElement).style.transform = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--accent-cell) 12%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-cell)', flexShrink: 0,
        }}>
          <Users size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {group.name}
          </h3>
          {group.purpose && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{group.purpose}</span>
          )}
        </div>
        <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: group.admin_name ? 10 : 0 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>{group.member_count}</strong> members
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
          background: group.status === 'ACTIVE' ? 'var(--color-success-bg)' : 'var(--color-surface-alt)',
          color: group.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-muted)',
        }}>
          {group.status}
        </span>
      </div>

      {group.admin_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '1px 5px', borderRadius: 99 }}>LEADER</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{group.admin_name}</span>
        </div>
      )}
    </div>
  )
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────────

function DashboardTab({ group, activeMembers }: {
  group: CellGroup & { members: CellGroupMember[] }
  activeMembers: CellGroupMember[]
}) {
  const leaders   = activeMembers.filter(m => m.role === 'LEADER' || m.role === 'ASSISTANT')
  const members   = activeMembers.filter(m => m.role === 'MEMBER')

  const pieData = [
    { name: 'Members',   value: members.length,   color: '#6b7280' },
    { name: 'Leaders',   value: leaders.filter(m => m.role === 'LEADER').length,   color: '#7c3aed' },
    { name: 'Assistants', value: leaders.filter(m => m.role === 'ASSISTANT').length, color: '#2563eb' },
  ].filter(d => d.value > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard icon={<Users size={18} />} label="Total Members" accent="var(--accent-cell)"
          value={activeMembers.length} />
        <KpiCard icon={<Shield size={18} />} label="Cell Leaders" accent="#7c3aed"
          value={leaders.length} sub={leaders.map(m => `${m.person_detail?.first_name ?? ''}`).join(', ') || 'None assigned'} />
        {group.meeting_schedule && (
          <KpiCard icon={<Calendar size={18} />} label="Meeting Schedule" accent="#059669"
            value={group.meeting_schedule} />
        )}
        {group.meeting_location && (
          <KpiCard icon={<MapPin size={18} />} label="Location" accent="#d97706"
            value={group.meeting_location} />
        )}
      </div>

      {/* Charts + Executives row */}
      <div style={{ display: 'grid', gridTemplateColumns: pieData.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* Executive Assignments */}
        {leaders.length > 0 && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Executive Assignments</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leaders.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${ROLE_CFG[m.role]?.color}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: ROLE_CFG[m.role]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROLE_CFG[m.role]?.color, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {initials(`${m.person_detail?.first_name ?? '?'} ${m.person_detail?.last_name ?? ''}`)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.person_detail?.first_name} {m.person_detail?.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.person_detail?.phone}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: ROLE_CFG[m.role]?.bg, color: ROLE_CFG[m.role]?.color }}>
                    {ROLE_CFG[m.role]?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role Breakdown Pie */}
        {pieData.length > 0 && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, alignSelf: 'flex-start' }}>Role Breakdown</h4>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Purpose / Description */}
      {(group.purpose || group.description) && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          {group.purpose && (
            <div style={{ marginBottom: group.description ? 16 : 0 }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Purpose</h4>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-body)', lineHeight: 1.6 }}>{group.purpose}</p>
            </div>
          )}
          {group.description && (
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</h4>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-body)', lineHeight: 1.6 }}>{group.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Members Tab ────────────────────────────────────────────────────────────────

function MembersTab({ group, activeMembers, isAdmin }: {
  group: CellGroup & { members: CellGroupMember[] }
  activeMembers: CellGroupMember[]
  isAdmin: boolean
}) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  const removeMut = useMutation({
    mutationFn: (personId: string) => cellGroupsApi.removeMember(group.id, personId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cells', group.id] })
      toast.success('Member removed')
      setRemoveId(null)
    },
    onError: (err: any) => toast.error(extractApiErrorMessage(err, 'Failed to remove')),
  })

  const filtered = activeMembers.filter(m => {
    const name = `${m.person_detail?.first_name ?? ''} ${m.person_detail?.last_name ?? ''}`.toLowerCase()
    const phone = m.person_detail?.phone ?? ''
    return name.includes(search.toLowerCase()) || phone.includes(search)
  })

  const removeTarget = removeId ? activeMembers.find(m => m.person === removeId) : null

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            style={{
              width: '100%', padding: '8px 12px 8px 32px', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', fontSize: 13, background: 'var(--color-bg)',
              color: 'var(--color-text-primary)', boxSizing: 'border-box',
            }}
          />
        </div>
        {group.status === 'ACTIVE' && (
          <button onClick={() => setAddOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'var(--accent-cell)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            <UserPlus size={14} /> Add Members
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <Users size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }} />
          {search ? 'No members match your search.' : 'No members yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: ROLE_CFG[m.role]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROLE_CFG[m.role]?.color, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {initials(`${m.person_detail?.first_name ?? '?'} ${m.person_detail?.last_name ?? ''}`)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.person_detail?.first_name} {m.person_detail?.last_name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.person_detail?.phone}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: ROLE_CFG[m.role]?.bg, color: ROLE_CFG[m.role]?.color, flexShrink: 0 }}>
                {ROLE_CFG[m.role]?.label ?? m.role}
              </span>
              {isAdmin && (
                <button
                  onClick={() => setRemoveId(m.person)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}
                  title="Remove member"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Remove confirm */}
      {removeId && removeTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Remove Member</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-text-muted)' }}>
              Remove <strong>{removeTarget.person_detail?.first_name} {removeTarget.person_detail?.last_name}</strong> from this group?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setRemoveId(null)} style={{ padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => removeMut.mutate(removeId)}
                disabled={removeMut.isPending}
                style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, opacity: removeMut.isPending ? 0.6 : 1 }}
              >
                {removeMut.isPending ? 'Removing…' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {addOpen && <AddMembersDialog groupId={group.id} onClose={() => setAddOpen(false)} />}
    </div>
  )
}

// ── Executives Tab ─────────────────────────────────────────────────────────────

function ExecutivesTab({ group, activeMembers }: {
  group: CellGroup & { members: CellGroupMember[] }
  activeMembers: CellGroupMember[]
}) {
  const qc = useQueryClient()
  const [assignRole, setAssignRole] = useState<'LEADER' | 'ASSISTANT'>('LEADER')
  const [assignOpen, setAssignOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  const roleMut = useMutation({
    mutationFn: ({ personId, role }: { personId: string; role: 'MEMBER' | 'LEADER' | 'ASSISTANT' }) =>
      cellGroupsApi.updateMemberRole(group.id, personId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cells', group.id] })
      toast.success('Role updated')
      setAssignOpen(false)
      setMemberSearch('')
    },
    onError: (err: any) => toast.error(extractApiErrorMessage(err, 'Failed to update role')),
  })

  const currentLeader    = activeMembers.find(m => m.role === 'LEADER')
  const currentAssistant = activeMembers.find(m => m.role === 'ASSISTANT')

  const filteredMembers = activeMembers.filter(m => {
    const name = `${m.person_detail?.first_name ?? ''} ${m.person_detail?.last_name ?? ''}`.toLowerCase()
    return name.includes(memberSearch.toLowerCase()) || (m.person_detail?.phone ?? '').includes(memberSearch)
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setAssignOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          background: 'var(--accent-cell)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          <Shield size={14} /> Assign Executive Role
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(['LEADER', 'ASSISTANT'] as const).map(role => {
          const cfg    = ROLE_CFG[role]
          const holder = role === 'LEADER' ? currentLeader : currentAssistant
          return (
            <div key={role} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)', borderLeft: `4px solid ${cfg.color}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                {holder ? (
                  <div style={{ fontSize: 14, color: 'var(--color-text-primary)', marginTop: 2, fontWeight: 600 }}>
                    {holder.person_detail?.first_name} {holder.person_detail?.last_name}
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 8 }}>{holder.person_detail?.phone}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                    Not assigned
                  </div>
                )}
              </div>
              {holder && (
                <button
                  onClick={() => roleMut.mutate({ personId: holder.person, role: 'MEMBER' })}
                  disabled={roleMut.isPending}
                  style={{
                    padding: '5px 10px', fontSize: 12, color: '#dc2626',
                    border: '1px solid #dc262630', borderRadius: 'var(--radius-sm)',
                    background: '#dc262608', cursor: 'pointer',
                  }}
                >
                  Revoke
                </button>
              )}
              {!holder && (
                <button
                  onClick={() => { setAssignRole(role); setAssignOpen(true) }}
                  style={{
                    padding: '5px 10px', fontSize: 12, color: cfg.color,
                    border: `1px solid ${cfg.color}30`, borderRadius: 'var(--radius-sm)',
                    background: cfg.bg, cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Assign
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Assign modal */}
      {assignOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Assign Executive Role</h3>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Role</label>
            <select
              value={assignRole}
              onChange={e => setAssignRole(e.target.value as 'LEADER' | 'ASSISTANT')}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text-primary)', marginBottom: 14, boxSizing: 'border-box' as const }}
            >
              <option value="LEADER">Cell Leader</option>
              <option value="ASSISTANT">Assistant Leader</option>
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Search Member</label>
            <input
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="Type name or phone…"
              autoFocus
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text-primary)', boxSizing: 'border-box' as const }}
            />

            <div style={{ marginTop: 10, maxHeight: 260, overflowY: 'auto' }}>
              {filteredMembers.length === 0 && (
                <div style={{ padding: '12px 8px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {activeMembers.length === 0 ? 'No members in this group yet.' : 'No members match your search.'}
                </div>
              )}
              {filteredMembers.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: '1px solid var(--color-border)', opacity: roleMut.isPending ? 0.6 : 1 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: ROLE_CFG[m.role]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROLE_CFG[m.role]?.color, fontSize: 12, fontWeight: 700 }}>
                    {initials(`${m.person_detail?.first_name ?? '?'} ${m.person_detail?.last_name ?? ''}`)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.person_detail?.first_name} {m.person_detail?.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.person_detail?.phone} · {ROLE_CFG[m.role]?.label ?? m.role}</div>
                  </div>
                  <button
                    onClick={() => !roleMut.isPending && roleMut.mutate({ personId: m.person, role: assignRole })}
                    disabled={roleMut.isPending || m.role === assignRole}
                    style={{
                      padding: '6px 10px', border: 'none', borderRadius: 'var(--radius-sm)',
                      background: m.role === assignRole ? 'var(--color-surface-alt)' : 'var(--accent-cell)',
                      color: m.role === assignRole ? 'var(--color-text-muted)' : '#fff',
                      cursor: m.role === assignRole ? 'default' : 'pointer', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    {m.role === assignRole ? 'Current' : roleMut.isPending ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => { setAssignOpen(false); setMemberSearch('') }} style={{ marginTop: 14, padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', width: '100%', color: 'var(--color-text-secondary)' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Admin Cell Group Portal ────────────────────────────────────────────────────

type AdminTab = 'dashboard' | 'members' | 'executives'

function CellAdminPortal({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()

  const validTabs: AdminTab[] = ['dashboard', 'members', 'executives']
  const tabParam = searchParams.get('tab') as AdminTab | null
  const tab: AdminTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'
  const setTab = (t: AdminTab) => {
    if (t === 'dashboard') setSearchParams({})
    else setSearchParams({ tab: t })
  }

  const { data: group, isLoading } = useQuery({
    queryKey: ['cells', groupId],
    queryFn:  () => cellGroupsApi.detail(groupId),
    select:   res => res.data,
  })

  const disbandMut = useMutation({
    mutationFn: (reason: string) => cellGroupsApi.disband(groupId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cells'] }); toast.success('Group disbanded'); onBack() },
    onError: () => toast.error('Failed to disband'),
  })

  if (isLoading) return (
    <div style={{ padding: 28 }}>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 20, marginBottom: 10 }} />)}
    </div>
  )
  if (!group) return null

  const activeMembers = (group as any).members?.filter((m: any) => m.is_active) ?? []

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard',  label: 'Dashboard',  icon: <TrendingUp size={14} /> },
    { key: 'members',    label: `Members (${activeMembers.length})`, icon: <Users size={14} /> },
    { key: 'executives', label: 'Executives', icon: <Shield size={14} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
        borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
          color: 'var(--color-text-secondary)', fontSize: 13,
        }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            {group.name}
          </h2>
          {group.purpose && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{group.purpose}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase',
            background: group.status === 'ACTIVE' ? 'var(--color-success-bg)' : 'var(--color-surface-alt)',
            color: group.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-muted)',
          }}>{group.status}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {activeMembers.length} members
          </span>
        </div>
        {group.status === 'ACTIVE' && (
          <button
            onClick={() => {
              const reason = prompt('Reason for disbanding?')
              if (reason) disbandMut.mutate(reason)
            }}
            style={{ padding: '6px 14px', background: 'none', border: '1.5px solid var(--color-danger)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-danger)', fontSize: 12, fontWeight: 600 }}
          >
            Disband
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, padding: '0 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 16px', border: 'none', background: 'none',
            fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? 'var(--accent-cell)' : 'var(--color-text-secondary)',
            borderBottom: tab === t.key ? '2px solid var(--accent-cell)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -1,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {tab === 'dashboard'  && <DashboardTab  group={group as any} activeMembers={activeMembers} />}
        {tab === 'members'    && <MembersTab    group={group as any} activeMembers={activeMembers} isAdmin={true} />}
        {tab === 'executives' && <ExecutivesTab group={group as any} activeMembers={activeMembers} />}
      </div>
    </div>
  )
}

// ── Cell Leader / Assistant Portal ────────────────────────────────────────────

function CellPortal({ groupId }: { groupId: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [addOpen, setAddOpen] = useState(false)
  const user = useAuthStore(s => s.user)
  const isLeader = user?.role === 'CELL_LEADER'

  const validTabs = ['dashboard', 'members']
  const tabParam = searchParams.get('tab')
  const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'
  const setTab = (t: string) => {
    if (t === 'dashboard') setSearchParams({})
    else setSearchParams({ tab: t })
  }

  const { data: group, isLoading } = useQuery({
    queryKey: ['cells', groupId],
    queryFn:  () => cellGroupsApi.detail(groupId),
    select:   res => res.data,
  })

  const qc = useQueryClient()
  const removeMut = useMutation({
    mutationFn: (personId: string) => cellGroupsApi.removeMember(groupId, personId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cells', groupId] }); toast.success('Member removed') },
    onError: () => toast.error('Failed to remove'),
  })

  if (isLoading) return (
    <div style={{ padding: 28 }}>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 20, marginBottom: 10 }} />)}
    </div>
  )
  if (!group) return null

  const activeMembers = (group as any).members?.filter((m: any) => m.is_active) ?? []

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp size={14} /> },
    { id: 'members',   label: `Members (${activeMembers.length})`, icon: <Users size={14} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
        borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            {group.name}
          </h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase',
              background: group.status === 'ACTIVE' ? 'var(--color-success-bg)' : 'var(--color-surface-alt)',
              color: group.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-muted)',
            }}>{group.status}</span>
            {group.admin_name && (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Leader: <strong style={{ color: 'var(--color-text-primary)' }}>{group.admin_name}</strong>
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', background: 'var(--color-surface-alt)', padding: '4px 12px', borderRadius: 99, fontWeight: 600 }}>
          {activeMembers.length} members
        </span>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 2, padding: '0 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 16px', border: 'none', cursor: 'pointer', background: 'none',
            fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? 'var(--accent-cell)' : 'var(--color-text-secondary)',
            borderBottom: tab === t.id ? '2px solid var(--accent-cell)' : '2px solid transparent', marginBottom: -1,
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {tab === 'dashboard' && <DashboardTab group={group as any} activeMembers={activeMembers} />}

        {tab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>Members ({activeMembers.length})</h3>
              {group.status === 'ACTIVE' && (
                <button onClick={() => setAddOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--accent-cell)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <UserPlus size={14} /> Add Members
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeMembers.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                  <Users size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }} />
                  No members yet.
                </div>
              ) : activeMembers.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: ROLE_CFG[m.role]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROLE_CFG[m.role]?.color, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {initials(`${m.person_detail?.first_name ?? '?'} ${m.person_detail?.last_name ?? ''}`)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.person_detail?.first_name} {m.person_detail?.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.person_detail?.phone}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: ROLE_CFG[m.role]?.bg, color: ROLE_CFG[m.role]?.color, flexShrink: 0 }}>
                    {ROLE_CFG[m.role]?.label ?? m.role}
                  </span>
                  {isLeader && (
                    <button onClick={() => removeMut.mutate(m.person)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {addOpen && <AddMembersDialog groupId={groupId} onClose={() => setAddOpen(false)} />}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CellGroupsPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin    = user?.role === 'ADMIN'
  const isCellExec = user?.role === 'CELL_LEADER' || user?.role === 'CELL_ASST'
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  const { data: groups, isLoading } = useQuery({
    queryKey: ['cells'],
    queryFn:  () => cellGroupsApi.list(),
    select:   res => res.data.results,
  })

  // Cell leader / assistant — locked to their own group
  if (isCellExec) {
    if (isLoading) return (
      <div style={{ padding: 28 }}>
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 20, marginBottom: 10 }} />)}
      </div>
    )
    if (!groups?.length) return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <Users size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
        <p style={{ margin: 0 }}>You are not assigned to any cell group. Contact Admin.</p>
      </div>
    )
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CellPortal groupId={groups[0].id} />
      </div>
    )
  }

  // Admin — full-page portal when a group is selected
  if (isAdmin && selectedGroupId) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CellAdminPortal groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />
      </div>
    )
  }

  // Admin — group grid
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Cell Groups</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 'var(--text-sm)' }}>
            {groups?.length ?? 0} active groups · Click a card to open the full portal
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', background: 'var(--accent-cell)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}
        >
          <Plus size={16} /> New Group
        </button>
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
          {groups?.map(g => (
            <GroupCard key={g.id} group={g} onClick={() => setSelectedGroupId(g.id)} />
          ))}
        </div>
      )}

      {createOpen && <CreateGroupModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
