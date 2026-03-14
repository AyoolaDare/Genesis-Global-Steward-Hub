/**
 * DepartmentsPage — admin card grid + executive full-portal view.
 *
 * Access model (per DEPARTMENT.md spec):
 *  - Admin: sees all departments as a grid; clicks to open full-page detail
 *  - Exec (HOD/ASST_HOD/WELFARE/PRO): lands directly in their dept portal
 *    with no back navigation to other departments.
 *  - If exec belongs to multiple depts → department switcher dropdown.
 */
import React, { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import {
  ArrowLeft, Building2, Users, CalendarDays, TrendingUp,
  AlertTriangle, Star, BookOpen, MessageSquare, Plus, ChevronDown,
  CheckCircle2, XCircle, Clock, Send, UserMinus, UserPlus,
  Shield, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import {
  departmentsApi,
  type Department, type DepartmentMember, type DepartmentSession,
  type DepartmentMessage, type LeaderboardEntry, type AbsenceAlert,
  type DashboardData, type AttStatus, type SessionType,
  type ExecRole, type ApprovalStage, type MessageType, type Priority,
  EXEC_ROLES, SESSION_TYPES, ATT_STATUS, STAGE_INFO,
} from '../api/departments'
import { personsApi, type PersonListItem } from '../api/persons'

// ── Small helpers ─────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtPct = (n: number) => `${Math.round(n)}%`

function extractApiErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data
  if (typeof data === 'string') {
    const text = data.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return text || fallback
  }
  if (!data || typeof data !== 'object') return fallback

  if (typeof data.error === 'string' && data.error.trim()) return data.error
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
    return String(data.non_field_errors[0])
  }

  const firstFieldError = Object.values(data).find((value) =>
    Array.isArray(value) ? value.length > 0 : typeof value === 'string',
  )
  if (Array.isArray(firstFieldError) && firstFieldError[0]) return String(firstFieldError[0])
  if (typeof firstFieldError === 'string' && firstFieldError.trim()) return firstFieldError

  return fallback
}

function ExecBadge({ role }: { role: ExecRole }) {
  const cfg = EXEC_ROLES[role]
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      color: cfg.color, background: cfg.bg, letterSpacing: '0.03em',
    }}>
      {cfg.label}
    </span>
  )
}

function SessionBadge({ type }: { type: SessionType }) {
  const cfg = SESSION_TYPES[type]
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
      color: cfg.color, background: cfg.color + '18',
    }}>
      {cfg.label}
    </span>
  )
}

function AttBadge({ status }: { status: AttStatus }) {
  const cfg = ATT_STATUS[status]
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  )
}

function StageBadge({ stage }: { stage: ApprovalStage }) {
  const cfg = STAGE_INFO[stage]
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
      color: cfg.color, background: cfg.color + '18',
    }}>
      {cfg.label}
    </span>
  )
}

function KpiCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; accent?: string
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      borderTop: `3px solid ${accent ?? 'var(--color-primary)'}`,
      flex: 1, minWidth: 160,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: accent ?? 'var(--color-primary)', opacity: 0.8 }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Mark Attendance Modal ─────────────────────────────────────────────────────

