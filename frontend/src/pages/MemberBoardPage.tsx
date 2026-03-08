import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { personsApi } from '@/api/persons'

export default function MemberBoardPage() {
  const { memberId = '' } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['member-board', memberId],
    queryFn: () => personsApi.board(memberId),
    select: (res) => res.data,
    enabled: !!memberId,
  })

  if (isLoading) return <div className="skeleton" style={{ height: 180 }} />
  if (!data) return <div>Member not found.</div>

  return (
    <div style={{ maxWidth: 1150 }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/people" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
          Back to Members
        </Link>
      </div>

      <section style={sectionStyle}>
        <h1 style={{ margin: '0 0 10px', fontSize: 'var(--text-2xl)' }}>{data.member.first_name} {data.member.last_name}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <KV label="Phone Number" value={data.member.phone} />
          <KV label="Email" value={data.member.email || '-'} />
          <KV label="Date of Birth" value={data.member.date_of_birth ? format(new Date(data.member.date_of_birth), 'PPP') : '-'} />
          <KV label="State" value={data.member.state || '-'} />
          <KV label="Address" value={data.member.address || '-'} />
          <KV label="Landmark" value={data.member.landmark || '-'} />
          <KV label="Occupation" value={data.member.occupation || '-'} />
          <KV label="Marital Status" value={data.member.marital_status || '-'} />
        </div>
      </section>

      <section style={{ ...sectionStyle, border: '2px solid var(--color-primary)' }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 6 }}>Attendance Count</div>
        <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{data.attendance_total}</div>
        <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', fontWeight: 700 }}>
          Present: {data.attendance_summary.PRESENT} | Absent: {data.attendance_summary.ABSENT} | Late: {data.attendance_summary.LATE} | Excused: {data.attendance_summary.EXCUSED}
        </div>
      </section>

      <section style={sectionStyle}>
        <h3 style={h3Style}>Medical Record</h3>
        {!data.medical_record ? (
          <p style={pStyle}>No medical record yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <KV label="Blood Group" value={data.medical_record.blood_group || '-'} />
            <KV label="Genotype" value={data.medical_record.genotype || '-'} />
            <KV label="Current Medications" value={data.medical_record.current_medications.join(', ') || '-'} />
            <KV label="Chronic Conditions" value={data.medical_record.chronic_conditions.join(', ') || '-'} />
            <KV label="Allergies" value={data.medical_record.allergies.join(', ') || '-'} />
            <KV label="Preferred Hospital" value={data.medical_record.preferred_hospital || '-'} />
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <h3 style={h3Style}>Last Check-Up History</h3>
        {data.medical_visits.length === 0 ? (
          <p style={pStyle}>No check-up history recorded.</p>
        ) : (
          data.medical_visits.map((v) => (
            <div key={v.id} style={rowCardStyle}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 4 }}>{format(new Date(v.visit_date), 'PPP')} - {v.visit_type}</div>
              <div style={miniGridStyle}>
                <KV label="BP" value={v.blood_pressure || '-'} />
                <KV label="Sugar Level" value={v.blood_sugar_level || '-'} />
                <KV label="Weight" value={v.weight_kg ? `${v.weight_kg} kg` : '-'} />
                <KV label="Height" value={v.height_cm ? `${v.height_cm} cm` : '-'} />
                <KV label="Temperature" value={v.temperature_c ? `${v.temperature_c} °C` : '-'} />
                <KV label="Pulse" value={v.pulse_rate || '-'} />
              </div>
              <KV label="Complaint" value={v.complaint || '-'} />
              <KV label="Diagnosis" value={v.diagnosis || '-'} />
              <KV label="Medication Prescribed" value={v.prescription || '-'} />
              <KV label="Summary / Advice" value={v.notes || '-'} />
            </div>
          ))
        )}
      </section>

      <section style={sectionStyle}>
        <h3 style={h3Style}>Cell Group</h3>
        {data.cell_groups.length === 0 ? <p style={pStyle}>No cell group membership.</p> : data.cell_groups.map((g) => (
          <div key={g.id} style={listRowStyle}>
            <span style={{ fontWeight: 600 }}>{g.group_name}</span>
            <span>{g.role}</span>
            <span>{g.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        ))}
      </section>

      <section style={sectionStyle}>
        <h3 style={h3Style}>Department</h3>
        {data.departments.length === 0 ? <p style={pStyle}>No department membership.</p> : data.departments.map((d) => (
          <div key={d.id} style={listRowStyle}>
            <span style={{ fontWeight: 600 }}>{d.department_name}</span>
            <span>{d.role}</span>
            <span>{d.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

const sectionStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }
const h3Style = { margin: '0 0 10px', fontSize: 'var(--text-lg)' }
const pStyle = { margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }
const rowCardStyle = { border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 10, background: 'var(--color-bg)' }
const miniGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 8 }
const listRowStyle = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, borderBottom: '1px solid var(--color-border)', padding: '10px 0', fontSize: 'var(--text-sm)' }
