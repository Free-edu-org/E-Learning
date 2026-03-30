import type { SxProps, Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { uiTokens } from "@/theme/uiTokens";

export const outlinedMetaChipSx: SxProps<Theme> = {
  borderRadius: 999,
  maxWidth: "100%",
  "& .MuiChip-label": {
    overflowWrap: "anywhere",
  },
};

export const panelIconButtonSx: SxProps<Theme> = {
  width: uiTokens.control.iconButtonSize,
  height: uiTokens.control.iconButtonSize,
  borderRadius: 2.5,
  border: "1px solid",
  borderColor: (theme) => alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.3 : 0.42),
  bgcolor: (theme) => alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.03 : 0.75),
  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.14)",
    borderColor: "primary.main",
  },
};

export const panelListRowSx: SxProps<Theme> = {
  p: 2,
  borderRadius: uiTokens.radius.card,
  border: "1px solid",
  borderColor: (theme) => alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.24 : 0.34),
  bgcolor: (theme) => alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.02 : 0.82),
  transition: "box-shadow 0.2s, transform 0.15s, border-color 0.15s",
  "&:hover": {
    boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)",
    transform: "translateY(-1px)",
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.28),
  },
};

export const panelGridCardSx: SxProps<Theme> = {
  height: "100%",
  minHeight: uiTokens.card.minHeight,
  borderRadius: uiTokens.radius.card,
  border: "1px solid",
  borderColor: (theme) => alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.22 : 0.32),
  bgcolor: (theme) => alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.02 : 0.86),
  transition: "box-shadow 0.2s, transform 0.15s, border-color 0.15s",
  "&:hover": {
    boxShadow: "0 18px 34px rgba(15, 23, 42, 0.14)",
    transform: "translateY(-2px)",
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
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
  borderColor: (theme) => alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.18 : 0.24),
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
  color: "error.main",
  border: "1px solid",
  borderColor: "error.main",
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
    boxShadow: "0 18px 34px rgba(15, 23, 42, 0.14)",
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
  borderColor: (theme) => alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.22 : 0.3),
  bgcolor: (theme) => alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.02 : 0.78),
};

export const panelSurfaceSx: SxProps<Theme> = {
  borderRadius: uiTokens.radius.card,
  border: "1px solid",
  borderColor: (theme) => alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.22 : 0.3),
  bgcolor: "background.paper",
};
