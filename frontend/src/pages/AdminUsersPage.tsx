import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { usersApi, type AppRole, type AppUser } from '@/api/users'
import { departmentsApi } from '@/api/departments'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { UserPlus, Search } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import type { CSSProperties } from 'react'

const ROLE_OPTIONS = [
  'ADMIN',
  'MEDICAL',
  'FOLLOWUP',
  'CELL_ADMIN',
  'DEPT_LEADER',
  'DEPT_ASST',
  'HR',
] as const

const createSchema = z.object({
  email: z.string().email('Enter a valid email'),
  username: z.string().min(3, 'Username must be at least 3 chars'),
  role: z.enum(ROLE_OPTIONS),
  department: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 chars'),
  is_active: z.boolean().default(true),
})

const editSchema = createSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 chars').optional().or(z.literal('')),
})

type EditForm = z.infer<typeof editSchema>

function roleLabel(role: AppRole) {
  return role.replace('_', ' ')
}

interface UserFormProps {
  initial?: AppUser | null
  onClose: () => void
}

function UserForm({ initial, onClose }: UserFormProps) {
  const queryClient = useQueryClient()
  const isEdit = !!initial
  const schema = isEdit ? editSchema : createSchema
  const { data: depts } = useQuery({
    queryKey: ['depts', 'for-users'],
    queryFn: () => departmentsApi.list(),
    select: (res) => res.data.results,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          email: initial.email,
          username: initial.username,
          role: initial.role,
          department: initial.department ?? '',
          is_active: initial.is_active,
          password: '',
        }
      : {
          role: 'FOLLOWUP',
          is_active: true,
        },
  })

  const mutation = useMutation({
    mutationFn: async (values: EditForm) => {
      if (isEdit && initial) {
        const payload: {
          email?: string
          username?: string
          role?: AppRole
          department?: string | null
          is_active?: boolean
          password?: string
        } = {
          email: values.email,
          username: values.username,
          role: values.role,
          department: values.department || null,
          is_active: values.is_active,
        }
        if (values.password) payload.password = values.password
        return usersApi.update(initial.id, payload)
      }

      return usersApi.create({
        email: values.email,
        username: values.username,
        role: values.role,
        department: values.department || undefined,
        password: values.password as string,
        module_access: [],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(isEdit ? 'User updated' : 'User created')
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Could not save user')
    },
  })

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={labelStyle}>Email</label>
        <input className="input" type="email" {...register('email')} />
        {errors.email && <p style={errStyle}>{errors.email.message}</p>}
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={labelStyle}>Username</label>
        <input className="input" type="text" {...register('username')} />
        {errors.username && <p style={errStyle}>{errors.username.message}</p>}
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={labelStyle}>Role</label>
        <select className="input" {...register('role')}>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        {errors.role && <p style={errStyle}>{errors.role.message}</p>}
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={labelStyle}>Department</label>
        <select className="input" {...register('department')}>
          <option value="">No department</option>
          {depts?.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {errors.department && <p style={errStyle}>{errors.department.message as string}</p>}
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={labelStyle}>{isEdit ? 'Password (optional)' : 'Password'}</label>
        <input className="input" type="password" {...register('password')} />
        {errors.password && <p style={errStyle}>{errors.password.message}</p>}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-6)' }}>
        <input type="checkbox" {...register('is_active')} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-body)' }}>Active account</span>
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <button type="button" onClick={onClose} style={ghostBtn}>
          Cancel
        </button>
        <button type="submit" disabled={mutation.isPending} style={primaryBtn}>
          {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </form>
  )
}

const labelStyle = {
  display: 'block',
  marginBottom: 'var(--space-2)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
}

const errStyle = {
  marginTop: 'var(--space-1)',
  color: 'var(--color-danger)',
  fontSize: 'var(--text-xs)',
}

const ghostBtn = {
  height: 40,
  padding: '0 16px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--color-border)',
  background: 'none',
  cursor: 'pointer',
}

const primaryBtn = {
  height: 40,
  padding: '0 18px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-primary)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<AppRole | ''>('')
  const [active, setActive] = useState<'true' | 'false' | ''>('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const params = useMemo(() => {
    const out: Record<string, string> = {}
    if (debouncedSearch) out.search = debouncedSearch
    if (role) out.role = role
    if (active) out.is_active = active
    if (cursor) out.cursor = cursor
    return out
  }, [debouncedSearch, role, active, cursor])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => usersApi.list(params),
    select: (res) => res.data,
  })

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)' }}>Admin Users</h1>
          <p style={{ marginTop: 4, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Create and manage app login accounts
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-4)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="input"
            placeholder="Search email or username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCursor(undefined) }}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <select className="input" value={role} onChange={(e) => { setRole(e.target.value as AppRole | ''); setCursor(undefined) }} style={{ width: 190 }}>
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{roleLabel(r)}</option>
          ))}
        </select>
        <select className="input" value={active} onChange={(e) => { setActive(e.target.value as 'true' | 'false' | ''); setCursor(undefined) }} style={{ width: 160 }}>
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-alt)' }}>
              {['Username', 'Email', 'Role', 'Department', 'Status', 'Last Login', 'Created', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx}>
                  <td colSpan={8} style={{ padding: 'var(--space-4)' }}>
                    <div className="skeleton" style={{ height: 14 }} />
                  </td>
                </tr>
              ))
            ) : data?.results?.length ? (
              data.results.map((user) => (
                <tr key={user.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}>{user.username}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>{roleLabel(user.role)}</td>
                  <td style={tdStyle}>{user.department_name ?? '—'}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        background: user.is_active ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                        color: user.is_active ? 'var(--color-success)' : 'var(--color-danger)',
                      }}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>{user.last_login ? format(new Date(user.last_login), 'MMM d, yyyy h:mma') : 'Never'}</td>
                  <td style={tdStyle}>{format(new Date(user.created_at), 'MMM d, yyyy')}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => { setEditing(user); setModalOpen(true) }}
                      style={{ ...ghostBtn, height: 32, padding: '0 12px' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {(data?.previous || data?.next) && (
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
            <button
              disabled={!data.previous}
              onClick={() => {
                if (!data.previous) return
                const url = new URL(data.previous, window.location.origin)
                setCursor(url.searchParams.get('cursor') ?? undefined)
              }}
              style={{ ...ghostBtn, opacity: data.previous ? 1 : 0.5 }}
            >
              Previous
            </button>
            <button
              disabled={!data.next}
              onClick={() => {
                if (!data.next) return
                const url = new URL(data.next, window.location.origin)
                setCursor(url.searchParams.get('cursor') ?? undefined)
              }}
              style={{ ...ghostBtn, opacity: data.next ? 1 : 0.5 }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <UserForm initial={editing} onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  color: 'var(--color-text-muted)',
}

const tdStyle: CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-body)',
}
