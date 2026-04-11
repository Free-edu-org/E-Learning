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
  border: "1px solid",
  borderColor: (theme) =>
    alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.22 : 0.32),
  bgcolor: (theme) =>
    alpha(
      theme.palette.common.white,
      theme.palette.mode === "dark" ? 0.02 : 0.86,
    ),
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
  p: 1.5,
  borderRadius: 2,
  bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
  border: "1px solid",
  borderColor: (theme) => alpha(theme.palette.success.main, 0.2),
};

export const taskFeedbackIncorrectSx: SxProps<Theme> = {
  mt: 2,
  p: 1.5,
  borderRadius: 2,
  bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
  border: "1px solid",
  borderColor: (theme) => alpha(theme.palette.error.main, 0.2),
};

export const chooseOptionCardSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  p: 2,
  borderRadius: 3,
  border: "1px solid",
  borderColor: (theme) =>
    alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.22 : 0.3),
  bgcolor: (theme) =>
    alpha(
      theme.palette.common.white,
      theme.palette.mode === "dark" ? 0.03 : 0.92,
    ),
  cursor: "pointer",
  transition: "border-color 0.15s, box-shadow 0.15s, background-color 0.15s",
  "&:hover": {
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.35),
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  },
};

export const chooseOptionSelectedSx: SxProps<Theme> = {
  ...chooseOptionCardSx,
  borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
  bgcolor: (theme) =>
    alpha(
      theme.palette.primary.main,
      theme.palette.mode === "dark" ? 0.08 : 0.06,
    ),
  boxShadow: (theme) =>
    `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
  "&:hover": {
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.6),
    boxShadow: (theme) =>
      `0 0 0 1px ${alpha(theme.palette.primary.main, 0.35)}`,
  },
};

export const chooseOptionCorrectSx: SxProps<Theme> = {
  ...chooseOptionCardSx,
  borderColor: (theme) => alpha(theme.palette.success.main, 0.5),
  bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
  cursor: "default",
  "&:hover": {},
};

export const chooseOptionIncorrectSx: SxProps<Theme> = {
  ...chooseOptionCardSx,
  borderColor: (theme) => alpha(theme.palette.error.main, 0.5),
  bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
  cursor: "default",
  "&:hover": {},
};

export const chooseOptionNumberSx: SxProps<Theme> = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  bgcolor: (theme) =>
    alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.08 : 0.06),
  color: "text.secondary",
  fontWeight: 700,
  fontSize: "0.9rem",
};

/* ── Task navigation sidebar (left rail) ─────────────────────────────────── */

export const taskNavRailSx: SxProps<Theme> = {
  position: "sticky",
  top: 24,
  width: 52,
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
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.78rem",
  transition: "all 0.15s ease",
  border: "2px solid",
  borderColor: "transparent",
  position: "relative",
};

export const sidebarCardSx: SxProps<Theme> = {
  p: 2.5,
  borderRadius: uiTokens.radius.card,
  border: "1px solid",
  borderColor: (theme) =>
    alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.22 : 0.3),
  bgcolor: (theme) =>
    alpha(
      theme.palette.common.white,
      theme.palette.mode === "dark" ? 0.02 : 0.92,
    ),
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
