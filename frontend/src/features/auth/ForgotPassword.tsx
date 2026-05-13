import type { FormEvent } from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Grow,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  ChevronLeft as ChevronLeftIcon,
  ErrorOutline as ErrorIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { ThemeSwitcher } from "../../components/ui/ThemeSwitcher";
import { authService } from "@/api/authService";
import { ApiError } from "@/api/apiClient";
import {
  getApiErrorMessage,
  translateApiMessage,
} from "@/utils/dashboardUtils";
import { useAppTheme } from "@/context/ThemeContext";

// --- Sub-components ---

interface BlobProps {
  color: string;
  top?: string;
  left?: string;
  size?: number;
  delay?: string;
}

function Blob({ color, top, left, size, delay }: BlobProps) {
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

export function ForgotPassword() {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const errors: { email?: string } = {};

    if (!email.trim()) {
      errors.email = "Wprowadź adres e-mail";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Wprowadź poprawny adres e-mail";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isDark = mode === "dark";

  const fieldLabels = {
    email: "adres e-mail",
  } as const;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (successMsg) {
      return;
    }

    setErrorMsg(null);

    if (!validate()) {
      return;
    }

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
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: { xs: "flex-start", md: "center" },
        position: "relative",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        overflowY: "auto",
        overflowX: "hidden",
        p: { xs: 2, md: 4 },
        pt: { xs: 4, md: 4 },
      }}
    >
      {/* Background Decor */}
      <Blob
        color={theme.palette.primary.main}
        top="-5%"
        left="-5%"
        size={500}
      />
      <Blob
        color={theme.palette.secondary.main}
        top="60%"
        left="80%"
        size={600}
        delay="2s"
      />
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
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              mb: 2.5,
            }}
          >
            <LockIcon sx={{ fontSize: 28 }} />
          </Box>

          <Typography
            variant="h5"
            fontWeight="800"
            gutterBottom
            sx={{ letterSpacing: "-0.5px" }}
          >
            Reset hasła
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 320, mx: "auto", lineHeight: 1.5 }}
          >
            Podaj adres e-mail przypisany do konta. Jeśli konto istnieje,
            wyślemy link do ustawienia nowego hasła.
          </Typography>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {successMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ textAlign: "left" }}>
              <TextField
                fullWidth
                label="Adres e-mail"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                placeholder="jan.kowalski@szkola.pl"
                disabled={isLoading || !!successMsg}
                error={Boolean(fieldErrors.email)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon
                        color={fieldErrors.email ? "error" : "action"}
                        sx={{ fontSize: 20 }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.01),
                    },
                    "&.Mui-focused": {
                      bgcolor: alpha(theme.palette.primary.main, 0.01),
                    },
                  },
                }}
              />
              <Collapse in={Boolean(fieldErrors.email)}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  sx={{ mt: 1, ml: 1, color: "error.main" }}
                >
                  <ErrorIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" fontWeight="500">
                    {fieldErrors.email}
                  </Typography>
                </Stack>
              </Collapse>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading || !!successMsg}
              sx={{
                mt: 3,
                py: 1.6,
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: "0.95rem",
                textTransform: "none",
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: `0 10px 28px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s",
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Wyślij link resetujący"
              )}
            </Button>
          </form>

          <Button
            component={RouterLink}
            to="/login"
            fullWidth
            startIcon={<ChevronLeftIcon />}
            sx={{
              mt: 3,
              fontWeight: 600,
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              },
              textTransform: "none",
            }}
          >
            Wróć do logowania
          </Button>
        </Paper>
      </Grow>

      {/* Footer / Bottom Info */}
      <Box sx={{ mt: 3, textAlign: "center", position: "relative", zIndex: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          alignItems="center"
          sx={{ opacity: 0.6 }}
        >
          <ShieldIcon sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="caption" color="text.secondary">
            Konta użytkowników tworzone są przez administratora szkoły.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
