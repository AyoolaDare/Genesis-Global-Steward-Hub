import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable, getCoreRowModel, flexRender, type ColumnDef,
} from '@tanstack/react-table'
import {
  HandCoins, Search, UserPlus, Plus, ChevronRight,
  TrendingUp, Wallet, CircleDollarSign, Users, User,
  MessageSquare, LayoutList, GitBranch, CheckCircle2,
  Clock, AlertTriangle, Send, Heart, BookOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDebounce } from '@/hooks/useDebounce'
import { useIsMobile } from '@/hooks/useIsMobile'
import Drawer from '@/components/ui/Drawer'
import Modal from '@/components/ui/Modal'
import {
  sponsorsApi,
  type SponsorListItem, type SponsorDetail, type SponsorMessage,
  type PersonDetails, type PipelineSponsor,
  type PaymentMethod, type Frequency,
} from '@/api/sponsors'

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)

const STATUS_CLR: Record<string, [string, string]> = {
  ACTIVE:   ['rgba(16,185,129,0.12)', 'var(--color-success)'],
  INACTIVE: ['rgba(107,114,128,0.12)', '#6B7280'],
  LAPSED:   ['rgba(239,68,68,0.12)', 'var(--color-danger)'],
}

const PMT_CLR: Record<string, [string, string]> = {
  CONFIRMED: ['rgba(16,185,129,0.12)', 'var(--color-success)'],
  PENDING:   ['rgba(250,219,27,0.14)', 'var(--brand-deep)'],
  FAILED:    ['rgba(239,68,68,0.12)', 'var(--color-danger)'],
}

const MSG_ICON: Record<string, React.ReactNode> = {
  THANK_YOU: <Heart size={12} />,
  GREETING:  <MessageSquare size={12} />,
  PRAYER:    <BookOpen size={12} />,
  CUSTOM:    <Send size={12} />,
}

const MSG_LABEL: Record<string, string> = {
  THANK_YOU: 'Thank You',
  GREETING:  'Greeting',
  PRAYER:    'Prayer',
  CUSTOM:    'Custom',
}

