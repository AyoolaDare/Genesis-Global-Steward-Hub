import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  open:     boolean
  onClose:  () => void
  title:    string
  width?:   number
  footer?:  React.ReactNode
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, width = 580, footer, children }: Props) {
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

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 40,
          animation: 'gg-fade-in 180ms ease-out both',
        }}
      />

      {/* Centering layer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'grid',
          placeItems: 'center',
          padding: '32px 16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: typeof width === 'number' ? `min(100%, ${width}px)` : width,
            maxWidth: '100%',
            maxHeight: 'calc(100dvh - 64px)',
            background: 'var(--gg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--gg-border-default)',
            boxShadow: '0 24px 72px rgba(0,0,0,0.65), 0 0 0 1px rgba(212,175,55,0.06)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'gg-scale-in 280ms cubic-bezier(0.25, 0.8, 0.25, 1) both',
            pointerEvents: 'auto',
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
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {children}
          </div>

          {/* Optional sticky footer */}
          {footer && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--gg-border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              flexShrink: 0,
              background: 'var(--gg-surface)',
            }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
