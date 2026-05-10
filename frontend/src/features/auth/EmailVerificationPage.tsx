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
import { alpha, useTheme } from "@mui/material/styles";
import {
  MarkEmailRead as EmailReadIcon,
  ErrorOutline as ErrorIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import {
  authService,
  type EmailVerificationTokenState,
} from "@/api/authService";
import { useAppTheme } from "@/context/ThemeContext";
import { ThemeSwitcher } from "../../components/ui/ThemeSwitcher";

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

// --- Sub-components ---

function Blob({ color, top, left, size, delay }: any) {
  return (
    <Box
      sx={{
        position: "fixed",
        width: size || 400,
        height: size || 400,
        borderRadius: "50%",
        background: color,
        top: top || "10%",
        left: left || "10%",
        filter: "blur(100px)",
        opacity: 0.1,
        zIndex: 0,
        animation: `blob-float 20s ease-in-out infinite alternate`,
        animationDelay: delay || "0s",
        pointerEvents: "none",
        "@keyframes blob-float": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "100%": { transform: "translate(60px, 40px) scale(1.1)" },
        },
      }}
    />
  );
}

export function EmailVerificationPage() {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [email, setEmail] = useState<string | null>(null);
  const [state, setState] = useState<VerificationUiState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const isDark = mode === "dark";

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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        overflow: "hidden",
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Background Decor */}
      <Blob color={theme.palette.primary.main} top="-5%" left="-5%" size={500} />
      <Blob color={theme.palette.secondary.main} top="60%" left="80%" size={600} delay="2s" />
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark
            ? `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.dark, 0.15)} 0%, transparent 40%),
               radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.dark, 0.1)} 0%, transparent 40%)`
            : `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.light, 0.1)} 0%, transparent 40%),
               radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.light, 0.05)} 0%, transparent 40%)`,
          pointerEvents: "none",
        }}
      />

      {/* Theme Switcher Overlay */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: { xs: 16, md: 32 },
          zIndex: 1000,
        }}
      >
        <ThemeSwitcher />
      </Box>

      <Grow in timeout={500}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 440,
            p: { xs: 4, md: 5 },
            borderRadius: 4,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: isDark
              ? `0 24px 64px ${alpha(theme.palette.common.black, 0.5)}`
              : `0 24px 64px ${alpha(theme.palette.primary.main, 0.06)}`,
            position: "relative",
            zIndex: 1,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              p: 1.5,
              borderRadius: "50%",
              bgcolor: alpha(
                state === "success" || state === "alreadyVerified" || isBusy
                  ? theme.palette.primary.main
                  : theme.palette.error.main,
                0.1
              ),
              color:
                state === "success" || state === "alreadyVerified" || isBusy
                  ? "primary.main"
                  : "error.main",
              mb: 2.5,
            }}
          >
            {isBusy ? (
              <CircularProgress size={28} color="inherit" />
            ) : state === "success" || state === "alreadyVerified" ? (
              <EmailReadIcon sx={{ fontSize: 28 }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 28 }} />
            )}
          </Box>

          <Typography variant="h5" fontWeight="800" gutterBottom sx={{ letterSpacing: "-0.5px" }}>
            Weryfikacja adresu email
          </Typography>
          
          <Stack spacing={3} sx={{ mt: 1 }}>
            {message && (
              <Alert
                severity={
                  state === "success" || state === "alreadyVerified"
                    ? "success"
                    : state === "expired" || state === "used"
                      ? "warning"
                      : "error"
                }
                sx={{ borderRadius: 2, textAlign: "left" }}
              >
                {message}
              </Alert>
            )}

            {email && (
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.divider, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Konto
                </Typography>
                <Typography variant="body2" fontWeight="600">
                  {email}
                </Typography>
              </Box>
            )}

            {!isBusy && (state === "expired" || state === "used") && email && (
              <Stack spacing={2}>
                {resendMessage && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>{resendMessage}</Alert>
                )}
                <Button
                  variant="outlined"
                  onClick={handleResend}
                  disabled={resendLoading}
                  fullWidth
                  sx={{ py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  {resendLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Wyślij link ponownie"
                  )}
                </Button>
              </Stack>
            )}

            {!isBusy && (
              <Button 
                component={RouterLink} 
                to="/login" 
                variant="contained"
                fullWidth
                sx={{ 
                  py: 1.5, 
                  borderRadius: 2.5, 
                  fontWeight: 700, 
                  textTransform: 'none',
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                }}
              >
                Przejdź do logowania
              </Button>
            )}
          </Stack>
        </Paper>
      </Grow>

      {/* Footer / Bottom Info */}
      <Box sx={{ mt: 3, textAlign: "center", position: "relative", zIndex: 1 }}>
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ opacity: 0.6 }}>
          <ShieldIcon sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="caption" color="text.secondary">
            Konta użytkowników tworzone są przez administratora szkoły.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
