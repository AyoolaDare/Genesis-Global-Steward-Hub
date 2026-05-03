import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { usersApi, type AppRole, type AppUser } from '@/api/users'
import { departmentsApi } from '@/api/departments'
import { personsApi, type PersonListItem } from '@/api/persons'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  UserPlus, Search, Shield, Pencil, X, Check,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import type { CSSProperties } from 'react'

// ── Role config ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: AppRole[] = [
  'ADMIN', 'MEDICAL', 'FOLLOWUP', 'CELL_LEADER', 'CELL_ASST',
  'HOD', 'ASST_HOD', 'WELFARE', 'PRO', 'HR',
]

const ROLE_CONFIG: Record<AppRole, { label: string; color: string; bg: string }> = {
  ADMIN:       { label: 'Administrator',  color: 'var(--gg-gold-200)',  bg: 'rgba(212,175,55,0.12)'  },
  MEDICAL:     { label: 'Medical Team',   color: 'var(--gg-success)',   bg: 'rgba(39,174,96,0.12)'   },
  FOLLOWUP:    { label: 'Follow-Up',      color: 'var(--gg-blue-200)',  bg: 'rgba(26,111,212,0.12)'  },
  CELL_LEADER: { label: 'Cell Leader',    color: 'var(--gg-ember-200)', bg: 'rgba(232,99,26,0.12)'   },
  CELL_ASST:   { label: 'Cell Assistant', color: 'var(--gg-ember-200)', bg: 'rgba(232,99,26,0.08)'   },
  HOD:         { label: 'Head of Dept',   color: 'var(--gg-blue-100)',  bg: 'rgba(26,111,212,0.12)'  },
  ASST_HOD:    { label: 'Assistant HOD',  color: '#a78bfa',             bg: 'rgba(167,139,250,0.12)' },
  WELFARE:     { label: 'Welfare',        color: '#34d399',             bg: 'rgba(52,211,153,0.12)'  },
  PRO:         { label: 'PRO',            color: '#fb923c',             bg: 'rgba(251,146,60,0.12)'  },
  HR:          { label: 'HR Team',        color: '#e879f9',             bg: 'rgba(232,121,249,0.12)' },
}

// Roles that require a department assignment
const DEPT_ROLES: AppRole[] = ['HOD', 'ASST_HOD', 'WELFARE', 'PRO']

// ── Module access config ───────────────────────────────────────────────────────

const ALL_MODULES = [
  { key: 'people',        label: 'Members'       },
  { key: 'medical',       label: 'Medical'       },
  { key: 'followup',      label: 'Follow-Up'     },
  { key: 'cells',         label: 'Cell Groups'   },
  { key: 'departments',   label: 'Departments'   },
  { key: 'hr',            label: 'HR'            },
  { key: 'messaging',     label: 'Messaging'     },
  { key: 'notifications', label: 'Notifications' },
  { key: 'audit',         label: 'Audit Logs'    },
]

const ROLE_DEFAULT_MODULES: Record<AppRole, string[]> = {
  ADMIN:       ['people', 'medical', 'followup', 'cells', 'departments', 'hr', 'messaging', 'notifications', 'audit'],
  MEDICAL:     ['medical', 'people', 'notifications'],
  FOLLOWUP:    ['followup', 'people', 'messaging', 'notifications'],
  CELL_LEADER: ['cells', 'people', 'notifications'],
  CELL_ASST:   ['cells', 'people', 'notifications'],
  HOD:         ['departments', 'people', 'messaging', 'notifications'],
  ASST_HOD:    ['departments', 'people', 'notifications'],
  WELFARE:     ['departments', 'notifications'],
  PRO:         ['departments', 'notifications'],
  HR:          ['hr', 'people', 'notifications'],
}

// ── Zod schemas ────────────────────────────────────────────────────────────────

const roleEnum = z.enum(['ADMIN', 'MEDICAL', 'FOLLOWUP', 'CELL_LEADER', 'CELL_ASST', 'HOD', 'ASST_HOD', 'WELFARE', 'PRO', 'HR'])

