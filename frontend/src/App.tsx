import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
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

  if (role === "TEACHER") {
    return <Navigate to="/teacher" replace />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/admin" replace />;
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

            {/* Zabezpieczenie przed wejœciem na panel nauczyciela przez inne role */}
            <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route
                path="/teacher/lesson/:lessonId/tasks"
                element={<TeacherLessonTasks />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route
                path="/student/lesson/:lessonId"
                element={<StudentLesson />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route
                path="/admin"
                element={
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography variant="h5">
                      Panel administratora - wkrótce dostêpny
                    </Typography>
                  </Box>
                }
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
