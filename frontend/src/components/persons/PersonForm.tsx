import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { personsApi, type CreatePersonPayload, type Person } from '@/api/persons'
import { useIsMobile } from '@/hooks/useIsMobile'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  other_names: z.string().optional(),
  phone: z.string().min(11, 'Enter a valid Nigerian phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  date_of_birth: z.string().optional(),
  source: z.enum(['WALK_IN', 'CELL', 'MEDICAL', 'FOLLOWUP', 'DEPARTMENT', 'ADMIN']),
  address: z.string().optional(),
  landmark: z.string().optional(),
  state: z.string().optional(),
  occupation: z.string().optional(),
  marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', '']).optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  person?: Person
  onClose: () => void
}

export default function PersonForm({ person, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!person
  const isMobile = useIsMobile()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: person
      ? {
          first_name: person.first_name,
          last_name: person.last_name,
          other_names: person.other_names,
          phone: person.phone,
          email: person.email,
          gender: (person.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'OTHER',
          date_of_birth: person.date_of_birth ?? '',
          source: person.source,
          address: person.address || '',
          landmark: person.landmark || '',
          state: person.state || '',
          occupation: person.occupation || '',
          marital_status: (person.marital_status as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | '') || '',
        }
      : {
          source: 'WALK_IN',
          gender: 'OTHER',
          address: '',
          landmark: '',
          state: '',
          occupation: '',
          marital_status: '',
        },
  })

  const mutation = useMutation({
    mutationFn: (data: CreatePersonPayload) => (isEdit ? personsApi.update(person!.id, data) : personsApi.create(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      toast.success(isEdit ? 'Member updated' : 'Member added')
      onClose()
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'An error occurred')
    },
  })

  const inputStyle = (hasError?: boolean) => ({
    height: 40,
    padding: '0 12px',
    border: `1.5px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    font: `400 var(--text-base) var(--font-body)`,
    color: 'var(--color-text-body)',
    background: 'var(--color-surface)',
    width: '100%',
    boxSizing: 'border-box' as const,
  })

  const labelStyle = {
    display: 'block',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    marginBottom: 'var(--space-2)',
  }

  const errStyle = {
    color: 'var(--color-danger)',
    fontSize: 'var(--text-xs)',
    marginTop: 'var(--space-1)',
  }

  const field = (name: keyof FormData, label: string, type = 'text') => (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} className="input" style={inputStyle(!!errors[name])} {...register(name)} />
      {errors[name] && <p style={errStyle}>{errors[name]!.message as string}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data as CreatePersonPayload))}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>{field('first_name', 'First Name')}</div>
        <div>{field('last_name', 'Last Name')}</div>
      </div>
      {field('other_names', 'Other Names')}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>{field('phone', 'Phone Number', 'tel')}</div>
        <div>{field('email', 'Email', 'email')}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--space-4)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={labelStyle}>Date of Birth</label>
          <input type="date" className="input" style={inputStyle(!!errors.date_of_birth)} {...register('date_of_birth')} />
        </div>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={labelStyle}>Gender</label>
          <select className="input" style={inputStyle(!!errors.gender)} {...register('gender')}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {field('address', 'Address')}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>{field('landmark', 'Landmark')}</div>
        <div>{field('state', 'State')}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>{field('occupation', 'Occupation')}</div>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={labelStyle}>Marital Status</label>
          <select className="input" style={inputStyle(!!errors.marital_status)} {...register('marital_status')}>
            <option value="">Select...</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label style={labelStyle}>Source of Collection</label>
        <select className="input" style={inputStyle(!!errors.source)} {...register('source')}>
          <option value="WALK_IN">Walk-In</option>
          <option value="CELL">Cell Group Referral</option>
          <option value="MEDICAL">Medical Unit</option>
          <option value="FOLLOWUP">Follow-Up Team</option>
          <option value="DEPARTMENT">Department</option>
          <option value="ADMIN">Admin Entry</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} style={{ height: 40, padding: '0 20px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || mutation.isPending} style={{ height: 40, padding: '0 24px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>
          {isSubmitting || mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}
