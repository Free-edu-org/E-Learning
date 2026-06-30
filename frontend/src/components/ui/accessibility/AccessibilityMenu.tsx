import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AccessibilityNewOutlined as AccessibilityIcon,
  ContrastOutlined as ContrastIcon,
  RestartAltOutlined as ResetIcon,
  TextDecreaseOutlined as TextDecreaseIcon,
  TextIncreaseOutlined as TextIncreaseIcon,
} from "@mui/icons-material";
import { useAppTheme } from "@/context/ThemeContext";

export function AccessibilityMenu() {
  const theme = useTheme();
  const {
    fontScale,
    highContrast,
    decreaseFontScale,
    increaseFontScale,
    resetAccessibility,
    toggleHighContrast,
  } = useAppTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <Box
      sx={{
        position: "fixed",
        top: { xs: 10, md: 14 },
        left: { xs: 10, md: 14 },
        zIndex: theme.zIndex.modal + 1,
      }}
    >
      <IconButton
        aria-label="Otwórz menu dostępności"
        aria-controls={open ? "accessibility-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="menu"
        size="small"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          width: 38,
          height: 38,
          color: highContrast ? "#000000" : "primary.contrastText",
          bgcolor: highContrast ? "#facc15" : "primary.main",
          boxShadow: (t) =>
            t.palette.mode === "light"
              ? "0 8px 24px rgba(15, 23, 42, 0.14)"
              : "0 10px 28px rgba(0, 0, 0, 0.4)",
          "&:hover": {
            bgcolor: highContrast ? "#fde047" : "primary.dark",
          },
        }}
      >
        <AccessibilityIcon fontSize="small" />
      </IconButton>

      <Popover
        id="accessibility-menu"
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          role: "menu",
          "aria-label": "Ustawienia dostępności",
          sx: {
            mt: 1,
            width: 210,
            borderRadius: 1,
            border: "1px solid",
            borderColor: highContrast
              ? "#ffffff"
              : alpha(theme.palette.divider, 0.8),
            bgcolor: highContrast ? "#000000" : "background.paper",
            color: highContrast ? "#ffffff" : "text.primary",
            boxShadow: highContrast
              ? "0 0 0 2px #facc15"
              : "0 16px 40px rgba(15, 23, 42, 0.18)",
          },
        }}
      >
        <Stack spacing={1.5} sx={{ p: 2 }}>
          <Typography
            variant="caption"
            component="h2"
            sx={{
              color: highContrast ? "#ffffff" : "text.secondary",
              fontWeight: 800,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            Kontrast
          </Typography>
          <Button
            role="menuitemcheckbox"
            aria-checked={highContrast}
            variant={highContrast ? "contained" : "outlined"}
            startIcon={<ContrastIcon />}
            onClick={toggleHighContrast}
            sx={{
              justifyContent: "flex-start",
              borderColor: highContrast ? "#facc15" : "divider",
              color: highContrast ? "#000000" : "text.primary",
              bgcolor: highContrast ? "#facc15" : "transparent",
              "&:hover": {
                bgcolor: highContrast ? "#fde047" : "action.hover",
              },
            }}
          >
            {highContrast ? "Wysoki" : "Standardowy"}
          </Button>

          <Divider sx={{ borderColor: highContrast ? "#ffffff" : "divider" }} />

          <Typography
            variant="caption"
            component="h2"
            sx={{
              color: highContrast ? "#ffffff" : "text.secondary",
              fontWeight: 800,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            Czcionka
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Zmniejsz tekst">
              <IconButton
                aria-label="Zmniejsz tekst"
                onClick={decreaseFontScale}
                sx={{
                  color: highContrast ? "#ffffff" : "text.primary",
                  border: "1px solid",
                  borderColor: highContrast ? "#ffffff" : "divider",
                }}
              >
                <TextDecreaseIcon />
              </IconButton>
            </Tooltip>
            <Typography
              aria-live="polite"
              variant="body2"
              sx={{
                flex: 1,
                textAlign: "center",
                fontWeight: 800,
                color: highContrast ? "#facc15" : "text.primary",
              }}
            >
              {Math.round(fontScale)}%
            </Typography>
            <Tooltip title="Powiększ tekst">
              <IconButton
                aria-label="Powiększ tekst"
                onClick={increaseFontScale}
                sx={{
                  color: highContrast ? "#ffffff" : "text.primary",
                  border: "1px solid",
                  borderColor: highContrast ? "#ffffff" : "divider",
                }}
              >
                <TextIncreaseIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          <Button
            role="menuitem"
            variant="text"
            size="small"
            startIcon={<ResetIcon />}
            onClick={resetAccessibility}
            sx={{
              justifyContent: "flex-start",
              color: highContrast ? "#ffffff" : "text.secondary",
            }}
          >
            Resetuj ustawienia
          </Button>
        </Stack>
      </Popover>
    </Box>
  );
}
