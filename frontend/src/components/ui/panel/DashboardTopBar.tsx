import { Box, Button } from "@mui/material";
import { LogoutOutlined as LogoutIcon } from "@mui/icons-material";
import { ThemeSwitcher } from "../../ui/ThemeSwitcher";

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
        gap: 1.5,
        zIndex: 10,
      }}
    >
      <ThemeSwitcher />
      {!hideLogout && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
          onClick={onLogout}
          sx={{
            height: 38,
            borderRadius: "99px",
            px: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            bgcolor: (t) =>
              t.palette.mode === "dark"
                ? "rgba(0,0,0,0.3)"
                : "rgba(255,255,255,0.5)",
            backdropFilter: "blur(12px)",
            color: "text.primary",
            borderColor: "divider",
            borderWidth: "1px",
            "&:hover": {
              borderColor: "divider",
              bgcolor: (t) =>
                t.palette.mode === "light"
                  ? "rgba(15,23,42,0.04)"
                  : "rgba(255,255,255,0.1)",
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s",
          }}
        >
          Wyloguj
        </Button>
      )}
    </Box>
  );
}
