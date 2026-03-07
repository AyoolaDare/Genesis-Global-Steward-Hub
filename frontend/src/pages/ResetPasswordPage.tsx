import { useForm } from 'react-hook-form'
import type { CSSProperties } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Confirm your new password'),
}).refine((v) => v.new_password === v.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.resetPassword(data.old_password, data.new_password)
      if (user && token && refreshToken) {
        setAuth({ ...user, must_reset_password: false }, token, refreshToken)
      }
      toast.success('Password reset successful')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? 'Failed to reset password')
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ marginTop: 0 }}>Reset Password</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        You must reset your password before using Genesis Global Steward Hub.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Current Password</label>
          <input className="input" type="password" {...register('old_password')} />
          {errors.old_password && <p style={err}>{errors.old_password.message}</p>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>New Password</label>
          <input className="input" type="password" {...register('new_password')} />
          {errors.new_password && <p style={err}>{errors.new_password.message}</p>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Confirm New Password</label>
          <input className="input" type="password" {...register('confirm_password')} />
          {errors.confirm_password && <p style={err}>{errors.confirm_password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} style={btn}>
          {isSubmitting ? 'Saving...' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}

const lbl: CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  marginBottom: 6,
}

const err: CSSProperties = {
  marginTop: 4,
  color: 'var(--color-danger)',
  fontSize: 'var(--text-xs)',
}

const btn: CSSProperties = {
  height: 40,
  padding: '0 18px',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-primary)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
}
