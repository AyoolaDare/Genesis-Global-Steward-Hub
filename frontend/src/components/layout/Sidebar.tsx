import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, ClipboardList,
  UsersRound, Building2, Briefcase, Bell, MessageSquare,
  LogOut, Shield, CalendarDays,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import toast from 'react-hot-toast'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  roles?: string[]
  accent: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, accent: 'var(--accent-admin)' },
  { to: '/admin/users', label: 'Admin Users', icon: <Shield size={18} />, roles: ['ADMIN'], accent: 'var(--accent-admin)' },
  { to: '/people', label: 'Members', icon: <Users size={18} />, accent: 'var(--accent-admin)' },
  { to: '/medical', label: 'Medical', icon: <Stethoscope size={18} />, roles: ['ADMIN', 'MEDICAL'], accent: 'var(--accent-medical)' },
  { to: '/followup', label: 'Follow-Up', icon: <ClipboardList size={18} />, roles: ['ADMIN', 'FOLLOWUP'], accent: 'var(--accent-followup)' },
  { to: '/cells', label: 'Cell Groups', icon: <UsersRound size={18} />, roles: ['ADMIN'], accent: 'var(--accent-cell)' },
  { to: '/departments', label: 'Departments', icon: <Building2 size={18} />, roles: ['ADMIN'], accent: 'var(--accent-department)' },
  { to: '/hr', label: 'HR', icon: <Briefcase size={18} />, roles: ['ADMIN', 'HR'], accent: 'var(--accent-hr)' },
  { to: '/messaging', label: 'Messaging', icon: <MessageSquare size={18} />, roles: ['ADMIN', 'FOLLOWUP'], accent: 'var(--accent-followup)' },
  { to: '/notifications', label: 'Notifications', icon: <Bell size={18} />, accent: 'var(--accent-admin)' },
]

const DEPT_EXEC_ROLES = ['HOD', 'ASST_HOD', 'WELFARE', 'PRO']
const CELL_EXEC_ROLES = ['CELL_LEADER', 'CELL_ASST']

interface DeptNavItem {
  pathname: string
  tab?: string
  label: string
  icon: React.ReactNode
  accent: string
}

const DEPT_EXEC_NAV: DeptNavItem[] = [
  { pathname: '/departments', label: 'Dashboard',   icon: <LayoutDashboard size={18} />, accent: 'var(--accent-department)' },
  { pathname: '/departments', tab: 'members',    label: 'Members',    icon: <Users size={18} />,        accent: 'var(--accent-department)' },
  { pathname: '/departments', tab: 'attendance', label: 'Attendance', icon: <CalendarDays size={18} />, accent: 'var(--accent-department)' },
  { pathname: '/departments', tab: 'messages',   label: 'Messages',   icon: <MessageSquare size={18} />,accent: 'var(--accent-department)' },
  { pathname: '/notifications',                  label: 'Notifications', icon: <Bell size={18} />,      accent: 'var(--accent-admin)' },
]

const CELL_EXEC_NAV: DeptNavItem[] = [
  { pathname: '/cells', label: 'Dashboard', icon: <LayoutDashboard size={18} />, accent: 'var(--accent-cell)' },
  { pathname: '/cells', tab: 'members', label: 'Members', icon: <Users size={18} />, accent: 'var(--accent-cell)' },
  { pathname: '/notifications', label: 'Notifications', icon: <Bell size={18} />, accent: 'var(--accent-admin)' },
]

interface Props {
  unreadCount: number
  isMobile?: boolean
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ unreadCount, isMobile = false, open = false, onClose }: Props) {
  const user = useAuthStore((s) => s.user)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try { await authApi.logout(refreshToken) } catch { /* ignore logout errors */ }
    clearAuth()
    navigate('/login', { replace: true })
    toast.success('Logged out')
  }

  const isDeptExec  = user ? DEPT_EXEC_ROLES.includes(user.role) : false
  const isCellExec  = user ? CELL_EXEC_ROLES.includes(user.role) : false

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true
    return user && item.roles.includes(user.role)
  })

  const width = 248

  if (isMobile && !open) return null

  const tabNavIsActive = (item: DeptNavItem) => {
    const currentTab = new URLSearchParams(location.search).get('tab') ?? 'dashboard'
    const itemTab = item.tab ?? 'dashboard'
    return location.pathname === item.pathname && currentTab === itemTab
  }

  const sidebar = (
    <aside
      style={{
        width,
        height: '100vh',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        zIndex: isMobile ? 60 : 30,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--color-border)',
          gap: 10,
          overflow: 'hidden',
        }}
      >
        <img src="/app-logo.png" alt="Steward Hub" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
          Steward Hub
        </span>
      </div>

      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {(isDeptExec || isCellExec) ? (
          (isDeptExec ? DEPT_EXEC_NAV : CELL_EXEC_NAV).map((item) => {
            const to = item.tab ? `${item.pathname}?tab=${item.tab}` : item.pathname
            const isActive = tabNavIsActive(item)
            return (
              <button
                key={to}
                onClick={() => { navigate(to); if (isMobile) onClose?.() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', margin: '2px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none', cursor: 'pointer', width: 'calc(100% - 16px)',
                  color: isActive ? item.accent : 'var(--color-text-muted)',
                  background: isActive ? `${item.accent}15` : 'transparent',
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textAlign: 'left',
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.pathname === '/notifications' && unreadCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--color-danger)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )
          })
        ) : (
          visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (isMobile) onClose?.() }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                margin: '2px 8px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? item.accent : 'var(--color-text-muted)',
                background: isActive ? `${item.accent}15` : 'transparent',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                fontWeight: isActive ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--color-danger)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))
        )}
      </nav>

      <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
            fontFamily: 'var(--font-display)',
          }}
        >
          {user?.username?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {user?.role?.replace('_', ' ')}
          </div>
        </div>
        <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4, borderRadius: 'var(--radius-sm)' }}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )

  if (!isMobile) return sidebar

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 55 }} />
      {sidebar}
    </>
  )
}
