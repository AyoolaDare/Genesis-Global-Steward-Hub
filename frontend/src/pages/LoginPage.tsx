import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  identifier: z.string().min(1, 'Enter your username or email'),
  password:   z.string().min(1, 'Password is required'),
})
type LoginForm = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(schema) })

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
        toast.error('Cannot reach server. Confirm backend is running.')
        return
      }
      toast.error(err.response?.data?.error?.message ?? 'Invalid credentials')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse 60% 50% at 15% 60%,  rgba(212,175,55,0.08) 0%, transparent 100%),
        radial-gradient(ellipse 50% 40% at 85% 15%,  rgba(26,111,212,0.07) 0%, transparent 100%),
        radial-gradient(ellipse 40% 35% at 50% 95%,  rgba(232,99,26,0.05)  0%, transparent 100%),
        #080808
      `,
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Decorative ambient orbs */}
      <div style={{
        position: 'absolute', top: '10%', right: '8%',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'gg-float 7s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '8%', left: '4%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,111,212,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'gg-float 9s ease-in-out infinite reverse',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img
            src="/app-logo.png"
            alt="Genesis Global"
            style={{
              width: 68, height: 68,
              borderRadius: 18,
              margin: '0 auto 20px',
              objectFit: 'cover',
              display: 'block',
              border: '1px solid rgba(212,175,55,0.35)',
              boxShadow: '0 8px 32px rgba(212,175,55,0.15)',
              animation: 'gg-pulse-gold 4s ease-in-out infinite',
            }}
          />
          <h1 className="shimmer-text" style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            margin: '0 0 10px',
            lineHeight: 1.2,
          }}>
            Genesis Global
          </h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
            color: 'rgba(212,175,55,0.60)',
            margin: 0,
            letterSpacing: '0.02em',
          }}>
            Steward Hub — Members Portal
          </p>
        </div>

        {/* Glass login card */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(212,175,55,0.22)',
          borderRadius: 24,
          backdropFilter: 'blur(16px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
          padding: 'clamp(24px, 5vw, 36px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.06)',
          animation: 'gg-scale-in 400ms cubic-bezier(0.25, 0.8, 0.25, 1) both',
        }}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Username / Email */}
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="identifier" style={LABEL_STYLE}>Username or Email</label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                className="input"
                placeholder="username or admin@genesis.org"
                style={errors.identifier ? INPUT_ERROR_STYLE : undefined}
                {...register('identifier')}
              />
              {errors.identifier && <p style={ERROR_TEXT_STYLE}>{errors.identifier.message}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 32 }}>
              <label htmlFor="password" style={LABEL_STYLE}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input"
                  placeholder="••••••••"
                  style={{ paddingRight: 48, ...(errors.password ? INPUT_ERROR_STYLE : {}) }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--gg-text-secondary)', display: 'flex', padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={ERROR_TEXT_STYLE}>{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: 48,
                background: isSubmitting
                  ? 'rgba(232,99,26,0.45)'
                  : 'linear-gradient(135deg, #E8631A 0%, #D4AF37 100%)',
                color: '#0A0A0A',
                border: 'none',
                borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: isSubmitting ? 'none' : '0 4px 24px rgba(232,99,26,0.22), 0 0 0 1px rgba(232,99,26,0.28)',
                transition: 'filter 150ms ease-out',
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.filter = 'brightness(1.09)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = '' }}
            >
              {isSubmitting
                ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#0A0A0A' }} />Signing in…</>
                : 'Sign In'
              }
            </button>

          </form>
        </div>

        <p style={{
          textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: 'var(--gg-text-secondary)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginTop: 28,
        }}>
          Genesis Global · All Rights Reserved
        </p>
      </div>
    </div>
  )
}

const LABEL_STYLE = {
  display: 'block',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--gg-text-secondary)',
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  marginBottom: 8,
}
const INPUT_ERROR_STYLE = {
  borderColor: 'rgba(192,57,43,0.65)',
  boxShadow: '0 0 0 3px rgba(192,57,43,0.12)',
}
const ERROR_TEXT_STYLE = {
  color: 'var(--gg-danger)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  marginTop: 5,
}
