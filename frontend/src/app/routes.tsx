import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard';
import { GroupManagement } from '@/pages/teacher/GroupManagement';
import { LessonEditor } from '@/pages/teacher/LessonEditor';
import { StudentManagement } from '@/pages/teacher/StudentManagement';
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { LessonPage } from '@/pages/student/LessonPage';
import { ResultsPage } from '@/pages/teacher/ResultsPage';
import { StudentResults } from '@/pages/student/StudentResults';
import { StudentProfileEditor } from '@/pages/student/StudentProfileEditor';
import { StudentStatistics } from '@/pages/student/StudentStatistics';
import type { UserRole } from '@/types';

function resolveRolePath(role: UserRole | null) {
  if (role === 'teacher') {
    return '/teacher';
  }
  if (role === 'student') {
    return '/student';
  }
  return '/login';
}

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={resolveRolePath(user.role)} replace />;
}

function NotFoundRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const fallbackPath = resolveRolePath(user.role);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">404 - Nie znaleziono strony</h1>
      <p className="text-sm text-slate-600">Sprawdź adres lub wróć do swojego panelu.</p>
      <Link className="text-sm font-medium text-indigo-600 hover:text-indigo-500" to={fallbackPath}>
        Wróć do panelu
      </Link>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute roles={['teacher']} />}>
        <Route element={<AppShell />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/lessons/new" element={<LessonEditor />} />
          <Route path="/teacher/lessons/:lessonId/edit" element={<LessonEditor />} />
          <Route path="/teacher/lessons/:lessonId/results" element={<ResultsPage />} />
          <Route path="/teacher/students" element={<StudentManagement />} />
          <Route path="/teacher/groups" element={<GroupManagement />} />
          <Route path="/teacher/students/:studentId/statistics" element={<StudentStatistics />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route element={<AppShell />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/lessons/:lessonId" element={<LessonPage />} />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/profile" element={<StudentProfileEditor />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
}
