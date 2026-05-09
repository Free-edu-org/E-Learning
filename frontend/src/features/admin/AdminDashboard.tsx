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
  AutoAwesomeOutlined as SparklesIcon,
  CheckOutlined as CheckIcon,
  CloseOutlined as CloseIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  GroupOutlined as GroupIcon,
  ListOutlined as ListIcon,
  LockResetOutlined as LockResetIcon,
  PeopleOutline as PeopleIcon,
  PersonOutline as PersonIcon,
  RefreshOutlined as RefreshIcon,
  SaveOutlined as SaveIcon,
  SchoolOutlined as SchoolIcon,
  SearchOutlined as SearchIcon,
  GridViewOutlined as GridIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  adminService,
  type AdminCreateStudentRequest,
  type AdminStudentProfile,
  type AdminStats,
  type AdminUpdateStudentRequest,
} from "@/api/adminService";
import { authService } from "@/api/authService";
import { ApiError } from "@/api/apiClient";
import { StatsCard } from "@/components/teacher/StatsCard";
import { userGroupService, type UserGroup } from "@/api/userGroupService";
import {
  userService,
  type CreateUserRequest,
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
  getRoleAccountLabel,
  getRoleChipColor,
  getRoleLabel,
} from "@/components/ui/chips/roleLabels";
import {
  FormActions,
  FormField,
  FormSection,
} from "@/components/ui/form/FormLayout";
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
  panelSurfaceActionSx,
  panelSurfaceSx,
  panelToolbarSx,
  panelTitleSx,
  panelTwoLinesSx,
} from "@/components/ui/panel/panelStyles";
import { useAuth } from "@/context/AuthContext";
import { uiTokens } from "@/theme/uiTokens";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";
import { getApiErrorMessage } from "@/utils/dashboardUtils";
import { INPUT_LIMITS } from "@/utils/inputLimits";

type UserRole = "TEACHER" | "STUDENT";
type UserFilter = "ALL" | UserRole;
type AdminTab = "users" | "groups";
type AdminListUser = UserProfile | AdminStudentProfile;
type AdminViewMode = "grid" | "list";

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
}

interface MembershipDialogState {
  groupPublicId: string;
  groupName: string;
  teacherPublicId?: string | null;
}

interface DialogFeedbackState {
  severity: "success" | "error";
  message: string;
}

