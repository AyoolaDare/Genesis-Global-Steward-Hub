import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import RoleGuard         from '@/components/RoleGuard'

/** Returns the correct landing page for a given role. */
function homeFor(role: string | undefined) {
  if (['HOD', 'ASST_HOD', 'WELFARE', 'PRO'].includes(role ?? '')) return '/departments'
  if (['CELL_LEADER', 'CELL_ASST'].includes(role ?? '')) return '/cells'
  if (role === 'FOLLOWUP') return '/followup'
  return '/dashboard'
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = useAuthStore((s) => s.accessToken)
  const mustResetPassword = useAuthStore((s) => s.user?.must_reset_password)
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
          <ProtectedRoute>
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
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*"              element={<RoleHomeRedirect />} />
      </Route>
    </Routes>
  )
}
