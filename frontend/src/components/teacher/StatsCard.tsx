import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AutoAwesomeOutlined as SparklesIcon,
  GroupOutlined as GroupIcon,
  MenuBookOutlined as LessonsIcon,
  PeopleOutlineOutlined as UsersIcon,
  PersonOutlineOutlined as StudentIcon,
  SchoolOutlined as TeacherIcon,
  TaskAltOutlined as TasksIcon,
  VerifiedOutlined as AdminIcon,
} from "@mui/icons-material";
import { panelSurfaceSx } from "@/components/ui/panel/panelStyles";

interface StatsCardProps {
  label: string;
  value: string | number;
  highlightColor?: string;
}

function resolveMetricMeta(label: string, fallbackColor: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("wszyscy użytkownicy")) {
    return {
      icon: UsersIcon,
      helper: "Pełna baza kont w systemie",
      gradient: "linear-gradient(135deg, rgba(96,165,250,0.92) 0%, rgba(37,99,235,0.88) 100%)",
      glow: alpha("#3b82f6", 0.12),
    };
  }

  if (normalized.includes("administratorzy")) {
    return {
      icon: AdminIcon,
      helper: "Konta z pełnym dostępem",
      gradient: "linear-gradient(135deg, rgba(192,132,252,0.9) 0%, rgba(139,92,246,0.86) 100%)",
      glow: alpha("#8b5cf6", 0.12),
    };
  }

  if (normalized.includes("nauczyciele")) {
    return {
      icon: TeacherIcon,
      helper: "Aktywni prowadzący zajęcia",
      gradient: "linear-gradient(135deg, rgba(129,140,248,0.9) 0%, rgba(79,70,229,0.86) 100%)",
      glow: alpha("#4f46e5", 0.12),
    };
  }

  if (normalized.includes("uczniowie")) {
    return {
      icon: StudentIcon,
      helper: "Konta uczniów i zaproszenia",
      gradient: "linear-gradient(135deg, rgba(74,222,128,0.9) 0%, rgba(22,163,74,0.86) 100%)",
      glow: alpha("#16a34a", 0.12),
    };
  }

  if (normalized.includes("grupy")) {
    return {
      icon: GroupIcon,
      helper: "Przestrzenie klas i zespołów",
      gradient: "linear-gradient(135deg, rgba(251,146,60,0.9) 0%, rgba(234,88,12,0.86) 100%)",
      glow: alpha("#ea580c", 0.12),
    };
  }

  if (normalized.includes("lekcji")) {
    return {
      icon: LessonsIcon,
      helper: "Materiały gotowe do pracy",
      gradient: "linear-gradient(135deg, rgba(96,165,250,0.9) 0%, rgba(37,99,235,0.86) 100%)",
      glow: alpha("#2563eb", 0.11),
    };
  }

  if (normalized.includes("zada")) {
    return {
      icon: TasksIcon,
      helper: "Zadania przypisane do lekcji",
      gradient: "linear-gradient(135deg, rgba(52,211,153,0.9) 0%, rgba(5,150,105,0.86) 100%)",
      glow: alpha("#059669", 0.11),
    };
  }

  return {
    icon: SparklesIcon,
    helper: "Kluczowy wskaźnik panelu",
    gradient: `linear-gradient(135deg, ${alpha(fallbackColor, 0.86)} 0%, ${alpha(fallbackColor, 0.78)} 100%)`,
    glow: alpha(fallbackColor, 0.1),
  };
}

export function StatsCard({ label, value, highlightColor }: StatsCardProps) {
  const theme = useTheme();
  const accentColor =
    highlightColor ??
    (theme.palette.mode === "light"
      ? theme.palette.primary.main
      : theme.palette.primary.light);
  const metricMeta = resolveMetricMeta(label, accentColor);
  const MetricIcon = metricMeta.icon;

  return (
    <Paper
      elevation={0}
      sx={{
        ...panelSurfaceSx,
        px: 1.85,
        py: 0.9,
        flex: 1,
        minWidth: 170,
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        minHeight: 124,
        display: "flex",
        bgcolor: theme.palette.mode === "light" ? undefined : "#182133",
        backgroundImage:
          theme.palette.mode === "light"
            ? "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(249,250,255,0.92) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.026) 0%, rgba(255,255,255,0.004) 100%)",
        boxShadow:
          theme.palette.mode === "light"
            ? "0 8px 18px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.82)"
            : "0 5px 14px rgba(0, 0, 0, 0.13)",
        transition:
          "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 42%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.022) 0%, rgba(255,255,255,0) 38%)",
          pointerEvents: "none",
        },
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            theme.palette.mode === "light"
              ? `0 12px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px ${alpha(accentColor, 0.05)}`
              : `0 9px 18px rgba(0, 0, 0, 0.18), 0 0 0 1px ${alpha(accentColor, 0.06)}`,
          borderColor: alpha(accentColor, theme.palette.mode === "light" ? 0.14 : 0.1),
        },
      }}
    >
      <Stack
        spacing={0.5}
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100%",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minHeight: 26 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "common.white",
              background: metricMeta.gradient,
              boxShadow: `0 6px 12px ${metricMeta.glow}`,
              flexShrink: 0,
            }}
          >
            <MetricIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color:
                theme.palette.mode === "light"
                  ? alpha(theme.palette.text.secondary, 0.96)
                  : alpha(theme.palette.common.white, 0.62),
            }}
          >
            {label}
          </Typography>
        </Stack>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 0.05,
            minHeight: 40,
          }}
        >
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              lineHeight: 0.92,
              letterSpacing: "-0.05em",
              color:
                highlightColor ??
                (theme.palette.mode === "light"
                  ? theme.palette.text.primary
                  : alpha(theme.palette.common.white, 0.98)),
            }}
          >
            {value}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            fontSize: "0.65rem",
            lineHeight: 1.45,
            letterSpacing: "0.01em",
            textAlign: "center",
            color:
              theme.palette.mode === "light"
                ? alpha(theme.palette.text.secondary, 0.72)
                : alpha(theme.palette.common.white, 0.36),
          }}
        >
          {metricMeta.helper}
        </Typography>
      </Stack>
    </Paper>
  );
}