function StatusPill({ val, cfg }: { val: string; cfg: Record<string, [string, string]> }) {
  const [bg, fg] = cfg[val] ?? ['#f3f4f6', '#6b7280']
  return (
    <span style={{
      background: bg, color: fg, padding: '2px 10px',
      borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {val.replace(/_/g, ' ')}
    </span>
  )
}

/* ── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--gg-border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 'var(--radius-md)',
        background: `${accent}18`, color: accent, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, color: 'var(--gg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem,2vw,1.4rem)', fontWeight: 600, color: 'var(--gg-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

/* ── Modals ──────────────────────────────────────────────────────────────── */

const addSchema = z.object({
  name:         z.string().min(2, 'Name is required'),
  email:        z.string().email('Invalid email').optional().or(z.literal('')),
  phone:        z.string().optional(),
  sponsor_type: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
  status:       z.enum(['ACTIVE', 'INACTIVE', 'LAPSED']),
  notes:        z.string().optional(),
})
type AddForm = z.infer<typeof addSchema>

function AddSponsorModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<AddForm>({ resolver: zodResolver(addSchema), defaultValues: { sponsor_type: 'INDIVIDUAL', status: 'ACTIVE' } })

  const mutation = useMutation({
    mutationFn: (data: AddForm) =>
      sponsorsApi.create({ ...data, email: data.email || '', phone: data.phone || '' }),
    onSuccess: () => {
      toast.success('Sponsor added')
      qc.invalidateQueries({ queryKey: ['sponsors'] })
      qc.invalidateQueries({ queryKey: ['sponsor-stats'] })
      onClose()
    },
    onError: () => toast.error('Failed to add sponsor'),
  })

  return (
    <Modal open title="Add sponsor" onClose={onClose} width={480}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Full name / Organisation name" error={errors.name?.message}>
          <input className="input" placeholder="e.g. Olabisi Oludare" {...register('name')} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Type">
            <select className="input" {...register('sponsor_type')}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="ORGANIZATION">Organization</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="input" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LAPSED">Lapsed</option>
            </select>
          </Field>
        </div>
        <Field label="Email" error={errors.email?.message}>
          <input className="input" type="email" placeholder="sponsor@example.com" {...register('email')} />
        </Field>
        <Field label="Phone">
          <input className="input" type="tel" placeholder="08012345678" {...register('phone')} />
        </Field>
        <Field label="Notes">
          <textarea className="input" rows={3} style={{ height: 'auto', paddingTop: 10 }} {...register('notes')} />
        </Field>
        <button type="submit" disabled={isSubmitting} style={CTA_BTN}>
          {isSubmitting ? 'Adding…' : 'Add sponsor'}
        </button>
      </form>
    </Modal>
  )
}

const pmtSchema = z.object({
  commitment:     z.string().optional(),
  amount:         z.string().min(1, 'Amount is required'),
  payment_method: z.enum(['PAYSTACK', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'OTHER']),
  payment_date:   z.string().min(1, 'Date is required'),
  reference:      z.string().optional(),
  status:         z.enum(['PENDING', 'CONFIRMED', 'FAILED']),
  notes:          z.string().optional(),
})
type PmtForm = z.infer<typeof pmtSchema>

function RecordPaymentModal({ sponsor, onClose }: { sponsor: SponsorDetail; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<PmtForm>({
      resolver: zodResolver(pmtSchema),
      defaultValues: { payment_method: 'CASH', status: 'CONFIRMED', payment_date: new Date().toISOString().split('T')[0] },
    })

  const mutation = useMutation({
    mutationFn: (data: PmtForm) =>
      sponsorsApi.addPayment(sponsor.id, {
        commitment: data.commitment || undefined,
        amount: parseFloat(data.amount),
        payment_method: data.payment_method as PaymentMethod,
        payment_date: data.payment_date,
        reference: data.reference || '',
        status: data.status as any,
        notes: data.notes || '',
      }),
    onSuccess: () => {
      toast.success('Payment recorded')
      qc.invalidateQueries({ queryKey: ['sponsor', sponsor.id] })
      qc.invalidateQueries({ queryKey: ['sponsors'] })
      qc.invalidateQueries({ queryKey: ['sponsor-stats'] })
      qc.invalidateQueries({ queryKey: ['sponsor-pipeline'] })
      onClose()
    },
    onError: () => toast.error('Failed to record payment'),
  })

  return (
    <Modal open title="Record payment" onClose={onClose} width={440}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sponsor.commitments.filter(c => c.is_active).length > 0 && (
          <Field label="Link to commitment (optional)">
            <select className="input" {...register('commitment')}>
              <option value="">— Unlinked payment —</option>
              {sponsor.commitments.filter(c => c.is_active).map(c => (
                <option key={c.id} value={c.id}>
                  {c.project || 'General'} — {fmt(c.amount)} / {c.frequency.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Amount (₦)" error={errors.amount?.message}>
          <input className="input" type="number" step="0.01" placeholder="50000" {...register('amount')} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Method">
            <select className="input" {...register('payment_method')}>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="PAYSTACK">Paystack</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="input" {...register('status')}>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </Field>
        </div>
        <Field label="Payment date" error={errors.payment_date?.message}>
          <input className="input" type="date" {...register('payment_date')} />
        </Field>
        <Field label="Reference / receipt number">
          <input className="input" placeholder="e.g. TRF-20250425" {...register('reference')} />
        </Field>
        <Field label="Notes">
          <textarea className="input" rows={2} style={{ height: 'auto', paddingTop: 10 }} {...register('notes')} />
        </Field>
        <button type="submit" disabled={isSubmitting} style={CTA_BTN}>
          {isSubmitting ? 'Saving…' : 'Record payment'}
        </button>
      </form>
    </Modal>
  )
}

const cmtSchema = z.object({
  project:    z.string().optional(),
  amount:     z.string().min(1, 'Amount is required'),
  frequency:  z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'ANNUAL']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date:   z.string().optional(),
  notes:      z.string().optional(),
})
type CmtForm = z.infer<typeof cmtSchema>

function AddCommitmentModal({ sponsor, onClose }: { sponsor: SponsorDetail; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<CmtForm>({
      resolver: zodResolver(cmtSchema),
      defaultValues: { frequency: 'ONE_TIME', start_date: new Date().toISOString().split('T')[0] },
    })

  const mutation = useMutation({
    mutationFn: (data: CmtForm) =>
      sponsorsApi.addCommitment(sponsor.id, {
        project: data.project || '',
        amount: parseFloat(data.amount),
        frequency: data.frequency as Frequency,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        notes: data.notes || '',
      }),
    onSuccess: () => {
      toast.success('Commitment added')
      qc.invalidateQueries({ queryKey: ['sponsor', sponsor.id] })
      qc.invalidateQueries({ queryKey: ['sponsors'] })
      qc.invalidateQueries({ queryKey: ['sponsor-stats'] })
      onClose()
    },
    onError: () => toast.error('Failed to add commitment'),
  })

  return (
    <Modal open title="Add commitment" onClose={onClose} width={440}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Project / Purpose">
          <input className="input" placeholder="e.g. Building Fund, Mission Trip…" {...register('project')} />
        </Field>
        <Field label="Pledge amount (₦)" error={errors.amount?.message}>
          <input className="input" type="number" step="0.01" placeholder="200000" {...register('amount')} />
        </Field>
        <Field label="Frequency">
          <select className="input" {...register('frequency')}>
            <option value="ONE_TIME">One-time</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Annual</option>
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Start date" error={errors.start_date?.message}>
            <input className="input" type="date" {...register('start_date')} />
          </Field>
          <Field label="End date (optional)">
            <input className="input" type="date" {...register('end_date')} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea className="input" rows={2} style={{ height: 'auto', paddingTop: 10 }} {...register('notes')} />
        </Field>
        <button type="submit" disabled={isSubmitting} style={CTA_BTN}>
          {isSubmitting ? 'Saving…' : 'Add commitment'}
        </button>
      </form>
    </Modal>
  )
}

/* ── Member Profile Panel ────────────────────────────────────────────────── */
function MemberProfile({ p }: { p: PersonDetails }) {
  return (
    <div style={{ padding: '0 20px 24px' }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        {p.profile_photo ? (
          <img
            src={p.profile_photo}
            alt={p.full_name}
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gg-border-subtle)' }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--brand-yellow)', color: 'var(--gg-text-on-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
          }}>
            {p.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--gg-text-primary)' }}>{p.full_name}</div>
          <div style={{ fontSize: 12, color: 'var(--gg-text-secondary)', marginTop: 2 }}>
            {p.status.replace('_', ' ')} · {p.phone}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <dl style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 10, columnGap: 12, margin: 0 }}>
        {p.email          && <><dt style={DT}>Email</dt><dd style={DD}>{p.email}</dd></>}
        {p.date_of_birth  && <><dt style={DT}>Date of birth</dt><dd style={DD}>{format(new Date(p.date_of_birth), 'dd MMM yyyy')}</dd></>}
        {p.gender         && <><dt style={DT}>Gender</dt><dd style={DD}>{p.gender.charAt(0) + p.gender.slice(1).toLowerCase()}</dd></>}
        {p.marital_status && <><dt style={DT}>Marital status</dt><dd style={DD}>{p.marital_status}</dd></>}
        {p.occupation     && <><dt style={DT}>Occupation</dt><dd style={DD}>{p.occupation}</dd></>}
        {p.address        && <><dt style={DT}>Address</dt><dd style={DD}>{[p.address, p.landmark, p.state].filter(Boolean).join(', ')}</dd></>}
        {p.joined_date    && <><dt style={DT}>Joined</dt><dd style={DD}>{format(new Date(p.joined_date), 'dd MMM yyyy')}</dd></>}
        {p.baptized && <>
          <dt style={DT}>Baptized</dt>
          <dd style={DD}>
            Yes{p.baptism_date ? ` — ${format(new Date(p.baptism_date), 'dd MMM yyyy')}` : ''}
          </dd>
        </>}
      </dl>
    </div>
  )
}

/* ── Messages Panel ──────────────────────────────────────────────────────── */
function MessagesPanel({ sponsorId, sponsorName }: { sponsorId: string; sponsorName: string }) {
  const qc = useQueryClient()
  const { data: msgs = [], isLoading } = useQuery({
    queryKey: ['sponsor-messages', sponsorId],
    queryFn:  () => sponsorsApi.messages(sponsorId).then(r => r.data),
  })

  const sendMutation = useMutation({
    mutationFn: (type: 'GREETING' | 'PRAYER') => sponsorsApi.sendMessage(sponsorId, type),
    onSuccess: (_, type) => {
      toast.success(`${MSG_LABEL[type]} sent to ${sponsorName}`)
      qc.invalidateQueries({ queryKey: ['sponsor-messages', sponsorId] })
      qc.invalidateQueries({ queryKey: ['sponsor', sponsorId] })
    },
    onError: () => toast.error('Failed to send message'),
  })

  return (
    <div style={{ padding: '0 20px 24px' }}>
      {/* Send buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          style={{ ...GHOST_BTN, display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={sendMutation.isPending}
          onClick={() => sendMutation.mutate('GREETING')}
        >
          <Heart size={13} /> Send Greeting
        </button>
        <button
          style={{ ...GHOST_BTN, display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={sendMutation.isPending}
          onClick={() => sendMutation.mutate('PRAYER')}
        >
          <BookOpen size={13} /> Send Prayer
        </button>
      </div>

      {/* History */}
      <SectionTitle>Message history</SectionTitle>
      {isLoading ? (
        <div>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 6 }} />)}</div>
      ) : msgs.length === 0 ? (
        <Empty>No messages sent yet</Empty>
      ) : (
        <div>
          {msgs.map(m => (
            <div key={m.id} style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--gg-border-subtle)',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: m.success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: m.success ? 'var(--color-success)' : 'var(--color-danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {MSG_ICON[m.message_type]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gg-text-primary)' }}>
                    {MSG_LABEL[m.message_type]}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--gg-text-secondary)' }}>
                    {format(new Date(m.sent_at), 'dd MMM yyyy, HH:mm')}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gg-text-secondary)', lineHeight: 1.5 }}>
                  {m.body.length > 100 ? `${m.body.slice(0, 100)}…` : m.body}
                </div>
                <div style={{ fontSize: 10, color: m.success ? 'var(--color-success)' : 'var(--color-danger)', marginTop: 3, fontWeight: 500 }}>
                  {m.success ? 'Delivered' : 'Failed'}{m.sent_by_name ? ` · by ${m.sent_by_name}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Sponsor Detail Drawer ───────────────────────────────────────────────── */
type DrawerTab = 'overview' | 'member' | 'messages'

function SponsorDrawer({ sponsorId, onClose }: { sponsorId: string; onClose: () => void }) {
  const [tab, setTab] = useState<DrawerTab>('overview')
  const [showPmtModal, setShowPmtModal] = useState(false)
  const [showCmtModal, setShowCmtModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['sponsor', sponsorId],
    queryFn: () => sponsorsApi.get(sponsorId).then(r => r.data),
  })

  if (isLoading || !data) {
    return (
      <Drawer open title="Sponsor" onClose={onClose}>
        <div style={{ padding: 24 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 20, marginBottom: 12, borderRadius: 6 }} />
          ))}
        </div>
      </Drawer>
    )
  }

  const s = data

  return (
    <>
      <Drawer open title={s.name} onClose={onClose}>
        {/* Header strip */}
        <div style={{
          background: 'var(--gg-surface-raised)',
          borderBottom: '1px solid var(--gg-border-subtle)',
          padding: '14px 20px',
          display: 'flex', flexWrap: 'wrap', gap: 8,
        }}>
          <StatusPill val={s.status} cfg={STATUS_CLR} />
          <span style={TAG}>{s.sponsor_id}</span>
          <span style={TAG}>{s.sponsor_type}</span>
        </div>

        {/* Financial summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--gg-border-subtle)' }}>
          {([['Committed', s.total_committed], ['Paid', s.total_paid], ['Outstanding', s.outstanding]] as [string, number][]).map(([label, val]) => (
            <div key={label} style={{ background: 'var(--gg-surface)', padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--gg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                {label}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: label === 'Outstanding' && val > 0 ? 'var(--gg-danger)' : 'var(--gg-text-primary)' }}>
                {fmt(val)}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gg-border-subtle)', paddingLeft: 20, gap: 0 }}>
          {([
            ['overview', 'Overview', <LayoutList size={13} />],
            ['member',   'Member',   <User size={13} />],
            ['messages', 'Messages', <MessageSquare size={13} />],
          ] as [DrawerTab, string, React.ReactNode][]).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 40, padding: '0 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: tab === id ? 600 : 400,
                color: tab === id ? 'var(--brand-deep)' : 'var(--gg-text-secondary)',
                borderBottom: tab === id ? '2px solid var(--brand-yellow)' : '2px solid transparent',
                marginBottom: -1,
                fontFamily: 'var(--font-body)',
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ overflowY: 'auto', paddingBottom: 24 }}>
          {tab === 'overview' && (
            <>
              {/* Contact */}
              <section style={{ padding: '16px 20px 0' }}>
                <SectionTitle>Contact</SectionTitle>
                <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 8, columnGap: 12, margin: 0 }}>
                  {s.email        && <><dt style={DT}>Email</dt><dd style={DD}>{s.email}</dd></>}
                  {s.phone        && <><dt style={DT}>Phone</dt><dd style={DD}>{s.phone}</dd></>}
                  {s.person_name  && <><dt style={DT}>Member</dt><dd style={DD}>{s.person_name}</dd></>}
                  <dt style={DT}>Since</dt>
                  <dd style={DD}>{format(new Date(s.created_at), 'dd MMM yyyy')}</dd>
                </dl>
              </section>

              {/* Commitments */}
              <section style={{ padding: '16px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <SectionTitle>Commitments</SectionTitle>
                  <button style={GHOST_BTN} onClick={() => setShowCmtModal(true)}>
                    <Plus size={13} /> Add
                  </button>
                </div>
                {s.commitments.length === 0 ? <Empty>No commitments yet</Empty>
                  : s.commitments.map(c => (
                    <div key={c.id} style={{ border: '1px solid var(--gg-border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 8, background: 'var(--gg-surface)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{c.project || 'General fund'}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: c.is_active ? 'var(--color-success)' : '#9CA3AF' }}>
                          {c.is_active ? 'Active' : 'Ended'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[['Pledged', fmt(c.amount)], ['Paid', fmt(c.total_paid)], ['Balance', fmt(c.outstanding)]].map(([k, v]) => (
                          <div key={k}>
                            <div style={{ fontSize: 10, color: 'var(--gg-text-secondary)', textTransform: 'uppercase' }}>{k}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--gg-text-secondary)' }}>
                        {c.frequency.replace('_', ' ')} · from {format(new Date(c.start_date), 'dd MMM yyyy')}
                        {c.end_date && ` · to ${format(new Date(c.end_date), 'dd MMM yyyy')}`}
                      </div>
                    </div>
                  ))
                }
              </section>

              {/* Payments */}
              <section style={{ padding: '16px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <SectionTitle>Payment history</SectionTitle>
                  <button style={GHOST_BTN} onClick={() => setShowPmtModal(true)}>
                    <Plus size={13} /> Record
                  </button>
                </div>
                {s.payments.length === 0 ? <Empty>No payments recorded yet</Empty>
                  : [...s.payments].reverse().map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gg-border-subtle)', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <StatusPill val={p.status} cfg={PMT_CLR} />
                          <span style={{ fontSize: 11, color: 'var(--gg-text-secondary)' }}>{p.payment_method.replace('_', ' ')}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gg-text-secondary)' }}>
                          {format(new Date(p.payment_date), 'dd MMM yyyy')}
                          {p.reference && ` · ${p.reference}`}
                          {p.commitment_project && ` · ${p.commitment_project}`}
                        </div>
                        {p.recorded_by_name && (
                          <div style={{ fontSize: 10, color: 'var(--gg-text-disabled)', marginTop: 2 }}>
                            Recorded by {p.recorded_by_name}
                          </div>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {fmt(p.amount)}
                      </div>
                    </div>
                  ))
                }
              </section>

              {s.notes && (
                <section style={{ padding: '16px 20px 0' }}>
                  <SectionTitle>Notes</SectionTitle>
                  <p style={{ fontSize: 13, color: 'var(--gg-text-secondary)', lineHeight: 1.6, margin: 0 }}>{s.notes}</p>
                </section>
              )}
            </>
          )}

          {tab === 'member' && (
            s.person_details
              ? <MemberProfile p={s.person_details} />
              : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gg-text-secondary)' }}>
                  <User size={36} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                  <p style={{ margin: 0, fontWeight: 500 }}>No linked member</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13 }}>Link this sponsor to a member profile to see their details</p>
                </div>
              )
          )}

          {tab === 'messages' && (
            <MessagesPanel sponsorId={s.id} sponsorName={s.name} />
          )}
        </div>
      </Drawer>

      {showPmtModal && <RecordPaymentModal sponsor={s} onClose={() => setShowPmtModal(false)} />}
      {showCmtModal && <AddCommitmentModal sponsor={s} onClose={() => setShowCmtModal(false)} />}
    </>
  )
}

/* ── Pipeline view ───────────────────────────────────────────────────────── */
function PipelineCard({ s, onOpen }: { s: PipelineSponsor; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--gg-border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'box-shadow 120ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gg-text-primary)' }}>{s.name}</div>
          {s.person_name && <div style={{ fontSize: 11, color: 'var(--gg-text-secondary)', marginTop: 1 }}>{s.person_name}</div>}
        </div>
        <ChevronRight size={14} style={{ color: 'var(--gg-text-secondary)', flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
        <span>
          <span style={{ color: 'var(--gg-text-secondary)' }}>Paid: </span>
          <span style={{ fontWeight: 600, color: 'var(--color-success)', fontVariantNumeric: 'tabular-nums' }}>{fmt(s.total_paid)}</span>
        </span>
        {s.outstanding > 0 && (
          <span>
            <span style={{ color: 'var(--gg-text-secondary)' }}>Owes: </span>
            <span style={{ fontWeight: 600, color: 'var(--gg-danger)', fontVariantNumeric: 'tabular-nums' }}>{fmt(s.outstanding)}</span>
          </span>
        )}
      </div>
      {s.phone && <div style={{ fontSize: 11, color: 'var(--gg-text-secondary)', marginTop: 4 }}>{s.phone}</div>}
    </div>
  )
}

interface PipelineColumnProps {
  title: string
  icon: React.ReactNode
  accent: string
  sponsors: PipelineSponsor[]
  onOpen: (id: string) => void
}

function PipelineColumn({ title, icon, accent, sponsors, onOpen }: PipelineColumnProps) {
  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        padding: '10px 14px', borderRadius: 'var(--radius-md)',
        background: `${accent}14`, border: `1px solid ${accent}28`,
      }}>
        <span style={{ color: accent }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--gg-text-primary)' }}>{title}</span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, fontWeight: 700,
          background: accent, color: '#fff',
          borderRadius: 'var(--radius-full)', padding: '1px 8px',
        }}>
          {sponsors.length}
        </span>
      </div>
      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sponsors.length === 0
          ? <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gg-text-secondary)', fontSize: 13, fontStyle: 'italic' }}>None</div>
          : sponsors.map(s => <PipelineCard key={s.id} s={s} onOpen={() => onOpen(s.id)} />)
        }
      </div>
    </div>
  )
}

function PipelineView({ onOpen }: { onOpen: (id: string) => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['sponsor-pipeline'],
    queryFn:  () => sponsorsApi.pipeline().then(r => r.data),
    staleTime: 30_000,
  })

  const prayerMutation = useMutation({
    mutationFn: sponsorsApi.bulkPrayers,
    onSuccess: (r) => toast.success(`Prayer SMS sent — ${r.data.sent} delivered, ${r.data.failed} failed`),
    onError:   () => toast.error('Failed to send bulk prayers'),
  })

  const greetingMutation = useMutation({
    mutationFn: sponsorsApi.bulkGreetings,
    onSuccess: (r) => toast.success(`Greeting SMS sent — ${r.data.sent} delivered, ${r.data.failed} failed`),
    onError:   () => toast.error('Failed to send bulk greetings'),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 16 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ flex: 1 }}>
            {[...Array(4)].map((_, j) => <div key={j} className="skeleton" style={{ height: 88, marginBottom: 8, borderRadius: 8 }} />)}
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      {/* Bulk action bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--gg-text-secondary)', marginRight: 4 }}>Broadcast to all active sponsors:</span>
        <button
          style={{ ...GHOST_BTN, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          disabled={greetingMutation.isPending}
          onClick={() => greetingMutation.mutate()}
        >
          <Heart size={13} /> Send Greeting
        </button>
        <button
          style={{ ...GHOST_BTN, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          disabled={prayerMutation.isPending}
          onClick={() => prayerMutation.mutate()}
        >
          <BookOpen size={13} /> Send Prayer
        </button>
      </div>

      {/* 3 columns */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <PipelineColumn
          title="Paid This Month"
          icon={<CheckCircle2 size={15} />}
          accent="var(--color-success)"
          sponsors={data.paid_this_month.sponsors}
          onOpen={onOpen}
        />
        <PipelineColumn
          title="Pending Confirmation"
          icon={<Clock size={15} />}
          accent="var(--brand-mid)"
          sponsors={data.pending.sponsors}
          onOpen={onOpen}
        />
        <PipelineColumn
          title="Overdue / At-Risk"
          icon={<AlertTriangle size={15} />}
          accent="var(--gg-danger)"
          sponsors={data.overdue.sponsors}
          onOpen={onOpen}
        />
      </div>
    </div>
  )
}

/* ── Directory view ──────────────────────────────────────────────────────── */
function DirectoryView({ onOpen }: { onOpen: (id: string) => void }) {
  const isMobile = useIsMobile()
  const [search, setSearch]   = useState('')
  const [statusF, setStatusF] = useState('')
  const [typeF, setTypeF]     = useState('')
  const dSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['sponsors', dSearch, statusF, typeF],
    queryFn:  () => sponsorsApi.list({
      search:       dSearch || undefined,
      status:       statusF || undefined,
      sponsor_type: typeF   || undefined,
    }).then(r => r.data),
    staleTime: 10_000,
  })

  const sponsors: SponsorListItem[] = data?.results ?? []

  const columns = useMemo<ColumnDef<SponsorListItem>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Sponsor',
      cell: ({ row: { original: s } }) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</div>
          <div style={{ fontSize: 11, color: 'var(--gg-text-secondary)' }}>
            {s.sponsor_id}{s.phone ? ` · ${s.phone}` : ''}
          </div>
          {s.person_name && <div style={{ fontSize: 11, color: 'var(--gg-text-secondary)' }}>Member: {s.person_name}</div>}
        </div>
      ),
    },
    ...(!isMobile ? [{
      accessorKey: 'sponsor_type',
      header: 'Type',
      cell: ({ getValue }: any) => (
        <span style={{ fontSize: 12, color: 'var(--gg-text-secondary)' }}>
          {(getValue() as string).charAt(0) + (getValue() as string).slice(1).toLowerCase()}
        </span>
      ),
    }] : []),
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusPill val={getValue() as string} cfg={STATUS_CLR} />,
    },
    {
      accessorKey: 'total_committed',
      header: 'Committed',
      cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{fmt(getValue() as number)}</span>,
    },
    {
      accessorKey: 'total_paid',
      header: 'Paid',
      cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, color: 'var(--color-success)', fontWeight: 600 }}>{fmt(getValue() as number)}</span>,
    },
    ...(!isMobile ? [{
      accessorKey: 'outstanding',
      header: 'Outstanding',
      cell: ({ getValue }: any) => {
        const v = getValue() as number
        return <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, color: v > 0 ? 'var(--gg-danger)' : 'var(--gg-text-secondary)', fontWeight: v > 0 ? 600 : 400 }}>{fmt(v)}</span>
      },
    }, {
      accessorKey: 'last_payment',
      header: 'Last payment',
      cell: ({ getValue }: any) => {
        const v = getValue() as string | null
        return <span style={{ fontSize: 12, color: 'var(--gg-text-secondary)' }}>{v ? format(new Date(v), 'dd MMM yyyy') : '—'}</span>
      },
    }] : []),
    {
      id: 'open',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={e => { e.stopPropagation(); onOpen(row.original.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gg-text-secondary)', display: 'flex', padding: 4 }}
        >
          <ChevronRight size={16} />
        </button>
      ),
    },
  ], [isMobile])

  const table = useReactTable({ data: sponsors, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gg-text-secondary)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by name, phone, ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: 110 }} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="LAPSED">Lapsed</option>
        </select>
        <select className="input" style={{ width: 'auto', minWidth: 120 }} value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option value="">All types</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="ORGANIZATION">Organization</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--gg-border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 32 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 8 }} />)}
          </div>
        ) : sponsors.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center', color: 'var(--gg-text-secondary)' }}>
            <HandCoins size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p style={{ margin: 0, fontWeight: 500 }}>No sponsors found</p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>Add a sponsor to start tracking their contributions</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id} style={{ borderBottom: '1px solid var(--gg-border-subtle)', background: 'var(--gg-surface-raised)' }}>
                    {hg.headers.map(h => (
                      <th key={h.id} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--gg-text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => onOpen(row.original.id)}
                    style={{ borderBottom: '1px solid var(--gg-border-subtle)', cursor: 'pointer', transition: 'background 120ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--gg-surface-raised)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && sponsors.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--gg-border-subtle)', fontSize: 12, color: 'var(--gg-text-secondary)' }}>
            {data?.count ?? sponsors.length} sponsor{(data?.count ?? sponsors.length) !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
type PageView = 'directory' | 'pipeline'

export default function SponsorsPage() {
  const isMobile    = useIsMobile()
  const [view, setView]         = useState<PageView>('directory')
  const [addOpen, setAddOpen]   = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['sponsor-stats'],
    queryFn:  () => sponsorsApi.stats().then(r => r.data),
    staleTime: 30_000,
  })

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(250,219,27,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-mid)' }}>
            <HandCoins size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem,2vw,1.25rem)', fontWeight: 600, letterSpacing: '0.05em' }}>Sponsors</h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--gg-text-secondary)' }}>Track commitments, payments, and care</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--gg-surface-raised)', border: '1px solid var(--gg-border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {([['directory', <LayoutList size={14} />, 'Directory'], ['pipeline', <GitBranch size={14} />, 'Pipeline']] as [PageView, React.ReactNode, string][]).map(([v, icon, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 36, padding: '0 14px',
                  background: view === v ? 'var(--brand-yellow)' : 'transparent',
                  color: view === v ? 'var(--gg-text-on-accent)' : 'var(--gg-text-secondary)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: view === v ? 600 : 400,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {icon} {!isMobile && label}
              </button>
            ))}
          </div>
          <button onClick={() => setAddOpen(true)} style={CTA_BTN}>
            <UserPlus size={15} /> Add sponsor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total sponsors"  value={String(stats?.total_sponsors  ?? '—')} icon={<Users size={18} />}           accent="var(--brand-mid)" />
        <StatCard label="Active"          value={String(stats?.active_sponsors ?? '—')} icon={<TrendingUp size={18} />}       accent="var(--color-success)" />
        <StatCard label="Total committed" value={stats ? fmt(stats.total_committed) : '—'} icon={<CircleDollarSign size={18} />} accent="var(--gg-blue-200)" />
        <StatCard label="Total paid"      value={stats ? fmt(stats.total_paid)      : '—'} icon={<Wallet size={18} />}          accent="var(--color-success)" />
        <StatCard label="Outstanding"     value={stats ? fmt(stats.outstanding)     : '—'} icon={<HandCoins size={18} />}       accent="var(--gg-danger)" />
      </div>

      {/* View content */}
      {view === 'directory'
        ? <DirectoryView onOpen={setSelectedId} />
        : <PipelineView  onOpen={setSelectedId} />
      }

      {/* Modals / Drawer */}
      {addOpen    && <AddSponsorModal onClose={() => setAddOpen(false)} />}
      {selectedId && <SponsorDrawer sponsorId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}

/* ── Shared micro-components ─────────────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--gg-text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: 'var(--gg-danger)', fontSize: 11, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 500, color: 'var(--gg-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      {children}
    </p>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: 'var(--gg-text-secondary)', fontStyle: 'italic', margin: 0, padding: '8px 0' }}>{children}</p>
}

/* ── Style constants ─────────────────────────────────────────────────────── */
const CTA_BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 40, padding: '0 18px',
  background: 'var(--brand-yellow)', color: 'var(--gg-text-on-accent)',
  border: 'none', borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap',
  transition: 'filter 150ms',
}

const GHOST_BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  height: 30, padding: '0 12px',
  background: 'var(--gg-surface-raised)', color: 'var(--gg-text-secondary)',
  border: '1px solid var(--gg-border-subtle)', borderRadius: 'var(--radius-sm)',
  fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer',
}

const DT: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: 'var(--gg-text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.07em', paddingTop: 2, margin: 0,
}

const DD: React.CSSProperties = {
  fontSize: 13, color: 'var(--gg-text-primary)', margin: 0, wordBreak: 'break-all',
}

const TAG: React.CSSProperties = {
  fontSize: 11, color: 'var(--gg-text-secondary)',
  padding: '2px 10px', background: 'var(--gg-surface)',
  borderRadius: 'var(--radius-full)', border: '1px solid var(--gg-border-subtle)',
}
