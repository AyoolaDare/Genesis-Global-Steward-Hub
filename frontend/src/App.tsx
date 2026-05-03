import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import LoginPage         from '@/pages/LoginPage'
import AppShell          from '@/components/layout/AppShell'
import DashboardPage     from '@/pages/DashboardPage'
import PeoplePage        from '@/pages/PeoplePage'
import MemberBoardPage   from '@/pages/MemberBoardPage'
import MedicalPage       from '@/pages/MedicalPage'
import FollowUpPage      from '@/pages/FollowUpPage'
import CellGroupsPage    from '@/pages/CellGroupsPage'
import DepartmentsPage   from '@/pages/DepartmentsPage'
import HRPage            from '@/pages/HRPage'
import NotificationsPage from '@/pages/NotificationsPage'
import MessagingPage     from '@/pages/MessagingPage'
import AdminUsersPage    from '@/pages/AdminUsersPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import SponsorsPage      from '@/pages/SponsorsPage'
import RoleGuard         from '@/components/RoleGuard'

/** Returns the correct landing page for a given role. */
function homeFor(role: string | undefined) {
  if (['HOD', 'ASST_HOD', 'WELFARE', 'PRO'].includes(role ?? '')) return '/departments'
  if (['CELL_LEADER', 'CELL_ASST'].includes(role ?? '')) return '/cells'
  if (role === 'FOLLOWUP') return '/followup'
  return '/dashboard'
}

function ProtectedRoute({ children, hydrated }: { children: React.ReactNode; hydrated: boolean }) {
  const location = useLocation()
  const token = useAuthStore((s) => s.accessToken)
  const mustResetPassword = useAuthStore((s) => s.user?.must_reset_password)

  // Still attempting silent refresh — don't redirect yet
  if (!hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FFFFFF' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E5E7EB', borderTopColor: 'var(--gg-gold-200)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />
  if (mustResetPassword && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />
  }
  return <>{children}</>
}

function LoginRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const role  = useAuthStore((s) => s.user?.role)
  if (token) return <Navigate to={homeFor(role)} replace />
  return <>{children}</>
}

function RoleHomeRedirect() {
  const role = useAuthStore((s) => s.user?.role)
  return <Navigate to={homeFor(role)} replace />
}

export default function App() {
  const [hydrated, setHydrated] = useState(false)
  const { accessToken, refreshToken, setToken, setRefreshToken, clearAuth } = useAuthStore()

  useEffect(() => {
    // If we already have an access token (shouldn't normally happen on cold
    // boot, but guard anyway), skip the refresh.
    if (accessToken) {
      setHydrated(true)
      return
    }

    // No refresh token persisted → nothing to restore, go straight to login.
    if (!refreshToken) {
      setHydrated(true)
      return
    }

    // Exchange the persisted refresh token for a fresh access token.
    axios.post(
      `${import.meta.env.VITE_API_URL ?? '/api/v1'}/auth/refresh/`,
      { refresh: refreshToken },
      { withCredentials: true },
    ).then((res) => {
      const newAccess   = res.data.access ?? res.data.access_token
      const newRefresh  = res.data.refresh
      if (newAccess) setToken(newAccess)
      if (newRefresh) setRefreshToken(newRefresh)
    }).catch(() => {
      // Refresh token expired or blacklisted — clear everything.
      clearAuth()
    }).finally(() => {
      setHydrated(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount only

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginRoute>
            <LoginPage />
          </LoginRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute hydrated={hydrated}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleHomeRedirect />} />
        <Route path="/dashboard"     element={<RoleGuard roles={['ADMIN','MEDICAL','FOLLOWUP','CELL_LEADER','CELL_ASST','HR','HOD','ASST_HOD','WELFARE','PRO']}><DashboardPage /></RoleGuard>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/people/*"      element={<PeoplePage />} />
        <Route path="/members/:memberId" element={<MemberBoardPage />} />
        <Route
          path="/medical/*"
          element={<RoleGuard roles={['ADMIN', 'MEDICAL']}><MedicalPage /></RoleGuard>}
        />
        <Route
          path="/followup/*"
          element={<RoleGuard roles={['ADMIN', 'FOLLOWUP']}><FollowUpPage /></RoleGuard>}
        />
        <Route
          path="/cells/*"
          element={<RoleGuard roles={['ADMIN', 'CELL_LEADER', 'CELL_ASST']}><CellGroupsPage /></RoleGuard>}
        />
        <Route
          path="/departments/*"
          element={<RoleGuard roles={['ADMIN', 'HOD', 'ASST_HOD', 'WELFARE', 'PRO']}><DepartmentsPage /></RoleGuard>}
        />
        <Route
          path="/hr/*"
          element={<RoleGuard roles={['ADMIN', 'HR']}><HRPage /></RoleGuard>}
        />
        <Route
          path="/admin/users"
          element={<RoleGuard roles={['ADMIN']}><AdminUsersPage /></RoleGuard>}
        />
        <Route
          path="/messaging/*"
          element={<RoleGuard roles={['ADMIN', 'FOLLOWUP', 'HOD', 'ASST_HOD', 'WELFARE', 'PRO']}><MessagingPage /></RoleGuard>}
        />
        <Route
          path="/sponsors/*"
          element={<RoleGuard roles={['ADMIN']}><SponsorsPage /></RoleGuard>}
        />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*"              element={<RoleHomeRedirect />} />
      </Route>
    </Routes>
  )
}
