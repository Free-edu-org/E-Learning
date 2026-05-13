import React from "react";
import { Box, Paper, Snackbar, Typography, Slide } from "@mui/material";
import { alpha, useTheme, keyframes } from "@mui/material/styles";
import { EmojiEventsOutlined as AchievementIcon } from "@mui/icons-material";
import type { StudentAchievement } from "@/api/studentService";
import {
  getAchievementIcon,
  getAchievementTitle,
  getAchievementVisuals,
} from "./achievementPresentation";

const pulse = keyframes`
  0% { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  50% { box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
  100% { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
`;

interface AchievementNotificationToastProps {
  achievement: StudentAchievement | null;
  open: boolean;
  onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void;
  onClick: () => void;
}

export function AchievementNotificationToast({
  achievement,
  open,
  onClose,
  onClick,
}: AchievementNotificationToastProps) {
  const theme = useTheme();

  if (!achievement) return null;

  const visuals = getAchievementVisuals(theme, achievement.color);
  const title = getAchievementTitle(achievement.title);
  const icon = getAchievementIcon(achievement.icon);

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      TransitionComponent={(props) => <Slide {...props} direction="left" />}
      sx={{
        mb: { xs: 2, md: 4 },
        mr: { xs: 1, md: 2 },
        zIndex: 9999,
      }}
    >
      <Paper
        elevation={0}
        onClick={onClick}
        sx={{
          p: 1.5,
          minWidth: 280,
          maxWidth: 340,
          borderRadius: 3,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 2,
          position: "relative",
          overflow: "hidden",
          border: "1px solid",
          borderColor: alpha(visuals.accent, 0.2),
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.94)} 0%, ${alpha(theme.palette.background.paper, 0.88)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.98)} 0%, ${alpha(theme.palette.common.white, 0.92)} 100%)`,
          backdropFilter: "blur(12px)",
          boxShadow: `0 12px 32px ${alpha("#000", 0.12)}`,
          animation: `${pulse} 3s infinite ease-in-out`,
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px) scale(1.02)",
            borderColor: alpha(visuals.accent, 0.4),
            boxShadow: `0 20px 48px ${alpha(visuals.accent, 0.15)}`,
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: 4,
            height: "100%",
            bgcolor: visuals.accent,
          },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            fontSize: 24,
            flexShrink: 0,
            bgcolor: alpha(visuals.accent, 0.1),
            color: visuals.accent,
            border: `1px solid ${alpha(visuals.accent, 0.15)}`,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            fontWeight={800}
            color={visuals.accent}
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: 0.9,
              fontSize: "0.65rem",
            }}
          >
            Odblokowano osiągnięcie!
          </Typography>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mt: 0.25,
            }}
          >
            {title}
          </Typography>
        </Box>
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
          <AchievementIcon
            sx={{ fontSize: 20, color: alpha(theme.palette.text.primary, 0.2) }}
          />
        </Box>
      </Paper>
    </Snackbar>
  );
}
