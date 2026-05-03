import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import {
  useReactTable, getCoreRowModel, flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { UserPlus, Upload, Search, Filter, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { personsApi, type PersonListItem, type PersonStatus, type PersonSource } from '@/api/persons'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'
import PersonForm from '@/components/persons/PersonForm'
import CsvImportModal from '@/components/persons/CsvImportModal'
import { format } from 'date-fns'
import { useDebounce } from '@/hooks/useDebounce'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const STATUS_OPTIONS: { value: PersonStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'NEW_MEMBER',       label: 'New Member' },
  { value: 'MEMBER',           label: 'Member' },
  { value: 'WORKER',           label: 'Worker' },
  { value: 'INACTIVE',         label: 'Inactive' },
]

const SOURCE_OPTIONS: { value: PersonSource | ''; label: string }[] = [
  { value: '', label: 'All Sources' },
  { value: 'WALK_IN',    label: 'Walk-In' },
  { value: 'CELL',       label: 'Cell Group Referral' },
  { value: 'MEDICAL',    label: 'Medical Unit' },
  { value: 'FOLLOWUP',   label: 'Follow-Up Team' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'ADMIN',      label: 'Admin Entry' },
]

export default function PeoplePage() {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)
  const isAdmin = role === 'ADMIN'

  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState<PersonStatus | ''>('')
  const [source,   setSource]   = useState<PersonSource | ''>('')
  const [cursor,   setCursor]   = useState<string | undefined>()
  const [addOpen,  setAddOpen]  = useState(false)
  const [csvOpen,  setCsvOpen]  = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const params: Record<string, string> = {}
  if (debouncedSearch) params.search = debouncedSearch
  if (status)          params.status = status
  if (source)          params.source = source
  if (cursor)          params.cursor = cursor

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['persons', params],
    queryFn:  () => personsApi.list(params),
    select:   (res) => res.data,
  })

  const columns: ColumnDef<PersonListItem>[] = [
    {
      header: 'Name',
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row, getValue }) => (
        <button
          onClick={() => navigate(`/members/${row.original.id}`)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: 'var(--color-primary)', fontWeight: 500,
            fontSize: 'var(--text-sm)', textAlign: 'left',
          }}
        >
          {getValue() as string}
        </button>
      ),
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: ({ getValue }) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
          {getValue() as string}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as PersonStatus} />,
    },
    {
      header: 'Source',
      accessorKey: 'source',
      cell: ({ getValue }) => (
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>
          {(getValue() as string).replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Joined',
      accessorKey: 'created_at',
      cell: ({ getValue }) => (
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          {format(new Date(getValue() as string), 'MMM d, yyyy')}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data:    data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const clearFilters = useCallback(() => {
    setSearch('')
    setStatus('')
    setSource('')
    setCursor(undefined)
  }, [])

  const hasFilters = search || status || source

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Members
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {data?.count != null ? `${data.count} total` : 'Manage members and visitors'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isAdmin && (
            <button
              onClick={() => setCsvOpen(true)}
              style={{
                height: 40, padding: '0 14px',
                background: 'none', color: 'var(--color-text-body)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontWeight: 500, fontSize: 'var(--text-sm)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Upload size={15} />
              Import CSV
            </button>
          )}
          <button
            onClick={() => setAddOpen(true)}
            style={{
              height: 40, padding: '0 18px',
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <UserPlus size={16} />
            Register Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          gap: 'var(--space-3)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search
            size={15}
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCursor(undefined) }}
            style={{ paddingLeft: 36 }}
          />
        </div>

        <select
          className="input"
          value={status}
          onChange={(e) => { setStatus(e.target.value as PersonStatus | ''); setCursor(undefined) }}
          style={{ width: 180 }}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          className="input"
          value={source}
          onChange={(e) => { setSource(e.target.value as PersonSource | ''); setCursor(undefined) }}
          style={{ width: 160 }}
        >
          {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              height: 40, padding: '0 12px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', background: 'none',
              cursor: 'pointer', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 'var(--text-sm)',
            }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'left',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'var(--color-text-muted)',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-surface-alt)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div className="skeleton" style={{ height: 16, borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{
                      padding: 'var(--space-12)',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <Filter size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                    No members found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-surface-alt)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.previous || data?.next) && (
          <div
            style={{
              padding: 'var(--space-4) var(--space-6)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              disabled={!data.previous || isFetching}
              onClick={() => {
                const url = new URL(data.previous!)
                setCursor(url.searchParams.get('cursor') ?? undefined)
              }}
              style={{
                height: 34, padding: '0 16px',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'none',
                cursor: data.previous ? 'pointer' : 'not-allowed',
                fontSize: 'var(--text-sm)', color: 'var(--color-text-body)',
                opacity: data.previous ? 1 : 0.4,
              }}
            >
              Previous
            </button>
            <button
              disabled={!data.next || isFetching}
              onClick={() => {
                const url = new URL(data.next!)
                setCursor(url.searchParams.get('cursor') ?? undefined)
              }}
              style={{
                height: 34, padding: '0 16px',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'none',
                cursor: data.next ? 'pointer' : 'not-allowed',
                fontSize: 'var(--text-sm)', color: 'var(--color-text-body)',
                opacity: data.next ? 1 : 0.4,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Member Registration">
        <MemberOnboardingSection onClose={() => setAddOpen(false)} />
      </Modal>

      {csvOpen && <CsvImportModal onClose={() => setCsvOpen(false)} />}
    </div>
  )
}

function MemberOnboardingSection({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [phone, setPhone] = useState('')
  const [foundMember, setFoundMember] = useState<PersonListItem | null>(null)

  const lookupMutation = useMutation({
    mutationFn: () => personsApi.phoneLookup([phone]),
    onSuccess: (res) => {
      const member = res.data.results[0]?.person
      if (!member) {
        setFoundMember(null)
        toast.error('No existing member found for this phone.')
        return
      }
      setFoundMember(member)
      toast.success('Existing member found')
    },
    onError: () => toast.error('Failed to check member'),
  })

  const tabButtonStyle = (active: boolean) => ({
    height: 34,
    padding: '0 12px',
    border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
    background: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
  })

  const labelStyle = {
    display: 'block',
    fontFamily: "'Public Sans', sans-serif",
    fontSize: 11,
    fontWeight: 500 as const,
    color: 'var(--gg-text-secondary)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  }

  return (
    <div>
      <div
        style={{
          border: '1px solid var(--gg-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.02)',
          padding: isMobile ? '16px' : '20px',
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setMode('new')} style={tabButtonStyle(mode === 'new')}>
            New Member
          </button>
          <button type="button" onClick={() => setMode('existing')} style={tabButtonStyle(mode === 'existing')}>
            Existing Member
          </button>
        </div>

        {mode === 'new' && (
          <PersonForm onClose={onClose} />
        )}

        {mode === 'existing' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              lookupMutation.mutate()
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Member Phone</label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: 10 }}>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="080XXXXXXXX"
                />
                <button
                  type="submit"
                  disabled={!phone || lookupMutation.isPending}
                  style={{
                    height: 40,
                    padding: '0 18px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: !phone || lookupMutation.isPending ? 'rgba(212,175,55,0.35)' : 'var(--color-primary)',
                    color: '#fff',
                    cursor: !phone || lookupMutation.isPending ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    minWidth: isMobile ? '100%' : 112,
                  }}
                >
                  <Search size={14} />
                  {lookupMutation.isPending ? 'Finding...' : 'Find Member'}
                </button>
              </div>
              <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                Enter the phone number used during registration to open an existing member profile.
              </p>
            </div>

            {foundMember ? (
              <div
                style={{
                  border: '1px solid var(--color-success)',
                  background: 'var(--color-success-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: isMobile ? 14 : 16,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                    gap: 14,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <span style={labelStyle}>Full Name</span>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {foundMember.first_name} {foundMember.last_name}
                    </div>
                  </div>
                  <div>
                    <span style={labelStyle}>Phone Number</span>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                      {foundMember.phone}
                    </div>
                  </div>
                  <div>
                    <span style={labelStyle}>Status</span>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                      {foundMember.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <span style={labelStyle}>Source</span>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                      {foundMember.source.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setFoundMember(null)}
                    style={{
                      height: 36,
                      padding: '0 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-body)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    Clear Result
                  </button>
                  <button
                    type="button"
                    onClick={() => { onClose(); navigate(`/members/${foundMember.id}`) }}
                    style={{
                      height: 36,
                      padding: '0 16px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: 'var(--color-success)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    Open Member Board
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '1px dashed var(--gg-border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: isMobile ? '14px' : '16px',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Search for an existing record, then continue to the member board from here.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 16 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: 40,
                  padding: '0 20px',
                  border: '1px solid var(--gg-border-default)',
                  borderRadius: 'var(--radius-md)',
                  background: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 'var(--text-sm)',
                  color: 'var(--gg-text-secondary)',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
