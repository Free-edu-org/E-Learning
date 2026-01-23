import { Navigate, Route, Routes } from 'react-router-dom';
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

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${user.role}`} replace />;
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
