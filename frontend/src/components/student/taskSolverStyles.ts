import type { SxProps, Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";
import {
  CheckCircleOutline as ChooseIcon,
  EditNoteOutlined as WriteIcon,
  ShuffleOutlined as ScatterIcon,
  MicNoneOutlined as SpeakIcon,
} from "@mui/icons-material";
import { createElement } from "react";
import { uiTokens } from "@/theme/uiTokens";
import type { TaskType } from "@/api/taskService";

export const taskCardSx: SxProps<Theme> = {
  p: 2.5,
  borderRadius: uiTokens.radius.card,
  bgcolor: (theme) =>
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.white, 0.03)
      : theme.palette.background.paper,
  boxShadow: (theme) =>
    theme.palette.mode === "dark"
      ? "0 1px 8px rgba(0,0,0,0.35)"
      : "0 2px 12px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04)",
};

export const taskHeaderSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "flex-start",
  gap: 1.5,
  mb: 2,
};

export const taskHintSx: SxProps<Theme> = {
  fontStyle: "italic",
  color: "text.secondary",
  fontSize: "0.82rem",
  mt: 1,
};

export const taskFeedbackCorrectSx: SxProps<Theme> = {
  mt: 2,
  px: 1.5,
  py: 1.25,
  borderRadius: 2,
  bgcolor: (theme) => alpha(theme.palette.success.main, 0.06),
  boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.success.main}`,
};

export const taskFeedbackIncorrectSx: SxProps<Theme> = {
  mt: 2,
  px: 1.5,
  py: 1.25,
  borderRadius: 2,
  bgcolor: (theme) => alpha(theme.palette.error.main, 0.06),
  boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.error.main}`,
};

export const chooseOptionCardSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  px: 1.75,
  py: 1.25,
  borderRadius: 2.5,
  bgcolor: (theme) =>
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.white, 0.04)
      : theme.palette.background.paper,
  boxShadow: (theme) =>
    theme.palette.mode === "dark"
      ? "0 1px 4px rgba(0,0,0,0.3)"
      : "0 1px 4px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
  cursor: "pointer",
  transition: "box-shadow 0.15s, background-color 0.15s",
  "&:hover": {
    boxShadow: (theme) =>
      theme.palette.mode === "dark"
        ? `0 2px 10px rgba(0,0,0,0.4), 0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`
        : `0 4px 14px rgba(15,23,42,0.1), 0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
};

export const chooseOptionSelectedSx: SxProps<Theme> = {
  ...chooseOptionCardSx,
  bgcolor: (theme) =>
    alpha(
      theme.palette.primary.main,
      theme.palette.mode === "dark" ? 0.1 : 0.06,
    ),
  boxShadow: (theme) =>
    `0 2px 10px rgba(15,23,42,0.08), 0 0 0 2px ${alpha(theme.palette.primary.main, 0.45)}`,
  "&:hover": {
    boxShadow: (theme) =>
      `0 2px 10px rgba(15,23,42,0.08), 0 0 0 2px ${alpha(theme.palette.primary.main, 0.55)}`,
  },
};

export const chooseOptionCorrectSx: SxProps<Theme> = {
  ...chooseOptionCardSx,
  bgcolor: (theme) => alpha(theme.palette.success.main, 0.07),
  boxShadow: (theme) =>
    `0 1px 4px rgba(15,23,42,0.05), 0 0 0 2px ${alpha(theme.palette.success.main, 0.45)}`,
  cursor: "default",
  "&:hover": {},
};

export const chooseOptionIncorrectSx: SxProps<Theme> = {
  ...chooseOptionCardSx,
  bgcolor: (theme) => alpha(theme.palette.error.main, 0.07),
  boxShadow: (theme) =>
    `0 1px 4px rgba(15,23,42,0.05), 0 0 0 2px ${alpha(theme.palette.error.main, 0.45)}`,
  cursor: "default",
  "&:hover": {},
};

export const chooseOptionNumberSx: SxProps<Theme> = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  bgcolor: (theme) =>
    alpha(
      theme.palette.text.primary,
      theme.palette.mode === "dark" ? 0.07 : 0.05,
    ),
  color: "text.secondary",
  fontWeight: 700,
  fontSize: "0.75rem",
};

/* ── Task navigation sidebar (left rail) ─────────────────────────────────── */

export const taskNavRailSx: SxProps<Theme> = {
  position: "sticky",
  top: 24,
  width: 92,
  flexShrink: 0,
  maxHeight: "calc(100vh - 48px)",
  overflowY: "auto",
  overflowX: "hidden",
  py: 1,
  pr: 0.5,
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
};

export const taskNavDotBaseSx: SxProps<Theme> = {
  width: 36,
  height: 36,
  minWidth: 36,
  minHeight: 36,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.85rem",
  transition: "all 0.15s ease",
  border: "2px solid",
  borderColor: "transparent",
  position: "relative",
};

export const sidebarCardSx: SxProps<Theme> = {
  p: 2.5,
  borderRadius: uiTokens.radius.card,
  bgcolor: (theme) =>
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.white, 0.03)
      : theme.palette.background.paper,
  boxShadow: (theme) =>
    theme.palette.mode === "dark"
      ? "0 1px 8px rgba(0,0,0,0.35)"
      : "0 2px 12px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04)",
};

export const taskTypeMeta: Record<
  TaskType,
  { label: string; icon: ReactNode; color: string }
> = {
  choose: {
    label: "Wybór",
    icon: createElement(ChooseIcon, { fontSize: "small" }),
    color: "#10b981",
  },
  write: {
    label: "Pisanie",
    icon: createElement(WriteIcon, { fontSize: "small" }),
    color: "#6366f1",
  },
  scatter: {
    label: "Rozsypanka",
    icon: createElement(ScatterIcon, { fontSize: "small" }),
    color: "#f59e0b",
  },
  speak: {
    label: "Mówienie",
    icon: createElement(SpeakIcon, { fontSize: "small" }),
    color: "#ec4899",
  },
};
