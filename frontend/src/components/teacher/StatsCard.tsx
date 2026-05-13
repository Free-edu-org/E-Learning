import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AutoAwesomeOutlined as SparklesIcon,
  EmojiEventsOutlined as TrophyIcon,
  GroupOutlined as GroupIcon,
  MenuBookOutlined as LessonsIcon,
  PeopleOutlineOutlined as UsersIcon,
  PersonOutlineOutlined as StudentIcon,
  SchoolOutlined as TeacherIcon,
  TaskAltOutlined as TasksIcon,
  TrendingUpOutlined as TrendUpIcon,
  VerifiedOutlined as AdminIcon,
} from "@mui/icons-material";
import { panelSurfaceSx } from "@/components/ui/panel/panelStyles";

interface StatsCardProps {
  label: string;
  value: string | number;
  highlightColor?: string;
  helperText?: string;
}

type MetricMeta = {
  icon: typeof SparklesIcon;
  helper: string;
  gradient: string;
  glow: string;
  iconColor?: string;
};

function resolveMetricMeta(label: string, fallbackColor: string): MetricMeta {
  const normalized = label.toLowerCase();

  if (normalized.includes("wszyscy użytkownicy")) {
    return {
      icon: UsersIcon,
      helper: "Pełna baza kont w systemie",
      gradient:
        "linear-gradient(135deg, rgba(153,167,196,0.82) 0%, rgba(107,124,157,0.76) 100%)",
      glow: alpha("#64748b", 0.07),
    };
  }

  if (normalized.includes("administratorzy")) {
    return {
      icon: AdminIcon,
      helper: "Konta z pełnym dostępem",
      gradient:
        "linear-gradient(135deg, rgba(204,154,247,0.8) 0%, rgba(157,118,236,0.74) 100%)",
      glow: alpha("#8b5cf6", 0.075),
    };
  }

  if (normalized.includes("nauczyciele")) {
    return {
      icon: TeacherIcon,
      helper: "Aktywni prowadzący zajęcia",
      gradient:
        "linear-gradient(135deg, rgba(151,160,243,0.8) 0%, rgba(100,94,222,0.74) 100%)",
      glow: alpha("#4f46e5", 0.075),
    };
  }

  if (normalized.includes("ukończyli")) {
    return {
      icon: StudentIcon,
      helper: "Uczniowie z ukończoną lekcją",
      gradient: `linear-gradient(135deg, ${alpha(fallbackColor, 0.82)} 0%, ${alpha(fallbackColor, 0.76)} 100%)`,
      glow: alpha(fallbackColor, 0.075),
    };
  }

  if (normalized.includes("uczniowie")) {
    return {
      icon: StudentIcon,
      helper: "Konta uczniów i zaproszenia",
      gradient:
        "linear-gradient(135deg, rgba(107,218,146,0.8) 0%, rgba(47,169,95,0.74) 100%)",
      glow: alpha("#16a34a", 0.075),
    };
  }

  if (normalized.includes("średni wynik")) {
    return {
      icon: TrendUpIcon,
      helper: "Średni rezultat wszystkich prób",
      gradient: `linear-gradient(135deg, ${alpha(fallbackColor, 0.82)} 0%, ${alpha(fallbackColor, 0.76)} 100%)`,
      glow: alpha(fallbackColor, 0.075),
    };
  }

  if (normalized.includes("najlepszy wynik")) {
    return {
      icon: TrophyIcon,
      helper: "Najwyższy wynik w tej lekcji",
      gradient:
        "linear-gradient(135deg, rgba(247,164,96,0.82) 0%, rgba(226,110,47,0.76) 100%)",
      glow: alpha("#ea580c", 0.075),
    };
  }

  if (normalized.includes("grupy")) {
    return {
      icon: GroupIcon,
      helper: "Przestrzenie klas i zespołów",
      gradient:
        "linear-gradient(135deg, rgba(247,164,96,0.82) 0%, rgba(226,110,47,0.76) 100%)",
      glow: alpha("#ea580c", 0.075),
    };
  }

  if (normalized.includes("lekcji")) {
    return {
      icon: LessonsIcon,
      helper: "Materiały gotowe do pracy",
      gradient:
        "linear-gradient(135deg, rgba(125,177,247,0.82) 0%, rgba(72,123,229,0.76) 100%)",
      glow: alpha("#2563eb", 0.07),
    };
  }

  if (normalized.includes("zada")) {
    return {
      icon: TasksIcon,
      helper: "Zadania przypisane do lekcji",
      gradient:
        "linear-gradient(135deg, rgba(91,204,167,0.82) 0%, rgba(38,156,122,0.76) 100%)",
      glow: alpha("#059669", 0.07),
    };
  }

  if (normalized.includes("poprawne odpowiedzi")) {
    return {
      icon: TasksIcon,
      helper: "Suma prawidłowych odpowiedzi",
      gradient:
        "linear-gradient(135deg, rgba(125,177,247,0.82) 0%, rgba(72,123,229,0.76) 100%)",
      glow: alpha("#2563eb", 0.07),
    };
  }

  if (normalized.includes("punkty")) {
    return {
      icon: TrophyIcon,
      helper: "Suma punktów z ukończonych lekcji",
      gradient:
        "linear-gradient(135deg, rgba(247,164,96,0.82) 0%, rgba(226,110,47,0.76) 100%)",
      glow: alpha("#ea580c", 0.075),
    };
  }

  return {
    icon: SparklesIcon,
    helper: "Kluczowy wskaźnik panelu",
    gradient: `linear-gradient(135deg, ${alpha(fallbackColor, 0.76)} 0%, ${alpha(fallbackColor, 0.68)} 100%)`,
    glow: alpha(fallbackColor, 0.065),
  };
}

export function StatsCard({
  label,
  value,
  highlightColor,
  helperText,
}: StatsCardProps) {
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
        borderRadius: 3.5,
        px: 1.85,
        py: 0.9,
        flex: 1,
        minWidth: 170,
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        minHeight: 124,
        display: "flex",
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
        "&:hover": {
          transform: "translateY(-2px)",
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
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ minHeight: 26 }}
        >
          <Box
            sx={{
              width: 31,
              height: 31,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: metricMeta.iconColor ?? "common.white",
              background: metricMeta.gradient,
              boxShadow: `0 4px 8px ${metricMeta.glow}`,
              flexShrink: 0,
            }}
          >
            <MetricIcon sx={{ fontSize: 15.5 }} />
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color:
                theme.palette.mode === "light"
                  ? alpha(theme.palette.text.secondary, 0.98)
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
            py: 0,
            minHeight: 40,
            transform: "translateY(-2px)",
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
                  ? alpha(theme.palette.text.primary, 0.96)
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
                ? alpha(theme.palette.text.secondary, 0.68)
                : alpha(theme.palette.common.white, 0.36),
          }}
        >
          {helperText ?? metricMeta.helper}
        </Typography>
      </Stack>
    </Paper>
  );
}
