import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Collapse,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  AddCircleOutline as AddCircleIcon,
  ArrowOutwardOutlined as ArrowOutwardIcon,
  AutoAwesomeOutlined as SparklesIcon,
  CalendarMonthOutlined as CalendarIcon,
  CheckOutlined as CheckIcon,
  CloseOutlined as CloseIcon,
  CancelOutlined as CancelIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  EmailOutlined as EmailIcon,
  ExpandMoreOutlined as ExpandMoreIcon,
  HourglassEmptyOutlined as PendingIcon,
  ListOutlined as ListIcon,
  PeopleOutline as PeopleIcon,
  PersonOutline as PersonIcon,
  RefreshOutlined as RefreshIcon,
  SchoolOutlined as SchoolIcon,
  SearchOutlined as SearchIcon,
  SendOutlined as SendIcon,
  GridViewOutlined as GridIcon,
  LockOutlined as LockIcon,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  adminService,
  type AdminCreateStudentRequest,
  type AdminInviteTeacherRequest,
  type AdminStudentProfile,
  type AdminStats,
  type AdminTeacherProfile,
  type AdminUpdateStudentRequest,
} from "@/api/adminService";
import { authService } from "@/api/authService";
import { ApiError } from "@/api/apiClient";
import { StatsCard } from "@/components/teacher/StatsCard";
import { userGroupService, type UserGroup } from "@/api/userGroupService";
import {
  userService,
  type UpdateUserRequest,
  type UserProfile,
} from "@/api/userService";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogStatus,
} from "@/components/ui/dialog/AppDialog";
import {
  getRoleChipColor,
  getRoleLabel,
} from "@/components/ui/chips/roleLabels";
import { FormActions, FormSection } from "@/components/ui/form/FormLayout";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  outlinedMetaChipSx,
  panelCardFooterSx,
  panelDeleteButtonSx,
  panelFooterButtonsSx,
  panelFooterButtonSx,
  panelGridCardContentSx,
  panelGridCardSx,
  panelIconButtonSx,
  panelInlineActionsSx,
  panelListRowSx,
  panelSingleLineSx,
  panelSurfaceSx,
  panelToolbarSx,
  panelTitleSx,
  panelTwoLinesSx,
} from "@/components/ui/panel/panelStyles";
import { useAuth } from "@/context/AuthContext";
import { uiTokens } from "@/theme/uiTokens";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";
import {
  getApiErrorMessage,
  translateApiMessage,
} from "@/utils/dashboardUtils";
import { INPUT_LIMITS } from "@/utils/inputLimits";

type UserRole = "TEACHER" | "STUDENT";
type UserFilter = "ALL" | UserRole;
type AdminTab = "users" | "groups";
type AdminListUser = AdminTeacherProfile | AdminStudentProfile;
type AdminViewMode = "grid" | "list";
type GroupEditableField = "name" | "description" | "teacherPublicId";

interface UserDraft {
  username: string;
  email: string;
  password: string;
  groupPublicId: string | "";
}

interface GroupDraft {
  name: string;
  description: string;
  teacherPublicId: string | "";
}

interface DeleteDialogState {
  type: "user" | "group";
  publicId: string;
  label: string;
  detail?: string | null;
  fields?: Array<{
    label: string;
    value: string;
    secondary?: boolean;
  }>;
}

type GroupFieldErrors = Partial<Record<keyof GroupDraft, string>>;
type UserFieldErrors = Partial<
  Record<keyof UserDraft | "emailConfirm", string>
>;

interface MembershipDialogState {
  groupPublicId: string;
  groupName: string;
  teacherPublicId?: string | null;
}

interface DialogFeedbackState {
  severity: "success" | "error";
  message: string;
}

const emptyUserDraft: UserDraft = {
  username: "",
  email: "",
  password: "",
  groupPublicId: "",
};
const emptyGroupDraft: GroupDraft = {
  name: "",
  description: "",
  teacherPublicId: "",
};

const validationFieldLabels: Record<string, string> = {
  name: "Nazwa",
  description: "Opis",
  username: "Nazwa użytkownika",
  email: "Adres e-mail",
  password: "Has?o",
  groupPublicId: "Grupa",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error, fallback, validationFieldLabels);
  }
  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak połączenia z serwerem.";
  }
  return fallback;
}

function parseGroupApiFieldErrors(error: ApiError): GroupFieldErrors {
  const detail = error.problem.detail ?? "";
  if (!detail.startsWith("Validation failed:")) {
    return {};
  }

  return detail
    .replace("Validation failed:", "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<GroupFieldErrors>((acc, part) => {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex === -1) {
        return acc;
      }

      const field = part
        .slice(0, separatorIndex)
        .trim() as keyof GroupFieldErrors;
      const validationDetail = part.slice(separatorIndex + 1).trim();
      if (!(field in emptyGroupDraft)) {
        return acc;
      }

      acc[field] = translateApiMessage(validationDetail);
      return acc;
    }, {});
}

function parseUserApiFieldErrors(error: ApiError): UserFieldErrors {
  const detail = error.problem.detail ?? "";
  if (!detail.startsWith("Validation failed:")) {
    return {};
  }

  return detail
    .replace("Validation failed:", "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<UserFieldErrors>((acc, part) => {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex === -1) {
        return acc;
      }

      let field = part.slice(0, separatorIndex).trim();
      // Strip DTO prefixes if present (e.g. UpdateUserRequest.email -> email)
      if (field.includes(".")) {
        field = field.split(".").pop() || field;
      }

      const fieldKey = field as keyof UserFieldErrors;
      const validationDetail = part.slice(separatorIndex + 1).trim();
      if (!(fieldKey in emptyUserDraft)) {
        return acc;
      }

      acc[fieldKey] = translateApiMessage(validationDetail);
      return acc;
    }, {});
}

function formatDate(value?: string) {
  if (!value) {
    return "Brak danych";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const toolbarFieldSx = {
  minWidth: 180,
  flex: "1 1 180px",
  "& .MuiAutocomplete-inputRoot": {
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.common.white, 0.98)
        : "#151a2c",
  },
  "& .MuiOutlinedInput-root": {
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
    "& fieldset": {
      border: "none",
    },
    "&:hover": {
      borderColor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.primary.main, 0.14)
          : alpha(theme.palette.common.white, 0.1),
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light" ? theme.palette.common.white : "#171d2f",
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
  "& .MuiInputBase-input::placeholder": {
    opacity: 1,
    color: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.text.secondary, 0.8)
        : alpha(theme.palette.common.white, 0.38),
  },
};

const compactToolbarFieldSx = {
  "& .MuiOutlinedInput-root.MuiInputBase-root": {
    minHeight: 38,
  },
  "& .MuiInputBase-input": {
    fontSize: "0.85rem",
  },
};

const groupCompactToolbarFieldSx = {
  "& .MuiOutlinedInput-root.MuiInputBase-root": {
    minHeight: 36,
  },
  "& .MuiInputBase-input": {
    fontSize: "0.82rem",
  },
};

const segmentedGroupSx = {
  p: 0.375,
  borderRadius: 2.5,
  bgcolor: "transparent",
  border: "none",
  gap: 0.375,
  "& .MuiToggleButtonGroup-grouped": {
    border: 0,
    borderRadius: "10px !important",
    minHeight: 32,
    px: 1.25,
    textTransform: "none",
    color: "text.secondary",
    transition:
      "background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.common.black, 0.04)
          : alpha(theme.palette.common.white, 0.05),
    },
    "&.Mui-selected": {
      color: "text.primary",
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.common.white, 0.92)
          : "#151a2c",
      boxShadow: (theme: Theme) =>
        theme.palette.mode === "light"
          ? "0 2px 8px rgba(15, 23, 42, 0.06)"
          : "0 4px 10px rgba(0, 0, 0, 0.16)",
    },
    "&.Mui-selected:hover": {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light" ? theme.palette.common.white : "#171d2f",
    },
  },
};

const segmentedStandaloneButtonSx = {
  textTransform: "none",
  borderRadius: 2.5,
  flexShrink: 0,
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.08)
      : alpha(theme.palette.common.white, 0.06),
  color: "text.secondary",
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.common.white, 0.8)
      : "#111625",
  transition:
    "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light" ? theme.palette.common.white : "#151a2c",
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.text.primary, 0.12)
        : alpha(theme.palette.common.white, 0.1),
  },
  "&.Mui-selected": {
    color: "text.primary",
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.08)
        : alpha(theme.palette.primary.light, 0.1),
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.18)
        : alpha(theme.palette.primary.light, 0.18),
    boxShadow: (theme: Theme) =>
      theme.palette.mode === "light"
        ? "none"
        : "0 4px 10px rgba(0, 0, 0, 0.12)",
  },
};

const counterFieldSx = {
  "& .MuiFormHelperText-root": {
    display: "flex",
    justifyContent: "flex-start",
    textAlign: "left",
    fontSize: "0.75rem",
    mt: 0.75,
    mx: 0,
    pl: 1.5,
    pr: 1.5,
  },
};

const dialogFieldLabelSx = {
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "text.primary",
  letterSpacing: "0.01em",
};

const inviteBadgeSx = {
  fontWeight: 700,
  px: 0.5,
  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
  color: "primary.main",
};

const standardFormDialogPaperSx: SxProps<Theme> = {
  width: {
    xs: "calc(100% - 24px)",
    sm: 700,
  },
};

const inlineEditIconButtonSx = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: "1px solid",
  borderColor: (theme: Theme) => alpha(theme.palette.text.primary, 0.08),
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.common.white, 0.9)
      : alpha(theme.palette.common.white, 0.03),
  boxShadow: (theme: Theme) =>
    theme.palette.mode === "light"
      ? "0 6px 14px rgba(15, 23, 42, 0.06)"
      : "none",
  "& .MuiSvgIcon-root": {
    fontSize: 18,
  },
};

const inlineEditConfirmButtonSx = {
  ...inlineEditIconButtonSx,
  color: "success.main",
  "&:hover": {
    bgcolor: (theme: Theme) => alpha(theme.palette.success.main, 0.12),
    borderColor: (theme: Theme) => alpha(theme.palette.success.main, 0.2),
  },
  "&.Mui-disabled": { opacity: 0.35 },
};

const inlineEditCancelButtonSx = {
  ...inlineEditIconButtonSx,
  color: "text.secondary",
  "&:hover": {
    bgcolor: (theme: Theme) => alpha(theme.palette.text.primary, 0.06),
    borderColor: (theme: Theme) => alpha(theme.palette.text.primary, 0.12),
  },
};

const compactInlineActionsWrapSx = {
  display: "flex",
  flexDirection: "row",
  gap: 1,
  alignItems: "center",
  mt: 0.5,
  flexShrink: 0,
};

const compactInlineConfirmButtonSx = {
  ...inlineEditConfirmButtonSx,
  width: 32,
  height: 32,
  bgcolor: alpha("#10B981", 0.08),
  color: "#10B981",
  border: "1px solid",
  borderColor: alpha("#10B981", 0.2),
  "&:hover": {
    bgcolor: alpha("#10B981", 0.15),
    borderColor: alpha("#10B981", 0.3),
  },
  "&.Mui-disabled": {
    bgcolor: alpha("#64748B", 0.05),
    borderColor: alpha("#64748B", 0.1),
  },
};

const compactInlineCancelButtonSx = {
  ...inlineEditCancelButtonSx,
  width: 32,
  height: 32,
  bgcolor: alpha("#64748B", 0.06),
  color: "#64748B",
  border: "1px solid",
  borderColor: alpha("#64748B", 0.15),
  "&:hover": {
    bgcolor: alpha("#64748B", 0.12),
    borderColor: alpha("#64748B", 0.25),
  },
};

const membershipHeaderBadgeSx = {
  ...inviteBadgeSx,
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "0.75rem",
  height: 24,
  mt: 0.5,
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.primary.main, 0.05)
      : alpha(theme.palette.primary.main, 0.1),
};

const membershipAddButtonSx: SxProps<Theme> = {
  ...panelFooterButtonSx,
  height: 40,
  px: 1.6,
  flexShrink: 0,
  whiteSpace: "nowrap",
  alignSelf: { xs: "stretch", sm: "auto" },
};

const inlineEditAccentColor = "#6366F1";

function getInlineEditSectionSx(isEditing: boolean): SxProps<Theme> {
  return {
    p: isEditing ? 2.75 : 2.25,
    bgcolor: isEditing ? alpha(inlineEditAccentColor, 0.035) : "transparent",
    borderLeft: isEditing ? "4px solid" : "none",
    borderLeftColor: inlineEditAccentColor,
    transition: "all 0.25s ease",
    "&:hover": {
      bgcolor: (theme: Theme) =>
        isEditing
          ? alpha(inlineEditAccentColor, 0.05)
          : theme.palette.mode === "light"
            ? alpha(theme.palette.text.primary, 0.01)
            : alpha(theme.palette.common.white, 0.02),
    },
  };
}

const inlineChangeButtonSx = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.82rem",
  borderRadius: "10px",
  px: 1.5,
  bgcolor: (theme: Theme) => alpha(theme.palette.text.primary, 0.03),
  "&:hover": {
    bgcolor: (theme: Theme) => alpha(theme.palette.text.primary, 0.07),
  },
};

const userCardActionButtonSx: SxProps<Theme> = {
  ...(panelFooterButtonSx as object),
  justifyContent: "center",
  px: 0.95,
  minHeight: 30,
  width: "auto",
  flex: "0 0 auto",
  borderRadius: 999,
  color: "text.secondary",
  fontWeight: 600,
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.06)
      : alpha(theme.palette.common.white, 0.045),
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.common.white, 0.54)
      : alpha(theme.palette.common.white, 0.024),
  boxShadow: (theme: Theme) =>
    theme.palette.mode === "light"
      ? "inset 0 1px 0 rgba(255,255,255,0.58)"
      : "inset 0 1px 0 rgba(255,255,255,0.02)",
  whiteSpace: "nowrap",
  transition:
    "background-color 0.22s ease, border-color 0.22s ease, color 0.22s ease, transform 0.22s ease",
  "&:hover": {
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.common.white, 0.74)
        : alpha(theme.palette.common.white, 0.04),
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.text.primary, 0.1)
        : alpha(theme.palette.common.white, 0.08),
    color: "text.primary",
    transform: "translateY(-1px)",
  },
};

const subtleMetaRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.55,
  color: "text.secondary",
  fontSize: "0.77rem",
  lineHeight: 1.45,
};

const settingsPanelSurfaceSx: SxProps<Theme> = {
  borderRadius: 3,
  bgcolor: (theme) =>
    theme.palette.mode === "light"
      ? "rgba(255, 255, 255, 0.78)"
      : "rgba(255, 255, 255, 0.03)",
  border: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? "rgba(148, 163, 184, 0.14)"
      : "rgba(255, 255, 255, 0.06)",
  backdropFilter: "blur(14px)",
  boxShadow: (theme) =>
    theme.palette.mode === "light"
      ? "0 16px 32px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.6)"
      : "0 12px 24px rgba(0, 0, 0, 0.18)",
  overflow: "hidden",
};

const settingsRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 2.5,
};

const settingsRowIconTileSx: SxProps<Theme> = {
  width: 40,
  height: 40,
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: (theme) =>
    theme.palette.mode === "light"
      ? alpha("#6366F1", 0.1)
      : alpha("#6366F1", 0.15),
  color: "#6366F1",
  flexShrink: 0,
};

const settingsRowLabelSx: SxProps<Theme> = {
  color: "text.secondary",
  fontWeight: 600,
  display: "block",
  mb: 0.25,
};

const userCardSurfaceSx: SxProps<Theme> = {
  ...(panelGridCardSx as object),
  borderRadius: 3.5,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  overflow: "hidden",
  minHeight: 196,
  backgroundImage: (theme: Theme) =>
    theme.palette.mode === "light"
      ? "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,251,255,0.985) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.042) 0%, rgba(255,255,255,0.016) 100%)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: (theme: Theme) =>
      theme.palette.mode === "light"
        ? "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 20%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.026) 0%, rgba(255,255,255,0) 22%)",
    pointerEvents: "none",
  },
};

const userCardContentSx: SxProps<Theme> = {
  ...(panelGridCardContentSx as object),
  position: "relative",
  zIndex: 1,
  flex: "1 1 auto",
  height: "auto",
  px: 2,
  pt: 1.7,
  pb: 1.05,
};

const userCardRoleChipSx = {
  flexShrink: 0,
  alignSelf: "flex-start",
  height: 28,
  borderRadius: 999,
  fontWeight: 700,
  "& .MuiChip-label": {
    px: 1.1,
  },
};

