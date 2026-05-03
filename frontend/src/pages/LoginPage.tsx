import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { isAxiosError } from 'axios'
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
    } catch (err: unknown) {
      if (!isAxiosError(err) || !err.response) {
        toast.error('Cannot reach server. Confirm backend is running.')
        return
      }
      toast.error(err.response.data?.error?.message ?? 'Invalid credentials')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse 70% 60% at 10% 70%,  rgba(244,216,9,0.08) 0%, transparent 100%),
        radial-gradient(ellipse 55% 45% at 90% 10%,  rgba(80,70,9,0.55) 0%,  transparent 100%),
        radial-gradient(ellipse 40% 35% at 55% 100%, rgba(108,94,0,0.10) 0%, transparent 100%),
        #2a2504
      `,
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Ambient glow orbs */}
      <div style={{
        position: 'absolute', top: '8%', right: '6%',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,216,9,0.09) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'gg-float 7s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '3%',
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,94,0,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'gg-float 9s ease-in-out infinite reverse',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/app-logo.png"
            alt="Genesis Global"
            style={{
              width: 68, height: 68,
              borderRadius: 16,
              margin: '0 auto 20px',
              objectFit: 'cover',
              display: 'block',
              border: '1.5px solid rgba(244,216,9,0.30)',
              boxShadow: '0 6px 24px rgba(0,0,0,0.30)',
              animation: 'gg-pulse-gold 4s ease-in-out infinite',
            }}
          />
          <h1 className="shimmer-text" style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            margin: '0 0 8px',
            lineHeight: 1.2,
          }}>
            Genesis Global
          </h1>
          <p style={{
            fontFamily: "'Public Sans', sans-serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
            color: 'rgba(244, 216, 9, 0.50)',
            margin: 0,
            letterSpacing: '0.01em',
          }}>
            Steward Hub — Members Portal
          </p>
        </div>

        {/* Login card — DESIGN.md: 8px radius for containers */}
        <div style={{
          background: 'rgba(80, 70, 9, 0.32)',
          border: '1px solid rgba(244, 216, 9, 0.20)',
          borderRadius: 8,
          backdropFilter: 'blur(20px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
          padding: 'clamp(24px, 5vw, 36px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(244,216,9,0.08)',
          animation: 'gg-scale-in 380ms cubic-bezier(0.25, 0.8, 0.25, 1) both',
        }}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Username / Email */}
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="identifier" style={LABEL_STYLE}>Username or email</label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="username or admin@genesis.org"
                className="input-dark"
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
                  placeholder="••••••••"
                  className="input-dark"
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
                    color: 'rgba(244, 216, 9, 0.45)', display: 'flex', padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={ERROR_TEXT_STYLE}>{errors.password.message}</p>}
            </div>

            {/* Submit — DESIGN.md: gold bg, dark text, uppercase, 4px radius */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: 48,
                background: isSubmitting ? 'rgba(244, 216, 9, 0.45)' : '#f4d809',
                color: '#211c00',
                border: 'none',
                borderRadius: 4,
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: isSubmitting ? 'none' : '0 2px 10px rgba(108,94,0,0.20)',
                transition: 'filter 150ms ease-out, transform 150ms ease-out',
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.filter = 'brightness(1.06)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = '' }}
              onMouseDown={(e)  => { if (!isSubmitting) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={(e)    => { e.currentTarget.style.transform = '' }}
            >
              {isSubmitting
                ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#211c00', borderColor: 'rgba(33,28,0,0.22)' }} />Signing in…</>
                : 'Sign in'
              }
            </button>

          </form>
        </div>

        <p style={{
          textAlign: 'center',
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 11,
          color: 'rgba(244, 216, 9, 0.25)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginTop: 28,
        }}>
          Genesis Global · All Rights Reserved
        </p>
      </div>
    </div>
  )
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  color: 'rgba(244, 216, 9, 0.55)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const INPUT_ERROR_STYLE: React.CSSProperties = {
  borderColor: 'rgba(186,26,26,0.70)',
  borderWidth: 2,
}

const ERROR_TEXT_STYLE: React.CSSProperties = {
  color: '#ffdad6',
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 11,
  marginTop: 5,
}