const baseSchema = z.object({
  email:         z.string().email('Enter a valid email'),
  username:      z.string().min(3, 'At least 3 characters'),
  role:          roleEnum,
  department:    z.string().optional(),
  module_access: z.array(z.string()).default([]),
  is_active:     z.boolean().default(true),
  person:        z.string().optional(),
})

const createSchema = baseSchema.extend({
  password: z.string().min(12, 'Minimum 12 characters'),
})

const editSchema = baseSchema.extend({
  password: z.string().min(12, 'Minimum 12 characters').optional().or(z.literal('')),
})

type EditFormData = z.infer<typeof editSchema>

// ── PersonSearch component ─────────────────────────────────────────────────────

interface PersonSearchProps {
  value: { id: string; name: string } | null
  onChange: (p: { id: string; name: string } | null) => void
}

function PersonSearch({ value, onChange }: PersonSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const dq = useDebounce(query, 300)

  const { data: results } = useQuery({
    queryKey: ['person-search-ac', dq],
    queryFn:  () => personsApi.list({ search: dq, page_size: '8' }),
    select:   (res) => res.data.results,
    enabled:  dq.length >= 2,
  })

  if (value) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px',
        border: '1px solid rgba(212,175,55,0.35)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(212,175,55,0.06)',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(212,175,55,0.15)',
          color: 'var(--gg-gold-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", flexShrink: 0,
        }}>
          {value.name.slice(0, 2).toUpperCase()}
        </div>
        <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--gg-text-primary)', fontWeight: 500 }}>
          {value.name}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gg-text-secondary)', padding: 0, display: 'flex' }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--gg-text-secondary)', pointerEvents: 'none',
        }} />
        <input
          className="input"
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          style={{ paddingLeft: 34 }}
        />
      </div>
      {open && results && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          zIndex: 200,
          background: 'var(--gg-surface)',
          border: '1px solid var(--gg-border-default)',
          borderRadius: 'var(--radius-md)',
          maxHeight: 220, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {results.map((p: PersonListItem) => {
            const name = p.full_name ?? `${p.first_name} ${p.last_name}`
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange({ id: p.id, name })
                  setQuery('')
                  setOpen(false)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', width: '100%',
                  background: 'none', border: 'none', borderBottom: '1px solid var(--gg-border-subtle)',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(212,175,55,0.12)',
                  color: 'var(--gg-gold-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", flexShrink: 0,
                }}>
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gg-text-primary)', fontWeight: 500 }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--gg-text-secondary)' }}>{p.phone}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── UserModal (Grant / Edit Access) ───────────────────────────────────────────

interface UserModalProps {
  user?: AppUser | null
  onClose: () => void
}

