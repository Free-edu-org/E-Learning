import type { ReactNode } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { SchoolOutlined as SchoolIcon } from "@mui/icons-material";
import { panelSurfaceSx } from "@/components/ui/panel/panelStyles";

interface DashboardHeaderProps {
  loading: boolean;
  /** Display name shown in the greeting, e.g. user.username */
  username?: string | null;
  /** Role label shown below the greeting, e.g. "Panel ucznia" */
  subtitle: string;
  /** Fallback name used when username is null/empty */
  fallbackName?: string;
  /** Custom icon rendered inside the logo box. Defaults to SchoolIcon. */
  icon?: ReactNode;
}

/**
 * Shared header row for dashboards: icon logo + greeting text + subtitle.
 * Renders a Skeleton while loading.
 */
export function DashboardHeader({
  loading,
  username,
  subtitle,
  fallbackName = "Użytkowniku",
  icon,
}: DashboardHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 4,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            ...panelSurfaceSx,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: 1,
          }}
        >
          {icon ?? <SchoolIcon sx={{ color: "primary.main" }} />}
        </Box>
        <Box>
          {loading ? (
            <Skeleton width={180} height={28} />
          ) : (
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Witaj, {username ?? fallbackName}!
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
