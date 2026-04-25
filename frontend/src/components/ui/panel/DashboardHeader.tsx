import { useState, type ReactNode } from "react";
import { Box, IconButton, Skeleton, Tooltip, Typography } from "@mui/material";
import {
  SchoolOutlined as SchoolIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import type { UserProfile } from "@/api/userService";
import { AccountSettingsDialog } from "@/components/ui/panel/AccountSettingsDialog";
import { panelSurfaceSx } from "@/components/ui/panel/panelStyles";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";

interface DashboardHeaderProps {
  loading: boolean;
  /** Display name shown in the greeting, e.g. user.username */
  username?: string | null;
  /** Role label shown below the greeting, e.g. "Panel ucznia" */
  subtitle: string;
  /** Fallback name used when username is null/empty */
  fallbackName?: string;
  /** Custom icon rendered inside the logo box. Defaults to UserAvatar or SchoolIcon. */
  icon?: ReactNode;
  user?: UserProfile | null;
  onUserUpdated?: (user: UserProfile) => void;
}

/**
 * Shared header row for dashboards: clickable account icon + greeting text.
 * Renders a Skeleton while loading.
 */
export function DashboardHeader({
  loading,
  username,
  subtitle,
  fallbackName = "Użytkowniku",
  icon,
  user,
  onUserUpdated,
}: DashboardHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsEnabled = Boolean(user && onUserUpdated);
  
  const isAvatar = Boolean(user && !icon);
  
  const headerIcon = icon ?? (user ? (
    <UserAvatar avatarUrl={user.avatarUrl} username={user.username} size={48} />
  ) : (
    <SchoolIcon sx={{ color: "primary.main" }} />
  ));

  const iconBoxSx = {
    ...(isAvatar ? {} : panelSurfaceSx),
    width: 48,
    height: 48,
    p: isAvatar ? 0 : undefined,
    boxShadow: isAvatar ? 0 : 1,
    overflow: 'visible',
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {settingsEnabled ? (
            <Tooltip title="Ustawienia konta">
              <IconButton
                aria-label="Ustawienia konta"
                onClick={() => setSettingsOpen(true)}
                sx={{
                  ...iconBoxSx,
                  position: "relative",
                  color: "primary.main",
                }}
              >
                {headerIcon}
                <Box
                  sx={{
                    position: "absolute",
                    right: -5,
                    bottom: -5,
                    width: 19,
                    height: 19,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "primary.contrastText",
                    bgcolor: "primary.main",
                    border: "2px solid",
                    borderColor: "background.paper",
                    boxShadow: (theme) =>
                      `0 2px 8px ${alpha(theme.palette.common.black, 0.22)}`,
                  }}
                >
                  <SettingsIcon sx={{ fontSize: 12 }} />
                </Box>
              </IconButton>
            </Tooltip>
          ) : (
            <Box
              sx={{
                ...iconBoxSx,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {headerIcon}
            </Box>
          )}
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
      <AccountSettingsDialog
        open={settingsOpen}
        user={user ?? null}
        onClose={() => setSettingsOpen(false)}
        onUserUpdated={(updatedUser) => {
          onUserUpdated?.(updatedUser);
        }}
      />
    </>
  );
}
