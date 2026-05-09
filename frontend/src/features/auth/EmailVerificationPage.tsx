import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grow,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import {
  authService,
  type EmailVerificationTokenState,
} from "@/api/authService";

const TOKEN_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_VERIFICATION_TOKEN_INVALID: "Link weryfikacyjny jest nieprawidłowy.",
  EMAIL_VERIFICATION_TOKEN_EXPIRED: "Link weryfikacyjny wygasł.",
  EMAIL_VERIFICATION_TOKEN_USED: "Ten link weryfikacyjny został już użyty.",
  EMAIL_ALREADY_VERIFIED: "Adres email został już potwierdzony.",
};

type VerificationUiState =
  | "loading"
  | "confirming"
  | "success"
  | "expired"
  | "alreadyVerified"
  | "used"
  | "invalid"
  | "error";

export function EmailVerificationPage() {
  const theme = useTheme();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [email, setEmail] = useState<string | null>(null);
  const [state, setState] = useState<VerificationUiState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setMessage("Brak tokenu weryfikacyjnego w linku.");
      return;
    }

    authService
      .getEmailVerificationTokenInfo(token)
      .then(async (info) => {
        setEmail(info.email);

        if (info.status === "VALID") {
          setState("confirming");
          await authService.confirmEmailVerification({ token });
          setState("success");
          setMessage("Adres email został potwierdzony. Możesz się zalogować.");
          return;
        }

        applyTokenState(info.status);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.problem.code) {
          setState("invalid");
          setMessage(
            TOKEN_ERROR_MESSAGES[err.problem.code] ??
              "Nie udało się zweryfikować linku.",
          );
        } else {
          setState("error");
          setMessage("Nie udało się zweryfikować linku.");
        }
      });
  }, [token]);

  const applyTokenState = (tokenState: EmailVerificationTokenState) => {
    if (tokenState === "EXPIRED") {
      setState("expired");
      setMessage("Link weryfikacyjny wygasł.");
      return;
    }
    if (tokenState === "ALREADY_VERIFIED") {
      setState("alreadyVerified");
      setMessage("Adres email został już wcześniej potwierdzony.");
      return;
    }
    if (tokenState === "USED") {
      setState("used");
      setMessage("Ten link weryfikacyjny został już użyty.");
      return;
    }
    setState("invalid");
    setMessage("Link weryfikacyjny jest nieprawidłowy.");
  };

  const handleResend = async () => {
    if (!email) return;

    setResendLoading(true);
    setResendMessage(null);
    try {
      const response = await authService.resendEmailVerification({ email });
      setResendMessage(response.message);
    } catch {
      setResendMessage("Nie udało się wysłać linku weryfikacyjnego ponownie.");
    } finally {
      setResendLoading(false);
    }
  };

  const isBusy = state === "loading" || state === "confirming";

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
        <Paper sx={{ p: 4, width: "100%", maxWidth: 460, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight="bold" textAlign="center">
              Weryfikacja adresu email
            </Typography>

            {isBusy && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress />
              </Box>
            )}

            {!isBusy && message && (
              <Alert
                severity={
                  state === "success" || state === "alreadyVerified"
                    ? "success"
                    : state === "expired" || state === "used"
                      ? "warning"
                      : "error"
                }
              >
                {message}
              </Alert>
            )}

            {!isBusy && email && (
              <Typography variant="body2" color="text.secondary">
                Konto: <strong>{email}</strong>
              </Typography>
            )}

            {!isBusy && (state === "expired" || state === "used") && email && (
              <>
                {resendMessage && (
                  <Alert severity="info">{resendMessage}</Alert>
                )}
                <Button
                  variant="outlined"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Wyślij link ponownie"
                  )}
                </Button>
              </>
            )}

            {!isBusy && (
              <Button component={RouterLink} to="/login" variant="contained">
                Przejdź do logowania
              </Button>
            )}
          </Stack>
        </Paper>
      </Grow>
    </Box>
  );
}
