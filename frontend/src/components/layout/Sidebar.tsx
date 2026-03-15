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
  icon: any
  roles?: string[]
  accent: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',     label: 'Dashboard',    icon: <LayoutDashboard size={16} />, accent: 'var(--gg-gold-200)' },
  { to: '/admin/users',   label: 'Access Control', icon: <Shield size={16} />,        roles: ['ADMIN'],             accent: 'var(--gg-gold-200)' },
  { to: '/people',        label: 'Members',      icon: <Users size={16} />,           accent: 'var(--gg-gold-200)' },
  { to: '/medical',       label: 'Medical',      icon: <Stethoscope size={16} />,     roles: ['ADMIN', 'MEDICAL'],  accent: 'var(--gg-success)' },
  { to: '/followup',      label: 'Follow-Up',    icon: <ClipboardList size={16} />,   roles: ['ADMIN', 'FOLLOWUP'], accent: 'var(--gg-blue-200)' },
  { to: '/cells',         label: 'Cell Groups',  icon: <UsersRound size={16} />,      roles: ['ADMIN'],             accent: 'var(--gg-ember-200)' },
  { to: '/departments',   label: 'Departments',  icon: <Building2 size={16} />,       roles: ['ADMIN'],             accent: 'var(--gg-blue-100)' },
  { to: '/hr',            label: 'HR',           icon: <Briefcase size={16} />,       roles: ['ADMIN', 'HR'],       accent: 'var(--gg-ember-100)' },
  { to: '/messaging',     label: 'Messaging',    icon: <MessageSquare size={16} />,   roles: ['ADMIN', 'FOLLOWUP'], accent: 'var(--gg-blue-200)' },
  { to: '/notifications', label: 'Notifications',icon: <Bell size={16} />,            accent: 'var(--gg-gold-200)' },
]

const DEPT_EXEC_ROLES = ['HOD', 'ASST_HOD', 'WELFARE', 'PRO']
const CELL_EXEC_ROLES = ['CELL_LEADER', 'CELL_ASST']

interface DeptNavItem { pathname: string; tab?: string; label: string; icon: any; accent: string }

const DEPT_EXEC_NAV: DeptNavItem[] = [
  { pathname: '/departments',                    label: 'Dashboard',    icon: <LayoutDashboard size={16} />, accent: 'var(--gg-blue-100)' },
  { pathname: '/departments', tab: 'members',    label: 'Members',      icon: <Users size={16} />,           accent: 'var(--gg-blue-100)' },
  { pathname: '/departments', tab: 'attendance', label: 'Attendance',   icon: <CalendarDays size={16} />,    accent: 'var(--gg-blue-100)' },
  { pathname: '/departments', tab: 'messages',   label: 'Messages',     icon: <MessageSquare size={16} />,   accent: 'var(--gg-blue-100)' },
  { pathname: '/notifications',                  label: 'Notifications',icon: <Bell size={16} />,            accent: 'var(--gg-gold-200)' },
]

const CELL_EXEC_NAV: DeptNavItem[] = [
  { pathname: '/cells',                    label: 'Dashboard',    icon: <LayoutDashboard size={16} />, accent: 'var(--gg-ember-200)' },
  { pathname: '/cells', tab: 'members',   label: 'Members',      icon: <Users size={16} />,           accent: 'var(--gg-ember-200)' },
  { pathname: '/notifications',            label: 'Notifications',icon: <Bell size={16} />,            accent: 'var(--gg-gold-200)' },
]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator', MEDICAL: 'Medical', FOLLOWUP: 'Follow-Up',
  CELL_LEADER: 'Cell Leader', CELL_ASST: 'Cell Assistant',
  HR: 'Human Resources', HOD: 'Head of Dept', ASST_HOD: 'Asst. HOD',
  WELFARE: 'Welfare', PRO: 'PRO',
}

