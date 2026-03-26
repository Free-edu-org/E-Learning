import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./features/auth/Login";
import { TeacherDashboard } from "./features/teacher/TeacherDashboard";
import { TeacherLessonTasks } from "./features/teacher/TeacherLessonTasks";
import { StudentDashboard } from "./features/student/StudentDashboard";
import { StudentLesson } from "./features/student/StudentLesson";

/** Redirects to the correct dashboard based on the user's role. */
function RoleBasedRedirect() {
  const { role } = useAuth();

  if (role === "TEACHER" || role === "ADMIN") {
    return <Navigate to="/teacher" replace />;
  }

  return <Navigate to="/student" replace />;
}

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<RoleBasedRedirect />} />
            </Route>

            {/* Zabezpieczenie na przyszlosc przed wejsciem na Panel przez zwyklego usera */}
            <Route element={<ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route
                path="/teacher/lesson/:lessonId/tasks"
                element={<TeacherLessonTasks />}
              />
              <Route path="/student" element={<StudentDashboard />} />
              <Route
                path="/student/lesson/:lessonId"
                element={<StudentLesson />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;
