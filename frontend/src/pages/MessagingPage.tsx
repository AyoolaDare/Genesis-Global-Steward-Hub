import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Plus, CheckCircle, XCircle, Clock, Send, Search, X, Users, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { messagingApi, type Campaign, type CampaignStatus } from '@/api/messaging'
import { personsApi, type PersonListItem, type PersonStatus } from '@/api/persons'
import { useAuthStore } from '@/store/authStore'
import { useIsMobile } from '@/hooks/useIsMobile'

const PERSON_STATUSES: { value: PersonStatus; label: string }[] = [
  { value: 'NEW_MEMBER',        label: 'New Member' },
  { value: 'PENDING_APPROVAL',  label: 'Pending Approval' },
  { value: 'MEMBER',            label: 'Member' },
  { value: 'WORKER',            label: 'Worker' },
  { value: 'INACTIVE',          label: 'Inactive' },
]

const MERGE_TAGS = [
  { tag: '<%first_name%>', label: 'First Name' },
  { tag: '<%last_name%>',  label: 'Last Name' },
  { tag: '<%full_name%>',  label: 'Full Name' },
]

/* ─── Status badge ───────────────────────────────────────── */
function StatusBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING:  { label: 'Pending',  color: 'var(--color-warning)',  bg: 'var(--color-warning-bg)',  icon: <Clock size={11} /> },
    APPROVED: { label: 'Approved', color: 'var(--color-success)',  bg: 'var(--color-success-bg)',  icon: <CheckCircle size={11} /> },
    REJECTED: { label: 'Rejected', color: 'var(--color-danger)',   bg: 'var(--color-danger-bg)',   icon: <XCircle size={11} /> },
  }
  const s = map[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: s.bg, color: s.color, fontSize: 'var(--text-xs)', fontWeight: 600 }}>
      {s.icon} {s.label}
    </span>
  )
}

