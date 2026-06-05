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
import { authService } from "@/api/authService";
import { useAppTheme } from "@/context/ThemeContext";
import { ThemeSwitcher } from "../../components/ui/ThemeSwitcher";

const TOKEN_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_CHANGE_TOKEN_INVALID: "Link zmiany adresu email jest nieprawidłowy.",
  EMAIL_CHANGE_TOKEN_EXPIRED: "Link zmiany adresu email wygasł.",
  EMAIL_CHANGE_TOKEN_USED: "Ten link zmiany adresu email został już użyty.",
  EMAIL_CHANGE_NEW_EMAIL_TAKEN:
    "Nowy adres email jest już zajęty przez inne konto.",
};

type ChangeUiState = "confirming" | "success" | "error";

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

export function EmailChangePage() {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [state, setState] = useState<ChangeUiState>(() =>
    token ? "confirming" : "error",
  );
  const [message, setMessage] = useState<string | null>(() =>
    token ? null : "Brak tokenu w linku. Sprawdź, czy skopiowałeś pełny adres.",
  );

  const isDark = mode === "dark";

  useEffect(() => {
    if (!token) return;

    authService
      .confirmEmailChange({ token })
      .then(() => {
        setState("success");
        setMessage(
          "Adres email został zmieniony. Zaloguj się używając nowego adresu.",
        );
      })
      .catch((err: unknown) => {
        setState("error");
        if (err instanceof ApiError && err.problem.code) {
          setMessage(
            TOKEN_ERROR_MESSAGES[err.problem.code] ??
              "Nie udało się potwierdzić zmiany adresu email.",
          );
        } else {
          setMessage("Nie udało się potwierdzić zmiany adresu email.");
        }
      });
  }, [token]);

  const isLoading = state === "confirming";

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
                isLoading || state === "success"
                  ? theme.palette.primary.main
                  : theme.palette.error.main,
                0.1,
              ),
              color:
                isLoading || state === "success"
                  ? "primary.main"
                  : "error.main",
              mb: 2.5,
            }}
          >
            {isLoading ? (
              <CircularProgress size={28} color="inherit" />
            ) : state === "success" ? (
              <EmailReadIcon sx={{ fontSize: 28 }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 28 }} />
            )}
          </Box>

          <Typography
            variant="h5"
            fontWeight="800"
            gutterBottom
            sx={{ letterSpacing: "-0.5px" }}
          >
            Zmiana adresu email
          </Typography>

          <Stack spacing={3} sx={{ mt: 1 }}>
            {message && (
              <Alert
                severity={state === "success" ? "success" : "error"}
                sx={{ borderRadius: 2, textAlign: "left" }}
              >
                {message}
              </Alert>
            )}

            {!isLoading && (
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  textTransform: "none",
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
            Link jest jednorazowy i wygasa po 24 godzinach.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
