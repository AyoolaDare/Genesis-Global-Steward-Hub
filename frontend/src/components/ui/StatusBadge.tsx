import type { PersonStatus } from '@/api/persons'

const CONFIG: Record<PersonStatus, { label: string; bg: string; fg: string; border: string }> = {
  NEW_MEMBER:       { label: 'New Member', bg: 'rgba(240,165,0,0.12)',   fg: 'var(--gg-warning)',        border: 'rgba(240,165,0,0.25)' },
  PENDING_APPROVAL: { label: 'Pending',    bg: 'rgba(232,99,26,0.10)',   fg: 'var(--gg-ember-100)',      border: 'rgba(232,99,26,0.25)' },
  MEMBER:           { label: 'Member',     bg: 'rgba(46,204,113,0.12)',  fg: 'var(--gg-success)',        border: 'rgba(46,204,113,0.25)' },
  WORKER:           { label: 'Worker',     bg: 'rgba(212,175,55,0.10)',  fg: 'var(--gg-gold-200)',       border: 'rgba(212,175,55,0.22)' },
  INACTIVE:         { label: 'Inactive',   bg: 'rgba(255,255,255,0.04)', fg: 'var(--gg-text-secondary)', border: 'rgba(212,175,55,0.12)' },
}

interface Props { status: PersonStatus }

export default function StatusBadge({ status }: Props) {
  const cfg = CONFIG[status] ?? {
    label: status,
    bg: 'rgba(255,255,255,0.04)',
    fg: 'var(--gg-text-secondary)',
    border: 'rgba(212,175,55,0.12)',
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 'var(--radius-full)',
      border: `1px solid ${cfg.border}`,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      background: cfg.bg,
      color: cfg.fg,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}
