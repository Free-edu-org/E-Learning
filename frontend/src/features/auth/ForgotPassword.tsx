import type { FormEvent } from "react";
import { useState } from "react";
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
import { Link as RouterLink } from "react-router-dom";
import { authService } from "@/api/authService";
import { ApiError } from "@/api/apiClient";
import { getApiErrorMessage, translateApiMessage } from "@/utils/dashboardUtils";
import { useAppTheme } from "@/context/ThemeContext";

export function ForgotPassword() {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cardBorderColor =
    mode === "dark"
      ? alpha(theme.palette.common.white, 0.15)
      : alpha(theme.palette.primary.main, 0.35);

  const fieldLabels = {
    email: "adres e-mail",
  } as const;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (successMsg) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword({ email });
      setSuccessMsg(translateApiMessage(response.message));
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErrorMsg(
          getApiErrorMessage(
            error,
            "Nie udało się wysłać linku resetującego.",
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
          Reset hasła
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Podaj adres e-mail przypisany do konta. Jeśli konto istnieje,
          wyślemy link do ustawienia nowego hasła.
        </Typography>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Adres e-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isLoading || !!successMsg}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={isLoading || !!successMsg}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Wyślij link resetujący"
            )}
          </Button>
        </form>

        <Button component={RouterLink} to="/login" fullWidth sx={{ mt: 2 }}>
          Wróć do logowania
        </Button>
      </Paper>
    </Box>
  );
}