function UserModal({ user, onClose }: UserModalProps) {
  const isEdit = !!user
  const qc     = useQueryClient()

  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string } | null>(
    user?.person ? { id: user.person, name: user.person_name ?? '' } : null
  )

  const schema = isEdit ? editSchema : createSchema

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(schema),
    defaultValues: user ? {
      email:         user.email,
      username:      user.username,
      role:          user.role,
      department:    user.department ?? '',
      module_access: user.module_access ?? [],
      is_active:     user.is_active,
      password:      '',
      person:        user.person ?? '',
    } : {
      role:          'FOLLOWUP',
      module_access: ROLE_DEFAULT_MODULES['FOLLOWUP'],
      is_active:     true,
      department:    '',
      password:      '',
      person:        '',
    },
  })

  const watchedRole    = watch('role')
  const watchedModules = watch('module_access') ?? []
  const deptNeeded     = DEPT_ROLES.includes(watchedRole as AppRole)

  // Auto-fill modules when role changes (create mode only)
  useEffect(() => {
    if (!isEdit) {
      setValue('module_access', ROLE_DEFAULT_MODULES[watchedRole as AppRole] ?? [])
    }
  }, [watchedRole, isEdit, setValue])

  // Department list for selector
  const { data: depts } = useQuery({
    queryKey: ['departments-list'],
    queryFn:  () => departmentsApi.list(),
    select:   (res) => res.data.results,
    staleTime: 60_000,
  })

  const toggleModule = (key: string) => {
    setValue(
      'module_access',
      watchedModules.includes(key)
        ? watchedModules.filter((k) => k !== key)
        : [...watchedModules, key],
    )
  }

  const mutation = useMutation({
    mutationFn: (data: EditFormData) => {
      const payload = {
        email:         data.email,
        username:      data.username,
        role:          data.role as AppRole,
        department:    deptNeeded && data.department ? data.department : null,
        module_access: data.module_access,
        is_active:     data.is_active,
        person:        selectedPerson?.id ?? null,
        ...(data.password ? { password: data.password } : {}),
      }
      return isEdit
        ? usersApi.update(user!.id, payload)
        : usersApi.create({ ...payload, password: data.password as string })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(isEdit ? 'Access updated' : 'Access granted')
      onClose()
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.error?.message ?? 'Failed to save')
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>

      {/* Person link */}
      <div style={{ marginBottom: 20 }}>
        <label style={LBL}>Link to Church Member <span style={{ color: 'var(--gg-text-disabled)', fontWeight: 400 }}>(optional)</span></label>
        <PersonSearch
          value={selectedPerson}
          onChange={(p) => {
            setSelectedPerson(p)
            setValue('person', p?.id ?? '')
            if (p && !isEdit) {
              const slug = p.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')
              setValue('username', slug)
            }
          }}
        />
        <p style={{ fontSize: 11, color: 'var(--gg-text-disabled)', marginTop: 5 }}>
          Ties this login account to an existing member record
        </p>
      </div>

      {/* Email + Username */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={LBL}>Email *</label>
          <input className="input" type="email" {...register('email')} style={errors.email ? ERR_INPUT : undefined} />
          {errors.email && <p style={ERR}>{errors.email.message}</p>}
        </div>
        <div>
          <label style={LBL}>Username *</label>
          <input className="input" type="text" {...register('username')} style={errors.username ? ERR_INPUT : undefined} />
          {errors.username && <p style={ERR}>{errors.username.message}</p>}
        </div>
      </div>

      {/* Role + Department */}
      <div style={{ display: 'grid', gridTemplateColumns: deptNeeded ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={LBL}>Role *</label>
          <select className="input" {...register('role')}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
            ))}
          </select>
          {errors.role && <p style={ERR}>{errors.role.message}</p>}
        </div>
        {deptNeeded && (
          <div>
            <label style={LBL}>Department *</label>
            <select className="input" {...register('department')}>
              <option value="">Select department…</option>
              {depts?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Module Access */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={{ ...LBL, marginBottom: 0 }}>Module Access</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setValue('module_access', ALL_MODULES.map(m => m.key))}
              style={{ fontSize: 11, color: 'var(--gg-gold-200)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Public Sans', sans-serif" }}
            >
              All
            </button>
            <span style={{ color: 'var(--gg-border-default)' }}>·</span>
            <button
              type="button"
              onClick={() => setValue('module_access', [])}
              style={{ fontSize: 11, color: 'var(--gg-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Public Sans', sans-serif" }}
            >
              None
            </button>
            <span style={{ color: 'var(--gg-border-default)' }}>·</span>
            <button
              type="button"
              onClick={() => setValue('module_access', ROLE_DEFAULT_MODULES[watchedRole as AppRole] ?? [])}
              style={{ fontSize: 11, color: 'var(--gg-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Public Sans', sans-serif" }}
            >
              Reset defaults
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {ALL_MODULES.map((m) => {
            const on = watchedModules.includes(m.key)
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => toggleModule(m.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px',
                  border: `1px solid ${on ? 'rgba(212,175,55,0.35)' : 'var(--gg-border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: on ? 'rgba(212,175,55,0.08)' : 'transparent',
                  color: on ? 'var(--gg-gold-200)' : 'var(--gg-text-secondary)',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12, cursor: 'pointer',
                  transition: 'all 150ms',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${on ? 'var(--gg-gold-200)' : 'var(--gg-border-default)'}`,
                  background: on ? 'var(--gg-gold-200)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms',
                }}>
                  {on && <Check size={10} color="#0A0A0A" strokeWidth={3} />}
                </span>
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Password */}
      <div style={{ marginBottom: 20 }}>
        <label style={LBL}>{isEdit ? 'New Password' : 'Temporary Password *'}</label>
        <input
          className="input"
          type="password"
          placeholder={isEdit ? 'Leave blank to keep current' : 'Min 12 characters'}
          {...register('password')}
          style={errors.password ? ERR_INPUT : undefined}
        />
        {errors.password && <p style={ERR}>{errors.password.message}</p>}
        {!isEdit && (
          <p style={{ fontSize: 11, color: 'var(--gg-text-disabled)', marginTop: 5 }}>
            Min 12 characters. User will be prompted to reset on first login.
          </p>
        )}
      </div>

      {/* Active */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, cursor: 'pointer' }}>
        <input type="checkbox" {...register('is_active')} />
        <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 'var(--text-sm)', color: 'var(--gg-text-primary)' }}>
          Account active
        </span>
      </label>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} style={GHOST_BTN}>Cancel</button>
        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            height: 40, padding: '0 24px',
            background: mutation.isPending
              ? 'rgba(232,99,26,0.45)'
              : 'linear-gradient(135deg, #E8631A 0%, #D4AF37 100%)',
            color: '#0A0A0A', border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.07em', textTransform: 'uppercase' as const,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(232,99,26,0.20)',
            transition: 'filter 150ms',
          }}
          onMouseEnter={(e) => { if (!mutation.isPending) e.currentTarget.style.filter = 'brightness(1.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = '' }}
        >
          {mutation.isPending ? 'Saving…' : isEdit ? 'Update Access' : 'Grant Access'}
        </button>
      </div>
    </form>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState<AppRole | ''>('')
  const [activeFilter, setActiveFilter] = useState<'true' | 'false' | ''>('')
  const [cursor,       setCursor]       = useState<string | undefined>()
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editUser,     setEditUser]     = useState<AppUser | null>(null)

  const dq = useDebounce(search, 300)
  const qc = useQueryClient()

  const params = useMemo(() => {
    const out: Record<string, string> = {}
    if (dq)          out.search    = dq
    if (roleFilter)  out.role      = roleFilter
    if (activeFilter) out.is_active = activeFilter
    if (cursor)      out.cursor    = cursor
    return out
  }, [dq, roleFilter, activeFilter, cursor])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', params],
    queryFn:  () => usersApi.list(params),
    select:   (res) => res.data,
  })

  // Inline status toggle
  const toggleStatus = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      usersApi.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
    onError:   () => toast.error('Failed to update status'),
  })

  const openEdit   = (u: AppUser) => { setEditUser(u); setModalOpen(true) }
  const openCreate = ()           => { setEditUser(null); setModalOpen(true) }
  const closeModal = ()           => { setModalOpen(false); setEditUser(null) }

  const results = data?.results ?? []

  return (
    <div style={{ maxWidth: 1280 }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Shield size={18} style={{ color: 'var(--gg-gold-200)' }} />
            <h1 style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 20, fontWeight: 600, letterSpacing: '0.05em',
              color: 'var(--gg-text-primary)',
            }}>
              Access Control
            </h1>
          </div>
          <p style={{
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 'var(--text-sm)', color: 'var(--gg-text-secondary)',
          }}>
            Manage system accounts, roles, and module permissions
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 40, padding: '0 20px',
            background: 'linear-gradient(135deg, #E8631A 0%, #D4AF37 100%)',
            color: '#0A0A0A', border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(232,99,26,0.20)',
            transition: 'filter 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = '' }}
        >
          <UserPlus size={15} />
          Grant Access
        </button>
      </div>

      {/* ── Role filter chips ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['', ...ROLE_OPTIONS] as const).map((r) => {
          const cfg    = r ? (ROLE_CONFIG[r] ?? { label: r, color: 'var(--gg-text-secondary)', bg: 'rgba(255,255,255,0.06)' }) : null
          const active = roleFilter === r
          const count  = r
            ? results.filter((u) => u.role === r).length
            : results.length
          return (
            <button
              key={r || 'all'}
              onClick={() => { setRoleFilter(r as AppRole | ''); setCursor(undefined) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${active ? (cfg?.color ?? 'var(--gg-gold-200)') : 'var(--gg-border-subtle)'}`,
                background: active ? (cfg?.bg ?? 'rgba(212,175,55,0.10)') : 'transparent',
                color: active ? (cfg?.color ?? 'var(--gg-gold-200)') : 'var(--gg-text-secondary)',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12, cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {r ? cfg!.label : 'All Roles'}
              {count > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 18, height: 18, borderRadius: 'var(--radius-full)',
                  background: active ? (cfg?.color ?? 'var(--gg-gold-200)') : 'var(--gg-border-subtle)',
                  color: active ? '#0A0A0A' : 'var(--gg-text-secondary)',
                  fontSize: 10, fontWeight: 700, padding: '0 4px',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--gg-text-secondary)', pointerEvents: 'none',
          }} />
          <input
            className="input"
            placeholder="Search name, email, username…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCursor(undefined) }}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select
          className="input"
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value as 'true' | 'false' | ''); setCursor(undefined) }}
          style={{ width: 160 }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* ── Matrix table ── */}
      <div style={{
        background: 'var(--gg-surface)',
        border: '1px solid var(--gg-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(212,175,55,0.03)', borderBottom: '1px solid var(--gg-border-subtle)' }}>
              {['Member', 'Credentials', 'Role', 'Department', 'Module Access', 'Status', 'Last Login', ''].map((h) => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--gg-border-subtle)' }}>
                    <td colSpan={8} style={{ padding: '14px 16px' }}>
                      <div className="skeleton" style={{ height: 14, width: `${50 + (i * 7) % 35}%` }} />
                    </td>
                  </tr>
                ))
              : results.length > 0
                ? results.map((u) => {
                    const cfg        = ROLE_CONFIG[u.role] ?? { label: u.role, color: 'var(--gg-text-secondary)', bg: 'rgba(255,255,255,0.06)' }
                    const initials   = (u.person_name ?? u.username).slice(0, 2).toUpperCase()
                    const mods       = u.module_access ?? []
                    const shownMods  = mods.slice(0, 3)
                    const extraCount = mods.length - 3
                    return (
                      <tr
                        key={u.id}
                        style={{ borderBottom: '1px solid var(--gg-border-subtle)', transition: 'background 150ms' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.02)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                      >

                        {/* Member */}
                        <td style={TD}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                              background: cfg.bg,
                              border: `1px solid ${cfg.color}33`,
                              color: cfg.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, fontFamily: "'Public Sans', sans-serif",
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--gg-text-primary)', lineHeight: 1.3 }}>
                                {u.person_name ?? '—'}
                              </div>
                              {u.must_reset_password && (
                                <div style={{ fontSize: 10, color: 'var(--gg-ember-200)', letterSpacing: '0.04em' }}>
                                  Awaiting first login
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Credentials */}
                        <td style={TD}>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gg-text-primary)', fontWeight: 500 }}>{u.username}</div>
                          <div style={{ fontSize: 11, color: 'var(--gg-text-secondary)' }}>{u.email}</div>
                        </td>

                        {/* Role badge */}
                        <td style={TD}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: cfg.bg, color: cfg.color,
                            border: `1px solid ${cfg.color}33`,
                            fontSize: 11, fontWeight: 500,
                            fontFamily: "'Public Sans', sans-serif",
                            whiteSpace: 'nowrap',
                          }}>
                            {cfg.label}
                          </span>
                        </td>

                        {/* Department */}
                        <td style={TD}>
                          <span style={{
                            fontSize: 'var(--text-sm)',
                            color: u.department_name ? 'var(--gg-text-primary)' : 'var(--gg-text-disabled)',
                          }}>
                            {u.department_name ?? '—'}
                          </span>
                        </td>

                        {/* Module access chips */}
                        <td style={TD}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {mods.length === 0 && (
                              <span style={{ fontSize: 11, color: 'var(--gg-text-disabled)' }}>None</span>
                            )}
                            {shownMods.map((mk) => {
                              const mod = ALL_MODULES.find((m) => m.key === mk)
                              return mod ? (
                                <span key={mk} style={{
                                  padding: '2px 7px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(212,175,55,0.08)',
                                  border: '1px solid rgba(212,175,55,0.18)',
                                  color: 'var(--gg-gold-200)',
                                  fontSize: 10,
                                  fontFamily: "'Public Sans', sans-serif",
                                }}>
                                  {mod.label}
                                </span>
                              ) : null
                            })}
                            {extraCount > 0 && (
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--gg-border-subtle)',
                                color: 'var(--gg-text-secondary)',
                                fontSize: 10,
                                fontFamily: "'Public Sans', sans-serif",
                              }}>
                                +{extraCount}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status toggle */}
                        <td style={TD}>
                          <button
                            onClick={() => toggleStatus.mutate({ id: u.id, is_active: !u.is_active })}
                            style={{
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-full)',
                              border: `1px solid ${u.is_active ? 'rgba(39,174,96,0.35)' : 'rgba(192,57,43,0.35)'}`,
                              background: u.is_active ? 'rgba(39,174,96,0.10)' : 'rgba(192,57,43,0.10)',
                              color: u.is_active ? 'var(--gg-success)' : 'var(--gg-danger)',
                              fontSize: 11, fontWeight: 500, cursor: 'pointer',
                              fontFamily: "'Public Sans', sans-serif",
                              transition: 'all 150ms',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Last login */}
                        <td style={TD}>
                          <span style={{ fontSize: 11, color: 'var(--gg-text-secondary)' }}>
                            {u.last_login ? format(new Date(u.last_login), 'MMM d, yy') : 'Never'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ ...TD, textAlign: 'right' }}>
                          <button
                            onClick={() => openEdit(u)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              height: 30, padding: '0 12px',
                              background: 'none',
                              border: '1px solid var(--gg-border-default)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--gg-text-secondary)',
                              fontSize: 11, cursor: 'pointer',
                              fontFamily: "'Public Sans', sans-serif",
                              transition: 'all 150ms',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--gg-gold-200)'
                              e.currentTarget.style.color = 'var(--gg-gold-200)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--gg-border-default)'
                              e.currentTarget.style.color = 'var(--gg-text-secondary)'
                            }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })
                : (
                  <tr>
                    <td colSpan={8} style={{
                      textAlign: 'center',
                      padding: '56px 16px',
                      color: 'var(--gg-text-secondary)',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 'var(--text-sm)',
                    }}>
                      No accounts found.
                    </td>
                  </tr>
                )
            }
          </tbody>
        </table>

        {/* Pagination */}
        {(data?.previous || data?.next) && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--gg-border-subtle)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <button
              disabled={!data?.previous}
              onClick={() => {
                if (!data?.previous) return
                const url = new URL(data.previous, window.location.origin)
                setCursor(url.searchParams.get('cursor') ?? undefined)
              }}
              style={{ ...GHOST_BTN, opacity: data?.previous ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              disabled={!data?.next}
              onClick={() => {
                if (!data?.next) return
                const url = new URL(data.next, window.location.origin)
                setCursor(url.searchParams.get('cursor') ?? undefined)
              }}
              style={{ ...GHOST_BTN, opacity: data?.next ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editUser ? 'Edit Access' : 'Grant System Access'}
        width={640}
      >
        <UserModal user={editUser} onClose={closeModal} />
      </Modal>
    </div>
  )
}

// ── Style constants ────────────────────────────────────────────────────────────

const LBL: CSSProperties = {
  display: 'block',
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--gg-text-secondary)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const ERR: CSSProperties = {
  color: 'var(--gg-danger)',
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 11,
  marginTop: 4,
}

const ERR_INPUT: CSSProperties = {
  borderColor: 'var(--gg-danger)',
  boxShadow: '0 0 0 3px rgba(192,57,43,0.12)',
}

const GHOST_BTN: CSSProperties = {
  height: 36,
  padding: '0 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--gg-border-default)',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--gg-text-secondary)',
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 'var(--text-sm)',
}

const TH: CSSProperties = {
  textAlign: 'left',
  padding: '10px 16px',
  fontSize: 10,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--gg-text-disabled)',
  fontFamily: "'Public Sans', sans-serif",
  whiteSpace: 'nowrap',
}

const TD: CSSProperties = {
  padding: '12px 16px',
  fontSize: 'var(--text-sm)',
  color: 'var(--gg-text-body)',
  verticalAlign: 'middle',
}