const userCardGroupTagSx = {
  borderRadius: 999,
  maxWidth: "100%",
  height: 26,
  fontSize: "0.72rem",
  fontWeight: 700,
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.primary.main, 0.07)
      : alpha(theme.palette.primary.light, 0.1),
  color: (theme: Theme) =>
    theme.palette.mode === "light"
      ? theme.palette.primary.dark
      : alpha(theme.palette.primary.light, 0.92),
  border: "1px solid",
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.primary.main, 0.12)
      : alpha(theme.palette.primary.light, 0.14),
  "& .MuiChip-label": {
    px: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

const userCardFooterSx: SxProps<Theme> = {
  ...(panelCardFooterSx as object),
  position: "relative",
  zIndex: 1,
  px: 2,
  py: 1.1,
  mt: 0,
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.06)
      : alpha(theme.palette.common.white, 0.05),
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha("#f8faff", 0.78)
      : alpha(theme.palette.common.white, 0.012),
  backdropFilter: "blur(8px)",
};

const userCardActionsWrapSx: SxProps<Theme> = {
  ...(panelFooterButtonsSx as object),
  gap: 0.65,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const userCardDeleteButtonSx: SxProps<Theme> = {
  ...(userCardActionButtonSx as object),
  order: 1,
  color: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.error.dark, 0.68)
      : alpha(theme.palette.error.light, 0.7),
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.error.main, 0.08)
      : alpha(theme.palette.error.light, 0.08),
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.error.main, 0.024)
      : alpha(theme.palette.error.light, 0.04),
  "&:hover": {
    color: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.error.dark, 0.84)
        : alpha(theme.palette.error.light, 0.82),
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.error.main, 0.14)
        : alpha(theme.palette.error.light, 0.14),
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.error.main, 0.04)
        : alpha(theme.palette.error.light, 0.06),
    transform: "translateY(-1px)",
  },
};

function getUserRoleBadgeSx(role: UserRole): SxProps<Theme> {
  if (role === "STUDENT") {
    return {
      ...userCardRoleChipSx,
      color: (theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.success.dark, 0.88)
          : alpha(theme.palette.success.light, 0.88),
      borderColor: (theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.success.main, 0.18)
          : alpha(theme.palette.success.light, 0.18),
      bgcolor: (theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.success.main, 0.07)
          : alpha(theme.palette.success.light, 0.1),
    };
  }

  return {
    ...userCardRoleChipSx,
    color: (theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.dark, 0.88)
        : alpha(theme.palette.primary.light, 0.9),
    borderColor: (theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.18)
        : alpha(theme.palette.primary.light, 0.18),
    bgcolor: (theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.07)
        : alpha(theme.palette.primary.light, 0.1),
  };
}

