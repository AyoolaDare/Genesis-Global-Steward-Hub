import type { PersonStatus } from '@/api/persons'

const CONFIG: Record<PersonStatus, { label: string; bg: string; fg: string }> = {
  NEW_MEMBER:       { label: 'New Member',  bg: 'var(--color-warning-bg)',    fg: 'var(--color-warning)' },
  PENDING_APPROVAL: { label: 'Pending',     bg: 'var(--color-warning-bg)',    fg: 'var(--color-warning)' },
  MEMBER:           { label: 'Member',      bg: 'var(--color-success-bg)',    fg: 'var(--color-success)' },
  WORKER:           { label: 'Worker',      bg: 'var(--color-primary-subtle)', fg: 'var(--color-primary)' },
  INACTIVE:         { label: 'Inactive',    bg: 'var(--color-surface-alt)',   fg: 'var(--color-text-muted)' },
}

interface Props {
  status: PersonStatus
}

export default function StatusBadge({ status }: Props) {
  const cfg = CONFIG[status] ?? { label: status, bg: 'var(--color-surface-alt)', fg: 'var(--color-text-muted)' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        background: cfg.bg,
        color: cfg.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}
