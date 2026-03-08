import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { personsApi, type CreatePersonPayload, type Person } from '@/api/persons'

const schema = z.object({
  first_name:         z.string().min(1, 'Required'),
  last_name:          z.string().min(1, 'Required'),
  other_names:        z.string().optional(),
  phone:              z.string().min(11, 'Enter a valid Nigerian phone number'),
  email:              z.string().email('Invalid email').optional().or(z.literal('')),
  gender:             z.enum(['MALE', 'FEMALE'], { required_error: 'Select gender' }),
  date_of_birth:      z.string().optional(),
  source:             z.enum(['WALK_IN', 'CELL', 'MEDICAL', 'FOLLOWUP', 'DEPARTMENT', 'ADMIN']),
  address:            z.string().optional(),
  occupation:         z.string().optional(),
  marital_status:     z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', '']).optional(),
  water_baptism:      z.boolean().optional(),
  holy_ghost_baptism: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  person?:  Person
  onClose:  () => void
}

const FIELD_LABEL: Record<string, string> = {
  first_name: 'First Name', last_name: 'Last Name', other_names: 'Other Names',
  phone: 'Phone', email: 'Email', gender: 'Gender', date_of_birth: 'Date of Birth',
  source: 'Source', address: 'Address', occupation: 'Occupation',
  marital_status: 'Marital Status',
}

export default function PersonForm({ person, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!person

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: person
      ? {
          first_name:         person.first_name,
          last_name:          person.last_name,
          other_names:        person.other_names,
          phone:              person.phone,
          email:              person.email,
          gender:             person.gender as 'MALE' | 'FEMALE',
          date_of_birth:      person.date_of_birth ?? '',
          source:             person.source,
          address:            person.address,
          occupation:         person.occupation,
          marital_status:     (person.marital_status as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | '') ?? '',
          water_baptism:      person.water_baptism,
          holy_ghost_baptism: person.holy_ghost_baptism,
        }
      : { source: 'WALK_IN', water_baptism: false, holy_ghost_baptism: false },
  })

  const mutation = useMutation({
    mutationFn: (data: CreatePersonPayload) =>
      isEdit ? personsApi.update(person!.id, data) : personsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      toast.success(isEdit ? 'Member updated' : 'Member added')
      onClose()
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'An error occurred')
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data as CreatePersonPayload)
  }

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

  const field = (name: keyof FormData, type = 'text') => (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={labelStyle}>{FIELD_LABEL[name] ?? name}</label>
      <input type={type} className="input" style={inputStyle(!!errors[name])} {...register(name)} />
      {errors[name] && <p style={errStyle}>{errors[name]!.message as string}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>{field('first_name')}</div>
        <div>{field('last_name')}</div>
      </div>
      {field('other_names')}
      {field('phone', 'tel')}
      {field('email', 'email')}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={labelStyle}>Gender</label>
          <select className="input" style={inputStyle(!!errors.gender)} {...register('gender')}>
            <option value="">Select…</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.gender && <p style={errStyle}>{errors.gender.message}</p>}
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={labelStyle}>Marital Status</label>
          <select className="input" style={inputStyle()} {...register('marital_status')}>
            <option value="">Select…</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
        </div>
      </div>

      {field('date_of_birth', 'date')}

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={labelStyle}>Source</label>
        <select className="input" style={inputStyle(!!errors.source)} {...register('source')}>
          <option value="WALK_IN">Walk-In</option>
          <option value="CELL">Cell Group Referral</option>
          <option value="MEDICAL">Medical Unit</option>
          <option value="FOLLOWUP">Follow-Up Team</option>
          <option value="DEPARTMENT">Department</option>
          <option value="ADMIN">Admin Entry</option>
        </select>
        {errors.source && <p style={errStyle}>{errors.source.message}</p>}
      </div>

      {field('address')}
      {field('occupation')}

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
          <input type="checkbox" {...register('water_baptism')} />
          Water Baptism
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
          <input type="checkbox" {...register('holy_ghost_baptism')} />
          Holy Ghost Baptism
        </label>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            height: 40, padding: '0 20px',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'none', cursor: 'pointer',
            fontSize: 'var(--text-sm)', color: 'var(--color-text-body)',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          style={{
            height: 40, padding: '0 24px',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600,
          }}
        >
          {isSubmitting || mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}
