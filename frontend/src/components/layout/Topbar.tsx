import { Bell, Search, Menu, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const THEME_STORAGE_KEY = 'cms-theme'

interface Props {
  unreadCount: number
  isMobile?: boolean
  onMenuToggle?: () => void
}

export default function Topbar({ unreadCount, isMobile = false, onMenuToggle }: Props) {
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [light, setLight] = useState(() => {
    if (typeof window === 'undefined') return false
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme ? storedTheme === 'light' : true
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
      height: 60,
      background: light ? 'rgba(255,252,245,0.92)' : 'rgba(8,8,8,0.88)',
      borderBottom: '1px solid var(--gg-border-subtle)',
      backdropFilter: 'blur(12px) saturate(1.1)',
      WebkitBackdropFilter: 'blur(12px) saturate(1.1)',
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '0 12px' : '0 24px',
      gap: 10,
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>

      {/* Hamburger — mobile only */}
      {isMobile && (
        <button
          onClick={onMenuToggle}
          title="Open navigation"
          style={iconBtnStyle}
        >
          <Menu size={16} />
        </button>
      )}

      {/* Search bar */}
      <button
        onClick={openSearch}
        style={{
          flex: 1,
          maxWidth: isMobile ? 'none' : 380,
          minWidth: 0,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          border: '1px solid var(--gg-border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: light ? 'rgba(240,235,225,0.8)' : 'rgba(6,6,6,0.8)',
          cursor: 'pointer',
          color: 'var(--gg-text-secondary)',
          fontSize: 'var(--text-sm)',
          fontFamily: "'DM Sans', sans-serif",
          textAlign: 'left',
          transition: 'border-color 150ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gg-border-default)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gg-border-subtle)' }}
      >
        <Search size={14} style={{ flexShrink: 0 }} />
        {!isMobile && <span>Search people, groups…</span>}
        {!isMobile && (
          <kbd style={{
            marginLeft: 'auto',
            fontSize: 10,
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid var(--gg-border-subtle)',
            borderRadius: 4,
            padding: '1px 6px',
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--gg-text-secondary)',
            letterSpacing: '0.05em',
          }}>
            Ctrl K
          </kbd>
        )}
      </button>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>

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
              position: 'absolute', top: 5, right: 5,
              width: 7, height: 7,
              borderRadius: 'var(--radius-full)',
              background: 'var(--gg-danger)',
              border: '1.5px solid var(--gg-bg)',
              animation: 'gg-dot-live 1.8s ease-in-out infinite',
            }} />
          )}
        </button>

        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 10px 4px 4px',
          border: '1px solid var(--gg-border-subtle)',
          borderRadius: 'var(--radius-full)',
          cursor: 'default',
        }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.08) 100%)',
            border: '1px solid rgba(212,175,55,0.30)',
            color: 'var(--gg-gold-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cinzel', serif",
            fontWeight: 600, fontSize: 11, letterSpacing: '0.04em',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          {!isMobile && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--gg-text-primary)',
              whiteSpace: 'nowrap',
            }}>
              {user?.username}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

const iconBtnStyle = {
  width: 36, height: 36,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--gg-border-subtle)',
  background: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--gg-text-secondary)',
  transition: 'border-color 150ms, color 150ms',
  flexShrink: 0,
}
