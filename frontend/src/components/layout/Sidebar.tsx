import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, ClipboardList,
  UsersRound, Building2, Briefcase, Bell, MessageSquare,
  LogOut, Shield, CalendarDays, HandCoins,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import toast from 'react-hot-toast'

interface NavItem {
  to: string
  label: string
  icon: any
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',     label: 'Dashboard',      icon: <LayoutDashboard size={16} /> },
  { to: '/admin/users',   label: 'Access Control', icon: <Shield size={16} />,         roles: ['ADMIN'] },
  { to: '/people',        label: 'Members',        icon: <Users size={16} /> },
  { to: '/medical',       label: 'Medical',        icon: <Stethoscope size={16} />,    roles: ['ADMIN', 'MEDICAL'] },
  { to: '/followup',      label: 'Follow-Up',      icon: <ClipboardList size={16} />,  roles: ['ADMIN', 'FOLLOWUP'] },
  { to: '/cells',         label: 'Cell Groups',    icon: <UsersRound size={16} />,     roles: ['ADMIN'] },
  { to: '/departments',   label: 'Departments',    icon: <Building2 size={16} />,      roles: ['ADMIN'] },
  { to: '/hr',            label: 'HR',             icon: <Briefcase size={16} />,      roles: ['ADMIN', 'HR'] },
  { to: '/sponsors',      label: 'Sponsors',       icon: <HandCoins size={16} />,      roles: ['ADMIN'] },
  { to: '/messaging',     label: 'Messaging',      icon: <MessageSquare size={16} />,  roles: ['ADMIN', 'FOLLOWUP'] },
  { to: '/notifications', label: 'Notifications',  icon: <Bell size={16} /> },
]

const DEPT_EXEC_ROLES = ['HOD', 'ASST_HOD', 'WELFARE', 'PRO']
const CELL_EXEC_ROLES = ['CELL_LEADER', 'CELL_ASST']

interface DeptNavItem { pathname: string; tab?: string; label: string; icon: any }

const DEPT_EXEC_NAV: DeptNavItem[] = [
  { pathname: '/departments',                    label: 'Dashboard',    icon: <LayoutDashboard size={16} /> },
  { pathname: '/departments', tab: 'members',    label: 'Members',      icon: <Users size={16} /> },
  { pathname: '/departments', tab: 'attendance', label: 'Attendance',   icon: <CalendarDays size={16} /> },
  { pathname: '/departments', tab: 'messages',   label: 'Messages',     icon: <MessageSquare size={16} /> },
  { pathname: '/notifications',                  label: 'Notifications',icon: <Bell size={16} /> },
]

const CELL_EXEC_NAV: DeptNavItem[] = [
  { pathname: '/cells',                  label: 'Dashboard',    icon: <LayoutDashboard size={16} /> },
  { pathname: '/cells', tab: 'members', label: 'Members',      icon: <Users size={16} /> },
  { pathname: '/notifications',          label: 'Notifications',icon: <Bell size={16} /> },
]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator', MEDICAL: 'Medical', FOLLOWUP: 'Follow-Up',
  CELL_LEADER: 'Cell Leader', CELL_ASST: 'Cell Assistant',
  HR: 'Human Resources', HOD: 'Head of Dept', ASST_HOD: 'Asst. HOD',
  WELFARE: 'Welfare', PRO: 'PRO',
}

/* ── Shared style constants — DESIGN.md inverse-surface palette ── */
const NAV_BG      = '#2d3133'   /* DESIGN.md inverse-surface */
const ACTIVE_CLR  = '#f4d809'   /* DESIGN.md primary-container (gold CTA) */
const MUTED_CLR   = 'rgba(239, 241, 243, 0.50)'  /* DESIGN.md inverse-on-surface at 50% */
const ACTIVE_BG   = 'rgba(244, 216, 9, 0.12)'
const BORDER_CLR  = 'rgba(239, 241, 243, 0.10)'  /* subtle divider on dark surface */

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

  const sidebar = (
    <aside style={{
      width: 240,
      height: '100vh',
      background: NAV_BG,
      borderRight: `1px solid ${BORDER_CLR}`,
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
        borderBottom: `1px solid ${BORDER_CLR}`,
        gap: 12,
        flexShrink: 0,
      }}>
        <img
          src="/app-logo.png"
          alt="Steward Hub"
          style={{
            width: 34, height: 34,
            borderRadius: 10,
            objectFit: 'cover',
            flexShrink: 0,
            border: `1px solid ${BORDER_CLR}`,
          }}
        />
        <span style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.01em',
          color: ACTIVE_CLR,
          whiteSpace: 'nowrap',
        }}>
          Steward Hub
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <p style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(239, 241, 243, 0.30)',
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
                    borderLeft: `2px solid ${isActive ? ACTIVE_CLR : 'transparent'}`,
                    border: 'none',
                    borderLeftWidth: 2,
                    borderLeftStyle: 'solid',
                    borderLeftColor: isActive ? ACTIVE_CLR : 'transparent',
                    cursor: 'pointer',
                    width: 'calc(100% - 16px)',
                    color: isActive ? ACTIVE_CLR : MUTED_CLR,
                    background: isActive ? ACTIVE_BG : 'transparent',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    transition: 'color 150ms, background 150ms',
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
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
                  borderLeft: `2px solid ${isActive ? ACTIVE_CLR : 'transparent'}`,
                  textDecoration: 'none',
                  color: isActive ? ACTIVE_CLR : MUTED_CLR,
                  background: isActive ? ACTIVE_BG : 'transparent',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                  transition: 'color 150ms, background 150ms',
                  animationDelay: `${i * 0.05}s`,
                })}
              >
                {({ isActive }) => (
                  <>
                    <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
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
        borderTop: `1px solid ${BORDER_CLR}`,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34,
          borderRadius: 'var(--radius-full)',
          background: 'rgba(244, 216, 9, 0.12)',
          border: `1px solid ${BORDER_CLR}`,
          color: ACTIVE_CLR,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 700, fontSize: 12, flexShrink: 0, letterSpacing: '0.02em',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 'var(--text-sm)', fontWeight: 500,
            color: 'var(--gg-nav-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.username}
          </div>
          <div style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 10, color: MUTED_CLR,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            background: 'none',
            border: '1px solid transparent',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: MUTED_CLR,
            display: 'flex',
            padding: 6,
            transition: 'color 150ms, border-color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--gg-danger)'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = MUTED_CLR
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
          background: 'rgba(0,0,0,0.70)',
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
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 10, fontWeight: 700,
  padding: '1px 6px', minWidth: 18, textAlign: 'center' as const,
}
