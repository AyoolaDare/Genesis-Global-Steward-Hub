import { Bell, Moon, Sun, Search, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

interface Props {
  unreadCount: number
  isMobile?: boolean
  onMenuToggle?: () => void
}

export default function Topbar({ unreadCount, isMobile = false, onMenuToggle }: Props) {
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
  }

  return (
    <header
      style={{
        height: 60,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 var(--space-3)' : '0 var(--space-6)',
        gap: 'var(--space-3)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {isMobile && (
        <button
          onClick={onMenuToggle}
          title="Open navigation"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)',
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          <Menu size={16} />
        </button>
      )}

      <button
        onClick={openSearch}
        style={{
          flex: isMobile ? 1 : 1,
          maxWidth: isMobile ? 'none' : 400,
          minWidth: 0,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg)',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-body)',
          textAlign: 'left',
        }}
      >
        <Search size={15} />
        {!isMobile && <span>Search people, groups...</span>}
        {!isMobile && (
          <kbd
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: '1px 5px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Ctrl+K
          </kbd>
        )}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <button
          onClick={() => setDark((d) => !d)}
          title="Toggle dark mode"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)',
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
          }}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={() => navigate('/notifications')}
          title="Notifications"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)',
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            position: 'relative',
          }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-danger)',
                border: '1.5px solid var(--color-surface)',
              }}
            />
          )}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 8px',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          {!isMobile && (
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {user?.username}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
