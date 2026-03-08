import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { personsApi } from '@/api/persons'
import StatusBadge from '@/components/ui/StatusBadge'

export default function MemberBoardPage() {
  const { memberId = '' } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['member-board', memberId],
    queryFn: () => personsApi.board(memberId),
    select: (res) => res.data,
    enabled: !!memberId,
  })

  const attendanceTotal = useMemo(() => {
    if (!data) return 0
    return Object.values(data.attendance_summary).reduce((sum, v) => sum + v, 0)
  }, [data])

  if (isLoading) return <div className="skeleton" style={{ height: 160 }} />
  if (!data) return <div>Member not found.</div>

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/people" style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
          Back to Members
        </Link>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
        <h1 style={{ margin: '0 0 8px' }}>{data.member.first_name} {data.member.last_name}</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={data.member.status} />
          <span>{data.member.phone}</span>
          <span>{data.member.email || 'No email'}</span>
          <span style={{ textTransform: 'capitalize' }}>{(data.member.source || '').replace('_', ' ')}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <Card label="Cell Groups" value={String(data.cell_groups.filter((g) => g.is_active).length)} />
        <Card label="Departments" value={String(data.departments.filter((d) => d.is_active).length)} />
        <Card label="Attendance Records" value={String(attendanceTotal)} />
        <Card label="Medical Record" value={data.medical_record ? 'Available' : 'None'} />
      </div>

      <section style={sectionStyle}>
        <h3 style={h3Style}>Attendance Summary</h3>
        <p style={pStyle}>Present: {data.attendance_summary.PRESENT} | Absent: {data.attendance_summary.ABSENT} | Late: {data.attendance_summary.LATE} | Excused: {data.attendance_summary.EXCUSED}</p>
      </section>

      <section style={sectionStyle}>
        <h3 style={h3Style}>Recent Attendance</h3>
        {data.recent_attendance.length === 0 ? <p style={pStyle}>No attendance records yet.</p> : data.recent_attendance.map((row) => (
          <div key={row.id} style={rowStyle}>
            <span>{row.department_name}</span>
            <span>{row.session_name || 'Session'}</span>
            <span>{row.session_date ? format(new Date(row.session_date), 'PPP') : '-'}</span>
            <span>{row.status}</span>
          </div>
        ))}
      </section>

      <section style={sectionStyle}>
        <h3 style={h3Style}>Cell Group Memberships</h3>
        {data.cell_groups.length === 0 ? <p style={pStyle}>No cell group memberships.</p> : data.cell_groups.map((group) => (
          <div key={group.id} style={rowStyle}>
            <span>{group.group_name}</span>
            <span>{group.role}</span>
            <span>{group.joined_date ? format(new Date(group.joined_date), 'PPP') : '-'}</span>
            <span>{group.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        ))}
      </section>

      <section style={sectionStyle}>
        <h3 style={h3Style}>Department Memberships</h3>
        {data.departments.length === 0 ? <p style={pStyle}>No department memberships.</p> : data.departments.map((dept) => (
          <div key={dept.id} style={rowStyle}>
            <span>{dept.department_name}</span>
            <span>{dept.role}</span>
            <span>{dept.joined_date ? format(new Date(dept.joined_date), 'PPP') : '-'}</span>
            <span>{dept.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        ))}
      </section>

      <section style={sectionStyle}>
        <h3 style={h3Style}>Medical</h3>
        {!data.medical_record ? (
          <p style={pStyle}>No medical record found.</p>
        ) : (
          <div>
            <p style={pStyle}>Blood Group: {data.medical_record.blood_group || '-'}</p>
            <p style={pStyle}>Genotype: {data.medical_record.genotype || '-'}</p>
            <p style={pStyle}>Allergies: {data.medical_record.allergies.join(', ') || '-'}</p>
            <p style={pStyle}>Conditions: {data.medical_record.chronic_conditions.join(', ') || '-'}</p>
            <p style={pStyle}>Current Medications: {data.medical_record.current_medications.join(', ') || '-'}</p>
          </div>
        )}
      </section>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{value}</div>
    </div>
  )
}

const sectionStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }
const rowStyle = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, fontSize: 'var(--text-sm)', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }
const h3Style = { margin: '0 0 10px' }
const pStyle = { margin: '0 0 6px', color: 'var(--color-text-body)', fontSize: 'var(--text-sm)' }
