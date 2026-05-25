import type { SxProps, Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { uiTokens } from "@/theme/uiTokens";

export const outlinedMetaChipSx: SxProps<Theme> = {
  borderRadius: 999,
  maxWidth: "100%",
  height: 24,
  fontSize: "0.72rem",
  fontWeight: 500,
  "& .MuiChip-label": {
    overflowWrap: "anywhere",
    px: 1.25,
  },
};

export const panelIconButtonSx: SxProps<Theme> = {
  width: uiTokens.control.iconButtonSize,
  height: uiTokens.control.iconButtonSize,
  borderRadius: 2,
  border: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.07)
      : alpha(theme.palette.common.white, 0.08),
  bgcolor: (theme) => (theme.palette.mode === "light" ? "#ffffff" : "#151a2c"),
  transition:
    "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: (theme) =>
      theme.palette.mode === "light"
        ? "0 4px 12px rgba(15, 23, 42, 0.1)"
        : "0 8px 18px rgba(0, 0, 0, 0.24)",
    borderColor: (theme) =>
      theme.palette.mode === "light"
        ? theme.palette.primary.main
        : alpha(theme.palette.primary.light, 0.28),
  },
};

export const panelListRowSx: SxProps<Theme> = {
  p: 2,
  borderRadius: uiTokens.radius.card,
  border: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.06)
      : alpha(theme.palette.common.white, 0.06),
  bgcolor: (theme) => (theme.palette.mode === "light" ? "#ffffff" : "#151a2c"),
  backgroundImage: (theme) =>
    theme.palette.mode === "light"
      ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,252,255,0.98) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 48%)",
  boxShadow: (theme) =>
    theme.palette.mode === "light"
      ? "0 6px 16px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)"
      : "0 4px 12px rgba(0, 0, 0, 0.18)",
  transition: "box-shadow 0.2s, transform 0.15s, border-color 0.15s",
  "&:hover": {
    boxShadow: (theme) =>
      theme.palette.mode === "light"
        ? "0 10px 24px rgba(15, 23, 42, 0.08)"
        : "0 12px 20px rgba(0, 0, 0, 0.24)",
    transform: "translateY(-1px)",
    borderColor: (theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.3)
        : alpha(theme.palette.primary.light, 0.16),
  },
};

export const panelGridCardSx: SxProps<Theme> = {
  height: "100%",
  minHeight: uiTokens.card.minHeight,
  borderRadius: uiTokens.radius.card,
  border: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.055)
      : alpha(theme.palette.common.white, 0.06),
  bgcolor: (theme) => (theme.palette.mode === "light" ? "#ffffff" : "#151a2c"),
  backgroundImage: (theme) =>
    theme.palette.mode === "light"
      ? "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,251,255,0.985) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 54%)",
  boxShadow: (theme) =>
    theme.palette.mode === "light"
      ? "0 8px 22px rgba(15, 23, 42, 0.05), 0 2px 6px rgba(15, 23, 42, 0.025)"
      : "0 6px 16px rgba(0, 0, 0, 0.2)",
  transition: "box-shadow 0.2s, transform 0.15s, border-color 0.15s",
  "&:hover": {
    boxShadow: (theme) =>
      theme.palette.mode === "light"
        ? "0 12px 28px rgba(15, 23, 42, 0.08)"
        : "0 12px 22px rgba(0, 0, 0, 0.24)",
    transform: "translateY(-2px)",
    borderColor: (theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.3)
        : alpha(theme.palette.primary.light, 0.16),
  },
};

export const panelGridCardContentSx: SxProps<Theme> = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  p: uiTokens.card.contentPadding,
  "&:last-child": {
    pb: uiTokens.card.contentPadding,
  },
};

export const panelCardFooterSx: SxProps<Theme> = {
  mt: "auto",
  pt: uiTokens.card.footerPaddingTop,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  borderTop: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.05)
      : alpha(theme.palette.common.white, 0.06),
  backgroundColor: (theme) =>
    theme.palette.mode === "light"
      ? alpha("#f7f9fc", 0.72)
      : alpha(theme.palette.common.white, 0.015),
};

export const panelActionClusterSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 1,
};

export const panelInlineActionsSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 0.75,
  flexWrap: "wrap",
};

export const panelFooterButtonsSx: SxProps<Theme> = {
  width: "100%",
  display: "flex",
  alignItems: "stretch",
  gap: 1,
  flexWrap: "wrap",
};

export const panelFooterButtonSx: SxProps<Theme> = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 600,
  minWidth: 0,
  boxShadow: "none",
};

