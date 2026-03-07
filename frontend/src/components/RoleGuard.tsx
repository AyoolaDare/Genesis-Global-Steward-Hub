import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface Props {
  roles:    string[]
  children: React.ReactNode
}

export default function RoleGuard({ roles, children }: Props) {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-danger)' }}>Access Denied</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          You don't have permission to view this page.
        </p>
      </div>
    )
  }
  return <>{children}</>
}
