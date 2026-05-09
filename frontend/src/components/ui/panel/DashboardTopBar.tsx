import { Box, Button, Switch } from "@mui/material";
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  LogoutOutlined as LogoutIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useAppTheme } from "@/context/ThemeContext";

interface DashboardTopBarProps {
  onLogout: () => void;
  hideLogout?: boolean;
}

/**
 * Shared top-right bar rendered in Student and Teacher dashboards.
 * Contains the dark/light mode toggle and the logout button.
 */
export function DashboardTopBar({
  onLogout,
  hideLogout = false,
}: DashboardTopBarProps) {
  const theme = useTheme();
  const { toggleColorMode } = useAppTheme();

  return (
    <Box
      sx={{
        position: { xs: "relative", md: "absolute" },
        top: { md: 32 },
        right: { md: 24 },
        mb: { xs: 3, md: 0 },
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 3,
        zIndex: 10,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <LightModeIcon
          fontSize="small"
          sx={{
            color:
              theme.palette.mode === "light" ? "primary.main" : "text.disabled",
            mr: 0.5,
            fontSize: 16,
          }}
        />
        <Switch
          size="small"
          checked={theme.palette.mode === "dark"}
          onChange={toggleColorMode}
        />
        <DarkModeIcon
          fontSize="small"
          sx={{
            color:
              theme.palette.mode === "dark" ? "primary.main" : "text.disabled",
            ml: 0.5,
            fontSize: 16,
          }}
        />
      </Box>
      {!hideLogout && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.8125rem",
            bgcolor: "background.paper",
            color: "text.secondary",
            borderColor: "divider",
            "&:hover": {
              borderColor: "divider",
              bgcolor: (t) =>
                t.palette.mode === "light"
                  ? "rgba(15,23,42,0.04)"
                  : "rgba(255,255,255,0.05)",
              color: "text.primary",
            },
          }}
        >
          Wyloguj
        </Button>
      )}
    </Box>
  );
}
