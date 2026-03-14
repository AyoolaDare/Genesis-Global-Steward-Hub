import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  identifier: z.string().min(1, 'Enter your username or email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof schema>

export default function LoginPage() {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore((s) => s.setAuth)
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await authApi.login(data)
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
      if (res.data.requires_password_reset || res.data.user?.must_reset_password) {
        navigate('/reset-password', { replace: true })
        return
      }
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      if (!err.response) {
        toast.error('Cannot reach server. Confirm backend is running on http://localhost:8000')
        return
      }
      toast.error(err.response?.data?.error?.message ?? 'Invalid credentials')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        padding: 'var(--space-6)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
        }}
      >
        {/* Logo / Branding */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <img
            src="/app-logo.png"
            alt="Genesis Global Steward Hub"
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              margin: '0 auto var(--space-4)',
              objectFit: 'cover',
            }}
          />
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Genesis Global Steward Hub
          </h1>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)',
              marginTop: 'var(--space-1)',
            }}
          >
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-8)',
            boxShadow: '0 4px 24px rgba(27,79,219,0.06)',
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Username / Email */}
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <label
                htmlFor="identifier"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Username or email
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                className="input"
                placeholder="ayo.sanake or admin@church.org"
                style={errors.identifier ? { borderColor: 'var(--color-danger)' } : {}}
                {...register('identifier')}
              />
              {errors.identifier && (
                <p
                  style={{
                    color: 'var(--color-danger)',
                    fontSize: 'var(--text-xs)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input"
                  placeholder="••••••••"
                  style={{
                    paddingRight: 44,
                    ...(errors.password ? { borderColor: 'var(--color-danger)' } : {}),
                  }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p
                  style={{
                    color: 'var(--color-danger)',
                    fontSize: 'var(--text-xs)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: 44,
                background: isSubmitting ? 'var(--color-primary-light)' : 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 150ms',
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            marginTop: 'var(--space-6)',
          }}
        >
          Genesis Global Steward Hub · All rights reserved
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