export function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [userFilter, setUserFilter] = useState<UserFilter>("ALL");
  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [viewMode, setViewMode] = useState<AdminViewMode>("grid");
  const [selectedTeacherFilters, setSelectedTeacherFilters] = useState<
    UserProfile[]
  >([]);
  const [selectedGroupFilters, setSelectedGroupFilters] = useState<UserGroup[]>(
    [],
  );
  const [showUngroupedStudents, setShowUngroupedStudents] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentUserError, setCurrentUserError] = useState<string | null>(null);
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [pageFeedback, setPageFeedback] = useState<DialogFeedbackState | null>(
    null,
  );

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<AdminStudentProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [userDialogRole, setUserDialogRole] = useState<UserRole>("TEACHER");
  const [selectedUser, setSelectedUser] = useState<AdminListUser | null>(null);
  const [userDraft, setUserDraft] = useState<UserDraft>(emptyUserDraft);
  const [userDialogLoading, setUserDialogLoading] = useState(false);
  const [userDialogFeedback, setUserDialogFeedback] =
    useState<DialogFeedbackState | null>(null);
  const [userDialogConfirmEmail, setUserDialogConfirmEmail] = useState("");
  const [userFieldErrors, setUserFieldErrors] = useState<UserFieldErrors>({});
  const [userDialogEditingFields, setUserDialogEditingFields] = useState<
    string[]
  >([]);
  const [userInlineSavingField, setUserInlineSavingField] = useState<
    "username" | "email" | "group" | null
  >(null);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupDialogMode, setGroupDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(emptyGroupDraft);
  const [groupDialogEditingFields, setGroupDialogEditingFields] = useState<
    GroupEditableField[]
  >([]);
  const [groupDialogLoading, setGroupDialogLoading] = useState(false);
  const [groupDialogFeedback, setGroupDialogFeedback] =
    useState<DialogFeedbackState | null>(null);
  const [groupFieldErrors, setGroupFieldErrors] = useState<GroupFieldErrors>(
    {},
  );
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogFeedback, setDeleteDialogFeedback] =
    useState<DialogFeedbackState | null>(null);

  const [membershipDialog, setMembershipDialog] =
    useState<MembershipDialogState | null>(null);
  const [membershipStudentPublicId, setMembershipStudentPublicId] = useState<
    string | ""
  >("");
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipDialogFeedback, setMembershipDialogFeedback] =
    useState<DialogFeedbackState | null>(null);

  const isCreateStudentDialog =
    userDialogMode === "create" && userDialogRole === "STUDENT";
  const isCreateInviteDialog =
    userDialogMode === "create" &&
    (userDialogRole === "STUDENT" || userDialogRole === "TEACHER");

  const allUsers = useMemo(
    () =>
      [
        ...teachers.map((user) => ({ ...user, role: "TEACHER" as const })),
        ...students.map((user) => ({ ...user, role: "STUDENT" as const })),
      ] as AdminListUser[],
    [teachers, students],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = userSearch.trim().toLowerCase();
    const selectedTeacherPublicIds = new Set(
      selectedTeacherFilters.map((t) => t.publicId),
    );
    const selectedGroupPublicIds = new Set(
      selectedGroupFilters.map((g) => g.publicId),
    );

    return allUsers.filter((user) => {
      if (showUngroupedStudents) {
        if (user.role !== "STUDENT") {
          return false;
        }
        if (!("groupPublicId" in user) || user.groupPublicId != null) {
          return false;
        }
      }

      if (userFilter !== "ALL" && user.role !== userFilter) {
        return false;
      }

      if (selectedTeacherPublicIds.size > 0) {
        if (user.role === "TEACHER") {
          if (!selectedTeacherPublicIds.has(user.publicId)) {
            return false;
          }
        } else {
          // Students: check if their group belongs to any selected teacher
          const studentGroupPublicId =
            "groupPublicId" in user
              ? (user as AdminStudentProfile).groupPublicId
              : null;
          const teacherGroupPublicIds = new Set(
            groups
              .filter((g) =>
                selectedTeacherPublicIds.has(g.teacherPublicId ?? ""),
              )
              .map((g) => g.publicId),
          );
          if (
            studentGroupPublicId == null ||
            !teacherGroupPublicIds.has(studentGroupPublicId)
          ) {
            return false;
          }
        }
      }

      if (selectedGroupPublicIds.size > 0) {
        if (user.role === "TEACHER") {
          const ownsSelectedGroup = selectedGroupFilters.some(
            (group) => group.teacherPublicId === user.publicId,
          );
          if (!ownsSelectedGroup) {
            return false;
          }
        } else {
          if (
            !("groupPublicId" in user) ||
            !selectedGroupPublicIds.has(user.groupPublicId ?? "")
          ) {
            return false;
          }
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        (user.username ?? "").toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [
    allUsers,
    groups,
    selectedGroupFilters,
    selectedTeacherFilters,
    showUngroupedStudents,
    userFilter,
    userSearch,
  ]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = groupSearch.trim().toLowerCase();
    const selectedTeacherPublicIds = new Set(
      selectedTeacherFilters.map((t) => t.publicId),
    );
    return groups.filter((group) => {
      if (
        selectedTeacherPublicIds.size > 0 &&
        !selectedTeacherPublicIds.has(group.teacherPublicId ?? "")
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        group.name.toLowerCase().includes(normalizedQuery) ||
        group.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [groupSearch, groups, selectedTeacherFilters]);

  const assignableGroups = useMemo(() => {
    return groups;
  }, [groups]);

  const currentMembershipStudents = useMemo(() => {
    if (!membershipDialog) {
      return [];
    }

    return students.filter(
      (student) => student.groupPublicId === membershipDialog.groupPublicId,
    );
  }, [membershipDialog, students]);

  const availableMembershipStudents = useMemo(() => {
    if (!membershipDialog) {
      return [];
    }

    return students.filter(
      (student) =>
        student.groupPublicId == null ||
        student.groupPublicId === membershipDialog.groupPublicId,
    );
  }, [membershipDialog, students]);

  const teacherNameById = useMemo(
    () =>
      new Map(teachers.map((teacher) => [teacher.publicId, teacher.username])),
    [teachers],
  );

  const teacherAvatarById = useMemo(
    () =>
      new Map(teachers.map((teacher) => [teacher.publicId, teacher.avatarUrl])),
    [teachers],
  );

  const quickActionTileSx = [
    panelSurfaceSx,
    {
      flex: 1,
      minWidth: 220,
      minHeight: 142,
      p: { xs: 1.5, md: 1.75 },
      borderRadius: 3.5,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "stretch",
      gap: 1,
      cursor: "pointer",
      borderColor: (theme: Theme) => alpha(theme.palette.text.primary, 0.08),
      background: (theme: Theme) =>
        theme.palette.mode === "light"
          ? "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,251,255,0.97) 100%)"
          : "linear-gradient(180deg, rgba(24,30,45,0.96) 0%, rgba(20,26,39,0.98) 100%)",
      boxShadow: (theme: Theme) =>
        theme.palette.mode === "light"
          ? "0 10px 24px rgba(15, 23, 42, 0.05), 0 2px 8px rgba(15, 23, 42, 0.022), inset 0 1px 0 rgba(255,255,255,0.86)"
          : "0 6px 16px rgba(0, 0, 0, 0.16)",
      transition:
        "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        background: (theme: Theme) =>
          theme.palette.mode === "light"
            ? "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 24%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 26%)",
        pointerEvents: "none",
      },
      "&:hover": {
        transform: "translateY(-2px)",
        borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.14),
        boxShadow: (theme: Theme) =>
          theme.palette.mode === "light"
            ? "0 12px 24px rgba(15, 23, 42, 0.07), 0 4px 14px rgba(76, 92, 149, 0.035)"
            : "0 9px 20px rgba(0, 0, 0, 0.2)",
      },
      "&:hover .quick-action-arrow": {
        transform: "translate(1px, -1px)",
        color: "text.primary",
        bgcolor: (theme: Theme) =>
          theme.palette.mode === "light"
            ? alpha(theme.palette.common.white, 0.94)
            : alpha(theme.palette.common.white, 0.1),
        borderColor: (theme: Theme) =>
          theme.palette.mode === "light"
            ? alpha(theme.palette.text.primary, 0.12)
            : alpha(theme.palette.common.white, 0.14),
      },
      "&:hover .quick-action-icon-shell": {
        transform: "translateY(-1px)",
        boxShadow: (theme: Theme) =>
          `0 8px 14px ${alpha(theme.palette.primary.main, 0.08)}`,
      },
    },
  ] as SxProps<Theme>;

  const groupFilterOptions = useMemo(() => {
    if (selectedTeacherFilters.length === 0) {
      return groups;
    }

    const selectedTeacherPublicIds = new Set(
      selectedTeacherFilters.map((teacher) => teacher.publicId),
    );
    return groups.filter((group) =>
      selectedTeacherPublicIds.has(group.teacherPublicId ?? ""),
    );
  }, [groups, selectedTeacherFilters]);

  const loadAdminStats = async () => {
    try {
      setAdminStats(await adminService.getStats());
      setStatsError(null);
    } catch (error) {
      setStatsError(
        getErrorMessage(error, "Nie udało się pobrać danych panelu admina."),
      );
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const [nextTeachers, nextStudents] = await Promise.all([
        adminService.getTeachers(),
        adminService.getStudents(),
      ]);
      setTeachers(nextTeachers);
      setStudents(nextStudents);
    } catch (error) {
      setUsersError(
        getErrorMessage(
          error,
          "Nie udało się pobrać list nauczycieli i uczniów.",
        ),
      );
    } finally {
      setUsersLoading(false);
    }
  };

  const loadGroups = async () => {
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      setGroups(await userGroupService.getGroups());
    } catch (error) {
      setGroupsError(
        getErrorMessage(error, "Nie udało się pobrać listy grup."),
      );
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setCurrentUser)
      .catch((error) =>
        setCurrentUserError(
          getErrorMessage(error, "Nie udało się pobrać danych administratora."),
        ),
      )
      .finally(() => setLoadingCurrentUser(false));

    loadAdminStats();
    loadUsers();
    loadGroups();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeDialogWithSuccessDelay = (closeFn: () => void) => {
    window.setTimeout(() => {
      closeFn();
    }, 900);
  };

  const openCreateUserDialog = (role: UserRole) => {
    setUserDialogMode("create");
    setUserDialogRole(role);
    setSelectedUser(null);
    setUserDraft(emptyUserDraft);
    setUserDialogConfirmEmail("");
    setUserDialogEditingFields([]);
    setUserFieldErrors({});
    setUserDialogFeedback(null);
    setUserDialogOpen(true);
  };

  const openEditUserDialog = (user: AdminListUser) => {
    setUserDialogMode("edit");
    setUserDialogRole(user.role as UserRole);
    setSelectedUser(user);
    setUserDraft({
      username: user.username,
      email: user.email,
      password: "",
      groupPublicId: "groupPublicId" in user ? (user.groupPublicId ?? "") : "",
    });
    setUserDialogConfirmEmail("");
    setUserDialogEditingFields([]);
    setUserFieldErrors({});
    setUserDialogFeedback(null);
    setUserDialogOpen(true);
  };

  const resetUserDialogState = () => {
    setSelectedUser(null);
    setUserDraft(emptyUserDraft);
    setUserDialogConfirmEmail("");
    setUserFieldErrors({});
    setUserDialogEditingFields([]);
    setUserInlineSavingField(null);
    setPasswordResetLoading(false);
    setPasswordResetSent(false);
    setUserDialogRole("TEACHER");
    setUserDialogMode("create");
    setUserDialogFeedback(null);
  };

  const resendUserInvite = async (user: AdminListUser) => {
    try {
      if (user.role === "TEACHER") {
        await adminService.resendTeacherInvite(user.publicId);
      } else {
        await adminService.resendStudentInvite(user.publicId);
      }
      setPageFeedback({
        severity: "success",
        message: `Zaproszenie wysłane ponownie na ${user.email}.`,
      });
    } catch {
      setPageFeedback({
        severity: "error",
        message: "Nie udało się wysłać zaproszenia.",
      });
    }
  };

  const closeUserDialog = () => {
    if (userDialogLoading) {
      return;
    }
    setUserDialogOpen(false);
  };

  const saveUserInlineSection = async (
    field: "username" | "email" | "group",
  ) => {
    if (!selectedUser || userInlineSavingField || userDialogLoading) {
      return;
    }

    const nextFieldErrors: UserFieldErrors = {};

    if (field === "username") {
      if (!userDraft.username.trim() || userDraft.username.trim().length < 3) {
        nextFieldErrors.username =
          "Minimalna długość nazwy użytkownika to 3 znaki.";
      }
    }

    if (field === "email") {
      if (!EMAIL_REGEX.test(userDraft.email.trim())) {
        nextFieldErrors.email = "Podaj prawidłowy adres e-mail.";
      }

      if (!EMAIL_REGEX.test(userDialogConfirmEmail.trim())) {
        nextFieldErrors.emailConfirm =
          "Podaj prawidłowy adres e-mail w polu potwierdzenia.";
      } else if (userDraft.email.trim() !== userDialogConfirmEmail.trim()) {
        nextFieldErrors.emailConfirm = "Adresy e-mail nie są identyczne.";
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setUserFieldErrors(nextFieldErrors);
      return;
    }

    setUserFieldErrors({});
    setUserDialogFeedback(null);
    setUserInlineSavingField(field);

    try {
      let updated: AdminListUser;

      if (selectedUser.role === "STUDENT") {
        updated = await adminService.updateStudent(selectedUser.publicId, {
          username: userDraft.username,
          email: userDraft.email,
          groupPublicId:
            userDraft.groupPublicId === "" ? null : userDraft.groupPublicId,
        });
      } else {
        updated = await userService.updateUser(selectedUser.publicId, {
          username: userDraft.username,
          email: userDraft.email,
        });
      }

      setSelectedUser(updated);
      setUserDraft({
        username: updated.username,
        email: updated.email,
        password: "",
        groupPublicId:
          "groupPublicId" in updated ? (updated.groupPublicId ?? "") : "",
      });
      setUserDialogConfirmEmail("");
      setUserDialogEditingFields((prev) =>
        prev.filter((item) => item !== field),
      );
      setUserDialogFeedback({
        severity: "success",
        message: "Zmiana została zapisana.",
      });
      await Promise.all([loadUsers(), loadAdminStats()]);
    } catch (error) {
      if (error instanceof ApiError) {
        const nextErrors = parseUserApiFieldErrors(error);
        if (Object.keys(nextErrors).length > 0) {
          setUserFieldErrors(nextErrors);
          return;
        }
      }

      setUserDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zapisać zmiany."),
      });
    } finally {
      setUserInlineSavingField(null);
    }
  };

  const sendPasswordResetLink = async () => {
    if (!selectedUser || passwordResetLoading) {
      return;
    }

    setPasswordResetLoading(true);
    setUserDialogFeedback(null);

    try {
      await authService.forgotPassword({ email: userDraft.email.trim() });
      setPasswordResetSent(true);
    } catch (error) {
      setUserDialogFeedback({
        severity: "error",
        message: getErrorMessage(
          error,
          "Nie udało się wysłać linku resetującego. Spróbuj ponownie.",
        ),
      });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const submitUserDialog = async () => {
    if (userDialogLoading) {
      return;
    }

    if (isCreateInviteDialog) {
      const nextFieldErrors: UserFieldErrors = {};

      if (!EMAIL_REGEX.test(userDraft.email.trim())) {
        nextFieldErrors.email = "Podaj prawidłowy adres e-mail.";
      }

      if (!EMAIL_REGEX.test(userDialogConfirmEmail.trim())) {
        nextFieldErrors.emailConfirm =
          "Podaj prawidłowy adres e-mail w polu potwierdzenia.";
      }

      if (userDraft.email.trim() !== userDialogConfirmEmail.trim()) {
        nextFieldErrors.emailConfirm = "Adresy e-mail nie są identyczne.";
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setUserFieldErrors(nextFieldErrors);
        return;
      }
    }

    if (userDialogMode === "edit") {
      const nextFieldErrors: UserFieldErrors = {};

      if (!userDraft.username.trim() || userDraft.username.trim().length < 3) {
        nextFieldErrors.username =
          "Minimalna długość nazwy użytkownika to 3 znaki.";
      }

      if (!EMAIL_REGEX.test(userDraft.email.trim())) {
        nextFieldErrors.email = "Podaj prawidłowy adres e-mail.";
      }

      if (userDialogEditingFields.includes("email")) {
        if (!EMAIL_REGEX.test(userDialogConfirmEmail.trim())) {
          nextFieldErrors.emailConfirm =
            "Podaj prawidłowy adres e-mail w polu potwierdzenia.";
        } else if (userDraft.email.trim() !== userDialogConfirmEmail.trim()) {
          nextFieldErrors.emailConfirm = "Adresy e-mail nie są identyczne.";
        }
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setUserFieldErrors(nextFieldErrors);
        return;
      }
    }

    setUserFieldErrors({});
    setUserDialogFeedback(null);
    setUserDialogLoading(true);
    try {
      if (userDialogMode === "create") {
        if (userDialogRole === "TEACHER") {
          const payload: AdminInviteTeacherRequest = {
            email: userDraft.email,
          };
          await adminService.inviteTeacher(payload);
          setUserDialogFeedback({
            severity: "success",
            message:
              "Zaproszenie wysłane. Nauczyciel aktywuje konto przez link w e-mailu.",
          });
        } else {
          const payload: AdminCreateStudentRequest = {
            email: userDraft.email,
            groupPublicId:
              userDraft.groupPublicId === "" ? null : userDraft.groupPublicId,
          };

          await adminService.createStudent(payload);
          setUserDialogFeedback({
            severity: "success",
            message:
              "Zaproszenie wysłane. Uczeń aktywuje konto przez link w e-mailu.",
          });
        }
      } else if (selectedUser) {
        let updated: AdminListUser;

        if (selectedUser.role === "STUDENT") {
          const payload: AdminUpdateStudentRequest = {
            username: userDraft.username,
            email: userDraft.email,
            groupPublicId:
              userDraft.groupPublicId === "" ? null : userDraft.groupPublicId,
          };
          updated = await adminService.updateStudent(
            selectedUser.publicId,
            payload,
          );
        } else {
          const payload: UpdateUserRequest = {
            username: userDraft.username,
            email: userDraft.email,
          };
          updated = await userService.updateUser(
            selectedUser.publicId,
            payload,
          );
        }

        setSelectedUser(updated);
        setUserDialogFeedback({
          severity: "success",
          message: "Dane konta zostały zapisane.",
        });
      }

      await Promise.all([loadUsers(), loadAdminStats()]);
      closeDialogWithSuccessDelay(closeUserDialog);
    } catch (error) {
      if (isCreateInviteDialog && error instanceof ApiError) {
        const nextFieldErrors = parseUserApiFieldErrors(error);
        const code = error.problem.code?.toUpperCase() ?? "";

        if (code === "EMAIL_ALREADY_TAKEN") {
          nextFieldErrors.email = "Ten adres e-mail jest już zajęty.";
        }

        if (isCreateStudentDialog && code === "USER_GROUP_NOT_FOUND") {
          nextFieldErrors.groupPublicId = "Wybrana grupa nie istnieje.";
        }

        if (Object.keys(nextFieldErrors).length > 0) {
          setUserFieldErrors(nextFieldErrors);
          return;
        }
      }

      setUserDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zapisać zmian konta."),
      });
    } finally {
      setUserDialogLoading(false);
    }
  };

  const openCreateGroupDialog = () => {
    setGroupDialogMode("create");
    setSelectedGroup(null);
    setGroupDraft(emptyGroupDraft);
    setGroupDialogEditingFields([]);
    setGroupFieldErrors({});
    setGroupDialogFeedback(null);
    setGroupDialogOpen(true);
  };

  const openEditGroupDialog = (group: UserGroup) => {
    setGroupDialogMode("edit");
    setSelectedGroup(group);
    setGroupDraft({
      name: group.name,
      description: group.description,
      teacherPublicId: group.teacherPublicId ?? "",
    });
    setGroupDialogEditingFields([]);
    setGroupFieldErrors({});
    setGroupDialogFeedback(null);
    setGroupDialogOpen(true);
  };

  const closeGroupDialog = () => {
    if (groupDialogLoading) {
      return;
    }
    setGroupDialogOpen(false);
    setSelectedGroup(null);
    setGroupDraft(emptyGroupDraft);
    setGroupDialogEditingFields([]);
    setGroupFieldErrors({});
    setGroupDialogFeedback(null);
  };

  const submitGroupDialog = async () => {
    if (groupDialogLoading) {
      return;
    }

    setGroupFieldErrors({});
    setGroupDialogFeedback(null);
    setGroupDialogLoading(true);
    try {
      const payload = {
        name: groupDraft.name,
        description: groupDraft.description,
        teacherPublicId:
          groupDraft.teacherPublicId === "" ? null : groupDraft.teacherPublicId,
      };

      if (groupDialogMode === "create") {
        await userGroupService.createGroup(payload);
        setGroupDialogFeedback({
          severity: "success",
          message: "Grupa została utworzona.",
        });
      } else if (selectedGroup) {
        await userGroupService.updateGroup(selectedGroup.publicId, payload);
        setGroupDialogFeedback({
          severity: "success",
          message: "Zmiany grupy zostały zapisane.",
        });
      }

      await Promise.all([loadGroups(), loadAdminStats()]);
      closeDialogWithSuccessDelay(closeGroupDialog);
    } catch (error) {
      if (error instanceof ApiError) {
        const nextFieldErrors = parseGroupApiFieldErrors(error);
        if (Object.keys(nextFieldErrors).length > 0) {
          setGroupFieldErrors(nextFieldErrors);
          return;
        }
      }

      setGroupDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zapisać zmian grupy."),
      });
    } finally {
      setGroupDialogLoading(false);
    }
  };

  const saveGroupInlineSection = async (field: GroupEditableField) => {
    if (!selectedGroup || groupDialogLoading) {
      return;
    }

    const nextFieldErrors: GroupFieldErrors = {};

    if (field === "name") {
      if (!groupDraft.name.trim() || groupDraft.name.trim().length < 3) {
        nextFieldErrors.name = "Minimalna długość nazwy grupy to 3 znaki.";
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setGroupFieldErrors(nextFieldErrors);
      return;
    }

    setGroupFieldErrors({});
    setGroupDialogFeedback(null);
    setGroupDialogLoading(true);

    try {
      const updatedPayload = {
        name: groupDraft.name,
        description: groupDraft.description,
        teacherPublicId:
          groupDraft.teacherPublicId === "" ? null : groupDraft.teacherPublicId,
      };

      const updatedGroup = await userGroupService.updateGroup(
        selectedGroup.publicId,
        updatedPayload,
      );

      setSelectedGroup(updatedGroup);
      setGroupDialogEditingFields((prev) => prev.filter((f) => f !== field));
      setGroupDialogFeedback({
        severity: "success",
        message: "Zmiana została zapisana.",
      });
      await Promise.all([loadGroups(), loadAdminStats()]);
    } catch (error) {
      if (error instanceof ApiError) {
        const nextErrors = parseGroupApiFieldErrors(error);
        if (Object.keys(nextErrors).length > 0) {
          setGroupFieldErrors(nextErrors);
          return;
        }
      }
      setGroupDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zapisać zmiany."),
      });
    } finally {
      setGroupDialogLoading(false);
    }
  };

  const openDeleteDialog = (payload: DeleteDialogState) => {
    setDeleteDialogFeedback(null);
    setDeleteDialog(payload);
  };

  const closeDeleteDialog = () => {
    if (deleteLoading) {
      return;
    }
    setDeleteDialogFeedback(null);
    setDeleteDialog(null);
  };

  const confirmDelete = async () => {
    if (!deleteDialog) {
      return;
    }
    if (deleteLoading) {
      return;
    }

    setDeleteDialogFeedback(null);
    setDeleteLoading(true);
    try {
      if (deleteDialog.type === "user") {
        await userService.deleteUser(deleteDialog.publicId);
        if (selectedUser?.publicId === deleteDialog.publicId) {
          setSelectedUser(null);
        }
        await Promise.all([loadUsers(), loadAdminStats()]);
        setDeleteDialogFeedback({
          severity: "success",
          message: "Konto zostało usunięte.",
        });
      } else {
        await userGroupService.deleteGroup(String(deleteDialog.publicId));
        await Promise.all([loadGroups(), loadAdminStats()]);
        setDeleteDialogFeedback({
          severity: "success",
          message: "Grupa została usunięta.",
        });
      }
      closeDialogWithSuccessDelay(closeDeleteDialog);
    } catch (error) {
      setDeleteDialogFeedback({
        severity: "error",
        message: getErrorMessage(
          error,
          "Nie udało się usunąć wskazanego elementu.",
        ),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openMembershipDialog = (group: UserGroup) => {
    setMembershipDialogFeedback(null);
    setMembershipDialog({
      groupPublicId: group.publicId,
      groupName: group.name,
      teacherPublicId: group.teacherPublicId,
    });
    setMembershipStudentPublicId("");
  };

  const closeMembershipDialog = () => {
    if (membershipLoading) {
      return;
    }
    setMembershipDialog(null);
    setMembershipStudentPublicId("");
    setMembershipDialogFeedback(null);
  };

  const addMembershipStudent = async () => {
    if (!membershipDialog || membershipLoading) {
      return;
    }
    if (membershipStudentPublicId === "") {
      setMembershipDialogFeedback({
        severity: "error",
        message: "Wybierz ucznia z listy.",
      });
      return;
    }

    setMembershipDialogFeedback(null);
    setMembershipLoading(true);
    try {
      await userGroupService.addStudentToGroup(
        membershipDialog.groupPublicId,
        membershipStudentPublicId,
      );
      setMembershipDialogFeedback({
        severity: "success",
        message: "Uczeń został dodany do grupy.",
      });
      await Promise.all([loadGroups(), loadUsers()]);
      setMembershipStudentPublicId("");
    } catch (error) {
      setMembershipDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zmienić składu grupy."),
      });
    } finally {
      setMembershipLoading(false);
    }
  };

  const removeMembershipStudent = async (studentPublicId: string) => {
    if (!membershipDialog || membershipLoading) {
      return;
    }

    setMembershipDialogFeedback(null);
    setMembershipLoading(true);
    try {
      await userGroupService.removeStudentFromGroup(
        membershipDialog.groupPublicId,
        studentPublicId,
      );
      setMembershipDialogFeedback({
        severity: "success",
        message: "Uczeń został usunięty z grupy.",
      });
      await Promise.all([loadGroups(), loadUsers()]);
    } catch (error) {
      setMembershipDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zmienić składu grupy."),
      });
    } finally {
      setMembershipLoading(false);
    }
  };

  const pageBg = theme.palette.mode === "light" ? "#f3f6fb" : "#07090f";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        {/* ── Top bar: dark mode toggle + logout ── */}
        <DashboardTopBar onLogout={handleLogout} />

        {/* ── Greeting header ── */}
        <DashboardHeader
          loading={loadingCurrentUser}
          username={currentUser?.username}
          subtitle="Panel administratora"
          fallbackName="Administratorze"
          user={currentUser}
          onUserUpdated={setCurrentUser}
        />

        {currentUserError && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            {currentUserError}
          </Alert>
        )}

        {statsError && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            {statsError}
          </Alert>
        )}

        {adminStats && (
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <StatsCard
              label="Wszyscy użytkownicy"
              value={adminStats.totalUsers}
            />
            <StatsCard
              label="Administratorzy"
              value={adminStats.totalAdmins}
              highlightColor={theme.palette.secondary.main}
            />
            <StatsCard
              label="Nauczyciele"
              value={adminStats.totalTeachers}
              highlightColor={theme.palette.primary.main}
            />
            <StatsCard
              label="Uczniowie"
              value={adminStats.totalStudents}
              highlightColor={theme.palette.success.main}
            />
            <StatsCard
              label="Grupy"
              value={adminStats.totalGroups}
              highlightColor={theme.palette.warning.main}
            />
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 3.5, flexWrap: "wrap" }}>
          <Paper
            elevation={0}
            onClick={() => openCreateUserDialog("TEACHER")}
            sx={quickActionTileSx}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box
                className="quick-action-icon-shell"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "common.white",
                  background:
                    "linear-gradient(135deg, rgba(103,153,235,0.78) 0%, rgba(69,116,218,0.74) 100%)",
                  boxShadow: "0 6px 12px rgba(37, 99, 235, 0.1)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
              >
                <SchoolIcon sx={{ fontSize: 21 }} />
              </Box>
              <Box
                className="quick-action-arrow"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.text.primary, 0.72)
                      : alpha(theme.palette.common.white, 0.78),
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.common.white, 0.82)
                      : alpha(theme.palette.common.white, 0.06),
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.text.primary, 0.08)
                      : alpha(theme.palette.common.white, 0.1),
                  transition:
                    "transform 0.25s ease, color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease",
                }}
              >
                <ArrowOutwardIcon sx={{ fontSize: 16 }} />
              </Box>
            </Stack>
            <Stack spacing={0.5} sx={{ maxWidth: 220 }}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}
              >
                Zaproszenie nauczyciela
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.45, fontSize: "0.83rem" }}
              >
                Wyślij zaproszenie e-mail do aktywacji konta nauczyciela.
              </Typography>
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            onClick={() => openCreateUserDialog("STUDENT")}
            sx={quickActionTileSx}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box
                className="quick-action-icon-shell"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "common.white",
                  background:
                    "linear-gradient(135deg, rgba(90,201,131,0.78) 0%, rgba(48,164,94,0.74) 100%)",
                  boxShadow: "0 6px 12px rgba(22, 163, 74, 0.1)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
              >
                <PersonIcon sx={{ fontSize: 21 }} />
              </Box>
              <Box
                className="quick-action-arrow"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.text.primary, 0.72)
                      : alpha(theme.palette.common.white, 0.78),
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.common.white, 0.82)
                      : alpha(theme.palette.common.white, 0.06),
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.text.primary, 0.08)
                      : alpha(theme.palette.common.white, 0.1),
                  transition:
                    "transform 0.25s ease, color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease",
                }}
              >
                <ArrowOutwardIcon sx={{ fontSize: 16 }} />
              </Box>
            </Stack>
            <Stack spacing={0.5} sx={{ maxWidth: 220 }}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}
              >
                Zaproszenie ucznia
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.45, fontSize: "0.83rem" }}
              >
                Wyślij zaproszenie e-mail i opcjonalnie przypisz grupę.
              </Typography>
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            onClick={openCreateGroupDialog}
            sx={quickActionTileSx}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box
                className="quick-action-icon-shell"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "common.white",
                  background:
                    "linear-gradient(135deg, rgba(241,151,87,0.8) 0%, rgba(222,111,54,0.74) 100%)",
                  boxShadow: "0 6px 12px rgba(234, 88, 12, 0.1)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
              >
                <SchoolIcon sx={{ fontSize: 21 }} />
              </Box>
              <Box
                className="quick-action-arrow"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.text.primary, 0.72)
                      : alpha(theme.palette.common.white, 0.78),
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.common.white, 0.82)
                      : alpha(theme.palette.common.white, 0.06),
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.text.primary, 0.08)
                      : alpha(theme.palette.common.white, 0.1),
                  transition:
                    "transform 0.25s ease, color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease",
                }}
              >
                <ArrowOutwardIcon sx={{ fontSize: 16 }} />
              </Box>
            </Stack>
            <Stack spacing={0.5} sx={{ maxWidth: 220 }}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}
              >
                Nowa grupa
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.45, fontSize: "0.83rem" }}
              >
                Zbuduj grupę i ustaw właściciela w kilku krokach.
              </Typography>
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            onClick={() => navigate("/admin/achievements")}
            sx={quickActionTileSx}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box
                className="quick-action-icon-shell"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "common.white",
                  background:
                    "linear-gradient(135deg, rgba(183,123,235,0.78) 0%, rgba(231,171,98,0.74) 100%)",
                  boxShadow: "0 6px 12px rgba(168, 85, 247, 0.1)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
              >
                <SparklesIcon sx={{ fontSize: 21 }} />
              </Box>
              <Box
                className="quick-action-arrow"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.text.primary, 0.72)
                      : alpha(theme.palette.common.white, 0.78),
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.common.white, 0.82)
                      : alpha(theme.palette.common.white, 0.06),
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.text.primary, 0.08)
                      : alpha(theme.palette.common.white, 0.1),
                  transition:
                    "transform 0.25s ease, color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease",
                }}
              >
                <ArrowOutwardIcon sx={{ fontSize: 16 }} />
              </Box>
            </Stack>
            <Stack spacing={0.5} sx={{ maxWidth: 220 }}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}
              >
                Osiągnięcia
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.45, fontSize: "0.83rem" }}
              >
                Zarządzaj listą osiągnięć i ich aktywnością.
              </Typography>
            </Stack>
          </Paper>
        </Box>

        <Card elevation={0} sx={panelSurfaceSx}>
          <CardContent
            sx={{
              px: { xs: 2, md: 3 },
              pb: { xs: 2, md: 3 },
              pt: { xs: 1.4, md: 1.8 },
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, value: AdminTab) => setActiveTab(value)}
              sx={{ mb: 2.4 }}
            >
              <Tab
                value="users"
                icon={<PeopleIcon fontSize="small" />}
                iconPosition="start"
                label="Użytkownicy"
              />
              <Tab
                value="groups"
                icon={<SchoolIcon fontSize="small" />}
                iconPosition="start"
                label="Grupy"
              />
            </Tabs>

            {activeTab === "users" ? (
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                >
                  <Stack spacing={0.4}>
                    <Typography variant="h6" fontWeight={800}>
                      Konta nauczycieli i uczniów
                    </Typography>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ sm: "center" }}
                  >
                    <IconButton
                      aria-label="Odśwież użytkowników"
                      onClick={loadUsers}
                      disabled={usersLoading}
                      sx={{ ...panelIconButtonSx, color: "text.secondary" }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                {usersError && <Alert severity="warning">{usersError}</Alert>}

                {pageFeedback && (
                  <Alert
                    severity={pageFeedback.severity}
                    onClose={() => setPageFeedback(null)}
                  >
                    {pageFeedback.message}
                  </Alert>
                )}

                <Paper elevation={0} sx={panelToolbarSx}>
                  <TextField
                    size="small"
                    placeholder="Szukaj po nazwie lub emailu"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon
                              fontSize="small"
                              sx={{ color: "text.secondary" }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      ...toolbarFieldSx,
                      ...compactToolbarFieldSx,
                      minWidth: { xs: "100%", sm: 260, lg: 320 },
                      flex: { xs: "1 1 100%", md: "1.5 1 280px" },
                    }}
                  />

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", md: "block" } }}
                  />

                  <Autocomplete
                    multiple
                    size="small"
                    options={teachers}
                    value={selectedTeacherFilters}
                    onChange={(_, value) => setSelectedTeacherFilters(value)}
                    getOptionLabel={(option) => option.username}
                    isOptionEqualToValue={(option, value) =>
                      option.publicId === value.publicId
                    }
                    disableCloseOnSelect
                    limitTags={1}
                    noOptionsText="Brak nauczycieli"
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => {
                        const { key, ...rest } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option.username}
                            size="small"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                            {...rest}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={
                          selectedTeacherFilters.length === 0
                            ? "Filtruj nauczycieli..."
                            : undefined
                        }
                      />
                    )}
                    sx={{
                      ...toolbarFieldSx,
                      ...compactToolbarFieldSx,
                      minWidth: { xs: "100%", sm: 220 },
                      flex: { xs: "1 1 100%", lg: "1 1 230px" },
                    }}
                  />

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", md: "block" } }}
                  />

                  <Autocomplete
                    multiple
                    size="small"
                    options={groupFilterOptions}
                    value={selectedGroupFilters}
                    onChange={(_, value) => setSelectedGroupFilters(value)}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                      option.publicId === value.publicId
                    }
                    disableCloseOnSelect
                    limitTags={1}
                    noOptionsText="Brak grup"
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => {
                        const { key, ...rest } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option.name}
                            size="small"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                            {...rest}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={
                          selectedGroupFilters.length === 0
                            ? "Filtruj grupy..."
                            : undefined
                        }
                      />
                    )}
                    sx={{
                      ...toolbarFieldSx,
                      ...groupCompactToolbarFieldSx,
                      minWidth: { xs: "100%", sm: 220 },
                      flex: { xs: "1 1 100%", lg: "1 1 230px" },
                    }}
                  />

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", md: "block" } }}
                  />

                  <ToggleButtonGroup
                    value={userFilter}
                    exclusive
                    onChange={(_, value: UserFilter | null) => {
                      if (value) {
                        setUserFilter(value);
                      }
                    }}
                    color="primary"
                    size="small"
                    sx={{
                      ...segmentedGroupSx,
                      flexShrink: 0,
                      alignSelf: "center",
                    }}
                  >
                    <ToggleButton value="ALL" sx={segmentedStandaloneButtonSx}>
                      Wszyscy
                    </ToggleButton>
                    <ToggleButton
                      value="TEACHER"
                      sx={segmentedStandaloneButtonSx}
                    >
                      Nauczyciele
                    </ToggleButton>
                    <ToggleButton
                      value="STUDENT"
                      sx={segmentedStandaloneButtonSx}
                    >
                      Uczniowie
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <ToggleButton
                    value="ungrouped"
                    selected={showUngroupedStudents}
                    onChange={() =>
                      setShowUngroupedStudents((current) => !current)
                    }
                    size="small"
                    sx={segmentedStandaloneButtonSx}
                  >
                    Bez grupy
                  </ToggleButton>

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", md: "block" } }}
                  />

                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, value: AdminViewMode | null) => {
                      if (value) {
                        setViewMode(value);
                      }
                    }}
                    size="small"
                    sx={{ ...segmentedGroupSx, flexShrink: 0 }}
                  >
                    <ToggleButton
                      value="grid"
                      aria-label="Widok siatki"
                      sx={segmentedStandaloneButtonSx}
                    >
                      <GridIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton
                      value="list"
                      aria-label="Widok listy"
                      sx={segmentedStandaloneButtonSx}
                    >
                      <ListIcon fontSize="small" />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Paper>

                {usersLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 220,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : filteredUsers.length === 0 ? (
                  <Alert severity="info">
                    Brak kont pasujących do wybranych filtrów.
                  </Alert>
                ) : viewMode === "list" ? (
                  <Stack spacing={1.25}>
                    {filteredUsers.map((user) => (
                      <Paper
                        key={`${user.role}-${user.publicId}`}
                        elevation={0}
                        sx={panelListRowSx}
                      >
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={2}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                        >
                          <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              alignItems={{ xs: "flex-start", sm: "center" }}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <UserAvatar
                                avatarUrl={user.avatarUrl}
                                username={user.username ?? user.email}
                                size={20}
                              />
                              <Typography
                                variant="body1"
                                fontWeight={700}
                                color="primary.main"
                                sx={{ overflowWrap: "anywhere" }}
                              >
                                {user.username ?? "(oczekuje)"}
                              </Typography>
                              <Chip
                                color={getRoleChipColor(user.role as UserRole)}
                                icon={
                                  user.role === "TEACHER" ? (
                                    <SchoolIcon />
                                  ) : (
                                    <PersonIcon />
                                  )
                                }
                                label={getRoleLabel(user.role as UserRole)}
                                size="small"
                              />
                              {"status" in user &&
                                user.status === "INVITED" && (
                                  <Chip
                                    icon={<PendingIcon />}
                                    label="Zaproszony"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                )}
                              {"status" in user &&
                                user.status ===
                                  "EMAIL_VERIFICATION_PENDING" && (
                                  <Chip
                                    icon={<PendingIcon />}
                                    label="Czeka na email"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                  />
                                )}
                            </Stack>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ overflowWrap: "anywhere" }}
                            >
                              {user.email}
                            </Typography>
                            <Stack direction="column" spacing={0.5}>
                              {user.role === "STUDENT" && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ overflowWrap: "anywhere" }}
                                >
                                  Grupa:{" "}
                                  <Box
                                    component="span"
                                    sx={{
                                      fontWeight: 700,
                                      color: "text.primary",
                                    }}
                                  >
                                    {"groupName" in user && user.groupName
                                      ? user.groupName
                                      : "Bez grupy"}
                                  </Box>
                                </Typography>
                              )}
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Utworzono {formatDate(user.createdAt)}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Box sx={panelInlineActionsSx}>
                            {"status" in user && user.status === "INVITED" && (
                              <Button
                                size="small"
                                color="warning"
                                startIcon={<SendIcon fontSize="small" />}
                                onClick={() => resendUserInvite(user)}
                                sx={panelFooterButtonSx}
                              >
                                Wyślij ponownie
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EditIcon fontSize="small" />}
                              onClick={() => openEditUserDialog(user)}
                              sx={panelFooterButtonSx}
                              disabled={
                                "status" in user && user.status === "INVITED"
                              }
                            >
                              Edytuj
                            </Button>
                            {"status" in user && user.status === "INVITED" && (
                              <Button
                                size="small"
                                startIcon={<CancelIcon fontSize="small" />}
                                onClick={() =>
                                  openDeleteDialog({
                                    type: "user",
                                    publicId: user.publicId,
                                    label: user.email,
                                    detail:
                                      "Konto oczekujące — link aktywacyjny straci ważność.",
                                    fields: [
                                      { label: "E-mail", value: user.email },
                                      {
                                        label: "Status",
                                        value:
                                          "Konto oczekujące — link aktywacyjny straci ważność.",
                                        secondary: true,
                                      },
                                    ],
                                  })
                                }
                                sx={panelDeleteButtonSx}
                              >
                                Anuluj
                              </Button>
                            )}
                            {"status" in user && user.status !== "INVITED" && (
                              <Button
                                size="small"
                                startIcon={<DeleteIcon fontSize="small" />}
                                onClick={() =>
                                  openDeleteDialog({
                                    type: "user",
                                    publicId: user.publicId,
                                    label: user.username ?? user.email,
                                    detail:
                                      user.role === "STUDENT" &&
                                      "groupName" in user &&
                                      user.groupName
                                        ? `Uczeń w grupie ${user.groupName}`
                                        : user.email,
                                    fields: [
                                      {
                                        label: "Nazwa",
                                        value: user.username ?? "—",
                                      },
                                      { label: "E-mail", value: user.email },
                                      ...(user.role === "STUDENT" &&
                                      "groupName" in user &&
                                      user.groupName
                                        ? [
                                            {
                                              label: "Grupa",
                                              value: user.groupName,
                                              secondary: true,
                                            },
                                          ]
                                        : []),
                                    ],
                                  })
                                }
                                sx={panelDeleteButtonSx}
                              >
                                Usuń
                              </Button>
                            )}
                            {!("status" in user) && (
                              <Button
                                size="small"
                                startIcon={<DeleteIcon fontSize="small" />}
                                onClick={() =>
                                  openDeleteDialog({
                                    type: "user",
                                    publicId: user.publicId,
                                    label: user.username ?? user.email,
                                    detail: user.email,
                                    fields: [
                                      {
                                        label: "Nazwa",
                                        value: user.username ?? "—",
                                      },
                                      {
                                        label: "E-mail",
                                        value: user.email,
                                        secondary: true,
                                      },
                                    ],
                                  })
                                }
                                sx={panelDeleteButtonSx}
                              >
                                Usuń
                              </Button>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Grid container spacing={2}>
                    {filteredUsers.map((user) => (
                      <Grid
                        key={`${user.role}-${user.publicId}`}
                        size={{ xs: 12, md: 6, xl: 4 }}
                      >
                        <Card elevation={0} sx={userCardSurfaceSx}>
                          <CardContent sx={userCardContentSx}>
                            <Stack
                              spacing={1.05}
                              sx={{
                                width: "100%",
                                minHeight: "100%",
                                height: "100%",
                                flex: 1,
                                justifyContent: "space-between",
                              }}
                            >
                              <Stack spacing={0.65}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="flex-start"
                                  spacing={1.5}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="flex-start"
                                    sx={{ minWidth: 0, flex: 1 }}
                                  >
                                    <UserAvatar
                                      avatarUrl={user.avatarUrl}
                                      username={user.username ?? user.email}
                                      size={42}
                                      sx={{ flexShrink: 0 }}
                                    />
                                    <Stack
                                      spacing={0.45}
                                      sx={{ minWidth: 0, flex: 1, pt: 0.15 }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        fontWeight={800}
                                        color="text.primary"
                                        sx={{
                                          ...panelTitleSx,
                                          letterSpacing: "-0.02em",
                                          lineHeight: 1.15,
                                        }}
                                      >
                                        {user.username ?? "(oczekuje)"}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          ...panelSingleLineSx,
                                          fontSize: "0.82rem",
                                          color: (theme) =>
                                            theme.palette.mode === "light"
                                              ? alpha(
                                                  theme.palette.text.secondary,
                                                  0.88,
                                                )
                                              : alpha(
                                                  theme.palette.common.white,
                                                  0.54,
                                                ),
                                        }}
                                      >
                                        {user.email}
                                      </Typography>
                                    </Stack>
                                  </Stack>
                                  <Chip
                                    color={getRoleChipColor(
                                      user.role as UserRole,
                                    )}
                                    icon={
                                      user.role === "TEACHER" ? (
                                        <SchoolIcon />
                                      ) : (
                                        <PersonIcon />
                                      )
                                    }
                                    label={getRoleLabel(user.role as UserRole)}
                                    size="small"
                                    sx={getUserRoleBadgeSx(
                                      user.role as UserRole,
                                    )}
                                  />
                                </Stack>

                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  flexWrap="wrap"
                                  useFlexGap
                                >
                                  {user.role === "STUDENT" && (
                                    <>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: "0.74rem",
                                          fontWeight: 700,
                                          lineHeight: 1.2,
                                          mt: 0.2, // Nudge down to align with value
                                          letterSpacing: "0.03em",
                                          textTransform: "uppercase",
                                          color: (theme) =>
                                            theme.palette.mode === "light"
                                              ? alpha(
                                                  theme.palette.text.secondary,
                                                  0.72,
                                                )
                                              : alpha(
                                                  theme.palette.common.white,
                                                  0.4,
                                                ),
                                        }}
                                      >
                                        Grupa
                                      </Typography>
                                      <Chip
                                        label={
                                          "groupName" in user && user.groupName
                                            ? user.groupName
                                            : "Bez grupy"
                                        }
                                        size="small"
                                        sx={userCardGroupTagSx}
                                      />
                                    </>
                                  )}
                                </Stack>
                              </Stack>

                              <Stack
                                direction="row"
                                spacing={1.2}
                                flexWrap="wrap"
                                useFlexGap
                                alignItems="center"
                                sx={{ width: "100%" }}
                              >
                                <Box sx={subtleMetaRowSx}>
                                  <CalendarIcon
                                    sx={{ fontSize: 15, opacity: 0.72 }}
                                  />
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontSize: "0.79rem",
                                      color: "inherit",
                                    }}
                                  >
                                    Utworzono {formatDate(user.createdAt)}
                                  </Typography>
                                </Box>
                                {"status" in user &&
                                  user.status === "INVITED" && (
                                    <Chip
                                      icon={<PendingIcon />}
                                      label="Zaproszony"
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                      sx={{
                                        ...outlinedMetaChipSx,
                                        height: 26,
                                        fontWeight: 700,
                                        borderColor: (theme) =>
                                          theme.palette.mode === "light"
                                            ? alpha(
                                                theme.palette.warning.main,
                                                0.22,
                                              )
                                            : alpha(
                                                theme.palette.warning.light,
                                                0.24,
                                              ),
                                        bgcolor: (theme) =>
                                          theme.palette.mode === "light"
                                            ? alpha(
                                                theme.palette.warning.main,
                                                0.05,
                                              )
                                            : alpha(
                                                theme.palette.warning.light,
                                                0.08,
                                              ),
                                      }}
                                    />
                                  )}
                              </Stack>
                            </Stack>
                          </CardContent>
                          <CardActions sx={userCardFooterSx}>
                            <Box sx={userCardActionsWrapSx}>
                              {"status" in user &&
                                user.status === "INVITED" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<SendIcon fontSize="small" />}
                                    fullWidth
                                    onClick={() => resendUserInvite(user)}
                                    sx={{ ...userCardActionButtonSx, order: 3 }}
                                  >
                                    Wyślij ponownie
                                  </Button>
                                )}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon fontSize="small" />}
                                fullWidth
                                onClick={() => openEditUserDialog(user)}
                                sx={{ ...userCardActionButtonSx, order: 2 }}
                                disabled={
                                  "status" in user && user.status === "INVITED"
                                }
                              >
                                Edytuj
                              </Button>
                              {"status" in user &&
                                user.status === "INVITED" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<CancelIcon fontSize="small" />}
                                    fullWidth
                                    onClick={() =>
                                      openDeleteDialog({
                                        type: "user",
                                        publicId: user.publicId,
                                        label: user.email,
                                        detail:
                                          "Konto oczekujące — link aktywacyjny straci ważność.",
                                        fields: [
                                          {
                                            label: "E-mail",
                                            value: user.email,
                                          },
                                          {
                                            label: "Status",
                                            value:
                                              "Konto oczekujące — link aktywacyjny straci ważność.",
                                            secondary: true,
                                          },
                                        ],
                                      })
                                    }
                                    sx={userCardDeleteButtonSx}
                                  >
                                    Anuluj
                                  </Button>
                                )}
                              {"status" in user &&
                                user.status !== "INVITED" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<DeleteIcon fontSize="small" />}
                                    fullWidth
                                    onClick={() =>
                                      openDeleteDialog({
                                        type: "user",
                                        publicId: user.publicId,
                                        label: user.username ?? user.email,
                                        detail:
                                          user.role === "STUDENT" &&
                                          "groupName" in user &&
                                          user.groupName
                                            ? `Uczeń w grupie ${user.groupName}`
                                            : user.email,
                                        fields: [
                                          {
                                            label: "Nazwa",
                                            value: user.username ?? "—",
                                          },
                                          {
                                            label: "E-mail",
                                            value: user.email,
                                          },
                                          ...(user.role === "STUDENT" &&
                                          "groupName" in user &&
                                          user.groupName
                                            ? [
                                                {
                                                  label: "Grupa",
                                                  value: user.groupName,
                                                  secondary: true,
                                                },
                                              ]
                                            : []),
                                        ],
                                      })
                                    }
                                    sx={userCardDeleteButtonSx}
                                  >
                                    Usuń
                                  </Button>
                                )}
                              {!("status" in user) && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<DeleteIcon fontSize="small" />}
                                  fullWidth
                                  onClick={() =>
                                    openDeleteDialog({
                                      type: "user",
                                      publicId: user.publicId,
                                      label: user.username ?? user.email,
                                      detail: user.email,
                                      fields: [
                                        {
                                          label: "Nazwa",
                                          value: user.username ?? "—",
                                        },
                                        {
                                          label: "E-mail",
                                          value: user.email,
                                          secondary: true,
                                        },
                                      ],
                                    })
                                  }
                                  sx={userCardDeleteButtonSx}
                                >
                                  Usuń
                                </Button>
                              )}
                            </Box>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Stack>
            ) : (
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                >
                  <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>
                    Grupy i skład uczniów
                  </Typography>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ sm: "center" }}
                  >
                    <IconButton
                      aria-label="Odśwież grupy"
                      onClick={loadGroups}
                      disabled={groupsLoading}
                      sx={{ ...panelIconButtonSx, color: "text.secondary" }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                {groupsError && <Alert severity="warning">{groupsError}</Alert>}

                <Paper elevation={0} sx={panelToolbarSx}>
                  <TextField
                    size="small"
                    placeholder="Filtruj grupy po nazwie lub opisie"
                    value={groupSearch}
                    onChange={(event) => setGroupSearch(event.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon
                              fontSize="small"
                              sx={{ color: "text.secondary" }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      ...toolbarFieldSx,
                      ...groupCompactToolbarFieldSx,
                      minWidth: { xs: "100%", sm: 260, lg: 320 },
                      flex: { xs: "1 1 100%", md: "1.4 1 280px" },
                    }}
                  />

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", md: "block" } }}
                  />

                  <Autocomplete
                    multiple
                    size="small"
                    options={teachers}
                    value={selectedTeacherFilters}
                    onChange={(_, value) => setSelectedTeacherFilters(value)}
                    getOptionLabel={(option) => option.username}
                    isOptionEqualToValue={(option, value) =>
                      option.publicId === value.publicId
                    }
                    disableCloseOnSelect
                    limitTags={1}
                    noOptionsText="Brak nauczycieli"
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => {
                        const { key, ...rest } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option.username}
                            size="small"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                            {...rest}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={
                          selectedTeacherFilters.length === 0
                            ? "Filtruj nauczycieli..."
                            : undefined
                        }
                      />
                    )}
                    sx={{
                      ...toolbarFieldSx,
                      minWidth: { xs: "100%", sm: 220 },
                      flex: { xs: "1 1 100%", lg: "1 1 230px" },
                    }}
                  />

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", md: "block" } }}
                  />

                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, value: AdminViewMode | null) => {
                      if (value) {
                        setViewMode(value);
                      }
                    }}
                    size="small"
                    sx={{ ...segmentedGroupSx, flexShrink: 0 }}
                  >
                    <ToggleButton
                      value="grid"
                      aria-label="Widok siatki"
                      sx={segmentedStandaloneButtonSx}
                    >
                      <GridIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton
                      value="list"
                      aria-label="Widok listy"
                      sx={segmentedStandaloneButtonSx}
                    >
                      <ListIcon fontSize="small" />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Paper>

                {groupsLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 220,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : filteredGroups.length === 0 ? (
                  <Alert severity="info">
                    Brak grup pasujących do aktualnych filtrów.
                  </Alert>
                ) : viewMode === "list" ? (
                  <Stack spacing={1.25}>
                    {filteredGroups.map((group) => (
                      <Paper
                        key={group.publicId}
                        elevation={0}
                        sx={panelListRowSx}
                      >
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={2}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                        >
                          <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              alignItems={{ xs: "flex-start", sm: "center" }}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Typography
                                variant="body1"
                                fontWeight={700}
                                color="primary.main"
                                sx={{ overflowWrap: "anywhere" }}
                              >
                                {group.name}
                              </Typography>
                              <Chip
                                icon={<SchoolIcon />}
                                label={`${group.studentCount} uczniów`}
                                color="warning"
                                size="small"
                              />
                            </Stack>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ overflowWrap: "anywhere" }}
                            >
                              {group.description || "Brak opisu grupy."}
                            </Typography>
                            <Stack direction="column" spacing={0.5}>
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                                sx={{ overflowWrap: "anywhere" }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Właściciel:
                                </Typography>
                                <UserAvatar
                                  avatarUrl={teacherAvatarById.get(
                                    group.teacherPublicId ?? "",
                                  )}
                                  username={teacherNameById.get(
                                    group.teacherPublicId ?? "",
                                  )}
                                  size={20}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    color: "text.primary",
                                  }}
                                >
                                  {teacherNameById.get(
                                    group.teacherPublicId ?? "",
                                  ) ?? "Brak danych"}
                                </Typography>
                              </Stack>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Utworzono {formatDate(group.createdAt)}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ xs: "stretch", sm: "center" }}
                          >
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<SchoolIcon />}
                              onClick={() => openMembershipDialog(group)}
                              sx={panelFooterButtonSx}
                            >
                              Skład grupy
                            </Button>
                            <Box sx={panelInlineActionsSx}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon fontSize="small" />}
                                onClick={() => openEditGroupDialog(group)}
                                sx={panelFooterButtonSx}
                              >
                                Edytuj
                              </Button>
                              <Button
                                size="small"
                                startIcon={<DeleteIcon fontSize="small" />}
                                onClick={() =>
                                  openDeleteDialog({
                                    type: "group",
                                    publicId: group.publicId,
                                    label: group.name,
                                    detail: group.description,
                                    fields: [
                                      { label: "Nazwa", value: group.name },
                                      {
                                        label: "Opis",
                                        value:
                                          group.description?.trim() ||
                                          "Brak opisu",
                                        secondary: true,
                                      },
                                    ],
                                  })
                                }
                                sx={panelDeleteButtonSx}
                              >
                                Usuń
                              </Button>
                            </Box>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Grid container spacing={2}>
                    {filteredGroups.map((group) => (
                      <Grid
                        key={group.publicId}
                        size={{ xs: 12, md: 6, xl: 4 }}
                      >
                        <Card elevation={0} sx={userCardSurfaceSx}>
                          <CardContent
                            sx={{
                              ...userCardContentSx,
                              pb: 1,
                            }}
                          >
                            <Stack
                              spacing={1.5}
                              sx={{ width: "100%", minHeight: "100%" }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                spacing={2}
                              >
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography
                                    variant="body1"
                                    fontWeight={700}
                                    color="primary.main"
                                    sx={panelTitleSx}
                                  >
                                    {group.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={panelTwoLinesSx}
                                  >
                                    {group.description || "Brak opisu grupy."}
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={0.75}
                                    alignItems="center"
                                    sx={{ mt: 1, ...panelSingleLineSx }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Właściciel:
                                    </Typography>
                                    <UserAvatar
                                      avatarUrl={teacherAvatarById.get(
                                        group.teacherPublicId ?? "",
                                      )}
                                      username={teacherNameById.get(
                                        group.teacherPublicId ?? "",
                                      )}
                                      size={18}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 700,
                                        color: "text.primary",
                                      }}
                                    >
                                      {teacherNameById.get(
                                        group.teacherPublicId ?? "",
                                      ) ?? "Brak danych"}
                                    </Typography>
                                  </Stack>
                                </Box>
                                <Chip
                                  icon={<SchoolIcon />}
                                  label={`${group.studentCount} uczniów`}
                                  color="warning"
                                  size="small"
                                  sx={{ flexShrink: 0 }}
                                />
                              </Stack>

                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                              >
                                <Chip
                                  label={`Utworzono ${formatDate(group.createdAt)}`}
                                  size="small"
                                  variant="outlined"
                                  sx={outlinedMetaChipSx}
                                />
                              </Stack>
                            </Stack>
                          </CardContent>
                          <CardActions sx={userCardFooterSx}>
                            <Box sx={userCardActionsWrapSx}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<SchoolIcon fontSize="small" />}
                                fullWidth
                                onClick={() => openMembershipDialog(group)}
                                sx={userCardActionButtonSx}
                              >
                                Skład grupy
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon fontSize="small" />}
                                fullWidth
                                onClick={() => openEditGroupDialog(group)}
                                sx={userCardActionButtonSx}
                              >
                                Edytuj
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DeleteIcon fontSize="small" />}
                                fullWidth
                                onClick={() =>
                                  openDeleteDialog({
                                    type: "group",
                                    publicId: group.publicId,
                                    label: group.name,
                                    detail: group.description,
                                    fields: [
                                      { label: "Nazwa", value: group.name },
                                      {
                                        label: "Opis",
                                        value: group.description || "Brak",
                                      },
                                    ],
                                  })
                                }
                                sx={userCardDeleteButtonSx}
                              >
                                Usuń
                              </Button>
                            </Box>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>

        <AppDialog
          open={userDialogOpen}
          onClose={closeUserDialog}
          onExited={resetUserDialogState}
          maxWidth="md"
          paperSx={{
            ...standardFormDialogPaperSx,
            ...(userDialogMode === "edit" ? { width: { sm: 640 } } : {}),
          }}
        >
          <AppDialogHeader
            icon={userDialogMode === "create" ? <SparklesIcon /> : <EditIcon />}
            iconContainerSx={
              userDialogMode === "edit"
                ? {
                    borderRadius: "50%",
                    width: 54,
                    height: 54,
                    boxShadow: (theme: Theme) =>
                      `0 10px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }
                : {}
            }
            title={
              userDialogMode === "create"
                ? userDialogRole === "TEACHER"
                  ? "Zaproszenie nauczyciela"
                  : "Zaproszenie ucznia"
                : `Edycja konta ${selectedUser?.username ?? ""}`
            }
            subtitle={
              userDialogRole === "TEACHER"
                ? userDialogMode === "create"
                  ? "Wyślij zaproszenie e-mail. Nauczyciel sam ustawi nazwę i hasło."
                  : "Zarządzaj danymi nauczyciela i dostępem do konta."
                : userDialogMode === "create"
                  ? "Wyślij zaproszenie e-mail. Uczeń sam ustawi nazwę i hasło."
                  : "Zarządzaj danymi ucznia, przypisaną grupą i dostępem."
            }
            badge={
              <Chip
                label={getRoleLabel(
                  ((selectedUser?.role as UserRole | undefined) ??
                    (userDialogMode === "create"
                      ? userDialogRole
                      : "TEACHER")) as UserRole,
                )}
                size="small"
                color={getRoleChipColor(
                  ((selectedUser?.role as UserRole | undefined) ??
                    userDialogRole) as UserRole,
                )}
                sx={{
                  ...inviteBadgeSx,
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 24,
                  mt: 0.5, // Nudge down for better optical centering
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.primary.main, 0.05)
                      : alpha(theme.palette.primary.main, 0.1),
                }}
              />
            }
          />
          <AppDialogBody
            sx={{
              p: userDialogMode === "create" ? 3 : 2.5,
              bgcolor: "transparent",
            }}
          >
            {userDialogFeedback && (
              <AppDialogStatus severity={userDialogFeedback.severity}>
                {userDialogFeedback.message}
              </AppDialogStatus>
            )}
            {userDialogMode === "create" ? (
              <Stack spacing={2.25}>
                {!isCreateInviteDialog && (
                  <FormSection
                    title="Tożsamość konta"
                    description="Uzupełnij dane startowe konta, które zostaną zapisane przed wysłaniem zaproszenia."
                  >
                    <Stack spacing={1}>
                      <Typography sx={dialogFieldLabelSx}>
                        Nazwa użytkownika
                      </Typography>
                      <TextField
                        name="admin-user-dialog-username"
                        autoComplete="off"
                        value={userDraft.username}
                        onChange={(event) =>
                          setUserDraft((current) => ({
                            ...current,
                            username: event.target.value.slice(
                              0,
                              INPUT_LIMITS.username,
                            ),
                          }))
                        }
                        inputProps={{ maxLength: INPUT_LIMITS.username }}
                        error={
                          userDraft.username.length > 0 &&
                          userDraft.username.trim().length < 3
                        }
                        helperText={
                          userDraft.username.length > 0 &&
                          userDraft.username.trim().length < 3
                            ? "Minimalna długość to 3 znaki"
                            : "Nazwa będzie widoczna w systemie od razu po utworzeniu konta."
                        }
                        fullWidth
                        placeholder="Np. anna.nowak"
                      />
                    </Stack>
                  </FormSection>
                )}
                <FormSection
                  title={
                    userDialogRole === "STUDENT"
                      ? "Dane zaproszenia"
                      : "Dane nauczyciela"
                  }
                  description={
                    userDialogRole === "STUDENT"
                      ? "Zaproszenie zostanie wysłane e-mailem. Uczeń sam ustawi nazwę użytkownika i hasło po otwarciu linku aktywacyjnego."
                      : "Wyślij profesjonalne zaproszenie e-mail i pozwól nauczycielowi dokończyć aktywację konta we własnym tempie."
                  }
                >
                  <Stack spacing={1.25}>
                    <Box>
                      <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                        Adres e-mail
                      </Typography>
                      <TextField
                        name="admin-user-dialog-email"
                        autoComplete="off"
                        value={userDraft.email}
                        onChange={(event) => {
                          setUserFieldErrors((current) => ({
                            ...current,
                            email: undefined,
                          }));
                          setUserDraft((current) => ({
                            ...current,
                            email: event.target.value.slice(
                              0,
                              INPUT_LIMITS.email,
                            ),
                          }));
                        }}
                        inputProps={{ maxLength: INPUT_LIMITS.email }}
                        error={Boolean(userFieldErrors.email)}
                        helperText={
                          userFieldErrors.email ??
                          "Na ten adres zostanie wysłany link do aktywacji konta."
                        }
                        fullWidth
                        placeholder="Np. student@szkola.pl"
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                        Potwierdź adres e-mail
                      </Typography>
                      <TextField
                        name="admin-user-dialog-email-confirm"
                        autoComplete="off"
                        value={userDialogConfirmEmail}
                        onChange={(event) => {
                          setUserFieldErrors((current) => ({
                            ...current,
                            emailConfirm: undefined,
                          }));
                          setUserDialogConfirmEmail(
                            event.target.value.slice(0, INPUT_LIMITS.email),
                          );
                        }}
                        inputProps={{ maxLength: INPUT_LIMITS.email }}
                        error={Boolean(userFieldErrors.emailConfirm)}
                        helperText={
                          userFieldErrors.emailConfirm ??
                          "Powtórz e-mail, aby uniknąć pomyłek."
                        }
                        fullWidth
                        placeholder="Powtórz e-mail"
                      />
                    </Box>
                  </Stack>
                </FormSection>

                {isCreateStudentDialog && (
                  <FormSection
                    title="Przypisanie do grupy"
                    description="Opcjonalnie wybierz grupę, do której uczeń zostanie przypisany natychmiast po aktywacji konta."
                  >
                    <Box>
                      <TextField
                        select
                        value={userDraft.groupPublicId}
                        onChange={(event) => {
                          setUserFieldErrors((current) => ({
                            ...current,
                            groupPublicId: undefined,
                          }));
                          setUserDraft((current) => ({
                            ...current,
                            groupPublicId: event.target.value as string | "",
                          }));
                        }}
                        error={Boolean(userFieldErrors.groupPublicId)}
                        fullWidth
                        helperText={
                          userFieldErrors.groupPublicId ??
                          (assignableGroups.length === 0
                            ? "Aktualnie nie ma dostępnych grup do przypisania."
                            : "Uczeń może też zostać przypisany do grupy później.")
                        }
                      >
                        <MenuItem value="">Brak grupy</MenuItem>
                        {assignableGroups.map((group) => (
                          <MenuItem key={group.publicId} value={group.publicId}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </FormSection>
                )}
              </Stack>
            ) : (
              <Stack spacing={2.25}>
                {/* Unified Premium Container: Username + Email + Group + Reset */}
                <Box
                  sx={{
                    borderRadius: uiTokens.radius.section,
                    bgcolor: (theme) =>
                      theme.palette.mode === "light"
                        ? "rgba(255, 255, 255, 0.78)"
                        : "rgba(255, 255, 255, 0.03)",
                    border: "1px solid",
                    borderColor: (theme) =>
                      theme.palette.mode === "light"
                        ? "rgba(148, 163, 184, 0.14)"
                        : "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(14px)",
                    boxShadow: (theme) =>
                      theme.palette.mode === "light"
                        ? "0 16px 32px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.6)"
                        : "0 12px 24px rgba(0, 0, 0, 0.18)",
                    overflow: "hidden",
                  }}
                >
                  {/* Row 1: Username */}
                  <Box
                    sx={{
                      p: userDialogEditingFields.includes("username")
                        ? 2.75
                        : 2.25,
                      bgcolor: userDialogEditingFields.includes("username")
                        ? alpha(inlineEditAccentColor, 0.035)
                        : "transparent",
                      borderLeft: userDialogEditingFields.includes("username")
                        ? "4px solid"
                        : "none",
                      borderLeftColor: inlineEditAccentColor,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2.5,
                      transition: "all 0.25s ease",
                      "&:hover": {
                        bgcolor: (theme) =>
                          userDialogEditingFields.includes("username")
                            ? alpha(inlineEditAccentColor, 0.05)
                            : theme.palette.mode === "light"
                              ? alpha(theme.palette.text.primary, 0.01)
                              : alpha(theme.palette.common.white, 0.02),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: (theme) =>
                          theme.palette.mode === "light"
                            ? alpha("#6366F1", 0.1)
                            : alpha("#6366F1", 0.15),
                        color: "#6366F1",
                        flexShrink: 0,
                        mt: userDialogEditingFields.includes("username")
                          ? 0.75
                          : 0,
                      }}
                    >
                      <PersonIcon fontSize="small" />
                    </Box>

                    {userDialogEditingFields.includes("username") ? (
                      <Box sx={{ flex: 1 }}>
                        <Collapse in timeout={180}>
                          <Stack spacing={1}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={700}
                              display="block"
                              sx={{ mb: 0.5, letterSpacing: "0.02em" }}
                            >
                              EDYCJA NAZWY UŻYTKOWNIKA
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1.25,
                                alignItems: "flex-start",
                              }}
                            >
                              <TextField
                                value={userDraft.username}
                                onChange={(event) =>
                                  setUserDraft((current) => ({
                                    ...current,
                                    username: event.target.value.slice(
                                      0,
                                      INPUT_LIMITS.username,
                                    ),
                                  }))
                                }
                                autoFocus
                                size="small"
                                fullWidth
                                placeholder="Wprowadź nazwę użytkownika"
                                inputProps={{
                                  maxLength: INPUT_LIMITS.username,
                                }}
                                error={
                                  (userDraft.username.length > 0 &&
                                    userDraft.username.trim().length < 3) ||
                                  Boolean(userFieldErrors.username)
                                }
                                helperText={
                                  userFieldErrors.username ??
                                  (userDraft.username.length > 0 &&
                                  userDraft.username.trim().length < 3
                                    ? "Minimalna długość to 3 znaki"
                                    : `${userDraft.username.length}/${INPUT_LIMITS.username}`)
                                }
                                sx={{
                                  ...counterFieldSx,
                                  "& .MuiOutlinedInput-root": {
                                    bgcolor: "background.paper",
                                    ...((userDraft.username.length > 0 &&
                                      userDraft.username.trim().length < 3) ||
                                    userFieldErrors.username
                                      ? {
                                          bgcolor: alpha("#EF4444", 0.02),
                                          "& fieldset": {
                                            borderColor: alpha("#EF4444", 0.2),
                                          },
                                        }
                                      : {}),
                                  },
                                }}
                              />
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: 1.25,
                                  alignItems: "center",
                                  mt: 0.25,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  disabled={
                                    userInlineSavingField === "username" ||
                                    userDraft.username.trim().length < 3
                                  }
                                  onClick={() =>
                                    void saveUserInlineSection("username")
                                  }
                                  sx={{
                                    ...inlineEditConfirmButtonSx,
                                    width: 32,
                                    height: 32,
                                    bgcolor: alpha("#10B981", 0.08),
                                    color: "#10B981",
                                    border: "1px solid",
                                    borderColor: alpha("#10B981", 0.2),
                                    "&:hover": {
                                      bgcolor: alpha("#10B981", 0.15),
                                      borderColor: alpha("#10B981", 0.3),
                                    },
                                    "&.Mui-disabled": {
                                      bgcolor: alpha("#64748B", 0.05),
                                      borderColor: alpha("#64748B", 0.1),
                                    },
                                  }}
                                >
                                  {userInlineSavingField === "username" ? (
                                    <CircularProgress
                                      size={14}
                                      color="inherit"
                                    />
                                  ) : (
                                    <CheckIcon sx={{ fontSize: 18 }} />
                                  )}
                                </IconButton>
                                <IconButton
                                  size="small"
                                  disabled={
                                    userInlineSavingField === "username"
                                  }
                                  onClick={() => {
                                    setUserDraft((current) => ({
                                      ...current,
                                      username: selectedUser?.username ?? "",
                                    }));
                                    setUserFieldErrors((current) => ({
                                      ...current,
                                      username: undefined,
                                    }));
                                    setUserDialogEditingFields((prev) =>
                                      prev.filter((f) => f !== "username"),
                                    );
                                  }}
                                  sx={{
                                    ...inlineEditCancelButtonSx,
                                    width: 32,
                                    height: 32,
                                    bgcolor: alpha("#64748B", 0.06),
                                    color: "#64748B",
                                    border: "1px solid",
                                    borderColor: alpha("#64748B", 0.15),
                                    "&:hover": {
                                      bgcolor: alpha("#64748B", 0.12),
                                      borderColor: alpha("#64748B", 0.25),
                                    },
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Stack>
                        </Collapse>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flex: 1,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            display="block"
                            sx={{ mb: 0.25 }}
                          >
                            Nazwa użytkownika
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            fontSize="1rem"
                          >
                            {userDraft.username || "—"}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          onClick={() =>
                            setUserDialogEditingFields((prev) => [
                              ...prev,
                              "username",
                            ])
                          }
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            borderRadius: "10px",
                            px: 1.5,
                            bgcolor: (theme) =>
                              alpha(theme.palette.text.primary, 0.03),
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.text.primary, 0.07),
                            },
                          }}
                        >
                          Zmień
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Divider
                    sx={{
                      borderColor: (theme) =>
                        theme.palette.mode === "light"
                          ? "rgba(148, 163, 184, 0.12)"
                          : "rgba(255, 255, 255, 0.05)",
                    }}
                  />

                  {/* Row 2: Email */}
                  <Box
                    sx={{
                      p: userDialogEditingFields.includes("email")
                        ? 2.75
                        : 2.25,
                      bgcolor: userDialogEditingFields.includes("email")
                        ? alpha(inlineEditAccentColor, 0.035)
                        : "transparent",
                      borderLeft: userDialogEditingFields.includes("email")
                        ? "4px solid"
                        : "none",
                      borderLeftColor: inlineEditAccentColor,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2.5,
                      transition: "all 0.25s ease",
                      "&:hover": {
                        bgcolor: (theme) =>
                          userDialogEditingFields.includes("email")
                            ? alpha(inlineEditAccentColor, 0.05)
                            : theme.palette.mode === "light"
                              ? alpha(theme.palette.text.primary, 0.01)
                              : alpha(theme.palette.common.white, 0.02),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: (theme) =>
                          theme.palette.mode === "light"
                            ? alpha("#6366F1", 0.1)
                            : alpha("#6366F1", 0.15),
                        color: "#6366F1",
                        flexShrink: 0,
                        mt: userDialogEditingFields.includes("email")
                          ? 0.75
                          : 0,
                      }}
                    >
                      <EmailIcon fontSize="small" />
                    </Box>

                    {userDialogEditingFields.includes("email") ? (
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          display="block"
                          sx={{ mb: 1.5, letterSpacing: "0.02em" }}
                        >
                          EDYCJA ADRESU E-MAIL
                        </Typography>

                        <Stack spacing={1.5}>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1.25,
                              alignItems: "flex-start",
                            }}
                          >
                            <TextField
                              value={userDraft.email}
                              onChange={(event) => {
                                setUserFieldErrors((current) => ({
                                  ...current,
                                  email: undefined,
                                }));
                                setUserDraft((current) => ({
                                  ...current,
                                  email: event.target.value.slice(
                                    0,
                                    INPUT_LIMITS.email,
                                  ),
                                }));
                              }}
                              autoFocus
                              size="small"
                              fullWidth
                              autoComplete="off"
                              inputProps={{ maxLength: INPUT_LIMITS.email }}
                              error={Boolean(userFieldErrors.email)}
                              helperText={
                                userFieldErrors.email ??
                                "Adres służący do logowania i odzyskiwania hasła."
                              }
                              placeholder="Wprowadź nowy e-mail"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  bgcolor: "background.paper",
                                  ...(userFieldErrors.email && {
                                    bgcolor: alpha("#EF4444", 0.02),
                                    "& fieldset": {
                                      borderColor: alpha("#EF4444", 0.2),
                                    },
                                  }),
                                },
                              }}
                            />
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "center",
                                mt: 0.5,
                              }}
                            >
                              <IconButton
                                size="small"
                                disabled={userInlineSavingField === "email"}
                                onClick={() =>
                                  void saveUserInlineSection("email")
                                }
                                sx={{
                                  ...inlineEditConfirmButtonSx,
                                  width: 32,
                                  height: 32,
                                  bgcolor: alpha("#10B981", 0.08),
                                  color: "#10B981",
                                  border: "1px solid",
                                  borderColor: alpha("#10B981", 0.2),
                                  "&:hover": {
                                    bgcolor: alpha("#10B981", 0.15),
                                    borderColor: alpha("#10B981", 0.3),
                                  },
                                  "&.Mui-disabled": {
                                    bgcolor: alpha("#64748B", 0.05),
                                    borderColor: alpha("#64748B", 0.1),
                                  },
                                }}
                              >
                                {userInlineSavingField === "email" ? (
                                  <CircularProgress size={14} color="inherit" />
                                ) : (
                                  <CheckIcon sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                              <IconButton
                                size="small"
                                disabled={userInlineSavingField === "email"}
                                onClick={() => {
                                  setUserDraft((current) => ({
                                    ...current,
                                    email: selectedUser?.email ?? "",
                                  }));
                                  setUserDialogConfirmEmail("");
                                  setUserFieldErrors((current) => ({
                                    ...current,
                                    email: undefined,
                                    emailConfirm: undefined,
                                  }));
                                  setUserDialogEditingFields((prev) =>
                                    prev.filter((f) => f !== "email"),
                                  );
                                }}
                                sx={{
                                  ...inlineEditCancelButtonSx,
                                  width: 32,
                                  height: 32,
                                  bgcolor: alpha("#64748B", 0.06),
                                  color: "#64748B",
                                  border: "1px solid",
                                  borderColor: alpha("#64748B", 0.15),
                                  "&:hover": {
                                    bgcolor: alpha("#64748B", 0.12),
                                    borderColor: alpha("#64748B", 0.25),
                                  },
                                }}
                              >
                                <CloseIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          </Box>

                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              display="block"
                              sx={{ mb: 1, opacity: 0.8 }}
                            >
                              Potwierdź adres e-mail
                            </Typography>
                            <TextField
                              value={userDialogConfirmEmail}
                              onChange={(event) => {
                                setUserFieldErrors((current) => ({
                                  ...current,
                                  emailConfirm: undefined,
                                }));
                                setUserDialogConfirmEmail(
                                  event.target.value.slice(
                                    0,
                                    INPUT_LIMITS.email,
                                  ),
                                );
                              }}
                              size="small"
                              fullWidth
                              placeholder="Powtórz e-mail, aby zapisać"
                              error={
                                Boolean(userFieldErrors.emailConfirm) ||
                                (userDialogConfirmEmail.length > 0 &&
                                  userDraft.email !== userDialogConfirmEmail)
                              }
                              helperText={
                                userFieldErrors.emailConfirm ??
                                (userDialogConfirmEmail.length > 0 &&
                                userDraft.email !== userDialogConfirmEmail
                                  ? "Adresy e-mail nie są zgodne"
                                  : "")
                              }
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  bgcolor: "background.paper",
                                  opacity: 0.9,
                                  ...((userDialogConfirmEmail.length > 0 &&
                                    userDraft.email !==
                                      userDialogConfirmEmail) ||
                                  userFieldErrors.emailConfirm
                                    ? {
                                        bgcolor: alpha("#EF4444", 0.02),
                                        "& fieldset": {
                                          borderColor: alpha("#EF4444", 0.2),
                                        },
                                      }
                                    : {}),
                                },
                              }}
                            />
                          </Box>
                        </Stack>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flex: 1,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            display="block"
                            sx={{ mb: 0.25 }}
                          >
                            Adres e-mail
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            fontSize="1rem"
                          >
                            {userDraft.email || "—"}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          onClick={() =>
                            setUserDialogEditingFields((prev) => [
                              ...prev,
                              "email",
                            ])
                          }
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            borderRadius: "10px",
                            px: 1.5,
                            bgcolor: (theme) =>
                              alpha(theme.palette.text.primary, 0.03),
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.text.primary, 0.07),
                            },
                          }}
                        >
                          Zmień
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {userDialogRole === "STUDENT" && (
                    <>
                      <Divider
                        sx={{
                          borderColor: (theme) =>
                            theme.palette.mode === "light"
                              ? "rgba(148, 163, 184, 0.12)"
                              : "rgba(255, 255, 255, 0.05)",
                        }}
                      />
                      {/* Row 3: Group (Student only) */}
                      <Box
                        sx={{
                          p: userDialogEditingFields.includes("group")
                            ? 2.75
                            : 2.25,
                          bgcolor: userDialogEditingFields.includes("group")
                            ? alpha(inlineEditAccentColor, 0.035)
                            : "transparent",
                          borderLeft: userDialogEditingFields.includes("group")
                            ? "4px solid"
                            : "none",
                          borderLeftColor: inlineEditAccentColor,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2.5,
                          transition: "all 0.25s ease",
                          "&:hover": {
                            bgcolor: (theme) =>
                              userDialogEditingFields.includes("group")
                                ? alpha(inlineEditAccentColor, 0.05)
                                : theme.palette.mode === "light"
                                  ? alpha(theme.palette.text.primary, 0.01)
                                  : alpha(theme.palette.common.white, 0.02),
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: (theme) =>
                              theme.palette.mode === "light"
                                ? alpha("#6366F1", 0.1)
                                : alpha("#6366F1", 0.15),
                            color: "#6366F1",
                            flexShrink: 0,
                            mt: userDialogEditingFields.includes("group")
                              ? 0.75
                              : 0,
                          }}
                        >
                          <SchoolIcon fontSize="small" />
                        </Box>

                        {userDialogEditingFields.includes("group") ? (
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={700}
                              display="block"
                              sx={{ mb: 1.5, letterSpacing: "0.02em" }}
                            >
                              EDYCJA GRUPY
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1.25,
                                alignItems: "flex-start",
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <TextField
                                  select
                                  value={userDraft.groupPublicId}
                                  onChange={(event) => {
                                    setUserFieldErrors((current) => ({
                                      ...current,
                                      groupPublicId: undefined,
                                    }));
                                    setUserDraft((current) => ({
                                      ...current,
                                      groupPublicId: event.target.value as
                                        | string
                                        | "",
                                    }));
                                  }}
                                  size="small"
                                  fullWidth
                                  error={Boolean(userFieldErrors.groupPublicId)}
                                  helperText={userFieldErrors.groupPublicId}
                                  SelectProps={{
                                    displayEmpty: true,
                                  }}
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      bgcolor: "background.paper",
                                      ...(userFieldErrors.groupPublicId && {
                                        bgcolor: alpha("#EF4444", 0.02),
                                        "& fieldset": {
                                          borderColor: alpha("#EF4444", 0.2),
                                        },
                                      }),
                                    },
                                  }}
                                >
                                  <MenuItem value="">Brak grupy</MenuItem>
                                  {assignableGroups.map((group) => (
                                    <MenuItem
                                      key={group.publicId}
                                      value={group.publicId}
                                    >
                                      {group.name}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: 1,
                                  alignItems: "center",
                                  mt: 0.5,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  disabled={userInlineSavingField === "group"}
                                  onClick={() =>
                                    void saveUserInlineSection("group")
                                  }
                                  sx={{
                                    ...inlineEditConfirmButtonSx,
                                    width: 32,
                                    height: 32,
                                    bgcolor: alpha("#10B981", 0.08),
                                    color: "#10B981",
                                    border: "1px solid",
                                    borderColor: alpha("#10B981", 0.2),
                                    "&:hover": {
                                      bgcolor: alpha("#10B981", 0.15),
                                      borderColor: alpha("#10B981", 0.3),
                                    },
                                    "&.Mui-disabled": {
                                      bgcolor: alpha("#64748B", 0.05),
                                      borderColor: alpha("#64748B", 0.1),
                                    },
                                  }}
                                >
                                  {userInlineSavingField === "group" ? (
                                    <CircularProgress
                                      size={14}
                                      color="inherit"
                                    />
                                  ) : (
                                    <CheckIcon sx={{ fontSize: 18 }} />
                                  )}
                                </IconButton>
                                <IconButton
                                  size="small"
                                  disabled={userInlineSavingField === "group"}
                                  onClick={() => {
                                    setUserDraft((current) => ({
                                      ...current,
                                      groupPublicId:
                                        selectedUser &&
                                        "groupPublicId" in selectedUser
                                          ? (selectedUser.groupPublicId ?? "")
                                          : "",
                                    }));
                                    setUserDialogEditingFields((prev) =>
                                      prev.filter((f) => f !== "group"),
                                    );
                                  }}
                                  sx={{
                                    ...inlineEditCancelButtonSx,
                                    width: 32,
                                    height: 32,
                                    bgcolor: alpha("#64748B", 0.06),
                                    color: "#64748B",
                                    border: "1px solid",
                                    borderColor: alpha("#64748B", 0.15),
                                    "&:hover": {
                                      bgcolor: alpha("#64748B", 0.12),
                                      borderColor: alpha("#64748B", 0.25),
                                    },
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flex: 1,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                display="block"
                                sx={{ mb: 0.25 }}
                              >
                                Grupa
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                fontSize="1rem"
                              >
                                {assignableGroups.find(
                                  (g) => g.publicId === userDraft.groupPublicId,
                                )?.name || "Brak grupy"}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              onClick={() =>
                                setUserDialogEditingFields((prev) => [
                                  ...prev,
                                  "group",
                                ])
                              }
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.82rem",
                                borderRadius: "10px",
                                px: 1.5,
                                bgcolor: (theme) =>
                                  alpha(theme.palette.text.primary, 0.03),
                                "&:hover": {
                                  bgcolor: (theme) =>
                                    alpha(theme.palette.text.primary, 0.07),
                                },
                              }}
                            >
                              Zmień
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </>
                  )}

                  <Divider
                    sx={{
                      borderColor: (theme) =>
                        theme.palette.mode === "light"
                          ? "rgba(148, 163, 184, 0.12)"
                          : "rgba(255, 255, 255, 0.05)",
                    }}
                  />

                  {/* Row 4: Password Reset (Action) */}
                  <Box
                    sx={{
                      p: 2.25,
                      bgcolor: "rgba(99, 102, 241, 0.04)",
                      display: "flex",
                      alignItems: "center",
                      gap: 2.5,
                      transition: "all 0.2s ease",
                      mt:
                        (userDialogEditingFields.includes("email") &&
                          userDialogRole === "TEACHER") ||
                        userDialogEditingFields.includes("group")
                          ? 1.5
                          : 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: (theme) =>
                          theme.palette.mode === "light"
                            ? alpha("#6366F1", 0.1)
                            : alpha("#6366F1", 0.15),
                        color: "#6366F1",
                        flexShrink: 0,
                      }}
                    >
                      <LockIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6366F1", mb: 0.25 }}
                        fontWeight={700}
                        display="block"
                      >
                        Reset hasła
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.4, fontSize: "0.85rem" }}
                      >
                        Wyślij link do ustawienia nowego hasła.
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={
                        passwordResetLoading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : passwordResetSent ? (
                          <CheckIcon fontSize="small" />
                        ) : (
                          <EmailIcon fontSize="small" />
                        )
                      }
                      onClick={() => void sendPasswordResetLink()}
                      disabled={
                        passwordResetLoading ||
                        passwordResetSent ||
                        !EMAIL_REGEX.test(userDraft.email.trim())
                      }
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        borderRadius: "10px",
                        px: 1.5,
                        py: 0.6,
                        minHeight: 32,
                        minWidth: 120,
                        whiteSpace: "nowrap",
                        gap: 0.5,
                        "& .MuiButton-startIcon": { mr: 0.5 },
                        borderColor: passwordResetSent
                          ? alpha("#10B981", 0.3)
                          : alpha("#6366F1", 0.2),
                        bgcolor: passwordResetSent
                          ? alpha("#10B981", 0.05)
                          : "transparent",
                        color: passwordResetSent ? "#10B981" : "#6366F1",
                        "&:hover": {
                          borderColor: passwordResetSent
                            ? alpha("#10B981", 0.4)
                            : alpha("#6366F1", 0.4),
                          bgcolor: passwordResetSent
                            ? alpha("#10B981", 0.08)
                            : alpha("#6366F1", 0.04),
                        },
                      }}
                    >
                      {passwordResetLoading
                        ? "Wysyłanie..."
                        : passwordResetSent
                          ? "Wysłano"
                          : "Wyślij link"}
                    </Button>
                  </Box>
                </Box>
              </Stack>
            )}
          </AppDialogBody>
          {userDialogMode === "create" && (
            <AppDialogFooter
              sx={{
                py: 2,
                px: 3,
                borderTop: "1px solid",
                borderColor: "rgba(15, 23, 42, 0.06)",
              }}
            >
              <FormActions sx={{ gap: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={submitUserDialog}
                  disabled={userDialogLoading}
                  sx={{
                    ...panelFooterButtonSx,
                    minWidth: 140,
                    boxShadow: "0 8px 20px -6px rgba(99, 102, 241, 0.5)",
                  }}
                >
                  {userDialogLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Dodaj użytkownika"
                  )}
                </Button>
              </FormActions>
            </AppDialogFooter>
          )}
        </AppDialog>

        <AppDialog
          open={groupDialogOpen}
          onClose={closeGroupDialog}
          maxWidth="md"
          paperSx={{
            ...standardFormDialogPaperSx,
            ...(groupDialogMode === "edit" ? { width: { sm: 640 } } : {}),
          }}
        >
          <AppDialogHeader
            icon={groupDialogMode === "create" ? <SchoolIcon /> : <EditIcon />}
            iconContainerSx={
              groupDialogMode === "edit"
                ? {
                    borderRadius: "50%",
                    width: 54,
                    height: 54,
                    boxShadow: (theme: Theme) =>
                      `0 10px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }
                : {}
            }
            title={groupDialogMode === "create" ? "Nowa grupa" : "Edycja grupy"}
            subtitle={
              groupDialogMode === "create"
                ? "Skonfiguruj grupę w lekkim, uporządkowanym flow i od razu przypisz nauczyciela prowadzącego."
                : "Zaktualizuj nazwę, opis i opiekuna grupy bez zmiany jej dotychczasowego działania."
            }
            badge={
              <Chip
                label={groupDialogMode === "create" ? "Nowa grupa" : "Edycja"}
                size="small"
                variant="filled"
                sx={{
                  fontWeight: 700,
                  px: 0.5,
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                  color: "warning.dark",
                }}
              />
            }
          />
          <AppDialogBody>
            {groupDialogFeedback && (
              <AppDialogStatus severity={groupDialogFeedback.severity}>
                {groupDialogFeedback.message}
              </AppDialogStatus>
            )}
            {groupDialogMode === "create" ? (
              <Stack spacing={1.75}>
                <FormSection
                  title="Informacje o grupie"
                  description="Nadaj grupie nazwę i krótki opis."
                >
                  <Box>
                    <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                      Nazwa grupy
                    </Typography>
                    <TextField
                      value={groupDraft.name}
                      onChange={(event) => {
                        setGroupFieldErrors((current) => ({
                          ...current,
                          name: undefined,
                        }));
                        setGroupDraft((current) => ({
                          ...current,
                          name: event.target.value.slice(
                            0,
                            INPUT_LIMITS.groupName,
                          ),
                        }));
                      }}
                      inputProps={{ maxLength: INPUT_LIMITS.groupName }}
                      error={Boolean(groupFieldErrors.name)}
                      helperText={
                        groupFieldErrors.name ?? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 1,
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <Box component="span">
                              Krótka, konkretna nazwa ułatwi szybkie
                              odnalezienie grupy.
                            </Box>
                            {groupDraft.name.length > 0 && (
                              <Box
                                component="span"
                                sx={{
                                  color: "text.secondary",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {groupDraft.name.length}/
                                {INPUT_LIMITS.groupName}
                              </Box>
                            )}
                          </Box>
                        )
                      }
                      fullWidth
                      placeholder="Np. Matematyka 6A"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <SchoolIcon sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                      Opis grupy
                    </Typography>
                    <TextField
                      value={groupDraft.description}
                      onChange={(event) => {
                        setGroupFieldErrors((current) => ({
                          ...current,
                          description: undefined,
                        }));
                        setGroupDraft((current) => ({
                          ...current,
                          description: event.target.value.slice(
                            0,
                            INPUT_LIMITS.groupDescription,
                          ),
                        }));
                      }}
                      inputProps={{ maxLength: INPUT_LIMITS.groupDescription }}
                      error={Boolean(groupFieldErrors.description)}
                      helperText={
                        groupFieldErrors.description ?? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 1,
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <Box component="span">
                              Dodaj kilka zdań o przeznaczeniu, poziomie lub
                              trybie pracy grupy.
                            </Box>
                            {groupDraft.description.length > 0 && (
                              <Box
                                component="span"
                                sx={{
                                  color: "text.secondary",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {groupDraft.description.length}/
                                {INPUT_LIMITS.groupDescription}
                              </Box>
                            )}
                          </Box>
                        )
                      }
                      multiline
                      minRows={3}
                      fullWidth
                      placeholder="Np. Grupa dla uczniów przygotowujących się do działu z geometrii i zadań tekstowych."
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment
                              position="start"
                              sx={{ alignSelf: "flex-start", mt: 1.7 }}
                            >
                              <EditIcon sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          alignItems: "flex-start",
                          py: 0.25,
                        },
                        "& .MuiInputBase-inputMultiline": {
                          lineHeight: 1.65,
                          resize: "vertical",
                          minHeight: 64,
                          pt: 1.15,
                          pb: 0.8,
                        },
                      }}
                    />
                  </Box>
                </FormSection>

                <FormSection
                  title="Nauczyciel prowadzący"
                  description="Wybierz opiekuna grupy."
                >
                  <Box>
                    <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                      Wybierz nauczyciela
                    </Typography>
                    <TextField
                      select
                      value={groupDraft.teacherPublicId}
                      onChange={(event) => {
                        setGroupFieldErrors((current) => ({
                          ...current,
                          teacherPublicId: undefined,
                        }));
                        setGroupDraft((current) => ({
                          ...current,
                          teacherPublicId: event.target.value,
                        }));
                      }}
                      SelectProps={{
                        displayEmpty: true,
                        IconComponent: ExpandMoreIcon,
                      }}
                      error={Boolean(groupFieldErrors.teacherPublicId)}
                      helperText={
                        groupFieldErrors.teacherPublicId ??
                        "Przypisanie nauczyciela jest opcjonalne na etapie tworzenia, ale ułatwia dalsze zarządzanie grupą."
                      }
                      fullWidth
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <SchoolIcon sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    >
                      <MenuItem value="">Bez przypisanego nauczyciela</MenuItem>
                      {teachers.map((teacher) => (
                        <MenuItem
                          key={teacher.publicId}
                          value={teacher.publicId}
                          sx={{ py: 1.25 }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <UserAvatar
                              avatarUrl={teacher.avatarUrl}
                              username={teacher.username}
                              size={26}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                              >
                                {teacher.username}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                              >
                                {teacher.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </FormSection>
              </Stack>
            ) : (
              <Box sx={settingsPanelSurfaceSx}>
                <Box
                  sx={{
                    ...getInlineEditSectionSx(
                      groupDialogEditingFields.includes("name"),
                    ),
                    borderBottom: "1px solid",
                    borderBottomColor: "divider",
                  }}
                >
                  {groupDialogEditingFields.includes("name") ? (
                    <Box sx={settingsRowSx}>
                      <Box
                        sx={{
                          ...settingsRowIconTileSx,
                          alignSelf: "flex-start",
                          mt: 0.25,
                        }}
                      >
                        <SchoolIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mb: 0.75 }}
                        >
                          Edycja nazwy grupy
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "center",
                          }}
                        >
                          <TextField
                            value={groupDraft.name}
                            onChange={(event) => {
                              setGroupFieldErrors((current) => ({
                                ...current,
                                name: undefined,
                              }));
                              setGroupDraft((current) => ({
                                ...current,
                                name: event.target.value.slice(
                                  0,
                                  INPUT_LIMITS.groupName,
                                ),
                              }));
                            }}
                            autoFocus
                            size="small"
                            fullWidth
                            inputProps={{ maxLength: INPUT_LIMITS.groupName }}
                            error={Boolean(groupFieldErrors.name)}
                            sx={counterFieldSx}
                          />
                          <Box sx={compactInlineActionsWrapSx}>
                            <IconButton
                              size="small"
                              disabled={groupDialogLoading}
                              onClick={() => saveGroupInlineSection("name")}
                              sx={compactInlineConfirmButtonSx}
                            >
                              {groupDialogLoading ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <CheckIcon sx={{ fontSize: 18 }} />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              disabled={groupDialogLoading}
                              onClick={() => {
                                setGroupDraft((current) => ({
                                  ...current,
                                  name: selectedGroup?.name ?? "",
                                }));
                                setGroupFieldErrors((current) => ({
                                  ...current,
                                  name: undefined,
                                }));
                                setGroupDialogEditingFields((prev) =>
                                  prev.filter((field) => field !== "name"),
                                );
                              }}
                              sx={compactInlineCancelButtonSx}
                            >
                              <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        </Box>
                        {(groupFieldErrors.name ||
                          groupDraft.name.length > 0) && (
                          <Typography
                            variant="caption"
                            color={
                              groupFieldErrors.name ? "error" : "text.secondary"
                            }
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            {groupFieldErrors.name ??
                              `${groupDraft.name.length}/${INPUT_LIMITS.groupName}`}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        ...settingsRowSx,
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={settingsRowIconTileSx}>
                        <SchoolIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" sx={settingsRowLabelSx}>
                          Nazwa grupy
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          fontSize="1rem"
                        >
                          {groupDraft.name || "—"}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() =>
                          setGroupDialogEditingFields((prev) => [
                            ...prev,
                            "name",
                          ])
                        }
                        sx={inlineChangeButtonSx}
                      >
                        Zmień
                      </Button>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    ...getInlineEditSectionSx(
                      groupDialogEditingFields.includes("description"),
                    ),
                    borderBottom: "1px solid",
                    borderBottomColor: "divider",
                  }}
                >
                  {groupDialogEditingFields.includes("description") ? (
                    <Box sx={settingsRowSx}>
                      <Box
                        sx={{
                          ...settingsRowIconTileSx,
                          alignSelf: "flex-start",
                          mt: 0.25,
                        }}
                      >
                        <ListIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mb: 0.75 }}
                        >
                          Edycja opisu grupy
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "flex-start",
                          }}
                        >
                          <TextField
                            value={groupDraft.description}
                            onChange={(event) => {
                              setGroupFieldErrors((current) => ({
                                ...current,
                                description: undefined,
                              }));
                              setGroupDraft((current) => ({
                                ...current,
                                description: event.target.value.slice(
                                  0,
                                  INPUT_LIMITS.groupDescription,
                                ),
                              }));
                            }}
                            multiline
                            minRows={2}
                            autoFocus
                            size="small"
                            fullWidth
                            inputProps={{
                              maxLength: INPUT_LIMITS.groupDescription,
                            }}
                            error={Boolean(groupFieldErrors.description)}
                            sx={{
                              ...counterFieldSx,
                              "& .MuiOutlinedInput-root": {
                                alignItems: "flex-start",
                                py: 0.3,
                              },
                              "& .MuiInputBase-inputMultiline": {
                                lineHeight: 1.65,
                                resize: "vertical",
                                minHeight: 48,
                                pt: 1.2,
                                pb: 0.85,
                              },
                            }}
                          />
                          <Box sx={compactInlineActionsWrapSx}>
                            <IconButton
                              size="small"
                              disabled={groupDialogLoading}
                              onClick={() =>
                                saveGroupInlineSection("description")
                              }
                              sx={compactInlineConfirmButtonSx}
                            >
                              {groupDialogLoading ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <CheckIcon sx={{ fontSize: 18 }} />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              disabled={groupDialogLoading}
                              onClick={() => {
                                setGroupDraft((current) => ({
                                  ...current,
                                  description: selectedGroup?.description ?? "",
                                }));
                                setGroupFieldErrors((current) => ({
                                  ...current,
                                  description: undefined,
                                }));
                                setGroupDialogEditingFields((prev) =>
                                  prev.filter(
                                    (field) => field !== "description",
                                  ),
                                );
                              }}
                              sx={compactInlineCancelButtonSx}
                            >
                              <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        </Box>
                        {(groupFieldErrors.description ||
                          groupDraft.description.length > 0) && (
                          <Typography
                            variant="caption"
                            color={
                              groupFieldErrors.description
                                ? "error"
                                : "text.secondary"
                            }
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            {groupFieldErrors.description ??
                              `${groupDraft.description.length}/${INPUT_LIMITS.groupDescription}`}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        ...settingsRowSx,
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={settingsRowIconTileSx}>
                        <ListIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" sx={settingsRowLabelSx}>
                          Opis grupy
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          fontSize="1rem"
                          sx={{ color: "text.primary", whiteSpace: "pre-wrap" }}
                        >
                          {groupDraft.description?.trim() ||
                            "Brak opisu grupy."}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() =>
                          setGroupDialogEditingFields((prev) => [
                            ...prev,
                            "description",
                          ])
                        }
                        sx={inlineChangeButtonSx}
                      >
                        Zmień
                      </Button>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={getInlineEditSectionSx(
                    groupDialogEditingFields.includes("teacherPublicId"),
                  )}
                >
                  {groupDialogEditingFields.includes("teacherPublicId") ? (
                    <Box sx={settingsRowSx}>
                      <Box
                        sx={{
                          ...settingsRowIconTileSx,
                          alignSelf: "flex-start",
                          mt: 0.25,
                        }}
                      >
                        <PersonIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mb: 0.75 }}
                        >
                          Edycja nauczyciela prowadzącego
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "center",
                          }}
                        >
                          <TextField
                            select
                            value={groupDraft.teacherPublicId}
                            onChange={(event) => {
                              setGroupFieldErrors((current) => ({
                                ...current,
                                teacherPublicId: undefined,
                              }));
                              setGroupDraft((current) => ({
                                ...current,
                                teacherPublicId: event.target.value,
                              }));
                            }}
                            SelectProps={{
                              displayEmpty: true,
                              IconComponent: ExpandMoreIcon,
                            }}
                            fullWidth
                            size="small"
                            autoFocus
                            error={Boolean(groupFieldErrors.teacherPublicId)}
                          >
                            <MenuItem value="">
                              Bez przypisanego nauczyciela
                            </MenuItem>
                            {teachers.map((teacher) => (
                              <MenuItem
                                key={teacher.publicId}
                                value={teacher.publicId}
                                sx={{ py: 1.25 }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={1.5}
                                  alignItems="center"
                                >
                                  <UserAvatar
                                    avatarUrl={teacher.avatarUrl}
                                    username={teacher.username}
                                    size={26}
                                  />
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                      noWrap
                                    >
                                      {teacher.username}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      noWrap
                                    >
                                      {teacher.email}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </MenuItem>
                            ))}
                          </TextField>
                          <Box sx={compactInlineActionsWrapSx}>
                            <IconButton
                              size="small"
                              disabled={groupDialogLoading}
                              onClick={() =>
                                saveGroupInlineSection("teacherPublicId")
                              }
                              sx={compactInlineConfirmButtonSx}
                            >
                              {groupDialogLoading ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <CheckIcon sx={{ fontSize: 18 }} />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              disabled={groupDialogLoading}
                              onClick={() => {
                                setGroupDraft((current) => ({
                                  ...current,
                                  teacherPublicId:
                                    selectedGroup?.teacherPublicId ?? "",
                                }));
                                setGroupFieldErrors((current) => ({
                                  ...current,
                                  teacherPublicId: undefined,
                                }));
                                setGroupDialogEditingFields((prev) =>
                                  prev.filter(
                                    (field) => field !== "teacherPublicId",
                                  ),
                                );
                              }}
                              sx={compactInlineCancelButtonSx}
                            >
                              <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        </Box>
                        {groupFieldErrors.teacherPublicId && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            {groupFieldErrors.teacherPublicId}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.5 }}
                        >
                          Możesz przypisać nowego opiekuna lub pozostawić grupę
                          bez nauczyciela.
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        ...settingsRowSx,
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={settingsRowIconTileSx}>
                        <PersonIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" sx={settingsRowLabelSx}>
                          Nauczyciel prowadzący
                        </Typography>
                        {groupDraft.teacherPublicId ? (
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                          >
                            <UserAvatar
                              avatarUrl={teacherAvatarById.get(
                                groupDraft.teacherPublicId,
                              )}
                              username={teacherNameById.get(
                                groupDraft.teacherPublicId,
                              )}
                              size={26}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                fontSize="1rem"
                                noWrap
                              >
                                {teacherNameById.get(
                                  groupDraft.teacherPublicId,
                                ) ?? "Brak danych"}
                              </Typography>
                            </Box>
                          </Stack>
                        ) : (
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            fontSize="1rem"
                          >
                            Bez przypisanego nauczyciela
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        onClick={() =>
                          setGroupDialogEditingFields((prev) => [
                            ...prev,
                            "teacherPublicId",
                          ])
                        }
                        sx={inlineChangeButtonSx}
                      >
                        Zmień
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </AppDialogBody>
          {groupDialogMode === "create" && (
            <AppDialogFooter>
              <FormActions>
                <Button
                  variant="contained"
                  startIcon={<AddCircleIcon />}
                  onClick={submitGroupDialog}
                  disabled={groupDialogLoading}
                  sx={panelFooterButtonSx}
                >
                  {groupDialogLoading ? "Zapisywanie..." : "Utwórz grupę"}
                </Button>
              </FormActions>
            </AppDialogFooter>
          )}
        </AppDialog>

        <AppDialog
          open={Boolean(deleteDialog)}
          onClose={closeDeleteDialog}
          maxWidth="sm"
          paperSx={{
            width: {
              xs: "calc(100% - 28px)",
              sm: 520,
            },
          }}
        >
          <AppDialogHeader
            icon={<DeleteIcon sx={{ color: "common.white" }} />}
            iconContainerSx={{
              width: 50,
              height: 50,
              borderRadius: 3,
              backgroundImage:
                "linear-gradient(135deg, rgba(239,68,68,0.94) 0%, rgba(220,38,38,0.9) 100%)",
              boxShadow: (theme) =>
                `0 14px 28px ${alpha(theme.palette.error.main, 0.22)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.24)}`,
              "&::after": {
                background: (theme) =>
                  `radial-gradient(circle, ${alpha(theme.palette.error.main, 0.18)} 0%, transparent 72%)`,
              },
              "& .MuiSvgIcon-root": {
                fontSize: 24,
              },
            }}
            title={deleteDialog?.type === "user" ? "Usuń konto" : "Usuń grupę"}
            subtitle="Ta operacja jest nieodwracalna."
            badge={
              <Chip
                label="Ostrzeżenie"
                size="small"
                color="error"
                sx={membershipHeaderBadgeSx}
              />
            }
          />
          <AppDialogBody>
            {deleteDialogFeedback && (
              <AppDialogStatus severity={deleteDialogFeedback.severity}>
                {deleteDialogFeedback.message}
              </AppDialogStatus>
            )}
            <FormSection>
              {deleteDialog?.fields && deleteDialog.fields.length > 0 ? (
                <Stack spacing={1}>
                  {deleteDialog.fields.map((field) => (
                    <Typography
                      key={`${field.label}-${field.value}`}
                      variant="body2"
                      color={
                        field.secondary ? "text.secondary" : "text.primary"
                      }
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      <Box
                        component="span"
                        fontWeight={700}
                        color="text.primary"
                      >
                        {field.label}:
                      </Box>{" "}
                      {field.value}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <>
                  <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
                    {deleteDialog?.label}
                  </Typography>
                  {deleteDialog?.detail && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {deleteDialog.detail}
                    </Typography>
                  )}
                </>
              )}
            </FormSection>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {deleteDialog?.type === "user"
                ? "Usunięcie konta skasuje dostęp tego użytkownika do systemu."
                : "Usunięcie grupy wyczyści też jej skład i przypisania."}
            </Typography>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={confirmDelete}
                disabled={deleteLoading}
                sx={panelDeleteButtonSx}
              >
                {deleteLoading ? "Usuwanie..." : "Potwierdź usunięcie"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <AppDialog
          open={Boolean(membershipDialog)}
          onClose={closeMembershipDialog}
          maxWidth="sm"
          paperSx={{
            ...standardFormDialogPaperSx,
            width: { sm: 640 },
          }}
        >
          <AppDialogHeader
            icon={<SchoolIcon />}
            iconContainerSx={{
              borderRadius: "50%",
              width: 54,
              height: 54,
              boxShadow: (theme: Theme) =>
                `0 10px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
            title="Skład grupy"
            subtitle="Sprawdź aktualnych uczniów i dodaj nowe osoby przypisane do właściciela tej grupy."
            badge={
              <Chip
                label="Członkowie"
                size="small"
                color="primary"
                variant="outlined"
                sx={membershipHeaderBadgeSx}
              />
            }
          />
          <AppDialogBody>
            {membershipDialogFeedback && (
              <AppDialogStatus severity={membershipDialogFeedback.severity}>
                {membershipDialogFeedback.message}
              </AppDialogStatus>
            )}
            <Stack spacing={3}>
              <FormSection>
                <Stack spacing={0.75}>
                  <Typography variant="body1" fontWeight={700}>
                    {membershipDialog?.groupName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Właściciel:{" "}
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      component="span"
                      sx={{ display: "inline-flex", verticalAlign: "middle" }}
                    >
                      <UserAvatar
                        avatarUrl={teacherAvatarById.get(
                          membershipDialog?.teacherPublicId ?? "",
                        )}
                        username={teacherNameById.get(
                          membershipDialog?.teacherPublicId ?? "",
                        )}
                        size={18}
                      />
                      <Box
                        component="span"
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        {teacherNameById.get(
                          membershipDialog?.teacherPublicId ?? "",
                        ) ?? "Brak danych"}
                      </Box>
                    </Stack>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uczniowie w grupie: {currentMembershipStudents.length}
                  </Typography>
                </Stack>
              </FormSection>

              <FormSection title="Aktualni członkowie">
                {currentMembershipStudents.length === 0 ? (
                  <Alert severity="info">
                    Ta grupa nie ma jeszcze żadnych uczniów.
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      maxHeight: 272,
                      overflowY: "auto",
                      pr: 0.5,
                    }}
                  >
                    <Stack spacing={1}>
                      {currentMembershipStudents.map((student) => (
                        <Paper
                          key={student.publicId}
                          elevation={0}
                          sx={{
                            ...panelSurfaceSx,
                            p: 1.5,
                            borderRadius: 3,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                              sx={{ minWidth: 0, flex: 1 }}
                            >
                              <UserAvatar
                                avatarUrl={student.avatarUrl}
                                username={student.username}
                                size={32}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{ overflowWrap: "anywhere" }}
                                >
                                  {student.username}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ overflowWrap: "anywhere" }}
                                >
                                  {student.email}
                                </Typography>
                              </Box>
                            </Stack>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon fontSize="small" />}
                              onClick={() =>
                                removeMembershipStudent(student.publicId)
                              }
                              disabled={membershipLoading}
                              sx={userCardDeleteButtonSx}
                            >
                              Usuń
                            </Button>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}
              </FormSection>

              <FormSection
                title="Dodaj ucznia"
                description="Lista pokazuje tylko uczniów przypisanych do właściciela tej grupy."
              >
                <Stack direction="column" spacing={1}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Autocomplete
                      sx={{ flex: 1 }}
                      size="small"
                      options={availableMembershipStudents.filter(
                        (student) =>
                          student.groupPublicId !==
                          membershipDialog?.groupPublicId,
                      )}
                      value={
                        availableMembershipStudents.find(
                          (student) =>
                            student.publicId === membershipStudentPublicId,
                        ) ?? null
                      }
                      onChange={(_, value) =>
                        setMembershipStudentPublicId(value?.publicId ?? "")
                      }
                      getOptionLabel={(option) =>
                        `${option.username} (${option.email})`
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.publicId === value.publicId
                      }
                      noOptionsText="Brak wolnych uczniów dla tego nauczyciela"
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Wybierz ucznia" />
                      )}
                    />
                    <Button
                      variant="contained"
                      startIcon={<AddCircleIcon />}
                      onClick={addMembershipStudent}
                      disabled={
                        membershipLoading || membershipStudentPublicId === ""
                      }
                      sx={membershipAddButtonSx}
                    >
                      {membershipLoading ? "Dodawanie..." : "Dodaj"}
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Wybór ucznia od razu przygotuje go do dodania do tej grupy.
                  </Typography>
                </Stack>
              </FormSection>
            </Stack>
          </AppDialogBody>
        </AppDialog>
      </Container>
    </Box>
  );
}
