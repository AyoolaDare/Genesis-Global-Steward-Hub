import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open:     boolean
  onClose:  () => void
  title:    string
  width?:   number
  children: React.ReactNode
}

export default function Drawer({ open, onClose, title, width = 480, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 40,
          animation: 'gg-fade-in 180ms ease-out both',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width,
          maxWidth: '100vw',
          background: 'var(--gg-surface)',
          borderLeft: '1px solid var(--gg-border-default)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.04)',
          animation: 'gg-slide-right 280ms cubic-bezier(0.25, 0.8, 0.25, 1) both',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--gg-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'var(--gg-text-primary)',
            margin: 0,
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--gg-text-secondary)',
              display: 'flex',
              padding: 6,
              transition: 'color 150ms, border-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--gg-text-primary)'
              e.currentTarget.style.borderColor = 'var(--gg-border-subtle)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--gg-text-secondary)'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </div>
      </div>
    </>
  )
}
