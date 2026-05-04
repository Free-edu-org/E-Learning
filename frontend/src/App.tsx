import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AppThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useRef, useEffect } from "react";
import { AppErrorBoundary } from "./components/error/AppErrorBoundary";
import { ErrorPage } from "./components/error/ErrorPage";
import { useApiErrorHandler } from "./utils/apiErrorEvents";
import { ForgotPassword } from "./features/auth/ForgotPassword";
import { Login } from "./features/auth/Login";
import { ResetPassword } from "./features/auth/ResetPassword";
import { TeacherDashboard } from "./features/teacher/TeacherDashboard";
import { TeacherLessonCreateView } from "./features/teacher/TeacherLessonCreateView";
import { TeacherLessonEditView } from "./features/teacher/TeacherLessonEditView";
import { LessonStatsView } from "./features/teacher/LessonStatsView";
import { TeacherLessonResultView } from "./features/teacher/TeacherLessonResultView";
import { TeacherStudentsView } from "./features/teacher/TeacherStudentsView";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { StudentDashboard } from "./features/student/StudentDashboard";
import { StudentProgressView } from "./features/student/StudentProgressView";
import { LessonSolver } from "./features/student/LessonSolver";
import { StudentLessonResultView } from "./features/student/StudentLessonResultView";

/** Redirects to the correct dashboard based on the user's role. */
function RoleBasedRedirect() {
  const { role } = useAuth();

  if (role === "TEACHER") {
    return <Navigate to="/teacher" replace />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/student" replace />;
}

/**
 * Wrapper that listens for global API errors (500, 503, 403, 404, network)
 * dispatched by the apiClient and shows a full-screen ErrorPage overlay.
 */
function ErrorGuard() {
  const { apiError, clearApiError } = useApiErrorHandler();
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathnameRef = useRef(location.pathname);

  // Auto-clear error only after the URL has actually changed.
  // This prevents the old route from re-mounting and re-firing the failed API call.
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      if (apiError) {
        clearApiError();
      }
    }
  }, [location.pathname, apiError, clearApiError]);

  const handleReturn = () => {
    // Only navigate — the useEffect above will clear the error
    // once React Router has finished changing the URL.
    navigate("/", { replace: true });
  };

  if (apiError) {
    return <ErrorPage type={apiError.type} onReturn={handleReturn} />;
  }

  return <Outlet />;
}

function App() {
  return (
    <AppErrorBoundary>
      <AppThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* ErrorGuard wraps all routes – shows full-screen error on API failures */}
              <Route element={<ErrorGuard />}>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<RoleBasedRedirect />} />
                </Route>

                {/* Zabezpieczenie przed wejściem na panel nauczyciela przez inne role */}
                <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
                  <Route path="/teacher" element={<TeacherDashboard />} />
                  <Route
                    path="/teacher/students"
                    element={<TeacherStudentsView />}
                  />
                  <Route
                    path="/teacher/lessons/new"
                    element={<TeacherLessonCreateView />}
                  />
                  <Route
                    path="/teacher/lessons/:lessonPublicId/edit"
                    element={<TeacherLessonEditView />}
                  />
                  <Route
                    path="/teacher/lessons/:lessonPublicId/stats"
                    element={<LessonStatsView />}
                  />
                  <Route
                    path="/teacher/lessons/:lessonPublicId/students/:studentPublicId/result"
                    element={<TeacherLessonResultView />}
                  />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route
                    path="/student/progress"
                    element={<StudentProgressView />}
                  />
                  <Route
                    path="/student/lessons/:lessonPublicId"
                    element={<LessonSolver />}
                  />
                  <Route
                    path="/student/lessons/:lessonPublicId/result"
                    element={<StudentLessonResultView />}
                  />
                </Route>

                {/* Catch-all: show proper 404 page */}
                <Route path="*" element={<ErrorPage type="404" />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AppThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
