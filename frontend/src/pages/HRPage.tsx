import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table'
import { Briefcase, Search, UserPlus, UserX, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { isAxiosError } from 'axios'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useDebounce } from '@/hooks/useDebounce'
import { useIsMobile } from '@/hooks/useIsMobile'
import Drawer from '@/components/ui/Drawer'
import Modal from '@/components/ui/Modal'
import {
  hrApi,
  type EmploymentStatus,
  type EmploymentType,
  type OnboardingStatus,
  type WorkerProfile,
} from '@/api/hr'
import { personsApi } from '@/api/persons'

const STATUS_CFG: Record<EmploymentStatus, [string, string]> = {
  ACTIVE: ['var(--color-success-bg)', 'var(--color-success)'],
  ON_LEAVE: ['var(--color-info-bg)', 'var(--color-info)'],
  SUSPENDED: ['var(--color-warning-bg)', 'var(--color-warning)'],
  TERMINATED: ['var(--color-danger-bg)', 'var(--color-danger)'],
}

function StatusBadge({ status }: { status: EmploymentStatus }) {
  const [bg, fg] = STATUS_CFG[status]
  return (
    <span style={{ background: bg, color: fg, borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
      {status.replace('_', ' ')}
    </span>
  )
}

const onboardSchema = z.object({
  job_title: z.string().min(2, 'Required'),
  employment_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER_STAFF']),
  hire_date: z.string().min(1, 'Required'),
  salary_amount: z.string().optional(),
  pay_frequency: z.string().optional(),
})

type OnboardForm = z.infer<typeof onboardSchema>

function OnboardWorkerModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [lookupPhone, setLookupPhone] = useState('')
  const [person, setPerson] = useState<any>(null)
  const [newPerson, setNewPerson] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    gender: 'OTHER',
  })

  const { register, handleSubmit, formState: { errors } } = useForm<OnboardForm>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      employment_type: 'FULL_TIME',
      pay_frequency: 'MONTHLY',
      hire_date: new Date().toISOString().split('T')[0],
    },
  })

  const lookupMutation = useMutation({
    mutationFn: () => personsApi.phoneLookup([lookupPhone]),
    onSuccess: (res) => {
      const found = res.data.results[0]?.person
      if (!found) {
        toast.error('Member not found')
        return
      }
      setPerson(found)
      toast.success('Member found')
    },
    onError: () => toast.error('Lookup failed'),
  })

  const onboardExistingMutation = useMutation({
    mutationFn: (data: OnboardForm) => hrApi.promote(person.id, {
      job_title: data.job_title,
      employment_type: data.employment_type as EmploymentType,
      hire_date: data.hire_date,
      salary_amount: data.salary_amount,
      pay_frequency: data.pay_frequency,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr'] })
      toast.success('Worker onboarded')
      onClose()
    },
    onError: (err: unknown) => toast.error(isAxiosError(err) ? (err.response?.data?.error?.message ?? 'Onboarding failed') : 'Onboarding failed'),
  })

  const onboardNewMutation = useMutation({
    mutationFn: async (data: OnboardForm) => {
      const personRes = await personsApi.create({
        first_name: newPerson.first_name,
        last_name: newPerson.last_name,
        phone: newPerson.phone,
        email: newPerson.email || undefined,
        gender: newPerson.gender,
        source: 'ADMIN',
      } as any)

      return hrApi.promote(personRes.data.id, {
        job_title: data.job_title,
        employment_type: data.employment_type as EmploymentType,
        hire_date: data.hire_date,
        salary_amount: data.salary_amount,
        pay_frequency: data.pay_frequency,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr'] })
      toast.success('New worker added and onboarded')
      onClose()
    },
    onError: (err: unknown) => toast.error(isAxiosError(err) ? (err.response?.data?.error?.message ?? 'Failed to add worker') : 'Failed to add worker'),
  })

  const canCreateNew = Boolean(newPerson.first_name && newPerson.last_name && newPerson.phone)

  return (
    <Modal open onClose={onClose} title="Onboard Worker" width={560}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button type="button" onClick={() => setMode('existing')} style={{ ...btnGhostSmall, borderColor: mode === 'existing' ? 'var(--accent-hr)' : 'var(--color-border)', color: mode === 'existing' ? 'var(--accent-hr)' : 'var(--color-text-muted)' }}>
          Existing Member
        </button>
        <button type="button" onClick={() => setMode('new')} style={{ ...btnGhostSmall, borderColor: mode === 'new' ? 'var(--accent-hr)' : 'var(--color-border)', color: mode === 'new' ? 'var(--accent-hr)' : 'var(--color-text-muted)' }}>
          New Member
        </button>
      </div>

      {mode === 'existing' && (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Find member by phone</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={lookupPhone} onChange={(e) => setLookupPhone(e.target.value)} placeholder="080XXXXXXXX" />
            <button type="button" onClick={() => lookupMutation.mutate()} style={btnPrimarySmall}><Search size={14} /></button>
          </div>
          {person && (
            <div style={{ marginTop: 10, padding: 12, border: '1px solid var(--color-success)', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600 }}>{person.first_name} {person.last_name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{person.phone}</div>
            </div>
          )}
        </div>
      )}

      {mode === 'new' && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>First name</label>
              <input className="input" value={newPerson.first_name} onChange={(e) => setNewPerson((v) => ({ ...v, first_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Last name</label>
              <input className="input" value={newPerson.last_name} onChange={(e) => setNewPerson((v) => ({ ...v, last_name: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Phone</label>
              <input className="input" value={newPerson.phone} onChange={(e) => setNewPerson((v) => ({ ...v, phone: e.target.value }))} placeholder="080XXXXXXXX" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input className="input" value={newPerson.email} onChange={(e) => setNewPerson((v) => ({ ...v, email: e.target.value }))} placeholder="optional" />
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit((data) => mode === 'existing' ? onboardExistingMutation.mutate(data) : onboardNewMutation.mutate(data))}>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Job title</label>
          <input className="input" {...register('job_title')} placeholder="e.g. Finance Officer" />
          {errors.job_title && <p style={errorStyle}>{errors.job_title.message}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Employment type</label>
            <select className="input" {...register('employment_type')}>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="VOLUNTEER_STAFF">Volunteer Staff</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Hire date</label>
            <input type="date" className="input" {...register('hire_date')} />
            {errors.hire_date && <p style={errorStyle}>{errors.hire_date.message}</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Salary amount</label>
            <input className="input" {...register('salary_amount')} placeholder="e.g. 150000" />
          </div>
          <div>
            <label style={labelStyle}>Pay frequency</label>
            <select className="input" {...register('pay_frequency')}>
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BI_WEEKLY">Bi-weekly</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
          <button
            type="submit"
            disabled={(mode === 'existing' && !person) || (mode === 'new' && !canCreateNew) || onboardExistingMutation.isPending || onboardNewMutation.isPending}
            style={btnPrimary}
          >
            {(onboardExistingMutation.isPending || onboardNewMutation.isPending) ? 'Saving...' : 'Onboard Worker'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function WorkerDrawer({ workerId, onClose }: { workerId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const { data: worker, isLoading } = useQuery({
    queryKey: ['hr', workerId],
    queryFn: () => hrApi.detail(workerId),
    select: (res) => res.data,
  })

  const [form, setForm] = useState({
    salary_amount: '',
    pay_frequency: 'MONTHLY',
    bank_name: '',
    account_number: '',
    account_name: '',
    probation_end: '',
    onboarding_status: 'IN_PROGRESS' as OnboardingStatus,
  })

  const statusMutation = useMutation({
    mutationFn: (status: EmploymentStatus) => hrApi.updateStatus(workerId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr'] })
      queryClient.invalidateQueries({ queryKey: ['hr', workerId] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const onboardMutation = useMutation({
    mutationFn: () => hrApi.onboard(workerId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr'] })
      queryClient.invalidateQueries({ queryKey: ['hr', workerId] })
      toast.success('Onboarding details saved')
    },
    onError: () => toast.error('Failed to save onboarding details'),
  })

  const terminateMutation = useMutation({
    mutationFn: () => {
      const reason = prompt('Termination reason?') ?? ''
      return hrApi.terminate(workerId, {
        termination_date: new Date().toISOString().split('T')[0],
        exit_reason: reason,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr'] })
      queryClient.invalidateQueries({ queryKey: ['hr', workerId] })
      toast.success('Worker terminated')
      onClose()
    },
    onError: () => toast.error('Termination failed'),
  })

  if (isLoading) return <div className="skeleton" style={{ height: 120 }} />
  if (!worker) return null

  const safeWorker = worker as WorkerProfile

  return (
    <div>
      <h3 style={{ margin: '0 0 6px', fontSize: 'var(--text-lg)' }}>{safeWorker.person_name ?? 'Worker'}</h3>
      <p style={{ margin: '0 0 14px', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{safeWorker.worker_id} | {safeWorker.job_title || 'No title'}</p>

      <div style={{ marginBottom: 14 }}>
        <StatusBadge status={safeWorker.employment_status} />
      </div>

      <div style={kvRow}><span style={muted}>Phone</span><span>{safeWorker.person_phone || '-'}</span></div>
      <div style={kvRow}><span style={muted}>Hire Date</span><span>{safeWorker.hire_date ? format(new Date(safeWorker.hire_date), 'PPP') : '-'}</span></div>
      <div style={kvRow}><span style={muted}>Salary</span><span>{safeWorker.salary_amount ? `NGN ${Number(safeWorker.salary_amount).toLocaleString()}` : '-'}</span></div>
      <div style={kvRow}><span style={muted}>Onboarding</span><span>{safeWorker.onboarding_status}</span></div>

      <h4 style={{ marginTop: 20, marginBottom: 8 }}>Onboarding / Payroll Setup</h4>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
        <input className="input" placeholder="Salary amount" value={form.salary_amount} onChange={(e) => setForm((v) => ({ ...v, salary_amount: e.target.value }))} />
        <select className="input" value={form.pay_frequency} onChange={(e) => setForm((v) => ({ ...v, pay_frequency: e.target.value }))}>
          <option value="MONTHLY">Monthly</option>
          <option value="WEEKLY">Weekly</option>
          <option value="BI_WEEKLY">Bi-weekly</option>
        </select>
        <input className="input" placeholder="Bank name" value={form.bank_name} onChange={(e) => setForm((v) => ({ ...v, bank_name: e.target.value }))} />
        <input className="input" placeholder="Account number" value={form.account_number} onChange={(e) => setForm((v) => ({ ...v, account_number: e.target.value }))} />
        <input className="input" placeholder="Account name" value={form.account_name} onChange={(e) => setForm((v) => ({ ...v, account_name: e.target.value }))} />
        <input type="date" className="input" value={form.probation_end} onChange={(e) => setForm((v) => ({ ...v, probation_end: e.target.value }))} />
      </div>
      <div style={{ marginTop: 10 }}>
        <select className="input" value={form.onboarding_status} onChange={(e) => setForm((v) => ({ ...v, onboarding_status: e.target.value as OnboardingStatus }))}>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={() => onboardMutation.mutate()} style={btnPrimarySmall}><Save size={13} /> Save HR Setup</button>
        <button onClick={() => statusMutation.mutate('ON_LEAVE')} style={btnGhostSmall}>On Leave</button>
        <button onClick={() => statusMutation.mutate('ACTIVE')} style={btnGhostSmall}>Set Active</button>
        <button onClick={() => statusMutation.mutate('SUSPENDED')} style={btnGhostSmall}>Suspend</button>
        <button onClick={() => terminateMutation.mutate()} style={btnDangerSmall}><UserX size={13} /> Terminate</button>
      </div>
    </div>
  )
}

export default function HRPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EmploymentStatus | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [onboardOpen, setOnboardOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const params = useMemo(() => {
    const out: Record<string, string> = {}
    if (debouncedSearch) out.search = debouncedSearch
    if (status) out.employment_status = status
    return out
  }, [debouncedSearch, status])

  const { data: workers, isLoading } = useQuery({
    queryKey: ['hr', params],
    queryFn: () => hrApi.list(params),
    select: (res) => res.data.results,
  })

  const columns: ColumnDef<WorkerProfile>[] = [
    {
      header: 'Worker',
      accessorKey: 'person_name',
      cell: ({ row, getValue }) => (
        <button onClick={() => setSelectedId(row.original.id)} style={{ border: 'none', background: 'none', padding: 0, color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
          {getValue() as string}
        </button>
      ),
    },
    { header: 'Phone', accessorKey: 'person_phone' },
    { header: 'Worker ID', accessorKey: 'worker_id' },
    { header: 'Title', accessorKey: 'job_title' },
    { header: 'Type', accessorKey: 'employment_type' },
    {
      header: 'Status',
      accessorKey: 'employment_status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as EmploymentStatus} />,
    },
    {
      header: 'Salary',
      accessorKey: 'salary_amount',
      cell: ({ getValue }) => {
        const val = getValue() as string | null
        return val ? `NGN ${Number(val).toLocaleString()}` : '-'
      },
    },
  ]

  const table = useReactTable({
    data: workers ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>HR and Payroll Workers</h1>
          <p style={{ marginTop: 4, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Manage paid workers from onboarding through termination.
          </p>
        </div>
        <button onClick={() => setOnboardOpen(true)} style={btnPrimary}><UserPlus size={14} /> Add / Onboard Worker</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="input" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value as EmploymentStatus | '')}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} style={thStyle}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={columns.length} style={{ padding: 14 }}><div className="skeleton" style={{ height: 14 }} /></td></tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                  <Briefcase size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.4 }} />
                  No workers found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  {row.getVisibleCells().map((cell) => <td key={cell.id} style={tdStyle}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={!!selectedId} onClose={() => setSelectedId(null)} title="Worker Details" width={520}>
        {selectedId && <WorkerDrawer workerId={selectedId} onClose={() => setSelectedId(null)} />}
      </Drawer>

      {onboardOpen && <OnboardWorkerModal onClose={() => setOnboardOpen(false)} />}
    </div>
  )
}

const labelStyle: CSSProperties = { display: 'block', marginBottom: 6, fontSize: 'var(--text-sm)', fontWeight: 500 }
const errorStyle: CSSProperties = { marginTop: 4, color: 'var(--color-danger)', fontSize: 11 }
const thStyle: CSSProperties = { textAlign: 'left', padding: '12px 14px', fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--color-text-muted)', background: 'var(--color-surface-alt)' }
const tdStyle: CSSProperties = { padding: '12px 14px', fontSize: 'var(--text-sm)' }
const kvRow: CSSProperties = { display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }
const muted: CSSProperties = { color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }
const btnPrimary: CSSProperties = { height: 40, padding: '0 16px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--accent-hr)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }
const btnPrimarySmall: CSSProperties = { ...btnPrimary, height: 34, padding: '0 12px', fontSize: 'var(--text-xs)' }
const btnGhost: CSSProperties = { height: 40, padding: '0 14px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer' }
const btnGhostSmall: CSSProperties = { ...btnGhost, height: 32, padding: '0 10px', fontSize: 'var(--text-xs)' }
const btnDangerSmall: CSSProperties = { ...btnGhostSmall, border: '1.5px solid var(--color-danger)', color: 'var(--color-danger)' }
