import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, ClipboardList,
  UsersRound, Building2, Briefcase, Bell, MessageSquare,
  CalendarDays, LayoutGrid,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  badge?: boolean
  tabKey?: string     /* if set, active when ?tab=<tabKey> */
}

const ADMIN_ITEMS: NavItem[] = [
  { to: '/dashboard',     label: 'Home',      icon: <LayoutDashboard size={22} /> },
  { to: '/people',        label: 'Members',   icon: <Users size={22} /> },
  { to: '/followup',      label: 'Follow-up', icon: <ClipboardList size={22} /> },
  { to: '/notifications', label: 'Alerts',    icon: <Bell size={22} />, badge: true },
]

const MEDICAL_ITEMS: NavItem[] = [
  { to: '/dashboard',     label: 'Home',    icon: <LayoutDashboard size={22} /> },
  { to: '/medical',       label: 'Medical', icon: <Stethoscope size={22} /> },
  { to: '/people',        label: 'Members', icon: <Users size={22} /> },
  { to: '/notifications', label: 'Alerts',  icon: <Bell size={22} />, badge: true },
]

const FOLLOWUP_ITEMS: NavItem[] = [
  { to: '/dashboard',     label: 'Home',     icon: <LayoutDashboard size={22} /> },
  { to: '/followup',      label: 'Follow-up',icon: <ClipboardList size={22} /> },
  { to: '/messaging',     label: 'Messages', icon: <MessageSquare size={22} /> },
  { to: '/notifications', label: 'Alerts',   icon: <Bell size={22} />, badge: true },
]

const HR_ITEMS: NavItem[] = [
  { to: '/dashboard',     label: 'Home',    icon: <LayoutDashboard size={22} /> },
  { to: '/hr',            label: 'HR',      icon: <Briefcase size={22} /> },
  { to: '/people',        label: 'Members', icon: <Users size={22} /> },
  { to: '/notifications', label: 'Alerts',  icon: <Bell size={22} />, badge: true },
]

const DEPT_EXEC_ITEMS: NavItem[] = [
  { to: '/departments',                  label: 'Overview',    icon: <Building2 size={22} /> },
  { to: '/departments?tab=members',      label: 'Members',     icon: <Users size={22} />,        tabKey: 'members' },
  { to: '/departments?tab=attendance',   label: 'Attendance',  icon: <CalendarDays size={22} />, tabKey: 'attendance' },
  { to: '/notifications',                label: 'Alerts',      icon: <Bell size={22} />, badge: true },
]

const CELL_EXEC_ITEMS: NavItem[] = [
  { to: '/cells',                label: 'My Cell', icon: <UsersRound size={22} /> },
  { to: '/cells?tab=members',    label: 'Members', icon: <Users size={22} />, tabKey: 'members' },
  { to: '/notifications',        label: 'Alerts',  icon: <Bell size={22} />, badge: true },
]

const DEPT_EXEC_ROLES = ['HOD', 'ASST_HOD', 'WELFARE', 'PRO']
const CELL_EXEC_ROLES = ['CELL_LEADER', 'CELL_ASST']

interface Props {
  unreadCount: number
  onMorePress: () => void
}

export default function BottomNav({ unreadCount, onMorePress }: Props) {
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()

  const role = user?.role ?? ''

  let items: NavItem[]
  let showMore = false

  if (DEPT_EXEC_ROLES.includes(role)) {
    items = DEPT_EXEC_ITEMS
  } else if (CELL_EXEC_ROLES.includes(role)) {
    items = CELL_EXEC_ITEMS
  } else if (role === 'MEDICAL') {
    items = MEDICAL_ITEMS
  } else if (role === 'FOLLOWUP') {
    items = FOLLOWUP_ITEMS
  } else if (role === 'HR') {
    items = HR_ITEMS
  } else {
    /* ADMIN: 4 primary tabs + More */
    items = ADMIN_ITEMS
    showMore = true
  }

  const isActive = (item: NavItem) => {
    const basePath = item.to.split('?')[0]
    if (item.tabKey) {
      const currentTab = new URLSearchParams(location.search).get('tab')
      return location.pathname === basePath && currentTab === item.tabKey
    }
    /* Non-tab: active when pathname matches and no relevant tab is active */
    if (location.pathname !== basePath && !location.pathname.startsWith(basePath + '/')) return false
    /* Don't mark a non-tab route active when a tab is selected on the same path */
    if (!item.tabKey && new URLSearchParams(location.search).get('tab')) return false
    return true
  }

  const totalSlots = items.length + (showMore ? 1 : 0)

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#2d3133',
        borderTop: '1px solid rgba(239, 241, 243, 0.10)',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(60px + env(safe-area-inset-bottom))',
      }}
    >
      {items.map((item) => {
        const active = isActive(item)
        return (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: `1 1 ${100 / totalSlots}%`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              borderTop: active ? '2px solid #f4d809' : '2px solid transparent',
              cursor: 'pointer',
              padding: '8px 4px 6px',
              color: active ? 'var(--brand-yellow)' : 'var(--gg-nav-text-muted)',
              transition: 'color var(--duration-fast) var(--ease-out)',
              position: 'relative',
            }}
          >
            {/* Notification badge */}
            {item.badge && unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: `calc(50% - 20px)`,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--gg-danger)',
                border: '1.5px solid #2d3133',
              }} />
            )}
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--font-body)',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.04em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          </button>
        )
      })}

      {showMore && (
        <button
          onClick={onMorePress}
          style={{
            flex: `1 1 ${100 / totalSlots}%`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            background: 'none',
            border: 'none',
            borderTop: '2px solid transparent',
            cursor: 'pointer',
            padding: '8px 4px 6px',
            color: 'var(--gg-nav-text-muted)',
            transition: 'color var(--duration-fast) var(--ease-out)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutGrid size={22} />
          </span>
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}>
            More
          </span>
        </button>
      )}
    </nav>
  )
}
