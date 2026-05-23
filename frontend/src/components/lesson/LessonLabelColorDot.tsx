import { Box, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getLessonLabelColorOption } from "@/constants/lessonLabelColors";
import type { LessonLabelColor } from "@/constants/lessonLabelColors";

interface LessonLabelColorDotProps {
  color?: LessonLabelColor | string | null;
  size?: number;
  showLabel?: boolean;
}

export function LessonLabelColorDot({
  color,
  size = 10,
  showLabel = false,
}: LessonLabelColorDotProps) {
  const option = getLessonLabelColorOption(color);

  if (!option) {
    return null;
  }

  const label = `Kolor lekcji: ${option.label}`;

  return (
    <Tooltip title={label} arrow placement="top">
      <Box
        component="span"
        aria-label={label}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.65,
          minWidth: 0,
          flexShrink: 0,
          verticalAlign: "middle",
        }}
      >
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            bgcolor: option.color,
            border: "1px solid",
            borderColor: (theme) => alpha(theme.palette.common.white, 0.75),
            boxShadow: (theme) =>
              `0 0 0 1px ${alpha(theme.palette.text.primary, 0.16)}, 0 2px 5px ${alpha(option.color, 0.28)}`,
            flexShrink: 0,
          }}
        />
        {showLabel && (
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700, minWidth: 0 }}
          >
            {option.label}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}
