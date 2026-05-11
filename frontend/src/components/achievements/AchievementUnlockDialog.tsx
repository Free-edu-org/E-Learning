import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha, keyframes, useTheme } from "@mui/material/styles";
import {
  AutoAwesomeOutlined as SparklesIcon,
  EmojiEventsOutlined as AchievementIcon,
} from "@mui/icons-material";
import type { StudentAchievement } from "@/api/studentService";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogStatus,
} from "@/components/ui/dialog/AppDialog";
import { formatDate } from "@/utils/dashboardUtils";
import {
  getAchievementDescription,
  getAchievementIcon,
  getAchievementTitle,
  getAchievementVisuals,
} from "./achievementPresentation";

const iconFloat = keyframes`
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-6px) scale(1.03); }
  100% { transform: translateY(0px) scale(1); }
`;

const haloPulse = keyframes`
  0% { transform: scale(0.98); opacity: 0.2; }
  100% { transform: scale(1.02); opacity: 0.36; }
`;

type AchievementUnlockDialogProps = {
  achievement: StudentAchievement | null;
  currentIndex: number;
  total: number;
  open: boolean;
  processing?: boolean;
  error?: string | null;
  onAdvance: () => void;
  onClose: () => void;
};

export function AchievementUnlockDialog({
  achievement,
  currentIndex,
  total,
  open,
  processing = false,
  error = null,
  onAdvance,
  onClose,
}: AchievementUnlockDialogProps) {
  const theme = useTheme();

  if (!achievement) {
    return null;
  }

  const visuals = getAchievementVisuals(theme, achievement.color);
  const title = getAchievementTitle(achievement.title);
  const description = getAchievementDescription(achievement.description);
  const icon = getAchievementIcon(achievement.icon);
  const isLast = currentIndex >= total - 1;
  const panelSurface = theme.palette.mode === "dark" ? "#0f172a" : "#ffffff";
  const panelSurfaceAlt = theme.palette.mode === "dark" ? "#111827" : "#f8fafc";
  const mutedSurface = theme.palette.mode === "dark" ? "#1f2937" : "#f1f5f9";
  const dialogTitle = isLast
    ? "Masz nowe osiągnięcie"
    : "Kolejne osiągnięcie odblokowane";
  const dialogSubtitle = isLast
    ? "Twój postęp został właśnie zapisany w panelu ucznia."
    : "Po chwili pokażemy Ci następne zdobyte osiągnięcie.";
  const helperCopy = error
    ? "Nie udało się jeszcze zapisać tego komunikatu. Spróbuj ponownie."
    : !isLast
      ? "Przejdź dalej, aby zobaczyć następne odblokowane osiągnięcie."
      : null;

  return (
    <AppDialog
      open={open}
      onClose={processing ? () => undefined : onClose}
      maxWidth="xs"
      backdropSx={{
        backgroundColor: alpha(
          "#0f172a",
          theme.palette.mode === "dark" ? 0.56 : 0.34,
        ),
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      paperSx={{
        position: "relative",
        overflow: "hidden",
        color: "text.primary",
        bgcolor: panelSurface,
        background: `linear-gradient(180deg, ${panelSurfaceAlt} 0%, ${panelSurface} 100%)`,
        backgroundImage: "none",
        borderColor: alpha(
          visuals.accent,
          theme.palette.mode === "dark" ? 0.22 : 0.2,
        ),
        boxShadow: `0 28px 70px ${alpha("#020617", theme.palette.mode === "dark" ? 0.58 : 0.22)}`,
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundColor: panelSurface,
          zIndex: 0,
        },
        "& > *": {
          position: "relative",
          zIndex: 1,
        },
      }}
    >
      <AppDialogHeader
        icon={<AchievementIcon />}
        title={dialogTitle}
        subtitle={dialogSubtitle}
      />

      <AppDialogBody>
        {error && <AppDialogStatus severity="error">{error}</AppDialogStatus>}

        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2.5}
            alignItems={{ xs: "center", sm: "flex-start" }}
          >
            <Box
              sx={{
                position: "relative",
                width: 132,
                height: 132,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 12,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${alpha(visuals.accent, 0.24)} 0%, ${alpha(visuals.accent, 0.06)} 70%, transparent 100%)`,
                  animation: `${haloPulse} 2.4s ease-in-out infinite alternate`,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `1px solid ${alpha(visuals.accent, 0.16)}`,
                  backgroundColor: panelSurfaceAlt,
                }}
              />
              <Box
                sx={{
                  position: "relative",
                  width: 88,
                  height: 88,
                  borderRadius: 3.5,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 44,
                  color: visuals.accent,
                  backgroundColor: mutedSurface,
                  border: `1px solid ${alpha(visuals.accent, 0.18)}`,
                  animation: `${iconFloat} 2.6s ease-in-out infinite`,
                }}
              >
                {icon}
              </Box>
            </Box>

            <Stack
              spacing={1.5}
              sx={{
                flex: 1,
                minWidth: 0,
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                justifyContent={{ xs: "center", sm: "flex-start" }}
                flexWrap="wrap"
                useFlexGap
              >
                <Chip
                  icon={<SparklesIcon fontSize="small" />}
                  label="Nowy etap"
                  sx={{
                    color: visuals.accent,
                    bgcolor: mutedSurface,
                    border: `1px solid ${alpha(visuals.accent, 0.18)}`,
                    fontWeight: 700,
                  }}
                />
                {total > 1 && (
                  <Chip
                    size="small"
                    label={`Osiągnięcie ${currentIndex + 1} z ${total}`}
                    variant="outlined"
                    sx={{
                      color: "text.secondary",
                      borderColor: alpha(theme.palette.divider, 0.7),
                      bgcolor: mutedSurface,
                    }}
                  />
                )}
              </Stack>

              <Box>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{ lineHeight: 1.16 }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1,
                    color: "text.secondary",
                    lineHeight: 1.7,
                  }}
                >
                  {description}
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Stack spacing={1.5}>
            {achievement.unlockedAt && (
              <Typography variant="body2" color="text.secondary">
                Zdobyte {formatDate(achievement.unlockedAt)}
              </Typography>
            )}
            {helperCopy && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                {helperCopy}
              </Typography>
            )}
          </Stack>
        </Stack>
      </AppDialogBody>

      <AppDialogFooter>
        <Button
          variant="contained"
          onClick={onAdvance}
          disabled={processing}
          sx={{
            minWidth: 170,
            borderRadius: 999,
            px: 3,
            py: 1.15,
            textTransform: "none",
            fontWeight: 700,
            background: visuals.accent,
            boxShadow: `0 10px 24px ${alpha(visuals.accent, 0.22)}`,
            "&:hover": {
              background: visuals.accent,
              boxShadow: `0 14px 28px ${alpha(visuals.accent, 0.28)}`,
            },
          }}
        >
          {processing
            ? "Zapisywanie"
            : error
              ? "Spróbuj ponownie"
              : isLast
                ? "Rozumiem"
                : "Dalej"}
        </Button>
      </AppDialogFooter>
    </AppDialog>
  );
}
