import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grow,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  HowToRegOutlined as RegisterIcon,
  MenuBook as BookIcon,
} from "@mui/icons-material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { authService } from "@/api/authService";
import { ApiError } from "@/api/apiClient";

const ACTIVATION_ERROR_MESSAGES: Record<string, string> = {
  INVITATION_TOKEN_INVALID: "Link aktywacyjny jest nieprawidłowy.",
  INVITATION_TOKEN_EXPIRED:
    "Link aktywacyjny wygasł. Poproś nauczyciela o ponowne zaproszenie.",
  INVITATION_TOKEN_USED: "Ten link aktywacyjny był już użyty.",
  ACCOUNT_ALREADY_ACTIVE: "Konto jest już aktywne. Możesz się zalogować.",
  USERNAME_ALREADY_TAKEN: "Podana nazwa użytkownika jest już zajęta.",
};

export function AccountActivationPage() {
  const theme = useTheme();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [email, setEmail] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [activationSuccess, setActivationSuccess] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length > 6) score += 25;
    if (password.length > 10) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  }, [password]);

  const strengthColor =
    passwordStrength <= 25
      ? "#ef4444"
      : passwordStrength <= 50
        ? "#f59e0b"
        : passwordStrength <= 75
          ? "#3b82f6"
          : "#10b981";

  const strengthLabel =
    passwordStrength <= 25
      ? "Słabe"
      : passwordStrength <= 50
        ? "Średnie"
        : passwordStrength <= 75
          ? "Mocne"
          : "Bardzo mocne";

  const confirmError =
    confirmPassword && password !== confirmPassword
      ? "Hasła nie są identyczne"
      : "";

  useEffect(() => {
    if (!token) {
      setTokenError("Brak tokenu aktywacyjnego w linku.");
      setTokenLoading(false);
      return;
    }
    authService
      .validateInviteToken(token)
      .then((info) => {
        setEmail(info.email);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.problem.code) {
          setTokenError(
            ACTIVATION_ERROR_MESSAGES[err.problem.code] ??
              "Link aktywacyjny jest nieprawidłowy lub wygasł.",
          );
        } else {
          setTokenError("Link aktywacyjny jest nieprawidłowy lub wygasł.");
        }
      })
      .finally(() => setTokenLoading(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await authService.activateAccount({ token, username, password });
      setActivationSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.problem.code) {
        setErrorMsg(
          ACTIVATION_ERROR_MESSAGES[err.problem.code] ??
            "Wystąpił błąd aktywacji konta.",
        );
      } else {
        setErrorMsg("Wystąpił błąd aktywacji konta. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cardBorderColor = alpha(theme.palette.primary.main, 0.35);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.background.default,
      }}
    >
      <Grow in timeout={500} style={{ transformOrigin: "top center" }}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 460,
            borderRadius: 3,
            border: `1px solid ${cardBorderColor}`,
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box
              sx={{
                bgcolor: "primary.light",
                color: "primary.main",
                p: 1.5,
                borderRadius: "50%",
                mb: 2,
              }}
            >
              <BookIcon fontSize="large" />
            </Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Aktywacja konta ucznia
            </Typography>
            {!tokenLoading && email && (
              <Typography variant="body2" color="text.secondary" align="center">
                Tworzysz konto dla: <strong>{email}</strong>
              </Typography>
            )}
          </Box>

          {tokenLoading && (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress />
            </Box>
          )}

          {!tokenLoading && tokenError && (
            <Stack gap={2}>
              <Alert severity="error">{tokenError}</Alert>
              <Button component={RouterLink} to="/login" variant="outlined">
                Wróć do logowania
              </Button>
            </Stack>
          )}

          {!tokenLoading && !tokenError && activationSuccess && (
            <Stack gap={2}>
              <Alert severity="success">
                Konto zostało aktywowane! Możesz się teraz zalogować.
              </Alert>
              <Button component={RouterLink} to="/login" variant="contained">
                Przejdź do logowania
              </Button>
            </Stack>
          )}

          {!tokenLoading && !tokenError && !activationSuccess && (
            <>
              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMsg}
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <TextField
                  label="Adres e-mail"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={email ?? ""}
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Nazwa użytkownika"
                  type="text"
                  autoComplete="username"
                  fullWidth
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  inputProps={{ minLength: 3, maxLength: 50 }}
                />
                <TextField
                  label="Hasło"
                  type="password"
                  autoComplete="new-password"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  inputProps={{ minLength: 6 }}
                />
                {password && (
                  <Box sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        height: 4,
                        bgcolor: "divider",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          width: `${passwordStrength}%`,
                          bgcolor: strengthColor,
                          transition: "width 0.3s, background-color 0.3s",
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Siła hasła: {strengthLabel}
                    </Typography>
                  </Box>
                )}
                <TextField
                  label="Powtórz hasło"
                  type="password"
                  autoComplete="new-password"
                  fullWidth
                  margin="normal"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  error={!!confirmError}
                  helperText={confirmError}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={isLoading ? undefined : <RegisterIcon />}
                  sx={{ mt: 3 }}
                  disabled={isLoading || !!confirmError || !confirmPassword}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Aktywuj konto"
                  )}
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  fullWidth
                  sx={{ mt: 1 }}
                  disabled={isLoading}
                >
                  Masz już konto? Zaloguj się
                </Button>
              </form>
            </>
          )}
        </Paper>
      </Grow>
    </Box>
  );
}