function MarkAttendanceModal({
  dept, members, onClose,
}: {
  dept: Department
  members: DepartmentMember[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [sessionName, setSessionName] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10))
  const [sessionType, setSessionType] = useState<SessionType>('REGULAR')
  const [notes, setNotes] = useState('')
  const [records, setRecords] = useState<Record<string, AttStatus>>(
    Object.fromEntries(members.map(m => [m.person, 'ABSENT' as AttStatus]))
  )
  const [excuses, setExcuses] = useState<Record<string, string>>({})
  const [step, setStep] = useState<1 | 2>(1)

  const mut = useMutation({
    mutationFn: () => departmentsApi.createSession(dept.id, {
      session_name: sessionName,
      session_date: sessionDate,
      session_type: sessionType,
      notes,
      records: members.map(m => ({
        person_id:    m.person,
        status:       records[m.person] ?? 'ABSENT',
        excuse_reason: excuses[m.person] ?? '',
      })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dept-sessions', dept.id] })
      qc.invalidateQueries({ queryKey: ['dept-dashboard', dept.id] })
      onClose()
    },
  })

  const presentCount  = Object.values(records).filter(s => s === 'PRESENT').length
  const absentCount   = Object.values(records).filter(s => s === 'ABSENT').length
  const excusedCount  = Object.values(records).filter(s => s === 'EXCUSED').length

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 48, zIndex: 200, overflowY: 'auto',
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: 640, margin: '0 16px 48px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Mark Attendance — {dept.name}</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {(['Session Details', 'Attendance Sheet'] as const).map((label, i) => (
              <span key={label} style={{
                fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                background: step === i + 1 ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                color: step === i + 1 ? '#fff' : 'var(--color-text-muted)',
                cursor: 'pointer',
              }} onClick={() => step === 2 && i === 0 && setStep(1)}>
                Step {i + 1}: {label}
              </span>
            ))}
          </div>
        </div>

        {step === 1 ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
              Session Name *
              <input
                value={sessionName} onChange={e => setSessionName(e.target.value)}
                placeholder="e.g. Sunday Rehearsal, Q1 Training"
                style={{
                  padding: '8px 12px', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
                Date *
                <input
                  type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                  style={{
                    padding: '8px 12px', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
                Type
                <select
                  value={sessionType} onChange={e => setSessionType(e.target.value as SessionType)}
                  style={{
                    padding: '8px 12px', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {Object.entries(SESSION_TYPES).map(([v, { label }]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
              Notes (optional)
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                style={{
                  padding: '8px 12px', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', fontSize: 14, resize: 'vertical',
                  background: 'var(--color-bg)', color: 'var(--color-text-primary)',
                }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '8px 16px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}>Cancel</button>
              <button
                onClick={() => setStep(2)}
                disabled={!sessionName.trim()}
                style={{
                  padding: '8px 18px', background: 'var(--color-primary)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  opacity: !sessionName.trim() ? 0.5 : 1,
                }}
              >Next →</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Present', count: presentCount, color: '#059669' },
                { label: 'Absent',  count: absentCount,  color: '#dc2626' },
                { label: 'Excused', count: excusedCount, color: '#d97706' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  color: s.color, background: s.color + '18',
                }}>
                  {s.label}: {s.count}
                </div>
              ))}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map(m => {
                const st = records[m.person] ?? 'ABSENT'
                return (
                  <div key={m.person} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', background: 'var(--color-bg)',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--color-primary)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {initials(m.person_detail?.full_name ?? '?')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {m.person_detail?.full_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {m.role}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'] as AttStatus[]).map(s => (
                        <button key={s} onClick={() => setRecords(r => ({ ...r, [m.person]: s }))}
                          style={{
                            padding: '4px 8px', fontSize: 10, fontWeight: 700, borderRadius: 6,
                            border: '1.5px solid',
                            borderColor: st === s ? ATT_STATUS[s].color : 'var(--color-border)',
                            background: st === s ? ATT_STATUS[s].bg : 'none',
                            color: st === s ? ATT_STATUS[s].color : 'var(--color-text-muted)',
                            cursor: 'pointer',
                          }}
                        >{s[0]}</button>
                      ))}
                    </div>
                    {st === 'EXCUSED' && (
                      <input
                        value={excuses[m.person] ?? ''}
                        onChange={e => setExcuses(x => ({ ...x, [m.person]: e.target.value }))}
                        placeholder="Reason…"
                        style={{
                          width: 110, padding: '4px 8px', fontSize: 12,
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setStep(1)} style={{
                padding: '8px 16px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}>← Back</button>
              <button onClick={() => mut.mutate()} disabled={mut.isPending} style={{
                padding: '8px 18px', background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                opacity: mut.isPending ? 0.6 : 1,
              }}>
                {mut.isPending ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
            {mut.isError && (
              <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8 }}>
                Failed to save. Please try again.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardTab({
  dept, execRole, isAdmin,
}: {
  dept: Department
  execRole: ExecRole | null
  isAdmin: boolean
}) {
  const canViewAlerts = isAdmin || execRole === 'HOD' || execRole === 'ASST_HOD' || execRole === 'WELFARE'
  const { data: dash } = useQuery<DashboardData>({
    queryKey: ['dept-dashboard', dept.id],
    queryFn:  () => departmentsApi.dashboard(dept.id).then(r => r.data),
  })
  const { data: regularLb } = useQuery<LeaderboardEntry[]>({
    queryKey: ['dept-lb-regular', dept.id],
    queryFn:  () => departmentsApi.leaderboardRegular(dept.id).then(r => r.data),
  })
  const { data: trainingLb } = useQuery<LeaderboardEntry[]>({
    queryKey: ['dept-lb-training', dept.id],
    queryFn:  () => departmentsApi.leaderboardTraining(dept.id).then(r => r.data),
  })
  const { data: alerts } = useQuery<AbsenceAlert[]>({
    queryKey: ['dept-alerts', dept.id],
    queryFn:  () => departmentsApi.alerts(dept.id).then(r => r.data),
    enabled: canViewAlerts,
  })

  if (!dash) return <div style={{ padding: 32, color: 'var(--color-text-muted)' }}>Loading dashboard…</div>

  const donutData = [
    { name: 'Present', value: dash.attendance_donut.present, color: '#059669' },
    { name: 'Late',    value: dash.attendance_donut.late,    color: '#2563eb' },
    { name: 'Excused', value: dash.attendance_donut.excused, color: '#d97706' },
    { name: 'Absent',  value: dash.attendance_donut.absent,  color: '#dc2626' },
  ]

  const genderData = Object.entries(dash.gender_breakdown).map(([name, value]) => ({ name, value }))
  const sessionTypeData = Object.entries(dash.session_type_breakdown).map(([name, value]) => ({ name, value }))
  const GENDER_COLORS = ['#2563eb', '#ec4899', '#6b7280']
  const TYPE_COLORS   = ['#2563eb', '#059669', '#d97706', '#7c3aed']

  const rankEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : String(r)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard icon={<Users size={18} />} label="Total Members" accent="#2563eb"
          value={dash.member_count} sub={`+${dash.new_this_month} this month`} />
        <KpiCard icon={<CalendarDays size={18} />} label="Last Session" accent="#059669"
          value={dash.last_session ? `${dash.last_session.present} present` : '—'}
          sub={dash.last_session ? `${fmtPct(dash.last_session.rate)} attendance` : 'No sessions yet'} />
        <KpiCard icon={<AlertTriangle size={18} />} label="Absent This Month" accent="#d97706"
          value={dash.absences_this_month}
          sub={dash.critical_absences > 0 ? `⚠ ${dash.critical_absences} critical` : 'All clear'} />
        <KpiCard icon={<TrendingUp size={18} />} label="Total Sessions" accent="#7c3aed"
          value={dash.session_count} />
      </div>

      {/* Charts row 1: Attendance Trend + Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 20,
        }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Attendance Trend — Last 8 Sessions</h4>
          {dash.attendance_trend.length === 0
            ? <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No sessions recorded yet.</p>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dash.attendance_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="present" stackId="a" fill="#059669" name="Present" />
                  <Bar dataKey="late"    stackId="a" fill="#2563eb" name="Late" />
                  <Bar dataKey="excused" stackId="a" fill="#d97706" name="Excused" />
                  <Bar dataKey="absent"  stackId="a" fill="#dc2626" name="Absent" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, alignSelf: 'flex-start' }}>
            Attendance Rate
          </h4>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>
            {fmtPct(dash.attendance_donut.rate)}
          </div>
          {dash.attendance_donut.total > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                  {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center' }}>
              No records yet
            </p>
          )}
        </div>
      </div>

      {/* Charts row 2: Member Growth + Gender + Session Types */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 20,
        }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Member Growth — Last 6 Months</h4>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dash.member_growth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[3,3,0,0]} name="Added" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, alignSelf: 'flex-start' }}>Gender</h4>
          {genderData.length > 0
            ? (
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" outerRadius={45} dataKey="value" label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`} labelLine={false}>
                    {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )
            : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No data</p>
          }
        </div>
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, alignSelf: 'flex-start' }}>Session Types</h4>
          {sessionTypeData.length > 0
            ? (
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={sessionTypeData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                    {sessionTypeData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )
            : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No sessions</p>
          }
        </div>
      </div>

      {/* Leaderboards row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { title: '⭐ Top Attendees', data: regularLb ?? [] },
          { title: '📚 Most Consistent Trainees', data: trainingLb ?? [] },
        ].map(({ title, data }) => (
          <div key={title} style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 20,
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>{title}</h4>
            {data.length === 0
              ? <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No data yet.</p>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Rank', 'Name', 'Rate', 'Streak'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '4px 8px', fontSize: 11,
                          color: 'var(--color-text-muted)', fontWeight: 600,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map(e => (
                      <tr key={e.person_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '6px 8px', fontSize: 16 }}>{rankEmoji(e.rank)}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 500 }}>{e.full_name}</td>
                        <td style={{ padding: '6px 8px', color: '#059669', fontWeight: 600 }}>{e.rate}%</td>
                        <td style={{ padding: '6px 8px' }}>
                          {e.streak >= 5 ? `🔥 ${e.streak}` : String(e.streak)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        ))}
      </div>

      {/* Absence alerts */}
      {canViewAlerts && (alerts?.length ?? 0) > 0 && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid #fbbf24',
          borderRadius: 'var(--radius-lg)', padding: 20,
        }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#d97706' }}>
            ⚠️ Needs Attention — Members with 3+ Consecutive Absences
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Name', 'Last Seen', 'Missed (in a row)'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '4px 8px', fontSize: 11,
                    color: 'var(--color-text-muted)', fontWeight: 600,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts!.map(a => (
                <tr key={a.person_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 500 }}>{a.full_name}</td>
                  <td style={{ padding: '6px 8px', color: 'var(--color-text-muted)' }}>
                    {a.last_seen ? fmtDate(a.last_seen) : 'Never'}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#dc2626', fontWeight: 700 }}>
                    {a.missed} in a row
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Members Tab ───────────────────────────────────────────────────────────────

function MembersTab({ dept, execRole }: { dept: Department; execRole: ExecRole | null }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [addSearch, setAddSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const addSearchTerm = addSearch.trim()

  const { data: members = [] } = useQuery<DepartmentMember[]>({
    queryKey: ['dept-members', dept.id],
    queryFn:  () => departmentsApi.listMembers(dept.id).then(r => r.data),
  })

  const {
    data: searchResults = [],
    isFetching: isSearchingMembers,
    error: addSearchError,
  } = useQuery<PersonListItem[]>({
    queryKey: ['dept-member-person-search', dept.id, addSearchTerm],
    queryFn:  () => personsApi.list({ search: addSearchTerm, page_size: '20' }).then(r => r.data.results),
    enabled: addOpen && addSearchTerm.length >= 2,
  })

  const addMut = useMutation({
    mutationFn: (personId: string) => departmentsApi.addMember(dept.id, { person_id: personId }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['dept-members', dept.id] })
      qc.invalidateQueries({ queryKey: ['dept-detail', dept.id] })
      setAddSearch('')
      setAddOpen(false)
      window.alert('Member added successfully.')
    },
    onError: (error: any) => {
      window.alert(extractApiErrorMessage(error, 'Could not add member.'))
    },
  })

  const removeMut = useMutation({
    mutationFn: (personId: string) => departmentsApi.removeMember(dept.id, personId, removeReason),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['dept-members', dept.id] })
      setRemoveId(null); setRemoveReason('')
    },
  })

  const canRemove = execRole === 'HOD' || execRole === 'ASST_HOD'
  const filtered  = members.filter(m =>
    m.person_detail?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.person_detail?.phone?.includes(search)
  )

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          style={{
            flex: 1, minWidth: 200, padding: '8px 12px',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text-primary)',
          }}
        />
        <button onClick={() => setAddOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          <UserPlus size={14} /> Add Member
        </button>
      </div>

      {/* Member list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0
          ? <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 32 }}>
              {search ? 'No members match your search.' : 'No members in this department.'}
            </p>
          : filtered.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: '#2563eb18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#2563eb', fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {initials(m.person_detail?.full_name ?? '?')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {m.person_detail?.full_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {m.person_detail?.phone} · Joined {fmtDate(m.joined_date)}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)',
              }}>
                {m.role}
              </span>
              {canRemove && (
                <button onClick={() => setRemoveId(m.person)} style={{
                  padding: '4px 8px', color: '#dc2626', border: '1px solid #dc262620',
                  borderRadius: 'var(--radius-sm)', background: '#dc262608',
                  cursor: 'pointer', fontSize: 12,
                }}>
                  Remove
                </button>
              )}
            </div>
          ))
        }
      </div>

      {/* Add member panel */}
      {addOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
            padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Add Member</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Search by name or phone number. Only registered church members can be added.
            </p>
            <input
              value={addSearch} onChange={e => setAddSearch(e.target.value)} autoFocus
              placeholder="Type name or phone…"
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
                color: 'var(--color-text-primary)', boxSizing: 'border-box',
              }}
            />
            <div style={{ marginTop: 8, maxHeight: 280, overflowY: 'auto' }}>
              {addSearchTerm.length < 2 && (
                <p style={{
                  color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16
                }}>
                  Type at least 2 characters to search for a member.
                </p>
              )}
              {addSearchTerm.length >= 2 && isSearchingMembers && (
                <p style={{
                  color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16
                }}>
                  Searching members...
                </p>
              )}
              {addSearchTerm.length >= 2 && addSearchError && (
                <p style={{
                  color: 'var(--color-danger)', fontSize: 13, textAlign: 'center', padding: 16
                }}>
                  {extractApiErrorMessage(addSearchError, 'Could not search members.')}
                </p>
              )}
              {addSearchTerm.length >= 2 && !isSearchingMembers && !addSearchError && searchResults.length === 0 && (
                <p style={{
                  color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16
                }}>
                  No member found. You cannot create new church members from here.
                  Contact Admin or Follow-Up team.
                </p>
              )}
              {searchResults.map((p) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                  borderBottom: '1px solid var(--color-border)',
                  opacity: addMut.isPending ? 0.6 : 1,
                }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: '#2563eb18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#2563eb', fontSize: 12, fontWeight: 700,
                  }}>
                    {initials(p.full_name ?? `${p.first_name} ${p.last_name}`.trim())}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {p.full_name ?? `${p.first_name} ${p.last_name}`.trim()}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.phone}</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 99,
                    background: '#059669' + '18', color: '#059669',
                  }}>{p.status}</span>
                  <button
                    onClick={() => !addMut.isPending && addMut.mutate(p.id)}
                    disabled={addMut.isPending}
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {addMut.isPending ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => { setAddOpen(false); setAddSearch('') }} style={{
              marginTop: 12, padding: '8px 16px', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', width: '100%',
            }}>Close</button>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {removeId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
            padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#dc2626' }}>
              Remove from Department?
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              The person's attendance history and church membership are unaffected.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Reason (required)
            </label>
            <textarea
              value={removeReason} onChange={e => setRemoveReason(e.target.value)} rows={2}
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', fontSize: 14, resize: 'vertical',
                background: 'var(--color-bg)', color: 'var(--color-text-primary)', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => { setRemoveId(null); setRemoveReason('') }} style={{
                padding: '8px 16px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
              }}>Cancel</button>
              <button
                onClick={() => removeMut.mutate(removeId)}
                disabled={removeReason.trim().length < 5 || removeMut.isPending}
                style={{
                  padding: '8px 16px', background: '#dc2626', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  opacity: removeReason.trim().length < 5 || removeMut.isPending ? 0.5 : 1,
                }}
              >
                {removeMut.isPending ? 'Removing…' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Attendance Tab ────────────────────────────────────────────────────────────

function AttendanceTab({ dept, execRole }: { dept: Department; execRole: ExecRole | null }) {
  const [attOpen, setAttOpen]     = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)

  const { data: members = [] } = useQuery<DepartmentMember[]>({
    queryKey: ['dept-members', dept.id],
    queryFn:  () => departmentsApi.listMembers(dept.id).then(r => r.data),
  })

  const { data: sessions = [] } = useQuery<DepartmentSession[]>({
    queryKey: ['dept-sessions', dept.id],
    queryFn:  () => departmentsApi.listSessions(dept.id).then(r => r.data),
  })

  const canMark = execRole === 'HOD' || execRole === 'ASST_HOD' || execRole === 'WELFARE'

  return (
    <div>
      {canMark && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setAttOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            <Plus size={14} /> Mark Attendance
          </button>
        </div>
      )}

      {sessions.length === 0
        ? <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 48 }}>
            No sessions recorded yet.
          </p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map(s => {
              const total   = s.record_count
              const present = s.present_count
              const absent  = s.absent_count
              const other   = total - present - absent
              const rate    = total > 0 ? Math.round((present / total) * 100) : 0
              const isOpen  = expanded === s.id

              return (
                <div key={s.id} style={{
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)', overflow: 'hidden',
                }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {s.session_name}
                        </span>
                        <SessionBadge type={s.session_type} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {fmtDate(s.session_date)} · {total} members
                      </div>
                    </div>
                    {/* Stacked bar */}
                    <div style={{ width: 120, height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${total ? (present / total) * 100 : 0}%`, background: '#059669' }} />
                      <div style={{ width: `${total ? (other / total) * 100 : 0}%`, background: '#d97706' }} />
                      <div style={{ width: `${total ? (absent / total) * 100 : 0}%`, background: '#dc2626' }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: rate >= 75 ? '#059669' : '#d97706', width: 36 }}>
                      {rate}%
                    </span>
                    <ChevronDown size={14} style={{
                      color: 'var(--color-text-muted)',
                      transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s',
                    }} />
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {s.records.map(r => (
                          <div key={r.person_id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '6px 0', borderBottom: '1px solid var(--color-border)',
                          }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563eb18',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#2563eb', fontSize: 11, fontWeight: 700,
                            }}>
                              {initials(r.person_name)}
                            </div>
                            <span style={{ flex: 1, fontSize: 13 }}>{r.person_name}</span>
                            <AttBadge status={r.status} />
                            {r.excuse_reason && (
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                {r.excuse_reason}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      }

      {attOpen && (
        <MarkAttendanceModal dept={dept} members={members} onClose={() => setAttOpen(false)} />
      )}
    </div>
  )
}

// ── Messages Tab ──────────────────────────────────────────────────────────────

function MessagesTab({ dept, execRole }: { dept: Department; execRole: ExecRole | null }) {
  const qc = useQueryClient()
  const [composeOpen, setComposeOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [msgType, setMsgType] = useState<MessageType>('ANNOUNCEMENT')
  const [priority, setPriority] = useState<Priority>('NORMAL')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: messages = [] } = useQuery<DepartmentMessage[]>({
    queryKey: ['dept-messages', dept.id],
    queryFn:  () => departmentsApi.listMessages(dept.id).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => departmentsApi.createMessage(dept.id, {
      subject, body, message_type: msgType, priority,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dept-messages', dept.id] })
      setComposeOpen(false); setSubject(''); setBody('')
    },
  })

  const submitMut = useMutation({
    mutationFn: (msgId: string) => departmentsApi.submitMessage(dept.id, msgId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['dept-messages', dept.id] }),
  })

  const appL1Mut = useMutation({
    mutationFn: (msgId: string) => departmentsApi.approveL1(dept.id, msgId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['dept-messages', dept.id] }),
  })

  const rejL1Mut = useMutation({
    mutationFn: (msgId: string) => departmentsApi.rejectL1(dept.id, msgId, rejectReason),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['dept-messages', dept.id] })
      setRejectId(null); setRejectReason('')
    },
  })

  const canApproveL1 = execRole === 'HOD' || execRole === 'ASST_HOD'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setComposeOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={14} /> Compose Message
        </button>
      </div>

      {messages.length === 0
        ? <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 48 }}>
            No messages yet.
          </p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map(m => (
              <div key={m.id} style={{
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                padding: '14px 16px', background: 'var(--color-surface)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {m.subject}
                      </span>
                      <StageBadge stage={m.approval_stage} />
                      {m.priority === 'URGENT' && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: 99 }}>
                          URGENT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      By {m.created_by_name} · {fmtDate(m.created_at)} · {m.message_type}
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {m.body.slice(0, 160)}{m.body.length > 160 ? '…' : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    {m.approval_stage === 'DRAFT' && (
                      <button onClick={() => submitMut.mutate(m.id)} style={{
                        padding: '5px 10px', fontSize: 12, fontWeight: 600,
                        background: '#2563eb', color: '#fff', border: 'none',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      }}>
                        <Send size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Submit
                      </button>
                    )}
                    {m.approval_stage === 'PENDING_LEVEL1' && canApproveL1 && (
                      <>
                        <button onClick={() => appL1Mut.mutate(m.id)} style={{
                          padding: '5px 10px', fontSize: 12, fontWeight: 600,
                          background: '#059669', color: '#fff', border: 'none',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        }}>✓ Approve</button>
                        <button onClick={() => setRejectId(m.id)} style={{
                          padding: '5px 10px', fontSize: 12, fontWeight: 600,
                          background: '#dc2626', color: '#fff', border: 'none',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        }}>✕ Reject</button>
                      </>
                    )}
                  </div>
                </div>
                {/* Rejection trail */}
                {m.level1_rejection_reason && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    background: '#fee2e2', fontSize: 12, color: '#dc2626',
                  }}>
                    <strong>L1 Rejection:</strong> {m.level1_rejection_reason}
                  </div>
                )}
                {m.admin_rejection_reason && (
                  <div style={{
                    marginTop: 4, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    background: '#fee2e2', fontSize: 12, color: '#dc2626',
                  }}>
                    <strong>Admin Rejection:</strong> {m.admin_rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      {/* Compose modal */}
      {composeOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
            padding: 24, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Compose Message</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject *"
                style={{
                  padding: '8px 12px', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select value={msgType} onChange={e => setMsgType(e.target.value as MessageType)}
                  style={{
                    padding: '8px 12px', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', fontSize: 13, background: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                  }}>
                  {[
                    ['ANNOUNCEMENT', 'Announcement'], ['REMINDER', 'Reminder'],
                    ['WELFARE_CHECK', 'Welfare Check'], ['PRAYER_REQUEST', 'Prayer Request'],
                    ['URGENT', 'Urgent'],
                  ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                  style={{
                    padding: '8px 12px', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', fontSize: 13, background: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                  }}>
                  {[['NORMAL', 'Normal Priority'], ['HIGH', 'High Priority'], ['URGENT', 'URGENT']].map(
                    ([v, l]) => <option key={v} value={v}>{l}</option>
                  )}
                </select>
              </div>
              <textarea
                value={body} onChange={e => setBody(e.target.value)} rows={5}
                placeholder="Message body… (goes through approval before sending)"
                style={{
                  padding: '8px 12px', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', fontSize: 14, resize: 'vertical',
                  background: 'var(--color-bg)', color: 'var(--color-text-primary)',
                }}
              />
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                💡 Saved as draft. You must submit for approval before it can be sent.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setComposeOpen(false)} style={{
                  padding: '8px 16px', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
                }}>Cancel</button>
                <button
                  onClick={() => createMut.mutate()}
                  disabled={!subject.trim() || !body.trim() || createMut.isPending}
                  style={{
                    padding: '8px 18px', background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    opacity: !subject.trim() || !body.trim() ? 0.5 : 1,
                  }}
                >
                  {createMut.isPending ? 'Saving…' : 'Save Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
            padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#dc2626' }}>
              Reject Message
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Provide a reason. The sender will be notified.
            </p>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} autoFocus
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', fontSize: 14, resize: 'vertical',
                background: 'var(--color-bg)', color: 'var(--color-text-primary)', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => { setRejectId(null); setRejectReason('') }} style={{
                padding: '8px 16px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
              }}>Cancel</button>
              <button
                onClick={() => rejL1Mut.mutate(rejectId)}
                disabled={rejectReason.trim().length < 5 || rejL1Mut.isPending}
                style={{
                  padding: '8px 16px', background: '#dc2626', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  opacity: rejectReason.trim().length < 5 ? 0.5 : 1,
                }}
              >
                {rejL1Mut.isPending ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Executives Tab (Admin only) ───────────────────────────────────────────────

function ExecutivesTab({ dept }: { dept: Department }) {
  const qc = useQueryClient()
  const [grantRole, setGrantRole] = useState<ExecRole>('HOD')
  const [grantSearch, setGrantSearch] = useState('')
  const [grantOpen, setGrantOpen] = useState(false)
  const searchTerm = grantSearch.trim()

  const {
    data: searchResults = [],
    isFetching: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ['dept-exec-person-search', searchTerm],
    queryFn:  () => personsApi.list({ search: searchTerm, page_size: '20' }).then(r => r.data.results),
    enabled: grantOpen && searchTerm.length >= 2,
  })

  const grantMut = useMutation({
    mutationFn: (personId: string) =>
      departmentsApi.grantExecutive(dept.id, { person_id: personId, role: grantRole }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['depts'] })
      qc.invalidateQueries({ queryKey: ['dept-detail', dept.id] })
      setGrantRole('HOD')
      setGrantOpen(false); setGrantSearch('')
      window.alert('Executive role assigned successfully.')
    },
    onError: (err: any) => {
      window.alert(extractApiErrorMessage(err, 'Could not assign executive role.'))
    },
  })

  const revokeMut = useMutation({
    mutationFn: (personId: string) => departmentsApi.revokeExecutive(dept.id, { person_id: personId }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['depts'] })
      qc.invalidateQueries({ queryKey: ['dept-detail', dept.id] })
    },
  })

  const executives = dept.executives ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setGrantOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          <Shield size={14} /> Grant Executive Access
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(['HOD', 'ASST_HOD', 'WELFARE', 'PRO'] as ExecRole[]).map(role => {
          const holder = executives.find(e => e.role === role)
          const cfg    = EXEC_ROLES[role]
          return (
            <div key={role} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)', borderLeft: `4px solid ${cfg.color}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                {holder
                  ? <div style={{ fontSize: 14, color: 'var(--color-text-primary)', marginTop: 2, fontWeight: 600 }}>
                      {holder.name}
                    </div>
                  : <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Not assigned
                    </div>
                }
              </div>
              {holder && (
                <button
                  onClick={() => revokeMut.mutate(holder.person_id)}
                  disabled={revokeMut.isPending}
                  style={{
                    padding: '5px 10px', fontSize: 12, color: '#dc2626',
                    border: '1px solid #dc262630', borderRadius: 'var(--radius-sm)',
                    background: '#dc262608', cursor: 'pointer',
                  }}
                >
                  Revoke
                </button>
              )}
            </div>
          )
        })}
      </div>

      {grantOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
            padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Grant Executive Access</h3>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Role</label>
            <select value={grantRole} onChange={e => setGrantRole(e.target.value as ExecRole)}
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
                color: 'var(--color-text-primary)', marginBottom: 12, boxSizing: 'border-box',
              }}>
              {(['HOD', 'ASST_HOD', 'WELFARE', 'PRO'] as ExecRole[]).map(r => (
                <option key={r} value={r}>{EXEC_ROLES[r].label}</option>
              ))}
            </select>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Search Person
            </label>
            <input
              value={grantSearch} onChange={e => setGrantSearch(e.target.value)} autoFocus
              placeholder="Type name or phone…"
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
                color: 'var(--color-text-primary)', boxSizing: 'border-box',
              }}
            />
            <div style={{ marginTop: 8, maxHeight: 240, overflowY: 'auto' }}>
              {searchTerm.length < 2 && (
                <div style={{ padding: '12px 8px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Type at least 2 characters to search for a member.
                </div>
              )}
              {searchTerm.length >= 2 && isSearching && (
                <div style={{ padding: '12px 8px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Searching members...
                </div>
              )}
              {searchTerm.length >= 2 && searchError && (
                <div style={{ padding: '12px 8px', fontSize: 13, color: 'var(--color-danger)' }}>
                  {extractApiErrorMessage(searchError, 'Could not search members.')}
                </div>
              )}
              {searchResults.map((p: PersonListItem) => {
                const fullName = p.full_name ?? `${p.first_name} ${p.last_name}`.trim()
                return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                  borderBottom: '1px solid var(--color-border)',
                  opacity: grantMut.isPending ? 0.6 : 1,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: '#7c3aed18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#7c3aed', fontSize: 12, fontWeight: 700,
                  }}>
                    {initials(fullName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.phone}</div>
                  </div>
                  <button
                    onClick={() => !grantMut.isPending && grantMut.mutate(p.id)}
                    disabled={grantMut.isPending}
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {grantMut.isPending ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              )})}
              {searchTerm.length >= 2 && !isSearching && !searchError && searchResults.length === 0 && (
                <div style={{ padding: '12px 8px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  No matching member found.
                </div>
              )}
            </div>
            <button onClick={() => { setGrantOpen(false); setGrantSearch('') }} style={{
              marginTop: 12, padding: '8px 16px', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
              width: '100%', color: 'var(--color-text-secondary)',
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dept Detail (full-page portal) ────────────────────────────────────────────

type Tab = 'dashboard' | 'members' | 'attendance' | 'messages' | 'executives'

function DeptDetail({
  dept, onBack, canGoBack, userRole, myDepts, onSwitchDept,
}: {
  dept: Department
  onBack: () => void
  canGoBack: boolean
  userRole: string | null
  myDepts: Department[]
  onSwitchDept: (id: string) => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs: Tab[] = ['dashboard', 'members', 'attendance', 'messages', 'executives']
  const tabParam = searchParams.get('tab') as Tab | null
  const tab: Tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'
  const setTab = (newTab: Tab) => {
    if (newTab === 'dashboard') setSearchParams({})
    else setSearchParams({ tab: newTab })
  }

  // Derive the logged-in user's executive role for THIS department from the dept data
  const { user } = useAuthStore()
  const isAdmin   = userRole === 'ADMIN'
  const execEntry = dept.executives?.find(e => e.person_id === user?.person)
  const execRole  = execEntry?.role ?? null

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard',  label: 'Dashboard',  icon: <TrendingUp size={14} /> },
    { key: 'members',    label: 'Members',    icon: <Users size={14} /> },
    { key: 'attendance', label: 'Attendance', icon: <CalendarDays size={14} /> },
    { key: 'messages',   label: 'Messages',   icon: <MessageSquare size={14} /> },
    ...(isAdmin ? [{ key: 'executives' as Tab, label: 'Executives', icon: <Shield size={14} /> }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
        borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
        flexShrink: 0,
      }}>
        {canGoBack && (
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: 13,
          }}>
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            margin: 0, fontSize: 18, fontWeight: 800,
            fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)',
          }}>
            {dept.name}
          </h2>
          {dept.category && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{dept.category}</span>
          )}
        </div>

        {/* Executive badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {dept.executives?.map(e => (
            <div key={e.role} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{EXEC_ROLES[e.role].label}:</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{e.name}</span>
            </div>
          ))}
        </div>

        {/* Dept switcher — Admin only (exec users are locked to their assigned dept) */}
        {isAdmin && myDepts.length > 1 && (
          <div style={{ position: 'relative' }}>
            <select
              value={dept.id}
              onChange={e => onSwitchDept(e.target.value)}
              style={{
                padding: '6px 10px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', fontSize: 13, background: 'var(--color-bg)',
                color: 'var(--color-text-primary)', cursor: 'pointer',
              }}
            >
              {myDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Tab bar — only shown to Admin (exec users navigate via sidebar) */}
      {isAdmin && <div style={{
        display: 'flex', gap: 2, padding: '0 24px',
        borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
        flexShrink: 0,
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 16px', border: 'none', background: 'none',
            fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -1,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>}

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {tab === 'dashboard'  && <DashboardTab  dept={dept} execRole={execRole} isAdmin={isAdmin} />}
        {tab === 'members'    && <MembersTab    dept={dept} execRole={execRole} />}
        {tab === 'attendance' && <AttendanceTab dept={dept} execRole={execRole} />}
        {tab === 'messages'   && <MessagesTab   dept={dept} execRole={execRole} />}
        {tab === 'executives' && isAdmin && <ExecutivesTab dept={dept} />}
      </div>
    </div>
  )
}

// ── Admin card grid ───────────────────────────────────────────────────────────

function DeptCard({ dept, onClick }: { dept: Department; onClick: () => void }) {
  const hod    = dept.executives?.find(e => e.role === 'HOD')
  const asst   = dept.executives?.find(e => e.role === 'ASST_HOD')

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: '20px', cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        borderTop: '3px solid var(--color-primary)',
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
          background: 'var(--color-primary-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-primary)', flexShrink: 0,
        }}>
          <Building2 size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {dept.name}
          </h3>
          {dept.category && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{dept.category}</span>
          )}
        </div>
        <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>{dept.member_count}</strong> members
        </span>
      </div>

      {(hod || asst) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hod && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '1px 5px', borderRadius: 99 }}>HOD</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{hod.name}</span>
            </div>
          )}
          {asst && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '1px 5px', borderRadius: 99 }}>ASST</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{asst.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Create Dept Modal ─────────────────────────────────────────────────────────

function CreateDeptModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  const mut = useMutation({
    mutationFn: () => departmentsApi.create({ name, category, description }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['depts'] }); onClose() },
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
        padding: 24, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Create Department</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={name} onChange={e => setName(e.target.value)} placeholder="Department name *" autoFocus
            style={{
              padding: '8px 12px', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
            }}
          />
          <input
            value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g. MINISTRY, MEDIA)"
            style={{
              padding: '8px 12px', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
            }}
          />
          <textarea
            value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Description (optional)"
            style={{
              padding: '8px 12px', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', fontSize: 14, resize: 'vertical',
              background: 'var(--color-bg)', color: 'var(--color-text-primary)',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={() => mut.mutate()} disabled={!name.trim() || mut.isPending}
            style={{
              padding: '8px 18px', background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              opacity: !name.trim() ? 0.5 : 1,
            }}
          >
            {mut.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
        {mut.isError && (
          <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8 }}>
            Failed to create. Name may already be taken.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Root page ─────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const { user } = useAuthStore()
  const isDeptScoped = ['HOD', 'ASST_HOD', 'WELFARE', 'PRO'].includes(user?.role ?? '')
  const isAdmin      = user?.role === 'ADMIN'

  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [createOpen,  setCreateOpen]  = useState(false)

  const { data: depts, isLoading } = useQuery({
    queryKey: ['depts'],
    queryFn:  () => departmentsApi.list().then(r => r.data.results),
  })

  const selected = selectedId ? depts?.find(d => d.id === selectedId) : null

  // ── Executive scoped view ──────────────────────────────────────────────────
  if (isDeptScoped) {
    if (isLoading) return (
      <div style={{ padding: 28 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 20, marginBottom: 10 }} />
        ))}
      </div>
    )

    // Backend returns only departments where this user is an executive
    if (!depts || depts.length === 0) return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <Building2 size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
        <p style={{ margin: 0 }}>
          You are not assigned as an executive of any department. Contact Admin.
        </p>
      </div>
    )

    const activeDeptId = selectedId && depts.find(d => d.id === selectedId)
      ? selectedId
      : depts[0].id
    const activeDept = depts.find(d => d.id === activeDeptId)!

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <DeptDetail
          dept={activeDept}
          onBack={() => {}}
          canGoBack={false}
          userRole={user?.role ?? null}
          myDepts={depts}
          onSwitchDept={setSelectedId}
        />
      </div>
    )
  }

  // ── Admin: detail view ────────────────────────────────────────────────────
  if (selected) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DeptDetail
        dept={selected}
        onBack={() => setSelectedId(null)}
        canGoBack
        userRole={user?.role ?? null}
        myDepts={[]}
        onSwitchDept={() => {}}
      />
    </div>
  )

  // ── Admin: card grid ───────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, padding: '0 4px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)',
            fontWeight: 700, color: 'var(--color-text-primary)', margin: 0,
          }}>Departments</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: 'var(--text-sm)' }}>
            {depts?.length ?? 0} departments · Click a card to open the full portal
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreateOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            <Plus size={14} /> New Department
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (depts?.length ?? 0) === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--color-text-muted)' }}>
          <Building2 size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
          <p>No departments yet. Create the first one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
          {depts!.map(d => (
            <DeptCard key={d.id} dept={d} onClick={() => setSelectedId(d.id)} />
          ))}
        </div>
      )}

      {createOpen && <CreateDeptModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
