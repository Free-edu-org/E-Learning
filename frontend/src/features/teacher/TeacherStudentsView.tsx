import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  alpha,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material/styles";
import {
  AddCircleOutlined as AddIcon,
  ArrowBackOutlined as BackIcon,
  CheckOutlined as CheckIcon,
  CloseOutlined as CloseIcon,
  DragIndicatorOutlined as DragIcon,
  EditOutlined as EditIcon,
  EmailOutlined as EmailIcon,
  ExpandMoreOutlined as ExpandMoreIcon,
  GroupOutlined as GroupIcon,
  HourglassEmptyOutlined as PendingIcon,
  PersonOutlined as PersonIcon,
  PersonAddOutlined as PersonAddIcon,
  RefreshOutlined as RefreshIcon,
  SaveOutlined as SaveIcon,
  SearchOutlined as SearchIcon,
  SchoolOutlined as SchoolIcon,
  LockResetOutlined as LockResetIcon,
  SendOutlined as SendIcon,
  CancelOutlined as CancelIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import { authService } from "@/api/authService";
import {
  lessonService,
  type Group,
  type TeacherStudentResponse,
} from "@/api/lessonService";
import { userGroupService } from "@/api/userGroupService";
import { userService, type UserProfile } from "@/api/userService";
import { useAuth } from "@/context/AuthContext";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogStatus,
} from "@/components/ui/dialog/AppDialog";
import { FormActions, FormSection } from "@/components/ui/form/FormLayout";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  panelSurfaceSx,
  panelToolbarSx,
} from "@/components/ui/panel/panelStyles";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";
import {
  getApiErrorMessage,
  translateApiMessage,
} from "@/utils/dashboardUtils";
import { INPUT_LIMITS } from "@/utils/inputLimits";
import { GroupInvitationsSection } from "./GroupInvitationsSection";

type DialogFeedbackState = {
  severity: "success" | "error" | "warning" | "info";
  message: string;
};

const operationErrorMessages: Record<string, string> = {
  EMAIL_ALREADY_TAKEN: "Ten adres e-mail jest już zajęty.",
  USERNAME_ALREADY_TAKEN: "Ta nazwa użytkownika jest już zajęta.",
  USER_GROUP_NOT_FOUND: "Wybrana grupa nie istnieje.",
  INVALID_ROLE_FOR_GROUP:
    "Do grupy można przypisać tylko użytkownika z rolą ucznia.",
  GROUP_NAME_ALREADY_EXISTS: "Grupa o tej nazwie już istnieje.",
  STUDENT_ALREADY_IN_GROUP: "Uczeń jest już przypisany do grupy.",
};

const getOperationErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    const code = error.problem.code ?? error.problem.title;
    if (code && operationErrorMessages[code]) {
      return operationErrorMessages[code];
    }
    return getApiErrorMessage(error, fallback, {
      username: "Nazwa użytkownika",
      email: "E-mail",
      password: "Hasło",
      groupPublicId: "Grupa",
      name: "Nazwa",
      description: "Opis",
    });
  }
  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak połączenia z serwerem.";
  }
  return fallback;
};

const emptyStudentDraft = {
  email: "",
  emailConfirm: "",
  groupPublicId: "" as string | "",
};

const dialogFieldLabelSx = {
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "text.primary",
  letterSpacing: "0.01em",
};

type StudentFieldErrors = Partial<
  Record<"username" | keyof typeof emptyStudentDraft, string>
>;

const emptyGroupDraft = {
  name: "",
  description: "",
};

type GroupFieldErrors = Partial<Record<keyof typeof emptyGroupDraft, string>>;

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

const inviteBadgeSx = {
  fontWeight: 700,
  px: 0.5,
  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
  color: "primary.main",
  borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.16),
};

const standardFormDialogPaperSx: SxProps<Theme> = {
  width: {
    xs: "calc(100% - 24px)",
    sm: 700,
  },
};

