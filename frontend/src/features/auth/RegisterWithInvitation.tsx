import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grow,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  HowToRegOutlined as RegisterIcon,
  MenuBook as BookIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { authService } from "@/api/authService";
import { invitationService } from "@/api/invitationService";
import { ApiError } from "@/api/apiClient";
import { PasswordStrengthIndicator } from "@/components/ui/form/PasswordStrengthIndicator";

const REGISTER_ERROR_MESSAGES: Record<string, string> = {
  INVITATION_NOT_FOUND: "Link zaproszenia jest nieprawidłowy.",
  INVITATION_EXPIRED: "Ten link zaproszenia wygasł.",
  INVITATION_LIMIT_REACHED: "Ten link osiągnął limit użyć.",
  INVITATION_INACTIVE: "Ten link zaproszenia nie jest już aktywny.",
  EMAIL_ALREADY_TAKEN: "Podany adres e-mail jest już zajęty.",
  USERNAME_ALREADY_TAKEN: "Podana nazwa użytkownika jest już zajęta.",
};

export function RegisterWithInvitation() {
  const theme = useTheme();
  const [params] = useSearchParams();

  const token = params.get("token") ?? "";

  const [groupName, setGroupName] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const confirmError =
    confirmPassword && password !== confirmPassword
      ? "Hasła nie są identyczne"
      : "";

  useEffect(() => {
    if (!token) {
      setTokenError("Brak tokenu zaproszenia w linku.");
      setTokenLoading(false);
      return;
    }

    invitationService
      .getInvitationInfo(token)
      .then((info) => {
        setGroupName(info.groupName);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.problem.code) {
          setTokenError(
            REGISTER_ERROR_MESSAGES[err.problem.code] ??
              "Link zaproszenia jest nieprawidłowy lub wygasł.",
          );
        } else {
          setTokenError("Link zaproszenia jest nieprawidłowy lub wygasł.");
        }
      })
      .finally(() => setTokenLoading(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;

    setErrorMsg(null);
    setResendMsg(null);
    setIsRegistered(false);
    setIsLoading(true);

    try {
      await invitationService.registerWithInvitation({
        token,
        email,
        username,
        password,
      });
      setIsRegistered(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.problem.code) {
        setErrorMsg(
          REGISTER_ERROR_MESSAGES[err.problem.code] ??
            "Wystąpił błąd rejestracji.",
        );
      } else {
        setErrorMsg("Wystąpił błąd rejestracji. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg(null);
    setResendMsg(null);
    setResendLoading(true);

    try {
      const response = await authService.resendEmailVerification({ email });
      setResendMsg(response.message);
    } catch {
      setErrorMsg("Nie udało się wysłać maila weryfikacyjnego ponownie.");
    } finally {
      setResendLoading(false);
    }
  };

  const cardBorderColor = alpha(theme.palette.primary.main, 0.35);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "center",
        bgcolor: theme.palette.background.default,
        overflowY: "auto",
        py: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Grow in timeout={500} style={{ transformOrigin: "top center" }}>
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
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
              Rejestracja ucznia
            </Typography>
            {tokenLoading ? (
              <CircularProgress size={20} />
            ) : groupName ? (
              <Typography variant="body2" color="text.secondary" align="center">
                Dołączasz do grupy: <strong>{groupName}</strong>
              </Typography>
            ) : null}
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

          {!tokenLoading && !tokenError && (
            <>
              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              {isRegistered ? (
                <Stack spacing={2}>
                  <Alert severity="info">
                    Sprawdź skrzynkę <strong>{email}</strong> i kliknij link
                    weryfikacyjny, aby aktywować konto.
                  </Alert>
                  {resendMsg && <Alert severity="info">{resendMsg}</Alert>}
                  <Button
                    variant="outlined"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                  >
                    {resendLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Wyślij mail weryfikacyjny ponownie"
                    )}
                  </Button>
                  <Button component={RouterLink} to="/login">
                    Przejdź do logowania
                  </Button>
                </Stack>
              ) : (
                <form onSubmit={handleSubmit}>
                  <TextField
                    label="Adres e-mail"
                    type="email"
                    autoComplete="email"
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
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
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    inputProps={{ minLength: 8 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? (
                              <VisibilityOff sx={{ fontSize: 20 }} />
                            ) : (
                              <Visibility sx={{ fontSize: 20 }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <PasswordStrengthIndicator password={password} />
                  <TextField
                    label="Powtórz hasło"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    fullWidth
                    margin="normal"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    error={!!confirmError}
                    helperText={confirmError}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff sx={{ fontSize: 20 }} />
                            ) : (
                              <Visibility sx={{ fontSize: 20 }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
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
                      "Zarejestruj się"
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
              )}
            </>
          )}
        </Paper>
      </Grow>
    </Box>
  );
}
