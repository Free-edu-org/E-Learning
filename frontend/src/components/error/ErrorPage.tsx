import { Box, Button, Container, Typography, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  BuildOutlined as MaintenanceIcon,
  BlockOutlined as DeniedIcon,
  SearchOffOutlined as NotFoundIcon,
  HomeOutlined as HomeIcon,
  RefreshOutlined as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────

export type ErrorType = "maintenance" | "denied" | "404";

interface ErrorPageProps {
  type: ErrorType;
  /** Optional custom message to override the default subtitle */
  message?: string;
  /** Custom return path, defaults to "/" */
  returnPath?: string;
  /** Called when user clicks "Powrót do panelu". If omitted, navigate(returnPath) is used. */
  onReturn?: () => void;
}

// ── Config ─────────────────────────────────────────────────────────

const errorConfig: Record<
  ErrorType,
  {
    icon: typeof MaintenanceIcon;
    title: string;
    subtitle: string;
    color: string;
    gradientFrom: string;
    gradientTo: string;
    showRefresh: boolean;
  }
> = {
  maintenance: {
    icon: MaintenanceIcon,
    title: "Przerwa techniczna",
    subtitle:
      "Nasz serwis jest chwilowo niedostępny. Pracujemy nad rozwiązaniem problemu — wrócimy tak szybko, jak to możliwe!",
    color: "#f59e0b",
    gradientFrom: "#f59e0b",
    gradientTo: "#d97706",
    showRefresh: true,
  },
  denied: {
    icon: DeniedIcon,
    title: "Brak dostępu",
    subtitle:
      "Ups! Wygląda na to, że ta lekcja nie jest jeszcze dla Ciebie dostępna. Sprawdź, czy masz odpowiednie uprawnienia.",
    color: "#ef4444",
    gradientFrom: "#ef4444",
    gradientTo: "#dc2626",
    showRefresh: false,
  },
  "404": {
    icon: NotFoundIcon,
    title: "Nie znaleziono",
    subtitle:
      "Strona, której szukasz, nie istnieje lub została przeniesiona. Sprawdź adres URL i spróbuj ponownie.",
    color: "#6366f1",
    gradientFrom: "#6366f1",
    gradientTo: "#4f46e5",
    showRefresh: false,
  },
};

// ── Component ──────────────────────────────────────────────────────

export function ErrorPage({
  type,
  message,
  returnPath = "/",
  onReturn,
}: ErrorPageProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (onReturn) {
      onReturn();
    } else {
      navigate(returnPath);
    }
  };
  const isDark = theme.palette.mode === "dark";
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: isDark ? "background.default" : "#eef1f8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background decoration */}
      <Box
        sx={{
          position: "absolute",
          top: "-30%",
          right: "-10%",
          width: "50vw",
          height: "50vw",
          maxWidth: 600,
          maxHeight: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(config.color, isDark ? 0.06 : 0.08)} 0%, transparent 70%)`,
          pointerEvents: "none",
          animation: "errorPulse 6s ease-in-out infinite alternate",
          "@keyframes errorPulse": {
            "0%": { transform: "scale(1) translate(0, 0)", opacity: 0.6 },
            "100%": {
              transform: "scale(1.15) translate(-2%, 4%)",
              opacity: 1,
            },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-20%",
          left: "-15%",
          width: "40vw",
          height: "40vw",
          maxWidth: 500,
          maxHeight: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(config.color, isDark ? 0.04 : 0.05)} 0%, transparent 70%)`,
          pointerEvents: "none",
          animation: "errorPulse2 8s ease-in-out infinite alternate",
          "@keyframes errorPulse2": {
            "0%": { transform: "scale(1)", opacity: 0.4 },
            "100%": { transform: "scale(1.2)", opacity: 0.8 },
          },
        }}
      />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Stack
          alignItems="center"
          spacing={3}
          sx={{
            textAlign: "center",
            animation: "errorFadeIn 0.6s ease-out",
            "@keyframes errorFadeIn": {
              "0%": { opacity: 0, transform: "translateY(24px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {/* Icon container with glow */}
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${alpha(config.gradientFrom, isDark ? 0.15 : 0.12)}, ${alpha(config.gradientTo, isDark ? 0.08 : 0.06)})`,
              border: "1px solid",
              borderColor: alpha(config.color, isDark ? 0.2 : 0.15),
              boxShadow: `0 0 60px ${alpha(config.color, isDark ? 0.12 : 0.1)}, inset 0 1px 0 ${alpha("#fff", 0.05)}`,
              mb: 1,
            }}
          >
            <Icon
              sx={{
                fontSize: 56,
                color: config.color,
                filter: `drop-shadow(0 2px 8px ${alpha(config.color, 0.3)})`,
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            {config.title}
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              maxWidth: 420,
              lineHeight: 1.7,
              fontSize: "1.05rem",
            }}
          >
            {message ?? config.subtitle}
          </Typography>

          {/* Decorative divider */}
          <Box
            sx={{
              width: 48,
              height: 3,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${config.gradientFrom}, ${config.gradientTo})`,
              opacity: 0.6,
            }}
          />

          {/* Actions */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ pt: 1 }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleReturn}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2.5,
                px: 4,
                py: 1.25,
                fontSize: "0.95rem",
                background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
                boxShadow: `0 4px 20px ${alpha(config.color, 0.3)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${config.gradientTo}, ${config.gradientFrom})`,
                  boxShadow: `0 6px 28px ${alpha(config.color, 0.4)}`,
                  transform: "translateY(-1px)",
                },
                transition:
                  "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Powrót do panelu
            </Button>

            {config.showRefresh && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2.5,
                  px: 3,
                  py: 1.25,
                  fontSize: "0.95rem",
                  borderColor: alpha(config.color, 0.4),
                  color: config.color,
                  "&:hover": {
                    borderColor: config.color,
                    bgcolor: alpha(config.color, 0.06),
                  },
                }}
              >
                Odśwież stronę
              </Button>
            )}
          </Stack>

          {/* Subtle help text for maintenance */}
          {type === "maintenance" && (
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                pt: 1,
                fontSize: "0.8rem",
              }}
            >
              Jeśli problem się powtarza, skontaktuj się z administratorem.
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
