import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./features/auth/Login";
import { TeacherDashboard } from "./features/teacher/TeacherDashboard";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { Box, Typography } from "@mui/material";

/** Redirects to the correct dashboard based on the user's role. */
function RoleBasedRedirect() {
  const { role } = useAuth();

  if (role === "TEACHER") {
    return <Navigate to="/teacher" replace />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  // STUDENT fallback - placeholder until a student dashboard is built
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h5">Panel ucznia - wkrótce dostępny</Typography>
    </Box>
  );
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

            {/* Zabezpieczenie przed wejściem na panel nauczyciela przez inne role */}
            <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;
