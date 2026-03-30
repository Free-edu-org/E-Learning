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
  borderColor: (theme) => alpha(theme.palette.divider, 0.8),
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
  borderColor: (theme) => alpha(theme.palette.divider, 0.75),
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
  borderColor: (theme) => alpha(theme.palette.divider, 0.72),
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
  borderColor: (theme) => alpha(theme.palette.divider, 0.45),
};

export const panelActionClusterSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 1,
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
