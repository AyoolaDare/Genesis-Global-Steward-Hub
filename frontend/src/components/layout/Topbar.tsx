import { Bell, Search, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

/* ── DESIGN.md inverse-surface chrome ── */
const CHROME_BG     = '#2d3133'  /* DESIGN.md inverse-surface */
const GOLD          = '#f4d809'  /* DESIGN.md primary-container */
const GOLD_DIM      = 'rgba(244, 216, 9, 0.60)'
const GOLD_BORDER   = 'rgba(244, 216, 9, 0.18)'
const GOLD_FILL     = 'rgba(244, 216, 9, 0.07)'
const CHROME_TEXT   = 'rgba(239, 241, 243, 0.85)'  /* DESIGN.md inverse-on-surface */
const CHROME_BORDER = 'rgba(239, 241, 243, 0.10)'

const THEME_STORAGE_KEY = 'cms-theme'

interface Props {
  unreadCount: number
  isMobile?: boolean
  onMenuToggle?: () => void
}

export default function Topbar({ unreadCount, isMobile = false }: Props) {
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [light, setLight] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored ? stored === 'light' : true
  })

  useEffect(() => {
    const theme = light ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [light])

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'GG'

  return (
    <header style={{
      height: isMobile ? 56 : 60,
      background: CHROME_BG,
      borderBottom: `1px solid ${CHROME_BORDER}`,
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '0 14px' : '0 24px',
      gap: 10,
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0,
    }}>

      {/* Brand wordmark — mobile only */}
      {isMobile && (
        <span style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.01em',
          color: GOLD,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          Steward Hub
        </span>
      )}

      {/* Search bar */}
      {isMobile ? (
        <button onClick={openSearch} title="Search" style={iconBtnStyle}>
          <Search size={16} />
        </button>
      ) : (
        <button
          onClick={openSearch}
          style={{
            flex: 1,
            maxWidth: 380,
            minWidth: 0,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: 'var(--radius-md)',
            background: GOLD_FILL,
            cursor: 'pointer',
            color: GOLD_DIM,
            fontSize: 'var(--text-sm)',
            fontFamily: "'Public Sans', sans-serif",
            textAlign: 'left',
            transition: 'border-color 150ms, background 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(244, 216, 9, 0.35)'
            e.currentTarget.style.background  = 'rgba(244, 216, 9, 0.11)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = GOLD_BORDER
            e.currentTarget.style.background  = GOLD_FILL
          }}
        >
          <Search size={14} style={{ flexShrink: 0 }} />
          <span>Search people, groups…</span>
          <kbd style={{
            marginLeft: 'auto',
            fontSize: 10,
            background: 'rgba(244, 216, 9, 0.08)',
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: 3,
            padding: '1px 6px',
            fontFamily: "'JetBrains Mono', monospace",
            color: 'rgba(244, 216, 9, 0.45)',
            letterSpacing: '0.04em',
          }}>
            Ctrl K
          </kbd>
        </button>
      )}

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>

        {/* Theme toggle */}
        <button
          onClick={() => setLight((v) => !v)}
          title={light ? 'Switch to dark mode' : 'Switch to light mode'}
          style={iconBtnStyle}
        >
          {light ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          title="Notifications"
          style={{ ...iconBtnStyle, position: 'relative' }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7,
              borderRadius: 'var(--radius-full)',
              background: 'var(--gg-danger)',
              border: `1.5px solid ${CHROME_BG}`,
              animation: 'gg-dot-live 1.8s ease-in-out infinite',
            }} />
          )}
        </button>

        {/* User chip — desktop only */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 12px 4px 4px',
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: 'var(--radius-full)',
            cursor: 'default',
          }}>
            <div style={{
              width: 28, height: 28,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(244, 216, 9, 0.12)',
              border: `1px solid rgba(244, 216, 9, 0.22)`,
              color: GOLD,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700, fontSize: 11, letterSpacing: '0.02em',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: CHROME_TEXT,
              whiteSpace: 'nowrap',
            }}>
              {user?.username}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-md)',
  border: `1px solid rgba(244, 216, 9, 0.18)`,
  background: 'rgba(244, 216, 9, 0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'rgba(244, 216, 9, 0.65)',
  transition: 'border-color 150ms, color 150ms, background 150ms',
  flexShrink: 0,
}
