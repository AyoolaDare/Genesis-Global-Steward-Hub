import { useQuery } from '@tanstack/react-query'
import {
  Users, Clock, CheckCircle, Briefcase,
  UsersRound, Building2, ClipboardList, Stethoscope,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { dashboardApi } from '@/api/dashboard'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/useIsMobile'

/* ─── Stat Card ──────────────────────────────────────── */
interface StatCardProps {
  label:  string
  value:  number | string
  icon:   React.ReactNode
  accent: string
  to?:    string
}

function StatCard({ label, value, icon, accent, to }: StatCardProps) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => to && navigate(to)}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        cursor: to ? 'pointer' : 'default',
        transition: 'box-shadow 150ms',
      }}
      onMouseEnter={(e) => { if (to) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
      onMouseLeave={(e) => { if (to) (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-md)',
          background: `${accent}18`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 'var(--text-2xl)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────────── */
function Skeleton({ height = 24, width = '100%' }: { height?: number; width?: string | number }) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius: 'var(--radius-md)' }}
    />
  )
}

/* ─── Status Badge ───────────────────────────────────── */
function StatusBadge({ source }: { source: string }) {
  const colors: Record<string, [string, string]> = {
    WALK_IN:    ['var(--color-info-bg)',    'var(--color-info)'],
    CELL:       ['#FFF7ED',                '#EA580C'],
    MEDICAL:    ['var(--color-success-bg)', 'var(--color-success)'],
    FOLLOWUP:   ['#F5F3FF',               '#7C3AED'],
    DEPARTMENT: ['#EFF6FF',               '#1B4FDB'],
  }
  const [bg, fg] = colors[source] ?? ['var(--color-surface-alt)', 'var(--color-text-muted)']
  return (
    <span
      style={{
        background: bg,
        color: fg,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
      }}
    >
      {source?.replace('_', ' ') ?? '—'}
    </span>
  )
}

/* ─── PIE colors ─────────────────────────────────────── */
const PIE_COLORS = [
  'var(--accent-admin)',
  'var(--accent-medical)',
  'var(--accent-followup)',
  'var(--accent-cell)',
  'var(--accent-department)',
]

