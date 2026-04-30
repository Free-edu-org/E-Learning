import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { authService } from "@/api/authService";
import { ApiError } from "@/api/apiClient";
import { getApiErrorMessage } from "@/utils/dashboardUtils";
import { useAppTheme } from "@/context/ThemeContext";

export function ResetPassword() {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const cardBorderColor =
    mode === "dark"
      ? alpha(theme.palette.common.white, 0.15)
      : alpha(theme.palette.primary.main, 0.35);

  const fieldLabels = {
    token: "link resetu hasła",
    newPassword: "nowe hasło",
    confirmPassword: "potwierdzenie hasła",
  } as const;

  const passwordMismatch = useMemo(() => {
    if (!confirmPassword) return "";
    return newPassword !== confirmPassword ? "Hasła muszą być identyczne." : "";
  }, [confirmPassword, newPassword]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg("Brakuje tokenu resetu hasła.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Hasła muszą być identyczne.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({ token, newPassword, confirmPassword });
      setSuccess(true);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErrorMsg(
          getApiErrorMessage(
            error,
            "Nie udało się ustawić nowego hasła.",
            fieldLabels,
          ),
        );
      } else if (error instanceof Error && error.message === "NETWORK_ERROR") {
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
        bgcolor: theme.palette.background.default,
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: 480,
          p: 4,
          borderRadius: 3,
          border: `1px solid ${cardBorderColor}`,
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Ustaw nowe hasło
        </Typography>

        {success ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Hasło zostało zmienione. Zaloguj się ponownie nowym hasłem.
            </Alert>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              fullWidth
            >
              Przejdź do logowania
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Wpisz nowe hasło i potwierdź zmianę.
            </Typography>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Nowe hasło"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                disabled={isLoading}
              />
              <TextField
                fullWidth
                label="Powtórz nowe hasło"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                disabled={isLoading}
                error={!!passwordMismatch}
                helperText={passwordMismatch}
                sx={{ mt: 2 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 3 }}
                disabled={isLoading || !!passwordMismatch}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Zapisz nowe hasło"
                )}
              </Button>
            </form>

            <Button component={RouterLink} to="/login" fullWidth sx={{ mt: 2 }}>
              Wróć do logowania
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
