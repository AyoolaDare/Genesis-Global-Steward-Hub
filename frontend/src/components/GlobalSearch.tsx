import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, UsersRound, Building2, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchResult {
  id:       string
  type:     'person' | 'cell_group' | 'department'
  title:    string
  subtitle: string
}

function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query.trim()) return []
      const res = await api.get<{ results: SearchResult[] }>('/search/', { params: { q: query } })
      return res.data.results
    },
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  })
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  person:     <Users size={16} />,
  cell_group: <UsersRound size={16} />,
  department: <Building2 size={16} />,
}

const TYPE_PATH: Record<string, string> = {
  person:     '/people',
  cell_group: '/cells',
  department: '/departments',
}

export default function GlobalSearch() {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [focused, setFocused] = useState(0)
  const inputRef  = useRef<HTMLInputElement>(null)
  const navigate  = useNavigate()

  const debouncedQuery = useDebounce(query, 300)
  const { data: results = [], isLoading } = useGlobalSearch(debouncedQuery)

  // Listen for CMD+K / CTRL+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Auto-focus input
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setFocused(0)
    }
  }, [open])

  const select = useCallback((result: SearchResult) => {
    navigate(`${TYPE_PATH[result.type] ?? '/'}`)
    setOpen(false)
  }, [navigate])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown')  { e.preventDefault(); setFocused((f) => Math.min(f + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setFocused((f) => Math.max(f - 1, 0)) }
      if (e.key === 'Enter' && results[focused]) { select(results[focused]) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, focused, select])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 51, 0.45)',
          zIndex: 60,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: 580,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
          zIndex: 70,
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Search size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setFocused(0) }}
            placeholder="Search people, cell groups, departments…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-primary)',
              background: 'transparent',
              fontFamily: 'var(--font-body)',
            }}
          />
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: '2px 4px',
              fontSize: 11,
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {query.trim().length < 2 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Type at least 2 characters to search
            </div>
          ) : isLoading ? (
            <div style={{ padding: 'var(--space-5)' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              No results for "{query}"
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => select(r)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  border: 'none',
                  background: i === focused ? 'var(--color-primary-subtle)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderBottom: '1px solid var(--color-border)',
                  color: i === focused ? 'var(--color-primary)' : 'var(--color-text-body)',
                }}
                onMouseEnter={() => setFocused(i)}
              >
                <span style={{ color: i === focused ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }}>
                  {TYPE_ICON[r.type]}
                </span>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{r.subtitle}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {r.type.replace('_', ' ')}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcut hint */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: 16,
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          <span><kbd style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '1px 4px' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '1px 4px' }}>↵</kbd> open</span>
          <span><kbd style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '1px 4px' }}>esc</kbd> close</span>
        </div>
      </div>
    </>
  )
}
