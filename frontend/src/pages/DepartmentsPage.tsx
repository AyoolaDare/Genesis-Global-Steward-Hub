import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Users, Plus, CheckSquare, UserPlus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { departmentsApi, type DepartmentMember, type AttendanceSession, type MarkAttendancePayload } from '@/api/departments'
import Drawer from '@/components/ui/Drawer'
import Modal from '@/components/ui/Modal'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { personsApi, type PersonListItem } from '@/api/persons'
import { useDebounce } from '@/hooks/useDebounce'

function CreateDepartmentModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const [hodQuery, setHodQuery] = useState('')
  const [hod, setHod] = useState<PersonListItem | null>(null)
  const [assistantQuery, setAssistantQuery] = useState('')
  const [assistant, setAssistant] = useState<PersonListItem | null>(null)
  const debouncedHodQuery = useDebounce(hodQuery, 300)
  const debouncedAssistantQuery = useDebounce(assistantQuery, 300)

  const { data: hodResults, isFetching: hodSearching } = useQuery({
    queryKey: ['dept-create-hod-search', debouncedHodQuery],
    queryFn: () => personsApi.list({ search: debouncedHodQuery }),
    select: (res) => res.data.results,
    enabled: debouncedHodQuery.trim().length >= 2,
  })

  const { data: assistantResults, isFetching: assistantSearching } = useQuery({
    queryKey: ['dept-create-assistant-search', debouncedAssistantQuery],
    queryFn: () => personsApi.list({ search: debouncedAssistantQuery }),
    select: (res) => res.data.results,
    enabled: debouncedAssistantQuery.trim().length >= 2,
  })

  const createMutation = useMutation({
    mutationFn: () => departmentsApi.create({
      name,
      hod: hod?.id,
      assistant_hod: assistant?.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depts'] })
      toast.success('Department created')
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message ?? 'Failed to create department'),
  })

  return (
    <Modal open onClose={onClose} title="Create Department" width={560}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={lbl}>Department Name *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Choir" />
        </div>

        <div>
          <input className="input" value={hodQuery} onChange={(e) => setHodQuery(e.target.value)} placeholder="Search HOD by name or phone..." />
          <div style={{ marginTop: 8, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {hodQuery.trim().length < 2 ? (
              <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Type at least 2 characters.</div>
            ) : hodSearching ? (
              <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Searching...</div>
            ) : !hodResults || hodResults.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No matching member found.</div>
            ) : (
              hodResults.slice(0, 6).map((person) => (
                <div key={person.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{person.first_name} {person.last_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{person.phone}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setHod(person); setHodQuery(`${person.first_name} ${person.last_name}`) }}
                    style={btnSmall}
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        {hod && <div style={picked}>HOD: {hod.first_name} {hod.last_name} ({hod.phone})</div>}

        <div>
          <input className="input" value={assistantQuery} onChange={(e) => setAssistantQuery(e.target.value)} placeholder="Search Assistant HOD by name or phone..." />
          <div style={{ marginTop: 8, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {assistantQuery.trim().length < 2 ? (
              <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Type at least 2 characters.</div>
            ) : assistantSearching ? (
              <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Searching...</div>
            ) : !assistantResults || assistantResults.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No matching member found.</div>
            ) : (
              assistantResults.slice(0, 6).map((person) => (
                <div key={person.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{person.first_name} {person.last_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{person.phone}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAssistant(person); setAssistantQuery(`${person.first_name} ${person.last_name}`) }}
                    style={btnSmall}
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        {assistant && <div style={picked}>Assistant HOD: {assistant.first_name} {assistant.last_name} ({assistant.phone})</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} style={btnAccent}>
          {createMutation.isPending ? 'Creating...' : 'Create Department'}
        </button>
      </div>
    </Modal>
  )
}

function MarkAttendanceModal({ deptId, members, onClose }: { deptId: string; members: DepartmentMember[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [sessionName, setSessionName] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [sessionType, setSessionType] = useState<'REGULAR' | 'SPECIAL' | 'TRAINING'>('REGULAR')
  const [notes, setNotes] = useState('')
  const [records, setRecords] = useState<Record<string, string>>(Object.fromEntries(members.filter((m) => m.is_active).map((m) => [m.person, 'PRESENT'])))

  const mutation = useMutation({
    mutationFn: () => {
      const payload: MarkAttendancePayload = {
        session_name: sessionName,
        session_date: sessionDate,
        session_type: sessionType,
        notes,
        records: Object.entries(records).map(([person_id, status]) => ({ person_id, status })),
      }
      return departmentsApi.markAttendance(deptId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dept-attendance', deptId] })
      toast.success('Attendance marked')
      onClose()
    },
    onError: () => toast.error('Failed to mark attendance'),
  })

  const activeMembers = members.filter((m) => m.is_active)

  const inputStyle = { height: 40, padding: '0 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', font: `400 var(--text-base) var(--font-body)`, color: 'var(--color-text-body)', background: 'var(--color-surface)', width: '100%', boxSizing: 'border-box' as const }
  const label = { display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 6 }

  return (
    <Modal open onClose={onClose} title="Mark Attendance" width={560}>
      <div style={{ marginBottom: 14 }}>
        <label style={label}>Session Name *</label>
        <input value={sessionName} onChange={(e) => setSessionName(e.target.value)} style={inputStyle} placeholder="Sunday Service, Bible Study..." />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={label}>Date</label>
          <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={label}>Type</label>
          <select value={sessionType} onChange={(e) => setSessionType(e.target.value as any)} style={inputStyle}>
            <option value="REGULAR">Regular</option>
            <option value="SPECIAL">Special</option>
            <option value="TRAINING">Training</option>
          </select>
        </div>
      </div>

      <label style={{ ...label, marginBottom: 8 }}>Member Attendance ({activeMembers.length})</label>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', maxHeight: 280, overflowY: 'auto', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-alt)' }}>
          {(['PRESENT', 'ABSENT'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setRecords(Object.fromEntries(activeMembers.map((m) => [m.person, s])))} style={{ height: 26, padding: '0 10px', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', color: s === 'PRESENT' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              All {s}
            </button>
          ))}
        </div>
        {activeMembers.map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-body)' }}>{(m.person_detail as any)?.first_name} {(m.person_detail as any)?.last_name}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setRecords((r) => ({ ...r, [m.person]: s }))} style={{ height: 26, padding: '0 8px', fontSize: 10, fontWeight: 600, border: `1.5px solid ${records[m.person] === s ? (s === 'PRESENT' ? 'var(--color-success)' : s === 'ABSENT' ? 'var(--color-danger)' : s === 'LATE' ? 'var(--color-warning)' : 'var(--color-info)') : 'var(--color-border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: records[m.person] === s ? (s === 'PRESENT' ? 'var(--color-success-bg)' : s === 'ABSENT' ? 'var(--color-danger-bg)' : s === 'LATE' ? 'var(--color-warning-bg)' : 'var(--color-info-bg)') : 'none', color: records[m.person] === s ? (s === 'PRESENT' ? 'var(--color-success)' : s === 'ABSENT' ? 'var(--color-danger)' : s === 'LATE' ? 'var(--color-warning)' : 'var(--color-info)') : 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  {s[0]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={label}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={() => mutation.mutate()} disabled={!sessionName || mutation.isPending} style={btnAccent}>{mutation.isPending ? 'Saving...' : 'Submit Attendance'}</button>
      </div>
    </Modal>
  )
}

function DeptDetail({ deptId }: { deptId: string }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'members' | 'attendance'>('members')
  const [addQuery, setAddQuery] = useState('')
  const [markOpen, setMarkOpen] = useState(false)
  const debouncedAddQuery = useDebounce(addQuery, 300)

  const { data: dept, isLoading } = useQuery({
    queryKey: ['depts', deptId],
    queryFn: () => departmentsApi.detail(deptId),
    select: (res) => res.data,
  })

  const { data: history } = useQuery({
    queryKey: ['dept-attendance', deptId],
    queryFn: () => departmentsApi.attendanceHistory(deptId),
    select: (res) => res.data,
    enabled: tab === 'attendance',
  })

  const addMemberMutation = useMutation({
    mutationFn: (personId: string) => departmentsApi.addMember(deptId, personId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['depts', deptId] }); toast.success('Member added'); setAddQuery('') },
    onError: (err: any) => toast.error(err.message ?? 'Failed to add member'),
  })

  const removeMutation = useMutation({
    mutationFn: (personId: string) => departmentsApi.removeMember(deptId, personId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['depts', deptId] }); toast.success('Member removed') },
    onError: () => toast.error('Failed to remove'),
  })

  const members: DepartmentMember[] = (dept as any)?.members ?? []
  const activeMembers = members.filter((m) => m.is_active)
  const activeMemberIds = new Set(activeMembers.map((m) => m.person))

  const { data: personSearchResults, isFetching: searchingPersons } = useQuery({
    queryKey: ['dept-add-member-search', deptId, debouncedAddQuery],
    queryFn: () => personsApi.list({ search: debouncedAddQuery }),
    select: (res) => res.data.results,
    enabled: tab === 'members' && debouncedAddQuery.trim().length >= 2,
  })

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 20 }} />)}</div>
  if (!dept) return null

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-lg)' }}>{dept.name}</h3>
        {dept.hod_name && <p style={{ margin: '0 0 4px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>HOD: {dept.hod_name}</p>}
        {dept.assistant_hod_name && <p style={{ margin: '0 0 4px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Assistant HOD: {dept.assistant_hod_name}</p>}
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{dept.member_count} active members</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
        {(['members', 'attendance'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ height: 36, padding: '0 16px', border: 'none', background: 'none', borderBottom: tab === t ? '2px solid var(--accent-department)' : '2px solid transparent', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--accent-department)' : 'var(--color-text-muted)', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {tab === 'members' ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
                placeholder="Search by member name or phone..."
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ marginTop: 8, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {addQuery.trim().length < 2 ? (
                <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  Type at least 2 characters to search members.
                </div>
              ) : searchingPersons ? (
                <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  Searching...
                </div>
              ) : !personSearchResults || personSearchResults.length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  No matching member found.
                </div>
              ) : (
                personSearchResults.slice(0, 8).map((person) => {
                  const alreadyAdded = activeMemberIds.has(person.id)
                  return (
                    <div key={person.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 12px', borderTop: '1px solid var(--color-border)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-body)' }}>
                          {person.first_name} {person.last_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {person.phone || 'No phone'}
                        </div>
                      </div>
                      <button
                        onClick={() => addMemberMutation.mutate(person.id)}
                        disabled={alreadyAdded || addMemberMutation.isPending}
                        style={alreadyAdded ? btnMuted : btnAccent}
                      >
                        <UserPlus size={14} />
                        {alreadyAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeMembers.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{(m.person_detail as any)?.first_name} {(m.person_detail as any)?.last_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{m.role}</div>
                </div>
                <button onClick={() => removeMutation.mutate(m.person)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <button onClick={() => setMarkOpen(true)} style={{ height: 36, padding: '0 16px', background: 'var(--accent-department)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}><CheckSquare size={14} /> Mark Attendance</button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history?.map((session: AttendanceSession) => {
              const present = session.records.filter((r) => r.status === 'PRESENT').length
              const total = session.record_count
              return (
                <div key={session.id} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{session.session_name}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{format(new Date(session.session_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <span style={{ color: 'var(--color-success)' }}>{present} present</span>
                    <span>{total - present} absent</span>
                    <span style={{ textTransform: 'capitalize' }}>{session.session_type.toLowerCase()}</span>
                  </div>
                </div>
              )
            })}
            {(!history || history.length === 0) && <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No attendance records yet</div>}
          </div>
        </>
      )}

      {markOpen && <MarkAttendanceModal deptId={deptId} members={members} onClose={() => setMarkOpen(false)} />}
    </>
  )
}

export default function DepartmentsPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: depts, isLoading } = useQuery({
    queryKey: ['depts'],
    queryFn: () => departmentsApi.list(),
    select: (res) => res.data.results,
  })

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Departments</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 'var(--text-sm)' }}>{depts?.length ?? 0} departments</p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreateOpen(true)} style={btnAccent}><Plus size={14} /> Create Department</button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : depts?.length === 0 ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <Building2 size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
          No departments configured.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {depts?.map((d) => (
            <div key={d.id} onClick={() => setSelectedId(d.id)} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', cursor: 'pointer', transition: 'box-shadow 150ms' }} onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'} onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-department)18', color: 'var(--accent-department)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={18} /></div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>{d.name}</h3>
              </div>
              {d.hod_name && <p style={{ margin: '0 0 6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>HOD: {d.hod_name}</p>}
              {d.assistant_hod_name && <p style={{ margin: '0 0 8px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Assistant HOD: {d.assistant_hod_name}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}><Users size={11} /> {d.member_count} members</div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!selectedId} onClose={() => setSelectedId(null)} title="Department Details" width={520}>
        {selectedId && <DeptDetail deptId={selectedId} />}
      </Drawer>

      {createOpen && <CreateDepartmentModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 'var(--text-sm)', fontWeight: 500 }
const picked: React.CSSProperties = { fontSize: 'var(--text-xs)', color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success)' }
const btnGhost: React.CSSProperties = { height: 40, padding: '0 14px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer' }
const btnAccent: React.CSSProperties = { height: 40, padding: '0 14px', background: 'var(--accent-department)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }
const btnMuted: React.CSSProperties = { height: 32, padding: '0 10px', background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 'var(--text-xs)' }
const btnSmall: React.CSSProperties = { height: 30, padding: '0 10px', background: 'var(--accent-department)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600 }
