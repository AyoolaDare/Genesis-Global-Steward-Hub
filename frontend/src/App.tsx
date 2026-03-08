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
import AdminUsersPage    from '@/pages/AdminUsersPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import RoleGuard         from '@/components/RoleGuard'

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
  if (token) return <Navigate to="/dashboard" replace />
  return <>{children}</>
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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<DashboardPage />} />
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
          element={<RoleGuard roles={['ADMIN', 'CELL_ADMIN']}><CellGroupsPage /></RoleGuard>}
        />
        <Route
          path="/departments/*"
          element={<RoleGuard roles={['ADMIN', 'DEPT_LEADER', 'DEPT_ASST']}><DepartmentsPage /></RoleGuard>}
        />
        <Route
          path="/hr/*"
          element={<RoleGuard roles={['ADMIN', 'HR']}><HRPage /></RoleGuard>}
        />
        <Route
          path="/admin/users"
          element={<RoleGuard roles={['ADMIN']}><AdminUsersPage /></RoleGuard>}
        />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*"              element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
