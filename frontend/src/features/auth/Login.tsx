import type { FormEvent } from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  TextField,
  Typography,
  Zoom,
} from "@mui/material";
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  MenuBook as BookIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { authService } from "@/api/authService.ts";
import { ApiError } from "@/api/apiClient.ts";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { mode, toggleColorMode } = useAppTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      login(response.token, response.role);
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.problem.code === "INVALID_CREDENTIALS") {
          setErrorMsg("Nieprawidłowy email lub hasło.");
        } else {
          setErrorMsg(err.problem.detail || "Wystąpił błąd logowania.");
        }
      } else if (err instanceof Error && err.message === "NETWORK_ERROR") {
        setErrorMsg("Brak połączenia z serwerem. Spróbuj ponownie później.");
      } else {
        setErrorMsg("Wystąpił nieoczekiwany błąd.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transition: "background-color 0.3s ease",
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <IconButton onClick={toggleColorMode} color="inherit">
          {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>

      <Zoom in={true} style={{ transitionDelay: "300ms" }}>
        <Paper
          elevation={4}
          sx={{ p: 4, width: "100%", maxWidth: 450, borderRadius: 3 }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box
              sx={{
                bgcolor: mode === "dark" ? "primary.dark" : "primary.light",
                color: mode === "dark" ? "white" : "primary.main",
                p: 1.5,
                borderRadius: "50%",
                mb: 2,
              }}
            >
              <BookIcon fontSize="large" />
            </Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              English Learning Platform
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Zaloguj się, aby kontynuować
            </Typography>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMsg}
            </Alert>
          )}

          <Divider sx={{ mb: 3, fontSize: "0.8rem", color: "text.secondary" }}>
            LUB UŻYJ FORMULARZA
          </Divider>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              variant="outlined"
            />
            <TextField
              label="Hasło"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              variant="outlined"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 1, position: "relative" }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Zaloguj się"
              )}
            </Button>
          </form>
        </Paper>
      </Zoom>
    </Box>
  );
}
