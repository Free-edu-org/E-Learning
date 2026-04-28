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
}: StatCardProps) {
  return (
    <Paper elevation={0} sx={panelGridCardSx}>
      <Box sx={panelGridCardContentSx}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Icon
            sx={{
              color: `${color}.main`,
              fontSize: 28,
            }}
          />
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette[color].main, 0.08),
            border: "1px solid",
            borderColor: (t) => alpha(t.palette[color].main, 0.18),
            textAlign: "center",
            mb: 1.5,
          }}
        >
          <Typography variant="h4" fontWeight={800} color={`${color}.main`}>
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