interface Props {
  unreadCount: number
  isMobile?: boolean
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ unreadCount, isMobile = false, open = false, onClose }: Props) {
  const user         = useAuthStore((s) => s.user)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clearAuth    = useAuthStore((s) => s.clearAuth)
  const navigate     = useNavigate()
  const location     = useLocation()

  const handleLogout = async () => {
    try { await authApi.logout(refreshToken) } catch { /* ignore */ }
    clearAuth()
    navigate('/login', { replace: true })
    toast.success('Logged out')
  }

  const isDeptExec = user ? DEPT_EXEC_ROLES.includes(user.role) : false
  const isCellExec = user ? CELL_EXEC_ROLES.includes(user.role) : false

  const visibleItems = NAV_ITEMS.filter((item) =>
    !item.roles || (user && item.roles.includes(user.role))
  )

  const tabNavIsActive = (item: DeptNavItem) => {
    const currentTab = new URLSearchParams(location.search).get('tab') ?? 'dashboard'
    return location.pathname === item.pathname && (item.tab ?? 'dashboard') === currentTab
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'GG'

  if (isMobile && !open) return null

  /* ── shared nav item active background ── */
  const activeItemBg = 'linear-gradient(90deg, rgba(212,175,55,0.10) 0%, transparent 100%)'

  const sidebar = (
    <aside style={{
      width: 240,
      height: '100vh',
      background: 'var(--gg-surface)',
      borderRight: '1px solid var(--gg-border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: isMobile ? 'fixed' : 'sticky',
      top: 0, left: 0,
      zIndex: isMobile ? 60 : 30,
      flexShrink: 0,
    }}>

      {/* ── Logo zone ── */}
      <div style={{
        height: 72,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid var(--gg-border-subtle)',
        gap: 12,
        flexShrink: 0,
      }}>
        <img
          src="/app-logo.png"
          alt="Steward Hub"
          style={{
            width: 32, height: 32, borderRadius: 8,
            objectFit: 'cover', flexShrink: 0,
            border: '1px solid rgba(212,175,55,0.28)',
          }}
        />
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: '0.07em',
          color: 'var(--gg-gold-200)',
          whiteSpace: 'nowrap',
        }}>
          Steward Hub
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--gg-text-disabled)',
          padding: '0 20px',
          marginBottom: 8, marginTop: 0,
        }}>
          Navigation
        </p>

        {(isDeptExec || isCellExec)
          ? (isDeptExec ? DEPT_EXEC_NAV : CELL_EXEC_NAV).map((item, i) => {
              const to       = item.tab ? `${item.pathname}?tab=${item.tab}` : item.pathname
              const isActive = tabNavIsActive(item)
              return (
                <button
                  key={to}
                  onClick={() => { navigate(to); if (isMobile) onClose?.() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 20px',
                    margin: '1px 8px',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: isActive ? `2px solid ${item.accent}` : '2px solid transparent',
                    border: 'none',
                    borderLeftWidth: 2,
                    borderLeftStyle: 'solid',
                    borderLeftColor: isActive ? item.accent : 'transparent',
                    cursor: 'pointer',
                    width: 'calc(100% - 16px)',
                    color: isActive ? item.accent : 'var(--gg-text-secondary)',
                    background: isActive ? activeItemBg : 'transparent',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive ? 500 : 400,
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    transition: 'color 150ms, background 150ms',
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.55 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.pathname === '/notifications' && unreadCount > 0 && (
                    <span style={BADGE_STYLE}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>
              )
            })
          : visibleItems.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => { if (isMobile) onClose?.() }}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 20px',
                  margin: '1px 8px',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `2px solid ${isActive ? item.accent : 'transparent'}`,
                  textDecoration: 'none',
                  color: isActive ? item.accent : 'var(--gg-text-secondary)',
                  background: isActive ? activeItemBg : 'transparent',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 500 : 400,
                  whiteSpace: 'nowrap',
                  transition: 'color 150ms, background 150ms',
                  animationDelay: `${i * 0.05}s`,
                })}
              >
                {({ isActive }) => (
                  <>
                    <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.55 }}>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.to === '/notifications' && unreadCount > 0 && (
                      <span style={BADGE_STYLE}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))
        }
      </nav>

      {/* ── User zone ── */}
      <div style={{
        borderTop: '1px solid var(--gg-border-subtle)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34,
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.08) 100%)',
          border: '1px solid rgba(212,175,55,0.30)',
          color: 'var(--gg-gold-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cinzel', serif",
          fontWeight: 600, fontSize: 12, flexShrink: 0, letterSpacing: '0.05em',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'var(--text-sm)', fontWeight: 500,
            color: 'var(--gg-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.username}
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10, color: 'var(--gg-text-secondary)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            background: 'none', border: '1px solid transparent',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', color: 'var(--gg-text-secondary)',
            display: 'flex', padding: 6,
            transition: 'color 150ms, border-color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--gg-danger)'
            e.currentTarget.style.borderColor = 'rgba(192,57,43,0.30)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--gg-text-secondary)'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )

  if (!isMobile) return sidebar

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 55,
          animation: 'gg-fade-in 200ms ease-out both',
        }}
      />
      {sidebar}
    </>
  )
}

const BADGE_STYLE = {
  marginLeft: 'auto',
  background: 'var(--gg-danger)',
  color: '#fff',
  borderRadius: 'var(--radius-full)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 10, fontWeight: 700,
  padding: '1px 6px', minWidth: 18, textAlign: 'center' as const,
}
