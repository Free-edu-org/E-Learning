import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SvgIconProps } from "@mui/material";
import { panelGridCardSx, panelGridCardContentSx } from "./panelStyles";

interface StatCardProps {
  icon: React.ComponentType<SvgIconProps>;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "primary" | "success" | "info" | "warning" | "error";
  centerText?: boolean;
}

/**
 * Reusable stat card component for dashboards
 * Displays an icon, title, large value, and optional subtitle
 */
export function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "primary",
  centerText = false,
}: StatCardProps) {
  return (
    <Paper elevation={0} sx={{ ...panelGridCardSx, borderRadius: 3.5 }}>
      <Box sx={panelGridCardContentSx}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: centerText ? "column" : "row",
            justifyContent: centerText ? "center" : "flex-start",
            gap: 1.25,
            mb: 2,
            width: "100%",
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (t) => alpha(t.palette[color].main, 0.1),
              border: "1px solid",
              borderColor: (t) => alpha(t.palette[color].main, 0.15),
              flexShrink: 0,
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 20 }} />
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={500}
            sx={{ lineHeight: 1.3, textAlign: centerText ? "center" : "left" }}
          >
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.75,
            borderRadius: 1.5,
            bgcolor: (t) => alpha(t.palette[color].main, 0.06),
            border: "1px solid",
            borderColor: (t) => alpha(t.palette[color].main, 0.12),
            textAlign: "center",
            mb: 1.5,
          }}
        >
          <Typography
            variant="h4"
            fontWeight={800}
            color={`${color}.main`}
            sx={{ letterSpacing: "-0.02em" }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