const editDialogHeaderIconContainerSx = {
  borderRadius: "50%",
  width: 54,
  height: 54,
  boxShadow: (theme: Theme) =>
    `0 10px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
};

const modalRoleBadgeSx = {
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

const inlineEditAccentColor = "#6366F1";

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

const compactInlineActionsWrapSx = {
  display: "flex",
  flexDirection: "row",
  gap: 1,
  alignItems: "center",
  mt: 0.5,
  flexShrink: 0,
};

const compactInlineConfirmButtonSx = {
  ...inlineEditIconButtonSx,
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
  ...inlineEditIconButtonSx,
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

function parseStudentApiFieldErrors(error: ApiError): StudentFieldErrors {
  const detail = error.problem.detail ?? "";
  if (!detail.startsWith("Validation failed:")) {
    return {};
  }

  return detail
    .replace("Validation failed:", "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<StudentFieldErrors>((acc, part) => {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex === -1) {
        return acc;
      }

      const field = part
        .slice(0, separatorIndex)
        .trim() as keyof StudentFieldErrors;
      const validationDetail = part.slice(separatorIndex + 1).trim();
      if (field !== "username" && !(field in emptyStudentDraft)) {
        return acc;
      }

      acc[field] = translateApiMessage(validationDetail);
      return acc;
    }, {});
}

export function TeacherStudentsView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  const [students, setStudents] = useState<TeacherStudentResponse[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageFeedback, setPageFeedback] = useState<DialogFeedbackState | null>(
    null,
  );

  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [createStudentDraft, setCreateStudentDraft] =
    useState(emptyStudentDraft);
  const [createStudentLoading, setCreateStudentLoading] = useState(false);
  const [createStudentFeedback, setCreateStudentFeedback] =
    useState<DialogFeedbackState | null>(null);
  const [createStudentFieldErrors, setCreateStudentFieldErrors] =
    useState<StudentFieldErrors>({});

  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [editingStudent, seteditingStudent] =
    useState<TeacherStudentResponse | null>(null);

  const [editStudentDraft, setEditStudentDraft] = useState({
    username: "",
    email: "",
    emailConfirm: "",
    groupPublicId: "" as string | "",
  });
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [editStudentFeedback, setEditStudentFeedback] =
    useState<DialogFeedbackState | null>(null);
  const [editStudentFieldErrors, setEditStudentFieldErrors] =
    useState<StudentFieldErrors>({});
  const [editStudentEditingFields, setEditStudentEditingFields] = useState<
    string[]
  >([]);
  const [editStudentInlineSavingField, setEditStudentInlineSavingField] =
    useState<"username" | "email" | "group" | null>(null);

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createGroupDraft, setCreateGroupDraft] = useState(emptyGroupDraft);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [createGroupFeedback, setCreateGroupFeedback] =
    useState<DialogFeedbackState | null>(null);
  const [createGroupFieldErrors, setCreateGroupFieldErrors] =
    useState<GroupFieldErrors>({});
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupDraft, setEditGroupDraft] = useState(emptyGroupDraft);
  const [editGroupLoading, setEditGroupLoading] = useState(false);
  const [editGroupFeedback, setEditGroupFeedback] =
    useState<DialogFeedbackState | null>(null);
  const [editGroupFieldErrors, setEditGroupFieldErrors] =
    useState<GroupFieldErrors>({});
  const [editGroupEditingFields, setEditGroupEditingFields] = useState<
    string[]
  >([]);
  const [editGroupInlineSavingField, setEditGroupInlineSavingField] = useState<
    "name" | "description" | null
  >(null);

  const [draggingStudentPublicId, setDraggingStudentPublicId] = useState<
    string | null
  >(null);
  const [dragOverGroupPublicId, setDragOverGroupPublicId] = useState<
    string | null
  >(null);
  const [movingStudentPublicId, setMovingStudentPublicId] = useState<
    string | null
  >(null);
  const [expandedGroupPublicIds, setExpandedGroupPublicIds] = useState<
    Set<string>
  >(() => new Set());

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setErrorData(null);
    try {
      const [studentsData, groupsData] = await Promise.all([
        lessonService.getTeacherStudents(),
        lessonService.getTeacherGroups(),
      ]);
      setStudents(studentsData);
      setAvailableGroups(groupsData);
    } catch (error) {
      setErrorData(
        getOperationErrorMessage(error, "Nie udało się pobrać uczniów i grup."),
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch((error: unknown) => {
        setErrorUser(
          getOperationErrorMessage(
            error,
            "Nie udało się pobrać profilu nauczyciela.",
          ),
        );
      })
      .finally(() => setLoadingUser(false));

    fetchData();
  }, [fetchData]);

  const groupsWithStudents = useMemo(
    () =>
      availableGroups.map((group) => ({
        ...group,
        students: students.filter(
          (student) => student.groupPublicId === group.publicId,
        ),
      })),
    [availableGroups, students],
  );

  const filteredGroupsWithStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groupsWithStudents;

    return groupsWithStudents
      .map((group) => {
        const groupMatches = [group.name, group.description ?? ""].some(
          (value) => value.toLowerCase().includes(query),
        );
        const matchingStudents = group.students.filter((student) =>
          [student.username ?? "", student.email].some((value) =>
            value.toLowerCase().includes(query),
          ),
        );

        return {
          ...group,
          totalStudentCount: group.students.length,
          students: groupMatches ? group.students : matchingStudents,
          matchesSearch: groupMatches || matchingStudents.length > 0,
        };
      })
      .filter((group) => group.matchesSearch);
  }, [groupsWithStudents, searchQuery]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openCreateStudentDialog = () => {
    setCreateStudentDraft(emptyStudentDraft);
    setCreateStudentFieldErrors({});
    setCreateStudentFeedback(null);
    setCreateStudentOpen(true);
  };

  const closeCreateStudentDialog = () => {
    if (createStudentLoading) return;
    setCreateStudentOpen(false);
    setCreateStudentFieldErrors({});
  };

  const submitCreateStudent = async () => {
    if (createStudentLoading) return;
    const nextFieldErrors: StudentFieldErrors = {};

    if (!createStudentDraft.email.trim()) {
      nextFieldErrors.email = "Podaj adres e-mail ucznia.";
    }
    if (
      createStudentDraft.email.trim() !== createStudentDraft.emailConfirm.trim()
    ) {
      nextFieldErrors.emailConfirm = "Adresy e-mail nie są zgodne.";
    }
    if (createStudentDraft.groupPublicId === "") {
      nextFieldErrors.groupPublicId =
        "Wybierz grupę, do której przypisać ucznia.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setCreateStudentFieldErrors(nextFieldErrors);
      return;
    }

    setCreateStudentFieldErrors({});
    setCreateStudentFeedback(null);
    setCreateStudentLoading(true);
    try {
      await lessonService.createTeacherStudent({
        email: createStudentDraft.email.trim(),
        groupPublicId: createStudentDraft.groupPublicId,
      });
      setCreateStudentFeedback({
        severity: "success",
        message:
          "Zaproszenie wysłane. Uczeń aktywuje konto przez link w e-mailu.",
      });
      await fetchData();
      window.setTimeout(() => closeCreateStudentDialog(), 1500);
    } catch (error) {
      if (error instanceof ApiError) {
        const nextFieldErrors = parseStudentApiFieldErrors(error);
        if (Object.keys(nextFieldErrors).length > 0) {
          setCreateStudentFieldErrors(nextFieldErrors);
          return;
        }
      }

      setCreateStudentFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się zaprosić ucznia.",
        ),
      });
    } finally {
      setCreateStudentLoading(false);
    }
  };

  const openEditStudentDialog = (student: TeacherStudentResponse) => {
    seteditingStudent(student);
    setEditStudentDraft({
      username: student.username ?? "",
      email: student.email,
      emailConfirm: student.email,
      groupPublicId: student.groupPublicId,
    });
    setEditStudentFieldErrors({});
    setEditStudentFeedback(null);
    setEditStudentEditingFields([]);
    setEditStudentOpen(true);
  };

  const closeEditStudentDialog = () => {
    if (editStudentLoading) return;
    setEditStudentOpen(false);
    seteditingStudent(null);
    setEditStudentFieldErrors({});
  };

  const saveEditStudentInlineField = async (
    field: "username" | "email" | "group",
  ) => {
    if (editStudentLoading || !editingStudent) return;

    const nextFieldErrors: StudentFieldErrors = {};
    if (field === "username") {
      if (editStudentDraft.username.trim().length < 3) {
        nextFieldErrors.username = "Minimalna długość to 3 znaki.";
      }
    }
    if (field === "email") {
      if (!editStudentDraft.email.trim()) {
        nextFieldErrors.email = "Wypełnij adres e-mail.";
      }
      if (
        editStudentDraft.email.trim() !== editStudentDraft.emailConfirm.trim()
      ) {
        nextFieldErrors.emailConfirm = "Adresy e-mail nie są zgodne.";
      }
    }
    if (field === "group" && !editStudentDraft.groupPublicId) {
      nextFieldErrors.groupPublicId = "Wybierz docelową grupę.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setEditStudentFieldErrors((prev) => ({
        ...prev,
        ...nextFieldErrors,
      }));
      return;
    }

    setEditStudentFieldErrors((prev) => ({
      ...prev,
      username: field === "username" ? undefined : prev.username,
      email: field === "email" ? undefined : prev.email,
      emailConfirm: field === "email" ? undefined : prev.emailConfirm,
      groupPublicId: field === "group" ? undefined : prev.groupPublicId,
    }));
    setEditStudentFeedback(null);
    setEditStudentLoading(true);
    setEditStudentInlineSavingField(field);

    try {
      const payload = {
        username: editStudentDraft.username.trim(),
        email: editStudentDraft.email.trim(),
        groupPublicId: editStudentDraft.groupPublicId,
      };
      await lessonService.updateTeacherStudent(
        editingStudent.publicId,
        payload,
      );
      await fetchData();
      seteditingStudent((prev) =>
        prev
          ? {
              ...prev,
              username: payload.username,
              email: payload.email,
              groupPublicId: payload.groupPublicId,
            }
          : prev,
      );
      setEditStudentEditingFields((prev) =>
        prev.filter((current) => current !== field),
      );
      setEditStudentFeedback({
        severity: "success",
        message: "Zmiana została zapisana.",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const parsed = parseStudentApiFieldErrors(error);
        if (Object.keys(parsed).length > 0) {
          setEditStudentFieldErrors((prev) => ({ ...prev, ...parsed }));
          return;
        }
      }
      setEditStudentFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się zapisać zmian ucznia.",
        ),
      });
    } finally {
      setEditStudentInlineSavingField(null);
      setEditStudentLoading(false);
    }
  };

  const resetStudentPassword = async () => {
    if (!editingStudent || editStudentLoading) return;
    try {
      setEditStudentLoading(true);
      await authService.forgotPassword({ email: editingStudent.email });
      setEditStudentFeedback({
        severity: "success",
        message: "Link do resetu hasła został wysłany na adres e-mail ucznia.",
      });
    } catch (error) {
      setEditStudentFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się wysłać linku do resetu hasła.",
        ),
      });
    } finally {
      setEditStudentLoading(false);
    }
  };

  const openCreateGroupDialog = () => {
    setCreateGroupDraft(emptyGroupDraft);
    setCreateGroupFieldErrors({});
    setCreateGroupFeedback(null);
    setCreateGroupOpen(true);
  };

  const resendStudentInvite = async (student: TeacherStudentResponse) => {
    try {
      await lessonService.resendTeacherStudentInvite(student.publicId);
      setPageFeedback({
        severity: "success",
        message: `Zaproszenie ponownie wysłane na ${student.email}.`,
      });
    } catch (error) {
      setPageFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się wysłać zaproszenia.",
        ),
      });
    }
  };

  const [cancelInviteTarget, setCancelInviteTarget] =
    useState<TeacherStudentResponse | null>(null);
  const [cancelInviteLoading, setCancelInviteLoading] = useState(false);

  const cancelStudentInvitation = async () => {
    if (!cancelInviteTarget || cancelInviteLoading) return;
    setCancelInviteLoading(true);
    try {
      await lessonService.cancelTeacherStudentInvitation(
        cancelInviteTarget.publicId,
      );
      setCancelInviteTarget(null);
      setPageFeedback({
        severity: "success",
        message: `Zaproszenie dla ${cancelInviteTarget.email} zostało anulowane.`,
      });
      await fetchData();
    } catch (error) {
      setPageFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się anulować zaproszenia.",
        ),
      });
      setCancelInviteTarget(null);
    } finally {
      setCancelInviteLoading(false);
    }
  };

  const closeCreateGroupDialog = () => {
    if (createGroupLoading) return;
    setCreateGroupOpen(false);
    setCreateGroupFieldErrors({});
  };

  const submitCreateGroup = async () => {
    if (createGroupLoading) return;
    if (!createGroupDraft.name.trim()) {
      setCreateGroupFieldErrors({
        name: "Nazwa grupy jest wymagana.",
      });
      return;
    }

    if (!createGroupDraft.description.trim()) {
      setCreateGroupFieldErrors({
        description: "Opis grupy jest wymagany.",
      });
      return;
    }

    setCreateGroupFieldErrors({});
    setCreateGroupFeedback(null);
    setCreateGroupLoading(true);
    try {
      await userGroupService.createGroup({
        name: createGroupDraft.name.trim(),
        description: createGroupDraft.description.trim(),
      });
      setCreateGroupFeedback({
        severity: "success",
        message: "Grupa została utworzona.",
      });
      await fetchData();
      window.setTimeout(() => closeCreateGroupDialog(), 700);
    } catch (error) {
      if (error instanceof ApiError) {
        const nextFieldErrors = parseGroupApiFieldErrors(error);
        if (Object.keys(nextFieldErrors).length > 0) {
          setCreateGroupFieldErrors(nextFieldErrors);
          return;
        }
      }

      setCreateGroupFeedback({
        severity: "error",
        message: getOperationErrorMessage(error, "Nie udało się dodać grupy."),
      });
    } finally {
      setCreateGroupLoading(false);
    }
  };

  const openEditGroupDialog = (group: Group) => {
    setEditingGroup(group);
    setEditGroupDraft({
      name: group.name,
      description: group.description ?? "",
    });
    setEditGroupFieldErrors({});
    setEditGroupFeedback(null);
    setEditGroupEditingFields([]);
    setEditGroupOpen(true);
  };

  const closeEditGroupDialog = () => {
    if (editGroupLoading) return;
    setEditGroupOpen(false);
    setEditingGroup(null);
    setEditGroupFieldErrors({});
  };

  const saveEditGroupInlineField = async (field: "name" | "description") => {
    if (!editingGroup || editGroupLoading) return;

    if (field === "name" && !editGroupDraft.name.trim()) {
      setEditGroupFieldErrors((prev) => ({
        ...prev,
        name: "Podaj nazwę grupy.",
      }));
      return;
    }

    setEditGroupFieldErrors((prev) => ({
      ...prev,
      name: field === "name" ? undefined : prev.name,
      description: field === "description" ? undefined : prev.description,
    }));
    setEditGroupFeedback(null);
    setEditGroupLoading(true);
    setEditGroupInlineSavingField(field);

    try {
      const payload = {
        name: editGroupDraft.name.trim(),
        description: editGroupDraft.description.trim(),
      };
      await userGroupService.updateGroup(editingGroup.publicId, payload);
      await fetchData();
      setEditingGroup((prev) => (prev ? { ...prev, ...payload } : prev));
      setEditGroupEditingFields((prev) =>
        prev.filter((current) => current !== field),
      );
      setEditGroupFeedback({
        severity: "success",
        message: "Zmiana została zapisana.",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const parsed = parseGroupApiFieldErrors(error);
        if (Object.keys(parsed).length > 0) {
          setEditGroupFieldErrors((prev) => ({ ...prev, ...parsed }));
          return;
        }
      }
      setEditGroupFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się zapisać zmian grupy.",
        ),
      });
    } finally {
      setEditGroupInlineSavingField(null);
      setEditGroupLoading(false);
    }
  };

  const moveStudentToGroup = async (
    student: TeacherStudentResponse,
    targetGroupPublicId: string,
  ) => {
    if (
      student.groupPublicId === targetGroupPublicId ||
      movingStudentPublicId !== null
    ) {
      return;
    }

    const previousGroupPublicId = student.groupPublicId;
    setMovingStudentPublicId(student.publicId);
    setPageFeedback({
      severity: "info",
      message: "Przenoszenie ucznia do nowej grupy...",
    });
    setStudents((current) =>
      current.map((item) =>
        item.publicId === student.publicId
          ? { ...item, groupPublicId: targetGroupPublicId }
          : item,
      ),
    );

    try {
      await lessonService.updateTeacherStudent(student.publicId, {
        username: student.username ?? "",
        email: student.email,
        groupPublicId: targetGroupPublicId,
      });
      const targetGroup = availableGroups.find(
        (group) => group.publicId === targetGroupPublicId,
      );
      setPageFeedback({
        severity: "success",
        message: `Uczeń został przeniesiony do grupy ${targetGroup?.name ?? ""}.`,
      });
      await fetchData();
    } catch (error) {
      setStudents((current) =>
        current.map((item) =>
          item.publicId === student.publicId
            ? { ...item, groupPublicId: previousGroupPublicId }
            : item,
        ),
      );
      setPageFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się przenieść ucznia.",
        ),
      });
    } finally {
      setMovingStudentPublicId(null);
      setDraggingStudentPublicId(null);
      setDragOverGroupPublicId(null);
    }
  };

  const handleDrop = (event: DragEvent, targetGroupPublicId: string) => {
    event.preventDefault();
    const rawStudentPublicId = event.dataTransfer.getData("text/plain");
    const student = students.find(
      (item) => item.publicId === rawStudentPublicId,
    );
    if (student) {
      moveStudentToGroup(student, targetGroupPublicId);
    }
  };

  const toggleGroupExpanded = (groupPublicId: string) => {
    setExpandedGroupPublicIds((current) => {
      const next = new Set(current);
      if (next.has(groupPublicId)) {
        next.delete(groupPublicId);
      } else {
        next.add(groupPublicId);
      }
      return next;
    });
  };

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;
  const buttonSx = {
    px: 3,
    py: 1,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        <DashboardTopBar onLogout={handleLogout} />

        <DashboardHeader
          loading={loadingUser}
          username={user?.username}
          subtitle="Zarządzanie grupami i uczniami"
          fallbackName="Nauczycielu"
          user={user}
          onUserUpdated={setUser}
        />

        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/teacher")}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            mb: 2,
            mt: -1, // Subtle pull up to header
            color: "primary.main",
            "&:hover": {
              bgcolor: "transparent",
              color: "primary.dark",
            },
          }}
        >
          Wróć do panelu
        </Button>

        {errorUser && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            {errorUser}
          </Alert>
        )}
        {errorData && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {errorData}
          </Alert>
        )}
        {pageFeedback && (
          <Alert
            severity={pageFeedback.severity}
            onClose={() => setPageFeedback(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {pageFeedback.message}
          </Alert>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Klasy i uczniowie
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rozwiń grupę, aby zobaczyć uczniów. Przeciągnij ucznia na inną
              grupę, aby zmienić przypisanie.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <IconButton
              aria-label="Odśwież listę"
              onClick={fetchData}
              disabled={loadingData}
              sx={{
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
              }}
            >
              <RefreshIcon />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={openCreateGroupDialog}
              sx={{ ...buttonSx, bgcolor: "background.paper" }}
            >
              Dodaj grupę
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={openCreateStudentDialog}
              disabled={availableGroups.length === 0}
              sx={buttonSx}
            >
              Dodaj ucznia
            </Button>
          </Stack>
        </Stack>

        {!loadingData && availableGroups.length > 0 && (
          <Box sx={{ ...panelToolbarSx, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Szukaj grupy, ucznia lub e-maila"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
                minWidth: 220,
                flex: "1 1 260px",
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={600}
              sx={{ px: 0.5, whiteSpace: "nowrap" }}
            >
              {searchQuery.trim()
                ? `Wyniki: ${filteredGroupsWithStudents.length} z ${groupsWithStudents.length} | Liczba grup: ${groupsWithStudents.length}`
                : `Liczba grup: ${groupsWithStudents.length}`}
            </Typography>
          </Box>
        )}

        {loadingData ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        ) : availableGroups.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nie masz jeszcze grup. Utwórz pierwszą grupę, aby dodać uczniów.
          </Alert>
        ) : filteredGroupsWithStudents.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Brak grup lub uczniów pasujących do wyszukiwania.
          </Alert>
        ) : (
          <Stack spacing={1.25}>
            {filteredGroupsWithStudents.map((group) => {
              const isDropTarget = dragOverGroupPublicId === group.publicId;
              const isExpanded = expandedGroupPublicIds.has(group.publicId);
              const visibleStudentCount = group.students.length;
              const totalStudentCount =
                "totalStudentCount" in group
                  ? group.totalStudentCount
                  : group.students.length;
              const studentCountLabel =
                searchQuery.trim() && visibleStudentCount !== totalStudentCount
                  ? `${visibleStudentCount} z ${totalStudentCount} uczniów`
                  : `${totalStudentCount} uczniów`;
              return (
                <Box
                  key={group.publicId}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverGroupPublicId(group.publicId);
                  }}
                  onDragLeave={() => setDragOverGroupPublicId(null)}
                  onDrop={(event) => handleDrop(event, group.publicId)}
                  sx={{
                    ...panelSurfaceSx,
                    borderColor: isDropTarget ? "primary.main" : "divider",
                    bgcolor: isDropTarget ? "action.hover" : "background.paper",
                    overflow: "hidden",
                    transition:
                      "border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
                    boxShadow: isDropTarget
                      ? "0 14px 30px rgba(15, 23, 42, 0.12)"
                      : "none",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <ButtonBase
                      onClick={() => toggleGroupExpanded(group.publicId)}
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        p: 2,
                        textAlign: "left",
                        minHeight: 78,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ minWidth: 0, flex: 1 }}
                      >
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2,
                            bgcolor: "action.hover",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <GroupIcon color="primary" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body1"
                            fontWeight={800}
                            sx={{
                              overflowWrap: "anywhere",
                            }}
                          >
                            {group.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflowWrap: "anywhere",
                            }}
                          >
                            {group.description || "Brak opisu grupy."}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ flexShrink: 0 }}
                      >
                        <Chip
                          label={studentCountLabel}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                        <ExpandMoreIcon
                          sx={{
                            color: "text.secondary",
                            transition: "transform 150ms ease",
                            transform: isExpanded ? "rotate(180deg)" : "none",
                          }}
                        />
                      </Stack>
                    </ButtonBase>
                    <IconButton
                      size="small"
                      aria-label={`Edytuj grupę ${group.name}`}
                      onClick={() => openEditGroupDialog(group)}
                      sx={{ color: "text.secondary", mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Collapse in={isExpanded} timeout={180} unmountOnExit>
                    <Divider />

                    {group.students.length === 0 ? (
                      <Box sx={{ p: 2 }}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Brak uczniów w tej grupie.
                        </Alert>
                      </Box>
                    ) : (
                      <Stack divider={<Divider flexItem />}>
                        {group.students.map((student) => {
                          const isMoving =
                            movingStudentPublicId === student.publicId;
                          return (
                            <Box
                              key={student.publicId}
                              draggable={movingStudentPublicId === null}
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData(
                                  "text/plain",
                                  String(student.publicId),
                                );
                                setDraggingStudentPublicId(student.publicId);
                              }}
                              onDragEnd={() => {
                                setDraggingStudentPublicId(null);
                                setDragOverGroupPublicId(null);
                              }}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1.5,
                                px: 2,
                                py: 1.5,
                                minHeight: 72,
                                opacity:
                                  draggingStudentPublicId ===
                                    student.publicId || isMoving
                                    ? 0.55
                                    : 1,
                                cursor:
                                  movingStudentPublicId === null
                                    ? "grab"
                                    : "default",
                                "&:hover": { bgcolor: "action.hover" },
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1.25}
                                alignItems="center"
                                sx={{ minWidth: 0 }}
                              >
                                <DragIcon
                                  fontSize="small"
                                  sx={{ color: "text.disabled", flexShrink: 0 }}
                                />
                                <UserAvatar
                                  avatarUrl={student.avatarUrl}
                                  username={student.username ?? student.email}
                                  size={32}
                                  sx={{ flexShrink: 0 }}
                                />
                                <Box sx={{ minWidth: 0 }}>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Typography
                                      variant="body1"
                                      fontWeight={700}
                                      sx={{ overflowWrap: "anywhere" }}
                                    >
                                      {student.username ?? "(oczekuje)"}
                                    </Typography>
                                    {student.status === "INVITED" && (
                                      <Chip
                                        label="Zaproszony"
                                        size="small"
                                        icon={<PendingIcon />}
                                        color="warning"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: "0.65rem" }}
                                      />
                                    )}
                                    {student.status ===
                                      "EMAIL_VERIFICATION_PENDING" && (
                                      <Chip
                                        label="Czeka na email"
                                        size="small"
                                        icon={<PendingIcon />}
                                        color="info"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: "0.65rem" }}
                                      />
                                    )}
                                  </Stack>
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    sx={{ minWidth: 0 }}
                                  >
                                    <EmailIcon
                                      sx={{
                                        fontSize: 14,
                                        color: "text.secondary",
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ overflowWrap: "anywhere" }}
                                    >
                                      {student.email}
                                    </Typography>
                                  </Stack>
                                </Box>
                              </Stack>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ flexShrink: 0 }}
                              >
                                {isMoving && <CircularProgress size={18} />}
                                {student.status === "INVITED" && (
                                  <>
                                    <IconButton
                                      aria-label="Wyślij ponownie zaproszenie"
                                      size="small"
                                      color="warning"
                                      onClick={() =>
                                        resendStudentInvite(student)
                                      }
                                      disabled={isMoving}
                                      title="Wyślij ponownie zaproszenie"
                                    >
                                      <SendIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      aria-label="Anuluj zaproszenie"
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        setCancelInviteTarget(student)
                                      }
                                      disabled={isMoving}
                                      title="Anuluj zaproszenie i usuń konto"
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                                <IconButton
                                  aria-label="Profil ucznia"
                                  size="small"
                                  onClick={() =>
                                    navigate(
                                      `/teacher/students/${student.publicId}/progress`,
                                    )
                                  }
                                  disabled={isMoving}
                                >
                                  <PersonIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  aria-label="Edytuj ucznia"
                                  size="small"
                                  color="primary"
                                  onClick={() => openEditStudentDialog(student)}
                                  disabled={
                                    isMoving || student.status === "INVITED"
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}

                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <GroupInvitationsSection groupPublicId={group.publicId} />
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
        )}

        <AppDialog
          open={createStudentOpen}
          onClose={closeCreateStudentDialog}
          maxWidth="md"
          paperSx={standardFormDialogPaperSx}
        >
          <AppDialogHeader
            icon={<PersonAddIcon />}
            title="Zaproś ucznia"
            subtitle="Wyślij zaproszenie e-mail. Uczeń sam ustawi nazwę i hasło."
            badge={
              <Chip
                label="Uczeń"
                size="small"
                variant="outlined"
                sx={modalRoleBadgeSx}
              />
            }
          />
          <AppDialogBody sx={{ p: 3, bgcolor: "transparent" }}>
            {createStudentFeedback && (
              <AppDialogStatus severity={createStudentFeedback.severity}>
                {createStudentFeedback.message}
              </AppDialogStatus>
            )}
            <Stack spacing={2.25}>
              <FormSection
                title="Dane zaproszenia"
                description="Zaproszenie zostanie wysłane e-mailem. Uczeń sam dokończy aktywację konta po otwarciu linku."
              >
                <Box>
                  <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                    Adres e-mail
                  </Typography>
                  <TextField
                    name="teacher-create-student-email"
                    autoComplete="off"
                    type="email"
                    value={createStudentDraft.email}
                    onChange={(event) => {
                      setCreateStudentFieldErrors((current) => ({
                        ...current,
                        email: undefined,
                      }));
                      setCreateStudentDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }));
                    }}
                    error={Boolean(createStudentFieldErrors.email)}
                    helperText={
                      createStudentFieldErrors.email ??
                      "Na ten adres wyślemy jednorazowy link aktywacyjny."
                    }
                    fullWidth
                    disabled={createStudentLoading}
                    placeholder="np. uczen@szkola.pl"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                    Potwierdź adres e-mail
                  </Typography>
                  <TextField
                    name="teacher-create-student-email-confirm"
                    autoComplete="off"
                    type="email"
                    value={createStudentDraft.emailConfirm}
                    onChange={(event) => {
                      setCreateStudentFieldErrors((current) => ({
                        ...current,
                        emailConfirm: undefined,
                      }));
                      setCreateStudentDraft((draft) => ({
                        ...draft,
                        emailConfirm: event.target.value,
                      }));
                    }}
                    fullWidth
                    disabled={createStudentLoading}
                    placeholder="Wpisz ten sam adres jeszcze raz"
                    error={
                      Boolean(createStudentFieldErrors.emailConfirm) ||
                      (createStudentDraft.emailConfirm.length > 0 &&
                        createStudentDraft.email !==
                          createStudentDraft.emailConfirm)
                    }
                    helperText={
                      createStudentFieldErrors.emailConfirm ??
                      (createStudentDraft.emailConfirm.length > 0 &&
                      createStudentDraft.email !==
                        createStudentDraft.emailConfirm
                        ? "Adresy e-mail nie są zgodne"
                        : "Dzięki temu unikniesz wysłania zaproszenia na zły adres.")
                    }
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
              </FormSection>
              <FormSection
                title="Grupa ucznia"
                description="Możesz od razu przypisać ucznia do jednej z dostępnych grup lub zrobić to później."
              >
                <Box>
                  <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                    Wybierz grupę
                  </Typography>
                  <TextField
                    select
                    value={createStudentDraft.groupPublicId}
                    onChange={(event) => {
                      setCreateStudentFieldErrors((current) => ({
                        ...current,
                        groupPublicId: undefined,
                      }));
                      setCreateStudentDraft((draft) => ({
                        ...draft,
                        groupPublicId: event.target.value,
                      }));
                    }}
                    error={Boolean(createStudentFieldErrors.groupPublicId)}
                    helperText={
                      createStudentFieldErrors.groupPublicId ??
                      "To pole jest opcjonalne."
                    }
                    fullWidth
                    disabled={createStudentLoading}
                    SelectProps={{
                      displayEmpty: true,
                      IconComponent: ExpandMoreIcon,
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <GroupIcon sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  >
                    <MenuItem value="">Bez przypisanej grupy</MenuItem>
                    {availableGroups.map((group) => (
                      <MenuItem key={group.publicId} value={group.publicId}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </FormSection>
            </Stack>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeCreateStudentDialog}
                sx={{ ...buttonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                onClick={submitCreateStudent}
                disabled={createStudentLoading}
                startIcon={<SendIcon />}
                sx={buttonSx}
              >
                Wyślij zaproszenie
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <AppDialog
          open={editStudentOpen}
          onClose={closeEditStudentDialog}
          maxWidth="md"
          paperSx={{
            ...standardFormDialogPaperSx,
            width: { sm: 640 },
          }}
        >
          <AppDialogHeader
            icon={<EditIcon />}
            iconContainerSx={editDialogHeaderIconContainerSx}
            title="Edytuj ucznia"
            subtitle="Zmiana danych ucznia i przypisanej grupy."
            badge={
              <Chip
                label="Uczeń"
                size="small"
                variant="outlined"
                sx={modalRoleBadgeSx}
              />
            }
          />
          <AppDialogBody sx={{ p: 2.5, bgcolor: "transparent" }}>
            {editStudentFeedback && (
              <AppDialogStatus severity={editStudentFeedback.severity}>
                {editStudentFeedback.message}
              </AppDialogStatus>
            )}
            <Box
              sx={{
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
              }}
            >
              <Box
                sx={{
                  ...getInlineEditSectionSx(
                    editStudentEditingFields.includes("username"),
                  ),
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                }}
              >
                {editStudentEditingFields.includes("username") ? (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Edycja nazwy użytkownika
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <TextField
                        name="teacher-edit-student-username"
                        autoComplete="off"
                        value={editStudentDraft.username}
                        onChange={(event) => {
                          setEditStudentFieldErrors((current) => ({
                            ...current,
                            username: undefined,
                          }));
                          setEditStudentDraft((draft) => ({
                            ...draft,
                            username: event.target.value.slice(
                              0,
                              INPUT_LIMITS.username,
                            ),
                          }));
                        }}
                        inputProps={{ maxLength: INPUT_LIMITS.username }}
                        error={Boolean(editStudentFieldErrors.username)}
                        helperText={
                          editStudentFieldErrors.username ??
                          `${editStudentDraft.username.length}/${INPUT_LIMITS.username}`
                        }
                        sx={counterFieldSx}
                        fullWidth
                        size="small"
                        autoFocus
                        disabled={editStudentLoading}
                      />
                      <Box sx={{ ...compactInlineActionsWrapSx, mt: 0 }}>
                        <IconButton
                          size="small"
                          disabled={
                            editStudentLoading ||
                            editStudentDraft.username.trim().length < 3 ||
                            editStudentInlineSavingField === "username"
                          }
                          onClick={() =>
                            void saveEditStudentInlineField("username")
                          }
                          sx={compactInlineConfirmButtonSx}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={editStudentLoading}
                          onClick={() => {
                            setEditStudentDraft((draft) => ({
                              ...draft,
                              username: editingStudent?.username ?? "",
                            }));
                            setEditStudentEditingFields((prev) =>
                              prev.filter((f) => f !== "username"),
                            );
                          }}
                          sx={compactInlineCancelButtonSx}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Nazwa użytkownika
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {editStudentDraft.username || "—"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() =>
                        setEditStudentEditingFields((prev) => [
                          ...prev,
                          "username",
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
                    editStudentEditingFields.includes("email"),
                  ),
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                }}
              >
                {editStudentEditingFields.includes("email") ? (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Edycja adresu e-mail
                    </Typography>
                    <Stack spacing={1}>
                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center" }}
                      >
                        <TextField
                          value={editStudentDraft.email}
                          onChange={(event) => {
                            setEditStudentFieldErrors((current) => ({
                              ...current,
                              email: undefined,
                            }));
                            setEditStudentDraft((draft) => ({
                              ...draft,
                              email: event.target.value,
                            }));
                          }}
                          error={Boolean(editStudentFieldErrors.email)}
                          helperText={editStudentFieldErrors.email}
                          fullWidth
                          size="small"
                          autoFocus
                          disabled={editStudentLoading}
                        />
                        <Box sx={compactInlineActionsWrapSx}>
                          <IconButton
                            size="small"
                            disabled={
                              editStudentLoading ||
                              editStudentInlineSavingField === "email"
                            }
                            onClick={() =>
                              void saveEditStudentInlineField("email")
                            }
                            sx={compactInlineConfirmButtonSx}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={editStudentLoading}
                            onClick={() => {
                              setEditStudentDraft((draft) => ({
                                ...draft,
                                email: editingStudent?.email ?? "",
                                emailConfirm: editingStudent?.email ?? "",
                              }));
                              setEditStudentEditingFields((prev) =>
                                prev.filter((f) => f !== "email"),
                              );
                            }}
                            sx={compactInlineCancelButtonSx}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography sx={{ ...dialogFieldLabelSx, mb: 0.25 }}>
                        Potwierdź adres e-mail
                      </Typography>
                      <TextField
                        value={editStudentDraft.emailConfirm}
                        onChange={(event) => {
                          setEditStudentFieldErrors((current) => ({
                            ...current,
                            emailConfirm: undefined,
                          }));
                          setEditStudentDraft((draft) => ({
                            ...draft,
                            emailConfirm: event.target.value,
                          }));
                        }}
                        fullWidth
                        size="small"
                        disabled={editStudentLoading}
                        error={
                          Boolean(editStudentFieldErrors.emailConfirm) ||
                          (editStudentDraft.emailConfirm.length > 0 &&
                            editStudentDraft.email !==
                              editStudentDraft.emailConfirm)
                        }
                        helperText={
                          editStudentFieldErrors.emailConfirm ??
                          (editStudentDraft.emailConfirm.length > 0 &&
                          editStudentDraft.email !==
                            editStudentDraft.emailConfirm
                            ? "Adresy e-mail nie są zgodne"
                            : "")
                        }
                        placeholder="Powtórz e-mail"
                      />
                    </Stack>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Adres e-mail
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {editStudentDraft.email || "—"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() =>
                        setEditStudentEditingFields((prev) => [
                          ...prev,
                          "email",
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
                  editStudentEditingFields.includes("group"),
                )}
              >
                {editStudentEditingFields.includes("group") ? (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Edycja przypisanej grupy
                    </Typography>
                    <Box
                      sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
                    >
                      <TextField
                        select
                        value={editStudentDraft.groupPublicId}
                        onChange={(event) => {
                          setEditStudentFieldErrors((current) => ({
                            ...current,
                            groupPublicId: undefined,
                          }));
                          setEditStudentDraft((draft) => ({
                            ...draft,
                            groupPublicId: event.target.value,
                          }));
                        }}
                        error={Boolean(editStudentFieldErrors.groupPublicId)}
                        helperText={editStudentFieldErrors.groupPublicId}
                        fullWidth
                        size="small"
                        disabled={editStudentLoading}
                      >
                        {availableGroups.map((group) => (
                          <MenuItem key={group.publicId} value={group.publicId}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Box sx={compactInlineActionsWrapSx}>
                        <IconButton
                          size="small"
                          disabled={
                            editStudentLoading ||
                            !editStudentDraft.groupPublicId ||
                            editStudentInlineSavingField === "group"
                          }
                          onClick={() =>
                            void saveEditStudentInlineField("group")
                          }
                          sx={compactInlineConfirmButtonSx}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={editStudentLoading}
                          onClick={() => {
                            setEditStudentDraft((draft) => ({
                              ...draft,
                              groupPublicId:
                                editingStudent?.groupPublicId ?? "",
                            }));
                            setEditStudentEditingFields((prev) =>
                              prev.filter((f) => f !== "group"),
                            );
                          }}
                          sx={compactInlineCancelButtonSx}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Przypisana grupa
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {availableGroups.find(
                          (g) => g.publicId === editStudentDraft.groupPublicId,
                        )?.name ?? "—"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() =>
                        setEditStudentEditingFields((prev) => [
                          ...prev,
                          "group",
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

            <Box
              sx={{
                p: 2.25,
                bgcolor: "rgba(99, 102, 241, 0.04)",
                display: "flex",
                alignItems: "center",
                gap: 2.5,
                transition: "all 0.2s ease",
                mt:
                  editStudentEditingFields.includes("email") ||
                  editStudentEditingFields.includes("group")
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
                <LockResetIcon fontSize="small" />
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
                startIcon={<EmailIcon fontSize="small" />}
                onClick={resetStudentPassword}
                disabled={editStudentLoading}
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
                  borderColor: alpha("#6366F1", 0.2),
                  color: "#6366F1",
                  bgcolor: "transparent",
                  "&:hover": {
                    borderColor: alpha("#6366F1", 0.4),
                    bgcolor: alpha("#6366F1", 0.04),
                  },
                }}
              >
                {editStudentLoading ? "Wysyłanie..." : "Wyślij link"}
              </Button>
            </Box>
          </AppDialogBody>
        </AppDialog>

        <AppDialog
          open={editGroupOpen}
          onClose={closeEditGroupDialog}
          maxWidth="md"
          paperSx={{
            ...standardFormDialogPaperSx,
            width: { sm: 640 },
          }}
        >
          <AppDialogHeader
            icon={<EditIcon />}
            iconContainerSx={editDialogHeaderIconContainerSx}
            title="Edytuj grupę"
            subtitle="Zmiana nazwy grupy i jej opisu."
            badge={
              <Chip
                label="Grupa"
                size="small"
                variant="outlined"
                sx={modalRoleBadgeSx}
              />
            }
          />
          <AppDialogBody sx={{ p: 2.5, bgcolor: "transparent" }}>
            {editGroupFeedback && (
              <AppDialogStatus severity={editGroupFeedback.severity}>
                {editGroupFeedback.message}
              </AppDialogStatus>
            )}
            <Box
              sx={{
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
              }}
            >
              <Box
                sx={{
                  ...getInlineEditSectionSx(
                    editGroupEditingFields.includes("name"),
                  ),
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                }}
              >
                {editGroupEditingFields.includes("name") ? (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Edycja nazwy grupy
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <TextField
                        value={editGroupDraft.name}
                        onChange={(event) => {
                          setEditGroupFieldErrors((current) => ({
                            ...current,
                            name: undefined,
                          }));
                          setEditGroupDraft((draft) => ({
                            ...draft,
                            name: event.target.value.slice(
                              0,
                              INPUT_LIMITS.groupName,
                            ),
                          }));
                        }}
                        inputProps={{ maxLength: INPUT_LIMITS.groupName }}
                        error={Boolean(editGroupFieldErrors.name)}
                        helperText={
                          editGroupFieldErrors.name ??
                          `${editGroupDraft.name.length}/${INPUT_LIMITS.groupName}`
                        }
                        sx={counterFieldSx}
                        fullWidth
                        size="small"
                        autoFocus
                        disabled={editGroupLoading}
                      />
                      <Box sx={compactInlineActionsWrapSx}>
                        <IconButton
                          size="small"
                          disabled={
                            editGroupLoading ||
                            editGroupDraft.name.trim().length < 1 ||
                            editGroupInlineSavingField === "name"
                          }
                          onClick={() => void saveEditGroupInlineField("name")}
                          sx={compactInlineConfirmButtonSx}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={editGroupLoading}
                          onClick={() => {
                            setEditGroupDraft((draft) => ({
                              ...draft,
                              name: editingGroup?.name ?? "",
                            }));
                            setEditGroupEditingFields((prev) =>
                              prev.filter((f) => f !== "name"),
                            );
                          }}
                          sx={compactInlineCancelButtonSx}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Nazwa grupy
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {editGroupDraft.name || "—"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() =>
                        setEditGroupEditingFields((prev) => [...prev, "name"])
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
                  editGroupEditingFields.includes("description"),
                )}
              >
                {editGroupEditingFields.includes("description") ? (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Edycja opisu grupy
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <TextField
                        value={editGroupDraft.description}
                        onChange={(event) => {
                          setEditGroupFieldErrors((current) => ({
                            ...current,
                            description: undefined,
                          }));
                          setEditGroupDraft((draft) => ({
                            ...draft,
                            description: event.target.value.slice(
                              0,
                              INPUT_LIMITS.groupDescription,
                            ),
                          }));
                        }}
                        inputProps={{
                          maxLength: INPUT_LIMITS.groupDescription,
                        }}
                        error={Boolean(editGroupFieldErrors.description)}
                        helperText={
                          editGroupFieldErrors.description ??
                          `${editGroupDraft.description.length}/${INPUT_LIMITS.groupDescription}`
                        }
                        sx={counterFieldSx}
                        fullWidth
                        size="small"
                        minRows={3}
                        multiline
                        autoFocus
                        disabled={editGroupLoading}
                      />
                      <Box sx={compactInlineActionsWrapSx}>
                        <IconButton
                          size="small"
                          disabled={
                            editGroupLoading ||
                            editGroupInlineSavingField === "description"
                          }
                          onClick={() =>
                            void saveEditGroupInlineField("description")
                          }
                          sx={compactInlineConfirmButtonSx}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={editGroupLoading}
                          onClick={() => {
                            setEditGroupDraft((draft) => ({
                              ...draft,
                              description: editingGroup?.description ?? "",
                            }));
                            setEditGroupEditingFields((prev) =>
                              prev.filter((f) => f !== "description"),
                            );
                          }}
                          sx={compactInlineCancelButtonSx}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Opis grupy
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                      >
                        {editGroupDraft.description || "Brak opisu"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() =>
                        setEditGroupEditingFields((prev) => [
                          ...prev,
                          "description",
                        ])
                      }
                      sx={{ ...inlineChangeButtonSx, ml: 1 }}
                    >
                      Zmień
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </AppDialogBody>
        </AppDialog>

        <AppDialog
          open={createGroupOpen}
          onClose={closeCreateGroupDialog}
          maxWidth="md"
          paperSx={standardFormDialogPaperSx}
        >
          <AppDialogHeader
            icon={<SchoolIcon />}
            title="Dodaj grupę"
            subtitle="Utworzenie klasy widocznej w panelu nauczyciela."
            badge={
              <Chip
                label="Grupa"
                size="small"
                variant="outlined"
                sx={modalRoleBadgeSx}
              />
            }
          />
          <AppDialogBody sx={{ p: 3, bgcolor: "transparent" }}>
            {createGroupFeedback && (
              <AppDialogStatus severity={createGroupFeedback.severity}>
                {createGroupFeedback.message}
              </AppDialogStatus>
            )}
            <FormSection
              title="Dane grupy"
              description="Utwórz nową grupę i dodaj krótki opis."
            >
              <Stack spacing={1.25}>
                <Box>
                  <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                    Nazwa grupy
                  </Typography>
                  <TextField
                    value={createGroupDraft.name}
                    onChange={(event) => {
                      setCreateGroupFieldErrors((current) => ({
                        ...current,
                        name: undefined,
                      }));
                      setCreateGroupDraft((draft) => ({
                        ...draft,
                        name: event.target.value.slice(
                          0,
                          INPUT_LIMITS.groupName,
                        ),
                      }));
                    }}
                    inputProps={{ maxLength: INPUT_LIMITS.groupName }}
                    error={Boolean(createGroupFieldErrors.name)}
                    helperText={
                      createGroupFieldErrors.name ?? (
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
                            Krótka, konkretna nazwa ułatwi szybkie odnalezienie
                            grupy.
                          </Box>
                          {createGroupDraft.name.length > 0 && (
                            <Box
                              component="span"
                              sx={{
                                color: "text.secondary",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {createGroupDraft.name.length}/
                              {INPUT_LIMITS.groupName}
                            </Box>
                          )}
                        </Box>
                      )
                    }
                    sx={counterFieldSx}
                    fullWidth
                    size="small"
                    disabled={createGroupLoading}
                    placeholder="Wprowadź nazwę grupy"
                  />
                </Box>
                <Box>
                  <Typography sx={{ ...dialogFieldLabelSx, mb: 1 }}>
                    Opis grupy
                  </Typography>
                  <TextField
                    value={createGroupDraft.description}
                    onChange={(event) => {
                      setCreateGroupFieldErrors((current) => ({
                        ...current,
                        description: undefined,
                      }));
                      setCreateGroupDraft((draft) => ({
                        ...draft,
                        description: event.target.value.slice(
                          0,
                          INPUT_LIMITS.groupDescription,
                        ),
                      }));
                    }}
                    inputProps={{ maxLength: INPUT_LIMITS.groupDescription }}
                    error={Boolean(createGroupFieldErrors.description)}
                    helperText={
                      createGroupFieldErrors.description ?? (
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
                          {createGroupDraft.description.length > 0 && (
                            <Box
                              component="span"
                              sx={{
                                color: "text.secondary",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {createGroupDraft.description.length}/
                              {INPUT_LIMITS.groupDescription}
                            </Box>
                          )}
                        </Box>
                      )
                    }
                    sx={counterFieldSx}
                    fullWidth
                    size="small"
                    minRows={3}
                    multiline
                    disabled={createGroupLoading}
                    placeholder="Wprowadź opis grupy"
                  />
                </Box>
              </Stack>
            </FormSection>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                variant="contained"
                onClick={submitCreateGroup}
                disabled={createGroupLoading}
                startIcon={<SaveIcon />}
                sx={buttonSx}
              >
                Utwórz grupę
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <AppDialog
          open={cancelInviteTarget !== null}
          onClose={() => {
            if (!cancelInviteLoading) setCancelInviteTarget(null);
          }}
          maxWidth="xs"
          paperSx={{ width: { xs: "calc(100% - 24px)", sm: 440 } }}
        >
          <AppDialogHeader
            icon={<CancelIcon />}
            title="Anuluj zaproszenie"
            subtitle={`Konto ${cancelInviteTarget?.email ?? ""} zostanie trwale usunięte, a link aktywacyjny straci ważność.`}
          />
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={() => setCancelInviteTarget(null)}
                disabled={cancelInviteLoading}
                sx={{ ...buttonSx, color: "text.secondary" }}
              >
                Wróć
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={cancelStudentInvitation}
                disabled={cancelInviteLoading}
                startIcon={<CancelIcon />}
                sx={buttonSx}
              >
                Anuluj zaproszenie
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>
      </Container>
    </Box>
  );
}