const counterHelperSx = { ml: "14px", fontSize: "0.7rem", opacity: 0.65, mt: 0.75 } as const;
const counterFieldSx = { "& .MuiFormHelperText-root": counterHelperSx } as const;

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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error, fallback, validationFieldLabels);
  }
  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak połączenia z serwerem.";
  }
  return fallback;
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
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    minHeight: 40,
  },
};

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
  const [userDialogEditingFields, setUserDialogEditingFields] = useState<
    string[]
  >([]);
  const [userDialogConfirmEmail, setUserDialogConfirmEmail] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupDialogMode, setGroupDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(emptyGroupDraft);
  const [groupDialogLoading, setGroupDialogLoading] = useState(false);
  const [groupDialogFeedback, setGroupDialogFeedback] =
    useState<DialogFeedbackState | null>(null);
  const [groupDialogEditingFields, setGroupDialogEditingFields] = useState<
    string[]
  >([]);

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
        user.username.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        String(user.publicId).includes(normalizedQuery)
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
        group.description.toLowerCase().includes(normalizedQuery) ||
        group.publicId.toLowerCase().includes(normalizedQuery)
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
    panelSurfaceActionSx,
    { flex: 1, minWidth: 210 },
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
    setUserDialogFeedback(null);
    setUserDialogOpen(true);
  };

  const resetUserDialogState = () => {
    setSelectedUser(null);
    setUserDraft(emptyUserDraft);
    setUserDialogRole("TEACHER");
    setUserDialogMode("create");
    setUserDialogFeedback(null);
    setUserDialogEditingFields([]);
    setUserDialogConfirmEmail("");
    setResetPasswordLoading(false);
    setResetPasswordSuccess(false);
  };

  const closeUserDialog = () => {
    if (userDialogLoading) {
      return;
    }
    setUserDialogOpen(false);
  };

  const submitUserDialog = async () => {
    if (userDialogLoading) {
      return;
    }

    setUserDialogFeedback(null);
    setUserDialogLoading(true);
    try {
      if (userDialogMode === "create") {
        const tempPassword =
          crypto.randomUUID().replace(/-/g, "") +
          crypto.randomUUID().replace(/-/g, "");
        if (userDialogRole === "TEACHER") {
          const payload: CreateUserRequest = {
            username: userDraft.username,
            email: userDraft.email,
            password: tempPassword,
          };
          await userService.createTeacher(payload);
          await authService.forgotPassword({ email: userDraft.email }).catch(
            () => {},
          );
          setUserDialogFeedback({
            severity: "success",
            message:
              "Nauczyciel został utworzony. Link do ustawienia hasła został wysłany na podany adres e-mail.",
          });
        } else {
          const payload: AdminCreateStudentRequest = {
            username: userDraft.username,
            email: userDraft.email,
            password: tempPassword,
            groupPublicId:
              userDraft.groupPublicId === "" ? null : userDraft.groupPublicId,
          };

          await adminService.createStudent(payload);
          await authService.forgotPassword({ email: userDraft.email }).catch(
            () => {},
          );
          setUserDialogFeedback({
            severity: "success",
            message:
              "Uczeń został utworzony. Link do ustawienia hasła został wysłany na podany adres e-mail.",
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
    setGroupDraft({
      ...emptyGroupDraft,
      teacherPublicId: teachers.length === 1 ? teachers[0].publicId : "",
    });
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
    setGroupDialogFeedback(null);
    setGroupDialogEditingFields([]);
    setGroupDialogOpen(true);
  };

  const closeGroupDialog = () => {
    if (groupDialogLoading) {
      return;
    }
    setGroupDialogOpen(false);
    setSelectedGroup(null);
    setGroupDraft(emptyGroupDraft);
    setGroupDialogFeedback(null);
    setGroupDialogEditingFields([]);
  };

  const submitGroupDialog = async () => {
    if (groupDialogLoading) {
      return;
    }

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
      setGroupDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zapisać zmian grupy."),
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

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

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
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", justifyContent: "center" }}>
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

        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          <Paper
            elevation={0}
            onClick={() => openCreateUserDialog("TEACHER")}
            sx={quickActionTileSx}
          >
            <Box sx={{ color: "info.main", mb: 0.5 }}>
              <SchoolIcon sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="body1" fontWeight={700} align="center">
              Nowy nauczyciel
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center">
              Dodaj konto i od razu nadaj dostęp
            </Typography>
          </Paper>
          <Paper
            elevation={0}
            onClick={() => openCreateUserDialog("STUDENT")}
            sx={quickActionTileSx}
          >
            <Box sx={{ color: "success.main", mb: 0.5 }}>
              <PersonIcon sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="body1" fontWeight={700} align="center">
              Nowy uczeń
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center">
              Utwórz konto ucznia i przypisz grupę
            </Typography>
          </Paper>
          <Paper
            elevation={0}
            onClick={openCreateGroupDialog}
            sx={quickActionTileSx}
          >
            <Box sx={{ color: "warning.main", mb: 0.5 }}>
              <GroupIcon sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="body1" fontWeight={700} align="center">
              Nowa grupa
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center">
              Zbuduj grupę i ustaw właściciela
            </Typography>
          </Paper>
          <Paper
            elevation={0}
            onClick={() => navigate("/admin/achievements")}
            sx={quickActionTileSx}
          >
            <Box sx={{ color: "warning.main", mb: 0.5 }}>
              <SparklesIcon sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="body1" fontWeight={700} align="center">
              Achievementy
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center">
              Zarządzaj listą achievementów i ich aktywnością
            </Typography>
          </Paper>
        </Box>

        <Card elevation={0} sx={panelSurfaceSx}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Tabs
              value={activeTab}
              onChange={(_, value: AdminTab) => setActiveTab(value)}
              sx={{ mb: 3 }}
            >
              <Tab
                value="users"
                icon={<PeopleIcon fontSize="small" />}
                iconPosition="start"
                label="Użytkownicy"
              />
              <Tab
                value="groups"
                icon={<GroupIcon fontSize="small" />}
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
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={800}>
                      Konta nauczycieli i uczniów
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Filtruj listę, wyszukuj po nazwie lub emailu i otwieraj
                      edycje w modalach.
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
                    sx={{ flexShrink: 0, alignSelf: "center" }}
                  >
                    <ToggleButton
                      value="ALL"
                      sx={{
                        textTransform: "none",
                        px: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      Wszyscy
                    </ToggleButton>
                    <ToggleButton
                      value="TEACHER"
                      sx={{ textTransform: "none", px: 1.5, borderRadius: 2 }}
                    >
                      Nauczyciele
                    </ToggleButton>
                    <ToggleButton
                      value="STUDENT"
                      sx={{ textTransform: "none", px: 1.5, borderRadius: 2 }}
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
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
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
                    sx={{ flexShrink: 0 }}
                  >
                    <ToggleButton
                      value="grid"
                      aria-label="Widok siatki"
                      sx={{ borderRadius: "8px !important" }}
                    >
                      <GridIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="list" aria-label="Widok listy">
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
                                username={user.username}
                                size={20}
                              />
                              <Typography
                                variant="body1"
                                fontWeight={700}
                                color="primary.main"
                                sx={{ overflowWrap: "anywhere" }}
                              >
                                {user.username}
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
                              <Chip
                                label={getRoleAccountLabel(
                                  user.role as UserRole,
                                )}
                                size="small"
                                variant="outlined"
                                sx={outlinedMetaChipSx}
                              />
                            </Stack>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ overflowWrap: "anywhere" }}
                            >
                              {user.email}
                            </Typography>
                            {user.role === "STUDENT" && (
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1.25}
                                flexWrap="wrap"
                                useFlexGap
                              >
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
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Utworzono {formatDate(user.createdAt)}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>

                          <Box sx={panelInlineActionsSx}>
                            <Button
                              size="small"
                              startIcon={<EditIcon fontSize="small" />}
                              onClick={() => openEditUserDialog(user)}
                              sx={panelFooterButtonSx}
                            >
                              Edytuj
                            </Button>
                            <Button
                              size="small"
                              startIcon={<DeleteIcon fontSize="small" />}
                              onClick={() =>
                                openDeleteDialog({
                                  type: "user",
                                  publicId: user.publicId,
                                  label: user.username,
                                  detail:
                                    user.role === "STUDENT" &&
                                    "groupName" in user &&
                                    user.groupName
                                      ? `Uczeń w grupie ${user.groupName}`
                                      : user.email,
                                })
                              }
                              sx={panelDeleteButtonSx}
                            >
                              Usuń
                            </Button>
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
                        <Card
                          elevation={0}
                          sx={{
                            ...panelGridCardSx,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <CardContent
                            sx={{
                              ...panelGridCardContentSx,
                              flex: "1 1 auto",
                              height: "auto",
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
                                  <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                  >
                                    <UserAvatar
                                      avatarUrl={user.avatarUrl}
                                      username={user.username}
                                      size={28}
                                    />
                                    <Typography
                                      variant="body1"
                                      fontWeight={700}
                                      color="primary.main"
                                      sx={panelTitleSx}
                                    >
                                      {user.username}
                                    </Typography>
                                  </Stack>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={panelSingleLineSx}
                                  >
                                    {user.email}
                                  </Typography>
                                </Box>
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
                                  sx={{ flexShrink: 0 }}
                                />
                              </Stack>

                              <Box sx={{ minHeight: 28 }}>
                                {user.role === "STUDENT" ? (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={panelSingleLineSx}
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
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={panelSingleLineSx}
                                  >
                                    {getRoleAccountLabel(user.role as UserRole)}
                                  </Typography>
                                )}
                              </Box>

                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                              >
                                <Chip
                                  label={`Utworzono ${formatDate(user.createdAt)}`}
                                  size="small"
                                  variant="outlined"
                                  sx={outlinedMetaChipSx}
                                />
                              </Stack>
                            </Stack>
                          </CardContent>
                          <Box
                            sx={{
                              mx: 2,
                              borderTop: "1px solid",
                              borderColor: (theme) =>
                                alpha(
                                  theme.palette.divider,
                                  theme.palette.mode === "dark" ? 0.1 : 0.15,
                                ),
                            }}
                          />
                          <CardActions
                            sx={{
                              ...panelCardFooterSx,
                              px: 1.75,
                              pb: 1.5,
                              mt: 0,
                              pt: 1,
                              borderTop: "none",
                            }}
                          >
                            <Box
                              sx={{
                                ...panelFooterButtonsSx,
                                flexWrap: "nowrap",
                              }}
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon fontSize="small" />}
                                fullWidth
                                onClick={() => openEditUserDialog(user)}
                                sx={panelFooterButtonSx}
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
                                    type: "user",
                                    publicId: user.publicId,
                                    label: user.username,
                                    detail:
                                      user.role === "STUDENT" &&
                                      "groupName" in user &&
                                      user.groupName
                                        ? `Uczeń w grupie ${user.groupName}`
                                        : user.email,
                                  })
                                }
                                sx={panelDeleteButtonSx}
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
            ) : (
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                >
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={800}>
                      Grupy i skład uczniów
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Twórz grupy, edytuj je i zarządzaj członkami przez
                      dedykowane okna akcji.
                    </Typography>
                  </Stack>

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
                    placeholder="Filtruj grupy po nazwie, opisie lub ID"
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
                    sx={{ flexShrink: 0 }}
                  >
                    <ToggleButton
                      value="grid"
                      aria-label="Widok siatki"
                      sx={{ borderRadius: "8px !important" }}
                    >
                      <GridIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="list" aria-label="Widok listy">
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
                                icon={<GroupIcon />}
                                label={`${group.studentCount} uczniów`}
                                color="warning"
                                size="small"
                              />
                              <Chip
                                label="Karta grupy"
                                size="small"
                                variant="outlined"
                                sx={outlinedMetaChipSx}
                              />
                            </Stack>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ overflowWrap: "anywhere" }}
                            >
                              {group.description || "Brak opisu grupy."}
                            </Typography>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1.25}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Właściciel:{" "}
                                <Stack
                                  direction="row"
                                  spacing={0.75}
                                  alignItems="center"
                                  component="span"
                                  sx={{
                                    display: "inline-flex",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <UserAvatar
                                    avatarUrl={teacherAvatarById.get(
                                      group.teacherPublicId ?? "",
                                    )}
                                    username={teacherNameById.get(
                                      group.teacherPublicId ?? "",
                                    )}
                                    size={20}
                                  />
                                  <Box
                                    component="span"
                                    sx={{
                                      fontWeight: 700,
                                      color: "text.primary",
                                    }}
                                  >
                                    {teacherNameById.get(
                                      group.teacherPublicId ?? "",
                                    ) ?? "Brak danych"}
                                  </Box>
                                </Stack>
                              </Typography>
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
                        <Card
                          elevation={0}
                          sx={{
                            ...panelGridCardSx,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <CardContent
                            sx={{
                              ...panelGridCardContentSx,
                              flex: "1 1 auto",
                              height: "auto",
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
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1, ...panelSingleLineSx }}
                                  >
                                    Właściciel:{" "}
                                    <Stack
                                      direction="row"
                                      spacing={0.75}
                                      alignItems="center"
                                      component="span"
                                      sx={{
                                        display: "inline-flex",
                                        verticalAlign: "middle",
                                      }}
                                    >
                                      <UserAvatar
                                        avatarUrl={teacherAvatarById.get(
                                          group.teacherPublicId ?? "",
                                        )}
                                        username={teacherNameById.get(
                                          group.teacherPublicId ?? "",
                                        )}
                                        size={18}
                                      />
                                      <Box
                                        component="span"
                                        sx={{
                                          fontWeight: 700,
                                          color: "text.primary",
                                        }}
                                      >
                                        {teacherNameById.get(
                                          group.teacherPublicId ?? "",
                                        ) ?? "Brak danych"}
                                      </Box>
                                    </Stack>
                                  </Typography>
                                </Box>
                                <Chip
                                  icon={<GroupIcon />}
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
                          <Box
                            sx={{
                              mx: 2,
                              borderTop: "1px solid",
                              borderColor: (theme) =>
                                alpha(
                                  theme.palette.divider,
                                  theme.palette.mode === "dark" ? 0.1 : 0.15,
                                ),
                            }}
                          />
                          <CardActions
                            sx={{
                              ...panelCardFooterSx,
                              px: 1.75,
                              pb: 1.5,
                              mt: 0,
                              pt: 1,
                              borderTop: "none",
                            }}
                          >
                            <Box
                              sx={{
                                ...panelFooterButtonsSx,
                                flexWrap: "nowrap",
                              }}
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<SchoolIcon fontSize="small" />}
                                fullWidth
                                onClick={() => openMembershipDialog(group)}
                                sx={panelFooterButtonSx}
                              >
                                Skład grupy
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon fontSize="small" />}
                                fullWidth
                                onClick={() => openEditGroupDialog(group)}
                                sx={panelFooterButtonSx}
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
                                  })
                                }
                                sx={panelDeleteButtonSx}
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
          maxWidth="xs"
          paperSx={{
            width: { xs: "calc(100% - 24px)", sm: uiTokens.modal.compactWidth },
          }}
        >
          <AppDialogHeader
            icon={userDialogMode === "create" ? <SparklesIcon /> : <EditIcon />}
            title={
              userDialogMode === "create"
                ? userDialogRole === "TEACHER"
                  ? "Nowe konto nauczyciela"
                  : "Nowe konto ucznia"
                : `Edycja konta ${selectedUser?.username ?? ""}`
            }
            subtitle={
              userDialogRole === "TEACHER"
                ? "Utwórz lub zaktualizuj konto nauczyciela."
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
                sx={{ fontWeight: 700 }}
              />
            }
          />
          <AppDialogBody>
            {userDialogFeedback && (
              <AppDialogStatus severity={userDialogFeedback.severity}>
                {userDialogFeedback.message}
              </AppDialogStatus>
            )}

            {userDialogMode === "create" ? (
              /* ── CREATE MODE ── */
              <Box
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 0.75 }}
                  >
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
                        : `${userDraft.username.length}/${INPUT_LIMITS.username}`
                    }
                    sx={counterFieldSx}
                    size="small"
                    fullWidth
                    placeholder="np. jan.kowalski"
                  />
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 0.75 }}
                  >
                    Adres e-mail
                  </Typography>
                  <Stack spacing={1.25}>
                    <TextField
                      name="admin-user-dialog-email"
                      autoComplete="off"
                      type="email"
                      value={userDraft.email}
                      onChange={(event) =>
                        setUserDraft((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      error={
                        userDraft.email.length > 0 &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDraft.email)
                      }
                      helperText={
                        userDraft.email.length > 0 &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDraft.email)
                          ? "Podaj prawidłowy adres e-mail"
                          : ""
                      }
                      size="small"
                      fullWidth
                      placeholder="np. jan@szkola.pl"
                      sx={counterFieldSx}
                    />
                    <TextField
                      name="admin-user-dialog-confirm-email"
                      autoComplete="off"
                      type="email"
                      value={userDialogConfirmEmail}
                      onChange={(event) =>
                        setUserDialogConfirmEmail(event.target.value)
                      }
                      error={
                        userDialogConfirmEmail.length > 0 &&
                        (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                          userDialogConfirmEmail,
                        ) ||
                          userDraft.email !== userDialogConfirmEmail)
                      }
                      helperText={
                        userDialogConfirmEmail.length > 0
                          ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                userDialogConfirmEmail,
                              )
                            ? "Podaj prawidłowy adres e-mail"
                            : userDraft.email !== userDialogConfirmEmail
                              ? "Adresy e-mail nie są identyczne"
                              : ""
                          : ""
                      }
                      size="small"
                      fullWidth
                      placeholder="Powtórz adres e-mail"
                      sx={counterFieldSx}
                    />
                  </Stack>
                </Box>
                {userDialogRole === "STUDENT" && (
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Grupa
                    </Typography>
                    <TextField
                      select
                      value={userDraft.groupPublicId}
                      onChange={(event) =>
                        setUserDraft((current) => ({
                          ...current,
                          groupPublicId: event.target.value as string | "",
                        }))
                      }
                      size="small"
                      fullWidth
                      helperText={
                        assignableGroups.length === 0
                          ? "Brak grup do wyboru"
                          : "Wybór grupy jest opcjonalny."
                      }
                      sx={counterFieldSx}
                    >
                      <MenuItem value="">Bez grupy</MenuItem>
                      {assignableGroups.map((group) => (
                        <MenuItem key={group.publicId} value={group.publicId}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                )}
              </Box>
            ) : (
              /* ── EDIT MODE: inline-edit rows (wzorzec AccountSettings) ── */
              <Box
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                {/* Nazwa użytkownika */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    "&:not(:last-child)": {
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    },
                  }}
                >
                  {userDialogEditingFields.includes("username") && (
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
                        autoComplete="off"
                        inputProps={{ maxLength: INPUT_LIMITS.username }}
                        error={
                          userDraft.username.length > 0 &&
                          userDraft.username.trim().length < 3
                        }
                        helperText={
                          userDraft.username.length > 0 &&
                          userDraft.username.trim().length < 3
                            ? "Minimalna długość to 3 znaki"
                            : `${userDraft.username.length}/${INPUT_LIMITS.username}`
                        }
                        sx={counterFieldSx}
                      />
                      <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, alignSelf: "flex-start", mt: 0.5 }}>
                        <IconButton
                          size="small"
                          disabled={userDraft.username.trim().length < 3}
                          onClick={() =>
                            setUserDialogEditingFields((prev) =>
                              prev.filter((f) => f !== "username"),
                            )
                          }
                          sx={{
                            borderRadius: 1.5,
                            color: "success.main",
                            bgcolor: (theme) =>
                              alpha(theme.palette.success.main, 0.08),
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.success.main, 0.16),
                            },
                            "&.Mui-disabled": { opacity: 0.35 },
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setUserDraft((current) => ({
                              ...current,
                              username: selectedUser?.username ?? "",
                            }));
                            setUserDialogEditingFields((prev) =>
                              prev.filter((f) => f !== "username"),
                            );
                          }}
                          sx={{
                            borderRadius: 1.5,
                            color: "text.secondary",
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.text.primary, 0.06),
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                  )}
                  {!userDialogEditingFields.includes("username") && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Nazwa użytkownika
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {userDraft.username || (
                            <Box
                              component="span"
                              sx={{ color: "text.disabled" }}
                            >
                              —
                            </Box>
                          )}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() => {
                          setUserDraft((current) => ({ ...current, username: "" }));
                          setUserDialogEditingFields((prev) => [
                            ...prev,
                            "username",
                          ]);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.8rem",
                          color: "primary.main",
                          flexShrink: 0,
                          ml: 1,
                        }}
                      >
                        Zmień
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* E-mail */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    "&:not(:last-child)": {
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    },
                  }}
                >
                  {userDialogEditingFields.includes("email") && (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 1.5 }}
                    >
                      Edycja adresu e-mail
                    </Typography>
                    <Stack spacing={1.25}>
                      <TextField
                        value={userDraft.email}
                        onChange={(event) =>
                          setUserDraft((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        autoFocus
                        size="small"
                        type="email"
                        label="Nowy adres e-mail"
                        fullWidth
                        autoComplete="off"
                        error={
                          userDraft.email.length > 0 &&
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDraft.email)
                        }
                        helperText={
                          userDraft.email.length > 0 &&
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDraft.email)
                            ? "Podaj prawidłowy adres e-mail"
                            : ""
                        }
                      />
                      <TextField
                        value={userDialogConfirmEmail}
                        onChange={(event) =>
                          setUserDialogConfirmEmail(event.target.value)
                        }
                        size="small"
                        type="email"
                        label="Powtórz adres e-mail"
                        fullWidth
                        autoComplete="off"
                        error={
                          userDialogConfirmEmail.length > 0 &&
                          (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDialogConfirmEmail) ||
                            userDraft.email !== userDialogConfirmEmail)
                        }
                        helperText={
                          userDialogConfirmEmail.length > 0
                            ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDialogConfirmEmail)
                              ? "Podaj prawidłowy adres e-mail"
                              : userDraft.email !== userDialogConfirmEmail
                              ? "Adresy e-mail nie są identyczne"
                              : ""
                            : ""
                        }
                      />
                    </Stack>
                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", mt: 1 }}>
                      <IconButton
                        size="small"
                        disabled={
                          !userDraft.email ||
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDraft.email) ||
                          userDraft.email !== userDialogConfirmEmail
                        }
                        onClick={() =>
                          setUserDialogEditingFields((prev) =>
                            prev.filter((f) => f !== "email"),
                          )
                        }
                        sx={{
                          borderRadius: 1.5,
                          color: "success.main",
                          bgcolor: (theme) =>
                            alpha(theme.palette.success.main, 0.08),
                          "&:hover": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.success.main, 0.16),
                          },
                          "&.Mui-disabled": { opacity: 0.35 },
                        }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setUserDraft((current) => ({
                            ...current,
                            email: selectedUser?.email ?? "",
                          }));
                          setUserDialogConfirmEmail("");
                          setUserDialogEditingFields((prev) =>
                            prev.filter((f) => f !== "email"),
                          );
                        }}
                        sx={{
                          borderRadius: 1.5,
                          color: "text.secondary",
                          "&:hover": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.text.primary, 0.06),
                          },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </>
                  )}
                  {!userDialogEditingFields.includes("email") && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Adres e-mail
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {userDraft.email || (
                            <Box
                              component="span"
                              sx={{ color: "text.disabled" }}
                            >
                              —
                            </Box>
                          )}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() => {
                          setUserDraft((current) => ({ ...current, email: "" }));
                          setUserDialogConfirmEmail("");
                          setUserDialogEditingFields((prev) => [
                            ...prev,
                            "email",
                          ]);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.8rem",
                          color: "primary.main",
                          flexShrink: 0,
                          ml: 1,
                        }}
                      >
                        Zmień
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Resetowanie hasła */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    "&:not(:last-child)": {
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Hasło
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{ letterSpacing: 2, color: "text.secondary" }}
                      >
                        {"•".repeat(8)}
                      </Typography>
                    </Box>
                    {resetPasswordSuccess ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: "success.main",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                        }}
                      >
                        <CheckIcon sx={{ fontSize: "1rem" }} />
                        Link wysłany
                      </Box>
                    ) : (
                      <Button
                        size="small"
                        disabled={resetPasswordLoading}
                        startIcon={
                          resetPasswordLoading ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <LockResetIcon sx={{ fontSize: "1rem" }} />
                          )
                        }
                        onClick={async () => {
                          if (!selectedUser?.email) return;
                          setResetPasswordLoading(true);
                          try {
                            await authService.forgotPassword({
                              email: selectedUser.email,
                            });
                            setResetPasswordSuccess(true);
                          } catch {
                            // ignore — email may still be sent
                            setResetPasswordSuccess(true);
                          } finally {
                            setResetPasswordLoading(false);
                          }
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.8rem",
                          color: "primary.main",
                          flexShrink: 0,
                          ml: 1,
                        }}
                      >
                        Wyślij link
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Grupa (tylko STUDENT) */}
                {userDialogRole === "STUDENT" && (
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    {userDialogEditingFields.includes("group") && (
                    <>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.75 }}
                      >
                        Zmiana grupy
                      </Typography>
                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center" }}
                      >
                        <TextField
                          select
                          value={userDraft.groupPublicId}
                          onChange={(event) =>
                            setUserDraft((current) => ({
                              ...current,
                              groupPublicId: event.target.value as string | "",
                            }))
                          }
                          size="small"
                          fullWidth
                          helperText={
                            assignableGroups.length === 0
                              ? "Brak grup do wyboru"
                              : "Wybór grupy jest opcjonalny."
                          }
                        >
                          <MenuItem value="">Bez grupy</MenuItem>
                          {assignableGroups.map((group) => (
                            <MenuItem
                              key={group.publicId}
                              value={group.publicId}
                            >
                              {group.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, alignSelf: "flex-start", mt: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setUserDialogEditingFields((prev) =>
                                prev.filter((f) => f !== "group"),
                              )
                            }
                            sx={{
                              borderRadius: 1.5,
                              color: "success.main",
                              bgcolor: (theme) =>
                                alpha(theme.palette.success.main, 0.08),
                              "&:hover": {
                                bgcolor: (theme) =>
                                  alpha(theme.palette.success.main, 0.16),
                              },
                            }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              const originalGroupId =
                                selectedUser && "groupPublicId" in selectedUser
                                  ? (selectedUser.groupPublicId ?? "")
                                  : "";
                              setUserDraft((current) => ({
                                ...current,
                                groupPublicId: originalGroupId,
                              }));
                              setUserDialogEditingFields((prev) =>
                                prev.filter((f) => f !== "group"),
                              );
                            }}
                            sx={{
                              borderRadius: 1.5,
                              color: "text.secondary",
                              "&:hover": {
                                bgcolor: (theme) =>
                                  alpha(theme.palette.text.primary, 0.06),
                              },
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </>
                    )}
                    {!userDialogEditingFields.includes("group") && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Grupa
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {assignableGroups.find(
                              (g) => g.publicId === userDraft.groupPublicId,
                            )?.name ?? (
                              <Box
                                component="span"
                                sx={{ color: "text.disabled" }}
                              >
                                Bez grupy
                              </Box>
                            )}
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
                            fontWeight: 500,
                            fontSize: "0.8rem",
                            color: "primary.main",
                            flexShrink: 0,
                            ml: 1,
                          }}
                        >
                          Zmień
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeUserDialog}
                sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                startIcon={
                  userDialogLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={submitUserDialog}
                disabled={userDialogLoading}
                sx={panelFooterButtonSx}
              >
                {userDialogMode === "create" ? "Utwórz konto" : "Zapisz zmiany"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <AppDialog
          open={groupDialogOpen}
          onClose={closeGroupDialog}
          maxWidth="xs"
          paperSx={{
            width: { xs: "calc(100% - 24px)", sm: uiTokens.modal.compactWidth },
          }}
        >
          <AppDialogHeader
            icon={<GroupIcon />}
            title={groupDialogMode === "create" ? "Nowa grupa" : "Edycja grupy"}
            subtitle="Nadaj grupie czytelną nazwę i krótki opis zgodny z jej przeznaczeniem."
            badge={
              <Chip
                label={groupDialogMode === "create" ? "Nowa grupa" : "Edycja"}
                size="small"
                color="warning"
                sx={{ fontWeight: 700 }}
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
              /* ── CREATE MODE ── */
              <Box
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 0.75 }}
                  >
                    Nazwa grupy
                  </Typography>
                  <TextField
                    value={groupDraft.name}
                    onChange={(event) =>
                      setGroupDraft((current) => ({
                        ...current,
                        name: event.target.value.slice(
                          0,
                          INPUT_LIMITS.groupName,
                        ),
                      }))
                    }
                    inputProps={{ maxLength: INPUT_LIMITS.groupName }}
                    error={
                      groupDraft.name.length > 0 &&
                      groupDraft.name.trim().length < 2
                    }
                    helperText={
                      groupDraft.name.length > 0 &&
                      groupDraft.name.trim().length < 2
                        ? "Minimalna długość to 2 znaki"
                        : `${groupDraft.name.length}/${INPUT_LIMITS.groupName}`
                    }
                    sx={counterFieldSx}
                    size="small"
                    fullWidth
                    placeholder="np. Klasa 3B"
                  />
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 0.75 }}
                  >
                    Opis grupy
                  </Typography>
                  <TextField
                    value={groupDraft.description}
                    onChange={(event) =>
                      setGroupDraft((current) => ({
                        ...current,
                        description: event.target.value.slice(
                          0,
                          INPUT_LIMITS.groupDescription,
                        ),
                      }))
                    }
                    inputProps={{ maxLength: INPUT_LIMITS.groupDescription }}
                    helperText={`${groupDraft.description.length}/${INPUT_LIMITS.groupDescription}`}
                    sx={counterFieldSx}
                    multiline
                    minRows={3}
                    size="small"
                    fullWidth
                    placeholder="Krótki opis grupy (opcjonalnie)"
                  />
                </Box>
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 0.75 }}
                  >
                    Właściciel grupy
                  </Typography>
                  <TextField
                    select
                    value={groupDraft.teacherPublicId}
                    onChange={(event) =>
                      setGroupDraft((current) => ({
                        ...current,
                        teacherPublicId: event.target.value,
                      }))
                    }
                    helperText="Wybierz nauczyciela, który ma zarządzać grupą."
                    size="small"
                    fullWidth
                    sx={counterFieldSx}
                  >
                    <MenuItem value="">Bez właściciela</MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem
                        key={teacher.publicId}
                        value={teacher.publicId}
                        sx={{ py: 1 }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <UserAvatar
                            avatarUrl={teacher.avatarUrl}
                            username={teacher.username}
                            size={24}
                          />
                          <Typography variant="body2">
                            {teacher.username}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>
            ) : (
              /* ── EDIT MODE: inline-edit rows ── */
              <Box
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                {/* Nazwa */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    "&:not(:last-child)": {
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    },
                  }}
                >
                  {groupDialogEditingFields.includes("name") && (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Edycja nazwy grupy
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        value={groupDraft.name}
                        onChange={(event) =>
                          setGroupDraft((current) => ({
                            ...current,
                            name: event.target.value.slice(
                              0,
                              INPUT_LIMITS.groupName,
                            ),
                          }))
                        }
                        autoFocus
                        size="small"
                        fullWidth
                        autoComplete="off"
                        inputProps={{ maxLength: INPUT_LIMITS.groupName }}
                        error={
                          groupDraft.name.length > 0 &&
                          groupDraft.name.trim().length < 2
                        }
                        helperText={
                          groupDraft.name.length > 0 &&
                          groupDraft.name.trim().length < 2
                            ? "Minimalna długość to 2 znaki"
                            : `${groupDraft.name.length}/${INPUT_LIMITS.groupName}`
                        }
                        sx={counterFieldSx}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <IconButton
                          size="small"
                          disabled={groupDraft.name.trim().length < 2}
                          onClick={() =>
                            setGroupDialogEditingFields((prev) =>
                              prev.filter((f) => f !== "name"),
                            )
                          }
                          sx={{
                            borderRadius: 1.5,
                            color: "success.main",
                            bgcolor: (theme) =>
                              alpha(theme.palette.success.main, 0.08),
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.success.main, 0.16),
                            },
                            "&.Mui-disabled": { opacity: 0.35 },
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setGroupDraft((current) => ({
                              ...current,
                              name: selectedGroup?.name ?? "",
                            }));
                            setGroupDialogEditingFields((prev) =>
                              prev.filter((f) => f !== "name"),
                            );
                          }}
                          sx={{
                            borderRadius: 1.5,
                            color: "text.secondary",
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.text.primary, 0.06),
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                  )}
                  {!groupDialogEditingFields.includes("name") && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Nazwa grupy
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {groupDraft.name}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() => {
                          setGroupDraft((current) => ({
                            ...current,
                            name: "",
                          }));
                          setGroupDialogEditingFields((prev) => [
                            ...prev,
                            "name",
                          ]);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.8rem",
                          color: "primary.main",
                          flexShrink: 0,
                          ml: 1,
                        }}
                      >
                        Zmień
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Opis */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    "&:not(:last-child)": {
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    },
                  }}
                >
                  {groupDialogEditingFields.includes("description") && (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Edycja opisu grupy
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        value={groupDraft.description}
                        onChange={(event) =>
                          setGroupDraft((current) => ({
                            ...current,
                            description: event.target.value.slice(
                              0,
                              INPUT_LIMITS.groupDescription,
                            ),
                          }))
                        }
                        autoFocus
                        size="small"
                        fullWidth
                        autoComplete="off"
                        multiline
                        minRows={3}
                        inputProps={{ maxLength: INPUT_LIMITS.groupDescription }}
                        helperText={`${groupDraft.description.length}/${INPUT_LIMITS.groupDescription}`}
                        sx={counterFieldSx}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            setGroupDialogEditingFields((prev) =>
                              prev.filter((f) => f !== "description"),
                            )
                          }
                          sx={{
                            borderRadius: 1.5,
                            color: "success.main",
                            bgcolor: (theme) =>
                              alpha(theme.palette.success.main, 0.08),
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.success.main, 0.16),
                            },
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setGroupDraft((current) => ({
                              ...current,
                              description: selectedGroup?.description ?? "",
                            }));
                            setGroupDialogEditingFields((prev) =>
                              prev.filter((f) => f !== "description"),
                            );
                          }}
                          sx={{
                            borderRadius: 1.5,
                            color: "text.secondary",
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.text.primary, 0.06),
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                  )}
                  {!groupDialogEditingFields.includes("description") && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Opis grupy
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {groupDraft.description || (
                            <Box
                              component="span"
                              sx={{ color: "text.disabled" }}
                            >
                              Brak opisu
                            </Box>
                          )}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() => {
                          setGroupDraft((current) => ({
                            ...current,
                            description: "",
                          }));
                          setGroupDialogEditingFields((prev) => [
                            ...prev,
                            "description",
                          ]);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.8rem",
                          color: "primary.main",
                          flexShrink: 0,
                          ml: 1,
                        }}
                      >
                        Zmień
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Właściciel */}
                <Box sx={{ px: 2, py: 1.5 }}>
                  {groupDialogEditingFields.includes("teacher") && (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Zmiana właściciela grupy
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        select
                        value={groupDraft.teacherPublicId}
                        onChange={(event) =>
                          setGroupDraft((current) => ({
                            ...current,
                            teacherPublicId: event.target.value,
                          }))
                        }
                        size="small"
                        fullWidth
                        helperText="Wybierz nauczyciela, który ma zarządzać grupą."
                      >
                        <MenuItem value="">Bez właściciela</MenuItem>
                        {teachers.map((teacher) => (
                          <MenuItem
                            key={teacher.publicId}
                            value={teacher.publicId}
                            sx={{ py: 1 }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <UserAvatar
                                avatarUrl={teacher.avatarUrl}
                                username={teacher.username}
                                size={24}
                              />
                              <Typography variant="body2">
                                {teacher.username}
                              </Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </TextField>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            setGroupDialogEditingFields((prev) =>
                              prev.filter((f) => f !== "teacher"),
                            )
                          }
                          sx={{
                            borderRadius: 1.5,
                            color: "success.main",
                            bgcolor: (theme) =>
                              alpha(theme.palette.success.main, 0.08),
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.success.main, 0.16),
                            },
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setGroupDraft((current) => ({
                              ...current,
                              teacherPublicId:
                                selectedGroup?.teacherPublicId ?? "",
                            }));
                            setGroupDialogEditingFields((prev) =>
                              prev.filter((f) => f !== "teacher"),
                            );
                          }}
                          sx={{
                            borderRadius: 1.5,
                            color: "text.secondary",
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.text.primary, 0.06),
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                  )}
                  {!groupDialogEditingFields.includes("teacher") && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Właściciel grupy
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {teachers.find(
                            (t) =>
                              t.publicId === groupDraft.teacherPublicId,
                          )?.username ?? (
                            <Box
                              component="span"
                              sx={{ color: "text.disabled" }}
                            >
                              Bez właściciela
                            </Box>
                          )}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() =>
                          setGroupDialogEditingFields((prev) => [
                            ...prev,
                            "teacher",
                          ])
                        }
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.8rem",
                          color: "primary.main",
                          flexShrink: 0,
                          ml: 1,
                        }}
                      >
                        Zmień
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeGroupDialog}
                sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                startIcon={
                  groupDialogLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={submitGroupDialog}
                disabled={groupDialogLoading}
                sx={panelFooterButtonSx}
              >
                {groupDialogMode === "create" ? "Utwórz grupę" : "Zapisz zmiany"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <AppDialog
          open={Boolean(deleteDialog)}
          onClose={closeDeleteDialog}
          maxWidth="xs"
        >
          <AppDialogHeader
            icon={<DeleteIcon sx={{ color: "error.main" }} />}
            title={deleteDialog?.type === "user" ? "Usuń konto" : "Usuń grupę"}
            subtitle="Ta operacja jest nieodwracalna i natychmiast usuwa wskazany element."
            badge={
              <Chip
                label="Ostrzeżenie"
                size="small"
                color="error"
                sx={{ fontWeight: 700 }}
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
            </FormSection>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {deleteDialog?.type === "user"
                ? "Usunięcie konta skasuje dostęp tego użytkownika do systemu."
                : "Usunięcie grupy wyczyści też jej skład i przypisania."}
            </Typography>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeDeleteDialog}
                sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                color="error"
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
            width: {
              xs: "calc(100% - 24px)",
              sm: uiTokens.modal.comfortableWidth,
            },
          }}
        >
          <AppDialogHeader
            icon={<SchoolIcon />}
            title="Skład grupy"
            subtitle="Sprawdź aktualnych uczniów i dodaj nowe osoby przypisane do właściciela tej grupy."
            badge={
              <Chip
                label="Członkowie"
                size="small"
                color="primary"
                sx={{ fontWeight: 700 }}
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
                            sx={panelDeleteButtonSx}
                          >
                            Usuń
                          </Button>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </FormSection>

              <FormSection
                title="Dodaj ucznia"
                description="Lista pokazuje tylko uczniów przypisanych do właściciela tej grupy."
              >
                <Autocomplete
                  size="small"
                  options={availableMembershipStudents.filter(
                    (student) =>
                      student.groupPublicId !== membershipDialog?.groupPublicId,
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
                    <TextField
                      {...params}
                      label="Wybierz ucznia"
                      helperText="Wybór ucznia od razu przygotuje go do dodania do tej grupy."
                    />
                  )}
                />
              </FormSection>
            </Stack>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeMembershipDialog}
                sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={addMembershipStudent}
                disabled={membershipLoading}
                sx={panelFooterButtonSx}
              >
                {membershipLoading ? "Zapisywanie..." : "Dodaj ucznia"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>
      </Container>
    </Box>
  );
}
