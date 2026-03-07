import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Circle } from 'lucide-react'
import toast from 'react-hot-toast'
import { notificationsApi, type Notification } from '@/api/notifications'
import { format } from 'date-fns'

/* ─── Notification type → color ──────────────────────── */
const TYPE_COLOR: Record<string, string> = {
  NEW_PERSON:      'var(--color-primary)',
  PERSON_APPROVED: 'var(--color-success)',
  FOLLOWUP_DUE:    'var(--accent-followup)',
  TASK_ASSIGNED:   'var(--accent-followup)',
  WORKER_PROMOTED: 'var(--accent-hr)',
  MEDICAL_VISIT:   'var(--accent-medical)',
  MERGE_DONE:      'var(--color-info)',
}

function NotifCard({ notif, onMarkRead }: { notif: Notification; onMarkRead: (id: string) => void }) {
  const color = TYPE_COLOR[notif.notification_type] ?? 'var(--color-primary)'

  return (
    <div
      style={{
        padding: 'var(--space-5)',
        display: 'flex',
        gap: 'var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
        background: notif.is_read ? 'transparent' : 'var(--color-primary-subtle)',
        transition: 'background 150ms',
      }}
    >
      {/* Indicator */}
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 'var(--radius-full)',
            background: notif.is_read ? 'var(--color-border)' : color,
            marginTop: 4,
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <p style={{ margin: '0 0 4px', fontSize: 'var(--text-sm)', fontWeight: notif.is_read ? 400 : 600, color: 'var(--color-text-primary)' }}>
            {notif.title}
          </p>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {format(new Date(notif.created_at), 'MMM d, h:mma')}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {notif.message}
        </p>
        {!notif.is_read && (
          <button
            onClick={() => onMarkRead(notif.id)}
            style={{
              marginTop: 8, background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-primary)', fontSize: 'var(--text-xs)', fontWeight: 500, padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Circle size={10} /> Mark as read
          </button>
        )}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn:  () => notificationsApi.list(),
    select:   (res) => res.data,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
  })

  const unread = data?.results.filter((n) => !n.is_read).length ?? 0

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            Notifications
            {unread > 0 && (
              <span style={{ background: 'var(--color-danger)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, padding: '1px 8px', fontFamily: 'var(--font-body)' }}>
                {unread}
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 'var(--text-sm)' }}>
            {data?.results.length ?? 0} notifications
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            style={{
              height: 36, padding: '0 16px',
              background: 'none', border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '90%' }} />
            </div>
          ))
        ) : data?.results.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Bell size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 'var(--text-base)' }}>No notifications yet</p>
          </div>
        ) : (
          data?.results.map((n) => (
            <NotifCard
              key={n.id}
              notif={n}
              onMarkRead={(id) => markReadMutation.mutate(id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
