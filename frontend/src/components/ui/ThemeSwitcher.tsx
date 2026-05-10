import { Box, IconButton, Stack, alpha, useTheme } from "@mui/material";
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";
import { useAppTheme } from "../../context/ThemeContext";

/**
 * Premium theme switcher component (capsule style).
 * Used across the application for light/dark mode toggling.
 */
export function ThemeSwitcher() {
  const theme = useTheme();
  const { mode, toggleColorMode } = useAppTheme();
  const isDark = mode === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        bgcolor: isDark
          ? alpha(theme.palette.common.black, 0.3)
          : alpha(theme.palette.common.white, 0.5),
        backdropFilter: "blur(12px)",
        p: "2px 6px",
        borderRadius: "99px",
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <Stack direction="row" spacing={0} alignItems="center">
        <IconButton
          size="small"
          onClick={() => mode !== "light" && toggleColorMode()}
          sx={{
            color: mode === "light" ? "primary.main" : "text.disabled",
            p: 1,
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
          }}
        >
          <LightModeIcon fontSize="small" />
        </IconButton>
        <Box
          sx={{
            width: 1,
            height: 16,
            bgcolor: alpha(theme.palette.divider, 0.1),
            mx: 0.5,
          }}
        />
        <IconButton
          size="small"
          onClick={() => mode !== "dark" && toggleColorMode()}
          sx={{
            color: mode === "dark" ? "primary.main" : "text.disabled",
            p: 1,
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
          }}
        >
          <DarkModeIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}