/* ─── Recipient search pill selector ─────────────────────── */
function RecipientPicker({
  selected, onChange,
}: { selected: PersonListItem[]; onChange: (v: PersonListItem[]) => void }) {
  const [q, setQ] = useState('')
  const [loadingStatus, setLoadingStatus] = useState<PersonStatus | null>(null)

  const { data } = useQuery({
    queryKey: ['person-search', q],
    queryFn:  () => personsApi.list({ search: q, page_size: '10' }),
    enabled:  q.trim().length >= 2,
  })

  const results = (data?.data?.results ?? []).filter(
    (p) => !selected.some((s) => s.id === p.id)
  )

  const add = (p: PersonListItem) => {
    onChange([...selected, p])
    setQ('')
  }
  const remove = (id: string) => onChange(selected.filter((p) => p.id !== id))

  const addByStatus = async (status: PersonStatus) => {
    setLoadingStatus(status)
    try {
      const res = await personsApi.list({ status, page_size: '500' })
      const fetched = res.data.results ?? []
      const selectedIds = new Set(selected.map((p) => p.id))
      const newOnes = fetched.filter((p) => !selectedIds.has(p.id))
      if (newOnes.length === 0) {
        toast('All members with that status are already added')
      } else {
        onChange([...selected, ...newOnes])
        toast.success(`Added ${newOnes.length} ${status.replace('_', ' ').toLowerCase()} recipients`)
      }
    } catch {
      toast.error('Failed to load members by status')
    } finally {
      setLoadingStatus(null)
    }
  }

  return (
    <div>
      {/* Add by status */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ margin: '0 0 6px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={11} /> Add all by status
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PERSON_STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => addByStatus(value)}
              disabled={loadingStatus !== null}
              style={{ padding: '4px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-alt)', color: 'var(--color-text-body)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, cursor: loadingStatus ? 'wait' : 'pointer', opacity: loadingStatus === value ? 0.6 : 1 }}
            >
              {loadingStatus === value ? 'Loading…' : `+ ${label}`}
            </button>
          ))}
        </div>
      </div>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, maxHeight: 100, overflowY: 'auto', padding: '2px 0' }}>
          {selected.map((p) => (
            <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 500 }}>
              {p.first_name} {p.last_name}
              <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', padding: 0 }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Or search individual member by name or phone…"
          style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box' }}
        />
        {q.trim().length >= 2 && results.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 220, overflowY: 'auto' }}>
            {results.map((p) => (
              <button key={p.id} onClick={() => add(p)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {p.first_name} {p.last_name}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{p.phone}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        {selected.length} recipient{selected.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  )
}

/* ─── New Campaign Modal ─────────────────────────────────── */
function NewCampaignModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle]         = useState('')
  const [message, setMessage]     = useState('')
  const [recipients, setRecipients] = useState<PersonListItem[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertTag = (tag: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? message.length
    const end   = el.selectionEnd   ?? message.length
    const next  = message.slice(0, start) + tag + message.slice(end)
    setMessage(next)
    // Restore cursor after tag
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
  }

  const create = useMutation({
    mutationFn: () => messagingApi.create({
      title,
      message,
      channel: 'SMS',
      recipient_ids: recipients.map((r) => r.id),
    }),
    onSuccess: () => {
      toast.success('Campaign submitted for Admin approval')
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      onClose()
    },
    onError: () => toast.error('Failed to submit campaign'),
  })

  const hasTags   = MERGE_TAGS.some(({ tag }) => message.includes(tag))
  const charCount = message.length
  const charColor = !hasTags && charCount > 160 ? 'var(--color-danger)' : charCount > 140 ? 'var(--color-warning)' : 'var(--color-text-muted)'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            New Message Campaign
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-body)', marginBottom: 6 }}>
              Campaign Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Members Welcome — March 2026"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Recipients */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-body)', marginBottom: 6 }}>
              Recipients
            </label>
            <RecipientPicker selected={recipients} onChange={setRecipients} />
          </div>

          {/* Message */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-body)' }}>
                Message
              </label>
              <span style={{ fontSize: 'var(--text-xs)', color: charColor, fontFamily: 'var(--font-mono)' }}>
                {charCount} chars
              </span>
            </div>
            {/* Personalized tag toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Tag size={11} /> Insert tag:
              </span>
              {MERGE_TAGS.map(({ tag, label }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertTag(tag)}
                  style={{ padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-alt)', color: 'var(--color-text-body)', fontFamily: 'var(--font-mono)', fontSize: '11px', cursor: 'pointer' }}
                >
                  {tag}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here… e.g. Hello <%first_name%>, welcome to our church!"
              rows={4}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4, margin: '4px 0 0' }}>
              Tags like <code style={{ fontFamily: 'var(--font-mono)' }}>{'<%first_name%>'}</code> are replaced with each recipient's actual data when sent. Message goes to Admin for approval first.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-body)' }}>
              Cancel
            </button>
            <button
              onClick={() => create.mutate()}
              disabled={!title.trim() || !message.trim() || recipients.length === 0 || create.isPending}
              style={{ padding: '8px 20px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: (create.isPending || !title.trim() || !message.trim() || recipients.length === 0) ? 0.6 : 1 }}
            >
              <Send size={14} />
              {create.isPending ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Review Modal (Admin approve/reject) ────────────────── */
function ReviewModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const qc   = useQueryClient()
  const [note, setNote] = useState('')

  const approveMut = useMutation({
    mutationFn: () => messagingApi.approve(campaign.id),
    onSuccess: (res) => {
      toast.success(`Approved — ${res.data.sent_count} SMS sent`)
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      onClose()
    },
    onError: () => toast.error('Failed to approve campaign'),
  })

  const rejectMut = useMutation({
    mutationFn: () => messagingApi.reject(campaign.id, note),
    onSuccess: () => {
      toast.success('Campaign rejected')
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      onClose()
    },
    onError: () => toast.error('Failed to reject campaign'),
  })

  const busy = approveMut.isPending || rejectMut.isPending

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 500, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Review Campaign
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Title</p>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }}>{campaign.title}</p>
          </div>

          <div style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Message</p>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-body)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{campaign.message}</p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
              <p style={{ margin: '0 0 2px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Recipients</p>
              <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>{campaign.recipient_count}</p>
            </div>
            <div style={{ flex: 1, background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
              <p style={{ margin: '0 0 2px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Channel</p>
              <p style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>{campaign.channel}</p>
            </div>
            <div style={{ flex: 1, background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
              <p style={{ margin: '0 0 2px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>By</p>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{campaign.created_by.username}</p>
            </div>
          </div>

          {/* Rejection note */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-body)', marginBottom: 6 }}>
              Rejection Note <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(required if rejecting)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for rejection…"
              rows={2}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              onClick={() => rejectMut.mutate()}
              disabled={busy || !note.trim()}
              style={{ flex: 1, padding: '9px 0', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: busy || !note.trim() ? 0.6 : 1 }}
            >
              <XCircle size={14} /> {rejectMut.isPending ? 'Rejecting…' : 'Reject'}
            </button>
            <button
              onClick={() => approveMut.mutate()}
              disabled={busy}
              style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--color-success)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: busy ? 0.6 : 1 }}
            >
              <CheckCircle size={14} /> {approveMut.isPending ? 'Sending…' : 'Approve & Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Campaign Row ───────────────────────────────────────── */
function CampaignRow({ campaign, isAdmin, onReview }: { campaign: Campaign; isAdmin: boolean; onReview: () => void }) {
  const date = new Date(campaign.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {campaign.title}
        </p>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {campaign.message}
        </p>
      </div>
      <div style={{ textAlign: 'center', minWidth: 60 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Recipients</p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{campaign.recipient_count}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <StatusBadge status={campaign.status} />
        <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{date}</p>
      </div>
      {isAdmin && campaign.status === 'PENDING' && (
        <button
          onClick={onReview}
          style={{ padding: '6px 14px', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Review
        </button>
      )}
      {!(isAdmin && campaign.status === 'PENDING') && (
        <div style={{ width: 72 }} />
      )}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function MessagingPage() {
  const user    = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const isMobile = useIsMobile()

  const [composeOpen, setComposeOpen]   = useState(false)
  const [reviewing, setReviewing]       = useState<Campaign | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', statusFilter],
    queryFn:  () => messagingApi.list(statusFilter ? { status: statusFilter } : {}),
  })

  const campaigns = data?.data?.results ?? []
  const pending   = campaigns.filter((c) => c.status === 'PENDING')

  return (
    <div style={{ padding: isMobile ? 16 : 28, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Messaging
            </h1>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              SMS campaigns · Requires Admin approval
            </p>
          </div>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={15} /> New Message
        </button>
      </div>

      {/* Admin pending banner */}
      {isAdmin && pending.length > 0 && (
        <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={16} color="var(--color-warning)" />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning)', fontWeight: 600 }}>
            {pending.length} campaign{pending.length !== 1 ? 's' : ''} awaiting your approval
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{ padding: '5px 14px', border: '1px solid', borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)', borderRadius: 'var(--radius-full)', background: statusFilter === s ? 'var(--color-primary-subtle)' : 'transparent', color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: statusFilter === s ? 600 : 400, cursor: 'pointer' }}
          >
            {s === '' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, padding: '10px 20px', background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Campaign</span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', minWidth: 60, textAlign: 'center' }}>Recipients</span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'right' }}>Status</span>
          <div style={{ width: 72 }} />
        </div>

        {isLoading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Loading…
          </div>
        )}

        {!isLoading && campaigns.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <MessageSquare size={40} color="var(--color-border)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              No campaigns yet. Click "New Message" to compose one.
            </p>
          </div>
        )}

        {campaigns.map((c) => (
          <CampaignRow
            key={c.id}
            campaign={c}
            isAdmin={isAdmin}
            onReview={() => setReviewing(c)}
          />
        ))}
      </div>

      {/* Delivery stats for approved campaigns */}
      {campaigns.some((c) => c.status === 'APPROVED') && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Sent', value: campaigns.reduce((n, c) => n + c.sent_count, 0), color: 'var(--color-success)' },
            { label: 'Failed', value: campaigns.reduce((n, c) => n + c.failed_count, 0), color: 'var(--color-danger)' },
            { label: 'Campaigns', value: campaigns.filter((c) => c.status === 'APPROVED').length, color: 'var(--color-primary)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {composeOpen && <NewCampaignModal onClose={() => setComposeOpen(false)} />}
      {reviewing   && <ReviewModal campaign={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  )
}