export const panelDeleteButtonSx: SxProps<Theme> = {
  ...panelFooterButtonSx,
  color: (theme) => theme.palette.error.main,
  border: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.error.main, 0.3)
      : alpha(theme.palette.error.light, 0.18),
  bgcolor: (theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.error.main, 0.04)
      : alpha(theme.palette.error.light, 0.06),
  "&:hover": {
    borderColor: (theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.error.main, 0.6)
        : alpha(theme.palette.error.light, 0.28),
    bgcolor: (theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.error.main, 0.08)
        : alpha(theme.palette.error.light, 0.09),
  },
};

export const panelToolbarButtonSx: SxProps<Theme> = {
  ...panelFooterButtonSx,
  minHeight: 34,
  minWidth: { xs: "100%", sm: 124 },
  px: 1.5,
  whiteSpace: "nowrap",
  fontSize: "0.84rem",
};

export const panelSurfaceActionSx: SxProps<Theme> = {
  p: 2.25,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.5,
  cursor: "pointer",
  transition: "box-shadow 0.2s, border-color 0.2s, transform 0.15s",
  "&:hover": {
    boxShadow: (theme) =>
      theme.palette.mode === "light"
        ? "0 8px 28px rgba(15, 23, 42, 0.1)"
        : "0 8px 28px rgba(0, 0, 0, 0.55)",
    borderColor: "primary.main",
    transform: "translateY(-2px)",
  },
};

export const panelTitleSx: SxProps<Theme> = {
  lineHeight: 1.3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const panelSingleLineSx: SxProps<Theme> = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const panelTwoLinesSx: SxProps<Theme> = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  minHeight: 40,
};

export const panelToolbarSx: SxProps<Theme> = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 1.5,
  p: 1.5,
  borderRadius: uiTokens.radius.card,
  border: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.06)
      : alpha(theme.palette.common.white, 0.06),
  bgcolor: (theme) => (theme.palette.mode === "light" ? "#f8faff" : "#111625"),
  backgroundImage: (theme) =>
    theme.palette.mode === "light"
      ? "linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(248,250,255,0.96) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
  boxShadow: (theme) =>
    theme.palette.mode === "light"
      ? "0 6px 16px rgba(15, 23, 42, 0.04)"
      : "0 4px 10px rgba(0, 0, 0, 0.18)",
  "&& .MuiAutocomplete-root .MuiOutlinedInput-root, && .MuiOutlinedInput-root, && .MuiAutocomplete-inputRoot, && .MuiInputBase-root":
    {
      borderRadius: 2,
      minHeight: 40,
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.common.white, 0.98)
          : "#151a2c",
      border: "1px solid",
      borderColor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.text.primary, 0.06)
          : alpha(theme.palette.common.white, 0.06),
      boxShadow: (theme: Theme) =>
        theme.palette.mode === "light"
          ? "0 2px 8px rgba(15, 23, 42, 0.035)"
          : "inset 0 1px 0 rgba(255,255,255,0.02)",
      transition:
        "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
      "&:hover": {
        borderColor: (theme: Theme) =>
          theme.palette.mode === "light"
            ? alpha(theme.palette.primary.main, 0.14)
            : alpha(theme.palette.common.white, 0.1),
        bgcolor: (theme: Theme) =>
          theme.palette.mode === "light"
            ? theme.palette.common.white
            : "#171d2f",
      },
      "&.Mui-focused": {
        borderColor: (theme: Theme) =>
          theme.palette.mode === "light"
            ? alpha(theme.palette.primary.main, 0.22)
            : alpha(theme.palette.primary.light, 0.2),
        boxShadow: (theme: Theme) =>
          theme.palette.mode === "light"
            ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`
            : `0 0 0 3px ${alpha(theme.palette.primary.light, 0.08)}`,
      },
    },
  "& .MuiAutocomplete-tag": {
    margin: "2px",
    height: 20,
    fontSize: "0.7rem",
  },
  "& .MuiInputBase-input::placeholder": {
    opacity: 1,
    color: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.text.secondary, 0.8)
        : alpha(theme.palette.common.white, 0.38),
  },
};

export const panelSurfaceSx: SxProps<Theme> = {
  borderRadius: uiTokens.radius.card,
  border: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.055)
      : alpha(theme.palette.common.white, 0.05),
  bgcolor: (theme) => (theme.palette.mode === "light" ? "#ffffff" : "#121827"),
  backgroundImage: (theme) =>
    theme.palette.mode === "light"
      ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,251,255,0.97) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.022) 0%, rgba(255,255,255,0.006) 100%)",
  boxShadow: (theme) =>
    theme.palette.mode === "light"
      ? "0 10px 24px rgba(15, 23, 42, 0.045), 0 2px 6px rgba(15, 23, 42, 0.02)"
      : "0 6px 16px rgba(0, 0, 0, 0.14)",
};
