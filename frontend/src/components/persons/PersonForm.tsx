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
    ...(hasError ? {
      borderColor: 'var(--gg-danger)',
      boxShadow: '0 0 0 3px rgba(192,57,43,0.12)',
    } : {}),
  })

  const labelStyle = {
    display: 'block',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    fontWeight: 500 as const,
    color: 'var(--gg-text-secondary)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  }

  const errStyle = {
    color: 'var(--gg-danger)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    marginTop: 4,
  }

  const field = (name: keyof FormData, label: string, type = 'text') => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} className="input" style={inputStyle(!!errors[name])} {...register(name)} />
      {errors[name] && <p style={errStyle}>{errors[name]!.message as string}</p>}
    </div>
  )

  const cols = isMobile ? '1fr' : '1fr 1fr'
  const gap  = 16

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data as CreatePersonPayload))}>

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap }}>
        {field('first_name', 'First Name')}
        {field('last_name', 'Last Name')}
      </div>

      {field('other_names', 'Other Names')}

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap }}>
        {field('phone', 'Phone Number', 'tel')}
        {field('email', 'Email', 'email')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Date of Birth</label>
          <input type="date" className="input" style={inputStyle(!!errors.date_of_birth)} {...register('date_of_birth')} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Gender</label>
          <select className="input" style={inputStyle(!!errors.gender)} {...register('gender')}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {field('address', 'Address')}

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap }}>
        {field('landmark', 'Landmark')}
        {field('state', 'State')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap }}>
        {field('occupation', 'Occupation')}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Marital Status</label>
          <select className="input" style={inputStyle(!!errors.marital_status)} {...register('marital_status')}>
            <option value="">Select…</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
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

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            height: 40, padding: '0 20px',
            border: '1px solid var(--gg-border-default)',
            borderRadius: 'var(--radius-md)',
            background: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'var(--text-sm)',
            color: 'var(--gg-text-secondary)',
            transition: 'border-color 150ms, color 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gg-text-primary)'; e.currentTarget.style.borderColor = 'var(--gg-border-strong)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--gg-text-secondary)'; e.currentTarget.style.borderColor = 'var(--gg-border-default)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          style={{
            height: 40, padding: '0 24px',
            background: isSubmitting || mutation.isPending
              ? 'rgba(232,99,26,0.45)'
              : 'linear-gradient(135deg, #E8631A 0%, #D4AF37 100%)',
            color: '#0A0A0A',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: isSubmitting || mutation.isPending ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase' as const,
            boxShadow: '0 4px 16px rgba(232,99,26,0.20)',
            transition: 'filter 150ms',
          }}
          onMouseEnter={(e) => { if (!isSubmitting && !mutation.isPending) e.currentTarget.style.filter = 'brightness(1.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = '' }}
        >
          {isSubmitting || mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}
