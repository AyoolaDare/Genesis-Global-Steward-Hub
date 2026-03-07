import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle, User, Calendar, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { followupApi, type FollowUpTask, type TaskStatus, type TaskPriority } from '@/api/followup'
import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'

/* ─── Priority config ────────────────────────────────── */
const PRIORITY_CONFIG: Record<TaskPriority, { bg: string; fg: string; label: string }> = {
  LOW:    { bg: 'var(--color-surface-alt)',   fg: 'var(--color-text-muted)', label: 'Low' },
  MEDIUM: { bg: 'var(--color-info-bg)',       fg: 'var(--color-info)',       label: 'Medium' },
  HIGH:   { bg: 'var(--color-warning-bg)',    fg: 'var(--color-warning)',    label: 'High' },
  URGENT: { bg: 'var(--color-danger-bg)',     fg: 'var(--color-danger)',     label: 'Urgent' },
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, background: cfg.bg, color: cfg.fg, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
      {cfg.label}
    </span>
  )
}

/* ─── Task Card ──────────────────────────────────────── */
function TaskCard({ task, onComplete, onAssign }: { task: FollowUpTask; onComplete: (t: FollowUpTask) => void; onAssign: (t: FollowUpTask) => void }) {
  const isComplete = task.status === 'COMPLETED' || task.status === 'CANCELLED'

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        opacity: isComplete ? 0.65 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, marginRight: 8 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
            {task.title}
          </p>
          {task.person_name && (
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={11} /> {task.person_name}
            </p>
          )}
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p style={{ margin: '0 0 10px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {task.due_date && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={10} />
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
          {task.assigned_name && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              → {task.assigned_name}
            </span>
          )}
        </div>

        {!isComplete && (
          <div style={{ display: 'flex', gap: 6 }}>
            {!task.assigned_to && (
              <button
                onClick={() => onAssign(task)}
                style={{ height: 28, padding: '0 10px', background: 'none', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-muted)' }}
              >
                Assign
              </button>
            )}
            <button
              onClick={() => onComplete(task)}
              style={{ height: 28, padding: '0 10px', background: 'var(--color-success-bg)', border: '1.5px solid var(--color-success)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 11, color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <CheckCircle size={11} /> Done
            </button>
          </div>
        )}

        {isComplete && task.outcome && (
          <span style={{ fontSize: 11, color: 'var(--color-success)', fontStyle: 'italic' }}>
            {task.outcome.slice(0, 40)}{task.outcome.length > 40 ? '…' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── Complete Dialog ────────────────────────────────── */
const completeSchema = z.object({ outcome: z.string().min(5, 'Describe the outcome (min 5 chars)') })

function CompleteDialog({ task, onClose }: { task: FollowUpTask; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<{ outcome: string }>({ resolver: zodResolver(completeSchema) })

  const mutation = useMutation({
    mutationFn: (data: { outcome: string }) => followupApi.complete(task.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['followup'] }); toast.success('Task completed'); onClose() },
    onError: () => toast.error('Failed to complete task'),
  })

  return (
    <Modal open onClose={onClose} title="Log Outcome" width={440}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 0 }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>{task.title}</strong>
      </p>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 6 }}>Outcome / Notes</label>
          <textarea
            {...register('outcome')}
            rows={4}
            className="input"
            style={{ height: 'auto', padding: '8px 12px', resize: 'vertical' }}
            placeholder="What happened? What was the result?"
          />
          {errors.outcome && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.outcome.message}</p>}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ height: 40, padding: '0 20px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
          <button type="submit" disabled={mutation.isPending} style={{ height: 40, padding: '0 24px', background: 'var(--color-success)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            {mutation.isPending ? 'Saving…' : 'Mark Complete'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── Assign Dialog ──────────────────────────────────── */
function AssignDialog({ task, onClose }: { task: FollowUpTask; onClose: () => void }) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [userId, setUserId] = useState(user?.id ?? '')

  const mutation = useMutation({
    mutationFn: () => followupApi.assign(task.id, { assigned_to: userId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['followup'] }); toast.success('Task assigned'); onClose() },
    onError: () => toast.error('Failed to assign'),
  })

  return (
    <Modal open onClose={onClose} title="Assign Task" width={400}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 0 }}>Assign "{task.title}" to:</p>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 6 }}>Assign to Me</label>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-body)' }}>{user?.username} ({user?.email})</p>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ height: 40, padding: '0 20px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{ height: 40, padding: '0 24px', background: 'var(--accent-followup)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
          {mutation.isPending ? 'Assigning…' : 'Assign to Me'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Status columns ─────────────────────────────────── */
const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'PENDING',     label: 'Pending',     color: 'var(--color-warning)' },
  { status: 'IN_PROGRESS', label: 'In Progress',  color: 'var(--color-info)' },
  { status: 'COMPLETED',   label: 'Completed',   color: 'var(--color-success)' },
]

/* ─── Main Page ──────────────────────────────────────── */
export default function FollowUpPage() {
  const [completeTask, setCompleteTask] = useState<FollowUpTask | null>(null)
  const [assignTask,   setAssignTask]   = useState<FollowUpTask | null>(null)
  const [activeStatus, setActiveStatus] = useState<TaskStatus | 'ALL'>('ALL')

  const params: Record<string, string> = {}
  if (activeStatus !== 'ALL') params.status = activeStatus

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['followup', params],
    queryFn:  () => followupApi.list(params),
    select:   (res) => res.data.results,
  })

  const byStatus = (status: TaskStatus) => tasks?.filter((t) => t.status === status) ?? []

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Follow-Up
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 'var(--text-sm)' }}>
            Track and manage follow-up tasks
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-6)' }}>
        {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            style={{
              height: 34, padding: '0 16px',
              border: `1.5px solid ${activeStatus === s ? 'var(--accent-followup)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              background: activeStatus === s ? `var(--accent-followup)15` : 'none',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: activeStatus === s ? 600 : 400,
              color: activeStatus === s ? 'var(--accent-followup)' : 'var(--color-text-muted)',
            }}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Kanban board */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)' }}>
          {COLUMNS.map((col) => (
            <div key={col.status}>
              <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 16 }} />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 100, marginBottom: 12 }} />
              ))}
            </div>
          ))}
        </div>
      ) : activeStatus === 'ALL' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)' }}>
          {COLUMNS.map((col) => {
            const colTasks = byStatus(col.status)
            return (
              <div key={col.status}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {col.label}
                  </h3>
                  <span style={{ background: `${col.color}20`, color: col.color, borderRadius: 'var(--radius-full)', padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>
                    {colTasks.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 100 }}>
                  {colTasks.length === 0 ? (
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', background: 'var(--color-surface)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={setCompleteTask}
                        onAssign={setAssignTask}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {tasks?.length === 0 ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', gridColumn: '1 / -1' }}>
              <AlertTriangle size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
              No {activeStatus.replace('_', ' ').toLowerCase()} tasks
            </div>
          ) : (
            tasks?.map((task) => (
              <TaskCard key={task.id} task={task} onComplete={setCompleteTask} onAssign={setAssignTask} />
            ))
          )}
        </div>
      )}

      {completeTask && <CompleteDialog task={completeTask} onClose={() => setCompleteTask(null)} />}
      {assignTask   && <AssignDialog   task={assignTask}   onClose={() => setAssignTask(null)} />}
    </div>
  )
}
