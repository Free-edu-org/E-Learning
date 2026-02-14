import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import StudentDashboardPage from '@/pages/student/StudentDashboardPage'
import StudentProgressPage from '@/pages/student/StudentProgressPage'
import TeacherDashboardPage from '@/pages/teacher/TeacherDashboardPage'
import { useAuth } from './auth/useAuth'

const routeForRole = (role: 'student' | 'admin') =>
  role === 'student' ? '/student' : '/teacher'

type GuardProps = { children: ReactNode }

const LoginGuard = ({ children }: GuardProps) => {
  const { session } = useAuth()
  if (session) {
    return <Navigate to={routeForRole(session.role)} replace />
  }
  return <>{children}</>
}

type RoleGuardProps = GuardProps & {
  requiredRole: 'student' | 'admin'
}

const RoleGuard = ({ requiredRole, children }: RoleGuardProps) => {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (session.role !== requiredRole) {
    return <Navigate to={routeForRole(session.role)} replace />
  }

  return <>{children}</>
}

const AppRouter = () => {
  const { session } = useAuth()
  const defaultTarget = session ? routeForRole(session.role) : '/login'

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginGuard>
            <LoginPage />
          </LoginGuard>
        }
      />
      <Route
        path="/student"
        element={
          <RoleGuard requiredRole="student">
            <StudentDashboardPage />
          </RoleGuard>
        }
      />
      <Route
        path="/student/progress"
        element={
          <RoleGuard requiredRole="student">
            <StudentProgressPage />
          </RoleGuard>
        }
      />
      <Route
        path="/teacher"
        element={
          <RoleGuard requiredRole="admin">
            <TeacherDashboardPage />
          </RoleGuard>
        }
      />
      <Route path="/" element={<Navigate to={defaultTarget} replace />} />
      <Route path="*" element={<Navigate to={defaultTarget} replace />} />
    </Routes>
  )
}

export default AppRouter
