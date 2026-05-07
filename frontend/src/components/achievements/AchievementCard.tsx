import { Box, Chip, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  CheckCircleOutlined as CheckCircleIcon,
  EmojiEventsOutlined as LockedAchievementIcon,
  LockOutlined as LockIcon,
} from "@mui/icons-material";
import type { StudentAchievement } from "@/api/studentService";
import { formatDate } from "@/utils/dashboardUtils";
import {
  getAchievementDescription,
  getAchievementIcon,
  getAchievementTitle,
  getAchievementVisuals,
} from "./achievementPresentation";

type AchievementCardProps = {
  achievement: StudentAchievement;
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const theme = useTheme();
  const visuals = getAchievementVisuals(theme, achievement.color);
  const title = getAchievementTitle(achievement.title);
  const description = getAchievementDescription(achievement.description);
  const icon = getAchievementIcon(achievement.icon);

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2.25,
        borderRadius: 3,
        border: "1px solid",
        borderColor: achievement.unlocked
          ? visuals.border
          : visuals.subduedBorder,
        bgcolor: achievement.unlocked
          ? visuals.softBackground
          : alpha(
              theme.palette.text.disabled,
              theme.palette.mode === "dark" ? 0.08 : 0.05,
            ),
        opacity: achievement.unlocked ? 1 : 0.78,
      }}
    >
      <Stack spacing={1.5} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" spacing={1.5}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              fontSize: 28,
              bgcolor: achievement.unlocked
                ? visuals.strongBackground
                : alpha(
                    theme.palette.common.black,
                    theme.palette.mode === "dark" ? 0.14 : 0.04,
                  ),
            }}
          >
            {achievement.unlocked ? (
              icon
            ) : (
              <LockedAchievementIcon color="disabled" />
            )}
          </Box>

          <Stack
            direction="row"
            spacing={0.75}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <Chip
              size="small"
              icon={achievement.unlocked ? <CheckCircleIcon /> : <LockIcon />}
              label={achievement.unlocked ? "Odblokowane" : "Zablokowane"}
              color={achievement.unlocked ? visuals.paletteColor : "default"}
              variant={achievement.unlocked ? "filled" : "outlined"}
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Stack>

        <Box>
          <Tooltip title={title} disableHoverListener={title.length < 36}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{ lineHeight: 1.25 }}
            >
              {title}
            </Typography>
          </Tooltip>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        </Box>

        <Box sx={{ mt: "auto", pt: 0.5 }}>
          {achievement.unlocked && achievement.unlockedAt ? (
            <Typography
              variant="caption"
              sx={{ color: visuals.accent, fontWeight: 700 }}
            >
              Zdobyte: {formatDate(achievement.unlockedAt)}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Oczekuje na odblokowanie przez backendowy event.
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