/* ─── Main Component ─────────────────────────────────── */
export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn:  () => dashboardApi.getStats(),
    select:   (res) => res.data,
  })

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn:  () => dashboardApi.getRecentActivity(),
    select:   (res) => res.data.results,
  })

  const { data: pendingList, isLoading: pendingLoading } = useQuery({
    queryKey: ['dashboard', 'pending'],
    queryFn:  () => dashboardApi.getPendingApprovals(),
    select:   (res) => res.data.results,
  })

  const { data: growthData } = useQuery({
    queryKey: ['dashboard', 'growth'],
    queryFn:  () => dashboardApi.getMemberGrowth(),
    select:   (res) => res.data,
  })

  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const moduleCards = [
    { label: 'Members',      to: '/people',      accent: 'var(--accent-admin)',      icon: <Users size={24} /> },
    { label: 'Medical',      to: '/medical',     accent: 'var(--accent-medical)',     icon: <Stethoscope size={24} /> },
    { label: 'Follow-Up',    to: '/followup',    accent: 'var(--accent-followup)',    icon: <ClipboardList size={24} /> },
    { label: 'Cell Groups',  to: '/cells',       accent: 'var(--accent-cell)',        icon: <UsersRound size={24} /> },
    { label: 'Departments',  to: '/departments', accent: 'var(--accent-department)',  icon: <Building2 size={24} /> },
    { label: 'HR',           to: '/hr',          accent: 'var(--accent-hr)',          icon: <Briefcase size={24} /> },
  ]

  const pieData = stats
    ? [
        { name: 'Members',     value: stats.total_persons },
        { name: 'Follow-Ups',  value: stats.open_followups },
        { name: 'Cells',       value: stats.active_cells },
        { name: 'Departments', value: stats.departments },
        { name: 'Workers',     value: stats.active_workers },
      ]
    : []

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Page header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 'var(--text-sm)' }}>
          Overview of your church management system
        </p>
      </div>

      {/* KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
              <Skeleton height={20} width="60%" />
              <div style={{ marginTop: 12 }}><Skeleton height={32} width="40%" /></div>
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Members"      value={stats?.total_persons ?? 0}    icon={<Users size={22} />}         accent="var(--accent-admin)"      to="/people" />
            <StatCard label="Pending Approval"   value={stats?.pending_approval ?? 0} icon={<Clock size={22} />}         accent="var(--color-warning)"     to="/people" />
            <StatCard label="Active Workers"     value={stats?.active_workers ?? 0}   icon={<CheckCircle size={22} />}   accent="var(--accent-hr)" />
            <StatCard label="Open Follow-Ups"    value={stats?.open_followups ?? 0}   icon={<ClipboardList size={22} />} accent="var(--accent-followup)"   to="/followup" />
            <StatCard label="Cell Groups"        value={stats?.active_cells ?? 0}     icon={<UsersRound size={22} />}    accent="var(--accent-cell)"       to="/cells" />
            <StatCard label="Departments"        value={stats?.departments ?? 0}       icon={<Building2 size={22} />}    accent="var(--accent-department)" to="/departments" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* Line chart — member growth */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: '0 0 var(--space-4)',
            }}
          >
            Member Growth
          </h3>
          {growthData && growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growthData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--color-primary)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--text-sm)',
              }}
            >
              No growth data available
            </div>
          )}
        </div>

        {/* Donut chart — distribution */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: '0 0 var(--space-4)',
            }}
          >
            Distribution
          </h3>
          {pieData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Module Quick-Access tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {moduleCards.map((m) => (
          <button
            key={m.to}
            onClick={() => navigate(m.to)}
            style={{
              background: 'var(--color-surface)',
              border: `1.5px solid var(--color-border)`,
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              textAlign: 'left',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = m.accent
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${m.accent}20`
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: `${m.accent}18`,
                color: m.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {m.icon}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-primary)',
              }}
            >
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom row: Pending Approvals + Recent Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 'var(--space-6)',
        }}
      >
        {/* Pending Approvals */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 'var(--space-5) var(--space-6)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Pending Approvals
            </h3>
            <button
              onClick={() => navigate('/people')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
              }}
            >
              View all
            </button>
          </div>

          {pendingLoading ? (
            <div style={{ padding: 'var(--space-4)' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ marginBottom: 'var(--space-3)' }}>
                  <Skeleton height={16} />
                </div>
              ))}
            </div>
          ) : pendingList && pendingList.length > 0 ? (
            <div>
              {pendingList.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 'var(--space-4) var(--space-6)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {p.first_name} {p.last_name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {p.phone}
                    </div>
                  </div>
                  <StatusBadge source={p.source} />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--text-sm)',
              }}
            >
              No pending approvals
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 'var(--space-5) var(--space-6)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Recent Activity
            </h3>
          </div>

          {activityLoading ? (
            <div style={{ padding: 'var(--space-4)' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ marginBottom: 'var(--space-3)' }}>
                  <Skeleton height={14} />
                </div>
              ))}
            </div>
          ) : activity && activity.length > 0 ? (
            <div>
              {activity.slice(0, 8).map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: 'var(--space-3) var(--space-6)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-body)' }}>
                      {a.activity_summary ? (
                        a.activity_summary
                      ) : (
                        <>
                          <span style={{ fontWeight: 600 }}>{a.user_name ?? a.user_email ?? a.performed_by ?? 'Unknown user'}</span>{' '}
                          {a.action}
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {a.target_label ? `Target: ${a.target_label}` : (a.target ? `Target: ${a.target}` : (a.entity_type ? `Entity: ${a.entity_type}` : 'System action'))}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {format(new Date(a.created_at), 'MMM d, h:mma')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--text-sm)',
              }}
            >
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
