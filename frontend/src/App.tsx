import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './features/auth/Login';
import { Button, Box, Typography } from '@mui/material';

// Placeholder for protected home
function Home() {
  const { logout, role } = useAuth();

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom>Witaj w FreeEdu!</Typography>
      <Typography variant="subtitle1" gutterBottom>Jesteś pomyślnie zalogowany. Twoja rola to: {role}</Typography>
      <Button variant="outlined" color="primary" onClick={logout} sx={{ mt: 2 }}>Wyloguj się</Button>
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
              <Route path="/" element={<Home />} />
              {/* Add more protected routes here */}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;
