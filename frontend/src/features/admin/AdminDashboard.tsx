import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
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
  Snackbar,
  Stack,
  Switch,
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
  DarkMode as DarkModeIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  GroupOutlined as GroupIcon,
  LightMode as LightModeIcon,
  ListOutlined as ListIcon,
  LogoutOutlined as LogoutIcon,
  ManageAccountsOutlined as ManageAccountsIcon,
  PeopleOutline as PeopleIcon,
  PersonOutline as PersonIcon,
  RefreshOutlined as RefreshIcon,
  SaveOutlined as SaveIcon,
  SchoolOutlined as SchoolIcon,
  SearchOutlined as SearchIcon,
  GridViewOutlined as GridIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  adminService,
  type AdminCreateStudentRequest,
  type AdminStudentProfile,
  type AdminStats,
  type AdminUpdateStudentRequest,
} from "@/api/adminService";
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
} from "@/components/ui/dialog/AppDialog";
import { getRoleAccountLabel, getRoleChipColor, getRoleLabel } from "@/components/ui/chips/roleLabels";
import { FormActions, FormField, FormSection } from "@/components/ui/form/FormLayout";
import {
  outlinedMetaChipSx,
  panelActionClusterSx,
  panelCardFooterSx,
  panelGridCardContentSx,
  panelGridCardSx,
  panelIconButtonSx,
  panelListRowSx,
  panelSingleLineSx,
  panelSurfaceSx,
  panelToolbarSx,
  panelTitleSx,
  panelTwoLinesSx,
} from "@/components/ui/panel/panelStyles";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { uiTokens } from "@/theme/uiTokens";

type UserRole = "TEACHER" | "STUDENT";
type UserFilter = "ALL" | UserRole;
type AdminTab = "users" | "groups";
type AdminListUser = UserProfile | AdminStudentProfile;
type AdminViewMode = "grid" | "list";

interface UserDraft {
  username: string;
  email: string;
  password: string;
  groupId: number | "";
}

interface GroupDraft {
  name: string;
  description: string;
  teacherId: number | "";
}

interface DeleteDialogState {
  type: "user" | "group";
  id: number;
  label: string;
  detail?: string | null;
}

interface MembershipDialogState {
  groupId: number;
  groupName: string;
  teacherId?: number | null;
}

const emptyUserDraft: UserDraft = {
  username: "",
  email: "",
  password: "",
  groupId: "",
};
const emptyGroupDraft: GroupDraft = { name: "", description: "", teacherId: "" };

const validationFieldLabels: Record<string, string> = {
  name: "Nazwa",
  description: "Opis",
  username: "Nazwa użytkownika",
  email: "Adres e-mail",
  password: "Has?o",
  groupId: "Grupa",
};

const validationMessageTranslations: Record<string, string> = {
  "Name is required": "Pole jest wymagane.",
  "Description is required": "Pole jest wymagane.",
  "Username is required": "Pole jest wymagane.",
  "Email is required": "Pole jest wymagane.",
  "Password is required": "Pole jest wymagane.",
  "must not be blank": "Pole jest wymagane.",
  "must not be null": "Pole jest wymagane.",
  "must not be empty": "Pole jest wymagane.",
  "must be a well-formed email address": "Podaj poprawny adres e-mail.",
  "must be greater than or equal to 0": "Wartość jest nieprawidłowa.",
};

function translateBackendMessage(message: string) {
  let translated = message;

  for (const [source, target] of Object.entries(validationMessageTranslations)) {
    translated = translated.replaceAll(source, target);
  }

  if (translated.startsWith("Validation failed:")) {
    const rawDetails = translated.replace("Validation failed:", "").trim();
    const parts = rawDetails
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf(":");
        if (separatorIndex === -1) {
          return part;
        }

        const field = part.slice(0, separatorIndex).trim();
        const detail = part.slice(separatorIndex + 1).trim();
        const label = validationFieldLabels[field] ?? field;
        return `${label}: ${detail}`;
      });

    return `Błąd walidacji: ${parts.join(", ")}`
      .replaceAll(" .", ".")
      .trim();
  }

  return translated;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const message = error.problem.detail || error.problem.title;
    return message ? translateBackendMessage(message) : fallback;
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

const actionButtonSx = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 600,
};

const topToolbarButtonSx = {
  ...actionButtonSx,
  minHeight: 36,
  minWidth: { xs: "100%", sm: 132 },
  px: 1.75,
  whiteSpace: "nowrap",
  fontSize: "0.875rem",
};

const teacherCreateButtonSx = {
  ...topToolbarButtonSx,
  bgcolor: "info.light",
  color: "info.contrastText",
  boxShadow: "none",
  "&:hover": {
    bgcolor: "info.main",
    boxShadow: "0 8px 16px rgba(2, 132, 199, 0.28)",
  },
};

const studentCreateButtonSx = {
  ...topToolbarButtonSx,
  bgcolor: "success.light",
  color: "success.contrastText",
  boxShadow: "none",
  "&:hover": {
    bgcolor: "success.main",
    boxShadow: "0 8px 16px rgba(22, 163, 74, 0.28)",
  },
};

export function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { toggleColorMode } = useAppTheme();

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
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<AdminStudentProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [userDialogRole, setUserDialogRole] = useState<UserRole>("TEACHER");
  const [selectedUser, setSelectedUser] = useState<AdminListUser | null>(null);
  const [userDraft, setUserDraft] = useState<UserDraft>(emptyUserDraft);
  const [userDialogLoading, setUserDialogLoading] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupDialogMode, setGroupDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(emptyGroupDraft);
  const [groupDialogLoading, setGroupDialogLoading] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [membershipDialog, setMembershipDialog] =
    useState<MembershipDialogState | null>(null);
  const [membershipStudentId, setMembershipStudentId] = useState<number | "">(
    "",
  );
  const [membershipLoading, setMembershipLoading] = useState(false);

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
    const selectedTeacherIds = new Set(selectedTeacherFilters.map((t) => t.id));
    const selectedGroupIds = new Set(selectedGroupFilters.map((g) => g.id));

    return allUsers.filter((user) => {
      if (showUngroupedStudents) {
        if (user.role !== "STUDENT") {
          return false;
        }
        if (!("groupId" in user) || user.groupId != null) {
          return false;
        }
      }

      if (userFilter !== "ALL" && user.role !== userFilter) {
        return false;
      }

      if (selectedTeacherIds.size > 0) {
        if (user.role === "TEACHER") {
          if (!selectedTeacherIds.has(user.id)) {
            return false;
          }
        } else {
          // Students: check if their group belongs to any selected teacher
          const studentGroupId = "groupId" in user ? (user as AdminStudentProfile).groupId : null;
          const teacherGroupIds = new Set(
            groups.filter((g) => selectedTeacherIds.has(g.teacherId ?? -1)).map((g) => g.id),
          );
          if (studentGroupId == null || !teacherGroupIds.has(studentGroupId)) {
            return false;
          }
        }
      }

      if (selectedGroupIds.size > 0) {
        if (user.role === "TEACHER") {
          const ownsSelectedGroup = selectedGroupFilters.some(
            (group) => group.teacherId === user.id,
          );
          if (!ownsSelectedGroup) {
            return false;
          }
        } else {
          if (!("groupId" in user) || !selectedGroupIds.has(user.groupId ?? -1)) {
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
        String(user.id).includes(normalizedQuery)
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
    const selectedTeacherIds = new Set(selectedTeacherFilters.map((t) => t.id));
    return groups.filter((group) => {
      if (selectedTeacherIds.size > 0 && !selectedTeacherIds.has(group.teacherId ?? -1)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        group.name.toLowerCase().includes(normalizedQuery) ||
        group.description.toLowerCase().includes(normalizedQuery) ||
        String(group.id).includes(normalizedQuery)
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

    return students.filter((student) => student.groupId === membershipDialog.groupId);
  }, [membershipDialog, students]);

  const availableMembershipStudents = useMemo(() => {
    if (!membershipDialog) {
      return [];
    }

    return students.filter(
      (student) => student.groupId == null || student.groupId === membershipDialog.groupId
    );
  }, [membershipDialog, students]);

  const teacherNameById = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher.username])),
    [teachers],
  );

  const groupFilterOptions = useMemo(() => {
    if (selectedTeacherFilters.length === 0) {
      return groups;
    }

    const selectedTeacherIds = new Set(selectedTeacherFilters.map((teacher) => teacher.id));
    return groups.filter((group) => selectedTeacherIds.has(group.teacherId ?? -1));
  }, [groups, selectedTeacherFilters]);

  const loadAdminStats = async () => {
    try {
      setAdminStats(await adminService.getStats());
      setStatsError(null);
    } catch (error) {
      setStatsError(
        getErrorMessage(error, "Nie udalo sie pobrac danych panelu admina."),
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
        getErrorMessage(error, "Nie udało się pobrać list nauczycieli i uczniów."),
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
      setGroupsError(getErrorMessage(error, "Nie udalo sie pobrac listy grup."));
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
          getErrorMessage(error, "Nie udalo sie pobrac danych administratora."),
        ),
      );

    loadAdminStats();
    loadUsers();
    loadGroups();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const showToast = (severity: "success" | "error", message: string) => {
    setToast({ severity, message });
  };

  const openCreateUserDialog = (role: UserRole) => {
    setUserDialogMode("create");
    setUserDialogRole(role);
    setSelectedUser(null);
    setUserDraft(emptyUserDraft);
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
      groupId: "groupId" in user ? (user.groupId ?? "") : "",
    });
    setUserDialogOpen(true);
  };

  const resetUserDialogState = () => {
    setSelectedUser(null);
    setUserDraft(emptyUserDraft);
    setUserDialogRole("TEACHER");
    setUserDialogMode("create");
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

    setUserDialogLoading(true);
    try {
      if (userDialogMode === "create") {
        if (userDialogRole === "TEACHER") {
          const payload: CreateUserRequest = {
            username: userDraft.username,
            email: userDraft.email,
            password: userDraft.password,
          };
          await userService.createTeacher(payload);
          showToast("success", "Nauczyciel został utworzony.");
        } else {
          const payload: AdminCreateStudentRequest = {
            username: userDraft.username,
            email: userDraft.email,
            password: userDraft.password,
            groupId: userDraft.groupId === "" ? null : userDraft.groupId,
          };

          await adminService.createStudent(payload);
          showToast("success", "Uczeń został utworzony.");
        }
      } else if (selectedUser) {
        let updated: AdminListUser;

        if (selectedUser.role === "STUDENT") {
          const payload: AdminUpdateStudentRequest = {
            username: userDraft.username,
            email: userDraft.email,
            groupId: userDraft.groupId === "" ? null : userDraft.groupId,
          };
          updated = await adminService.updateStudent(selectedUser.id, payload);
        } else {
          const payload: UpdateUserRequest = {
            username: userDraft.username,
            email: userDraft.email,
          };
          updated = await userService.updateUser(selectedUser.id, payload);
        }

        setSelectedUser(updated);
        showToast("success", "Dane konta zostały zapisane.");
      }

      await Promise.all([loadUsers(), loadAdminStats()]);
      closeUserDialog();
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udało się zapisać zmian konta."),
      );
    } finally {
      setUserDialogLoading(false);
    }
  };

  const openCreateGroupDialog = () => {
    setGroupDialogMode("create");
    setSelectedGroup(null);
    setGroupDraft({
      ...emptyGroupDraft,
      teacherId: teachers.length === 1 ? teachers[0].id : "",
    });
    setGroupDialogOpen(true);
  };

  const openEditGroupDialog = (group: UserGroup) => {
    setGroupDialogMode("edit");
    setSelectedGroup(group);
    setGroupDraft({
      name: group.name,
      description: group.description,
      teacherId: group.teacherId ?? "",
    });
    setGroupDialogOpen(true);
  };

  const closeGroupDialog = () => {
    if (groupDialogLoading) {
      return;
    }
    setGroupDialogOpen(false);
    setSelectedGroup(null);
    setGroupDraft(emptyGroupDraft);
  };

  const submitGroupDialog = async () => {
    if (groupDialogLoading) {
      return;
    }

    setGroupDialogLoading(true);
    try {
      const payload = {
        name: groupDraft.name,
        description: groupDraft.description,
        teacherId: groupDraft.teacherId === "" ? null : groupDraft.teacherId,
      };

      if (groupDialogMode === "create") {
        await userGroupService.createGroup(payload);
        showToast("success", "Grupa została utworzona.");
      } else if (selectedGroup) {
        await userGroupService.updateGroup(selectedGroup.id, payload);
        showToast("success", "Zmiany grupy zostały zapisane.");
      }

      await Promise.all([loadGroups(), loadAdminStats()]);
      closeGroupDialog();
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udało się zapisać zmian grupy."),
      );
    } finally {
      setGroupDialogLoading(false);
    }
  };

  const openDeleteDialog = (payload: DeleteDialogState) => {
    setDeleteDialog(payload);
  };

  const closeDeleteDialog = () => {
    if (deleteLoading) {
      return;
    }
    setDeleteDialog(null);
  };

  const confirmDelete = async () => {
    if (!deleteDialog) {
      return;
    }
    if (deleteLoading) {
      return;
    }

    setDeleteLoading(true);
    try {
      if (deleteDialog.type === "user") {
        await userService.deleteUser(deleteDialog.id);
        if (selectedUser?.id === deleteDialog.id) {
          setSelectedUser(null);
        }
        await Promise.all([loadUsers(), loadAdminStats()]);
        showToast("success", "Konto zostało usunięte.");
      } else {
        await userGroupService.deleteGroup(deleteDialog.id);
        await Promise.all([loadGroups(), loadAdminStats()]);
        showToast("success", "Grupa została usunięta.");
      }
      closeDeleteDialog();
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udało się usunąć wskazanego elementu."),
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const openMembershipDialog = (group: UserGroup) => {
    setMembershipDialog({
      groupId: group.id,
      groupName: group.name,
      teacherId: group.teacherId,
    });
    setMembershipStudentId("");
  };

  const closeMembershipDialog = () => {
    if (membershipLoading) {
      return;
    }
    setMembershipDialog(null);
    setMembershipStudentId("");
  };

  const addMembershipStudent = async () => {
    if (!membershipDialog || membershipLoading) {
      return;
    }
    if (membershipStudentId === "") {
      showToast("error", "Wybierz ucznia z listy.");
      return;
    }

    setMembershipLoading(true);
    try {
      await userGroupService.addStudentToGroup(
        membershipDialog.groupId,
        membershipStudentId,
      );
      showToast("success", "Uczeń został dodany do grupy.");
      await Promise.all([loadGroups(), loadUsers()]);
      setMembershipStudentId("");
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udało się zmienić składu grupy."),
      );
    } finally {
      setMembershipLoading(false);
    }
  };

  const removeMembershipStudent = async (studentId: number) => {
    if (!membershipDialog || membershipLoading) {
      return;
    }

    setMembershipLoading(true);
    try {
      await userGroupService.removeStudentFromGroup(membershipDialog.groupId, studentId);
      showToast("success", "Uczeń został usunięty z grupy.");
      await Promise.all([loadGroups(), loadUsers()]);
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udało się zmienić składu grupy."),
      );
    } finally {
      setMembershipLoading(false);
    }
  };

  const pageBg =
    theme.palette.mode === "light" ? "#e8eef7" : theme.palette.background.default;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        <Box
          sx={{
            position: { xs: "relative", md: "absolute" },
            top: { md: 32 },
            right: { md: 24 },
            mb: { xs: 3, md: 0 },
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 3,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LightModeIcon
              fontSize="small"
              sx={{
                color:
                  theme.palette.mode === "light"
                    ? "primary.main"
                    : "text.disabled",
                mr: 0.5,
              }}
            />
            <Switch
              size="small"
              checked={theme.palette.mode === "dark"}
              onChange={toggleColorMode}
            />
            <DarkModeIcon
              fontSize="small"
              sx={{
                color:
                  theme.palette.mode === "dark"
                    ? "primary.main"
                    : "text.disabled",
                ml: 0.5,
              }}
            />
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "background.paper",
            }}
          >
            Wyloguj
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: "background.paper",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: 1,
              }}
            >
              <ManageAccountsIcon sx={{ color: "primary.main" }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Witaj, {currentUser?.username ?? "Administrator"}!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Panel administratora
              </Typography>
            </Box>
          </Stack>
        </Box>

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

        <Card
          elevation={0}
          sx={panelSurfaceSx}
        >
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
                      Filtruj liste, wyszukuj po nazwie lub emailu i otwieraj edycje w
                      modalach.
                    </Typography>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ sm: "center" }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={loadUsers}
                      disabled={usersLoading}
                      sx={topToolbarButtonSx}
                    >
                      Odśwież
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddCircleIcon />}
                      onClick={() => openCreateUserDialog("TEACHER")}
                      sx={teacherCreateButtonSx}
                    >
                      Nauczyciel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddCircleIcon />}
                      onClick={() => openCreateUserDialog("STUDENT")}
                      sx={studentCreateButtonSx}
                    >
                      Uczeń
                    </Button>
                  </Stack>
                </Stack>

                {usersError && <Alert severity="warning">{usersError}</Alert>}

                <Paper
                  elevation={0}
                  sx={panelToolbarSx}
                >
                  <TextField
                    size="small"
                    placeholder="Szukaj po nazwie, emailu lub ID"
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
                    isOptionEqualToValue={(option, value) => option.id === value.id}
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
                    isOptionEqualToValue={(option, value) => option.id === value.id}
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
                    onChange={() => setShowUngroupedStudents((current) => !current)}
                    size="small"
                    sx={{ textTransform: "none", borderRadius: 2, flexShrink: 0 }}
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
                      <Paper key={`${user.role}-${user.id}`} elevation={0} sx={panelListRowSx}>
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
                                {user.username}
                              </Typography>
                              <Chip
                                color={getRoleChipColor(user.role as UserRole)}
                                icon={
                                  user.role === "TEACHER" ? <SchoolIcon /> : <PersonIcon />
                                }
                                label={getRoleLabel(user.role as UserRole)}
                                size="small"
                              />
                              <Chip
                                label={getRoleAccountLabel(user.role as UserRole)}
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
                                  <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                                    {"groupName" in user && user.groupName
                                      ? user.groupName
                                      : "Bez grupy"}
                                  </Box>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Utworzono {formatDate(user.createdAt)}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={1}
                            alignSelf={{ xs: "flex-end", md: "center" }}
                          >
                            <IconButton
                              aria-label={`Edytuj ${user.username}`}
                              onClick={() => openEditUserDialog(user)}
                              sx={{ ...panelIconButtonSx, color: "primary.main" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label={`Usuń ${user.username}`}
                              onClick={() =>
                                openDeleteDialog({
                                  type: "user",
                                  id: user.id,
                                  label: user.username,
                                  detail:
                                    user.role === "STUDENT" &&
                                    "groupName" in user &&
                                    user.groupName
                                      ? `Uczeń w grupie ${user.groupName}`
                                      : user.email,
                                })
                              }
                              sx={{ ...panelIconButtonSx, color: "error.main" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Grid container spacing={2}>
                    {filteredUsers.map((user) => (
                      <Grid key={`${user.role}-${user.id}`} size={{ xs: 12, md: 6, xl: 4 }}>
                        <Card elevation={0} sx={panelGridCardSx}>
                          <CardContent sx={panelGridCardContentSx}>
                            <Stack spacing={1.5} sx={{ width: "100%", minHeight: "100%" }}>
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
                                    {user.username}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={panelSingleLineSx}
                                  >
                                    {user.email}
                                  </Typography>
                                </Box>
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
                                      sx={{ fontWeight: 700, color: "text.primary" }}
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

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                  label={`Utworzono ${formatDate(user.createdAt)}`}
                                  size="small"
                                  variant="outlined"
                                  sx={outlinedMetaChipSx}
                                />
                              </Stack>

                              <Box sx={panelCardFooterSx}>
                                <Typography variant="caption" color="text.secondary">
                                  Akcje konta
                                </Typography>
                                <Box sx={panelActionClusterSx}>
                                  <IconButton
                                    aria-label={`Edytuj ${user.username}`}
                                    onClick={() => openEditUserDialog(user)}
                                    sx={{
                                      ...panelIconButtonSx,
                                      color: "primary.main",
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    aria-label={`Usuń ${user.username}`}
                                    onClick={() =>
                                      openDeleteDialog({
                                        type: "user",
                                        id: user.id,
                                        label: user.username,
                                        detail:
                                          user.role === "STUDENT" &&
                                          "groupName" in user &&
                                          user.groupName
                                            ? `Uczeń w grupie ${user.groupName}`
                                            : user.email,
                                      })
                                    }
                                    sx={{
                                      ...panelIconButtonSx,
                                      color: "error.main",
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Stack>
                          </CardContent>
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
                      Twórz grupy, edytuj je i zarządzaj członkami przez dedykowane
                      okna akcji.
                    </Typography>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ sm: "center" }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={loadGroups}
                      disabled={groupsLoading}
                      sx={topToolbarButtonSx}
                    >
                      Odśwież
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddCircleIcon />}
                      onClick={openCreateGroupDialog}
                      sx={topToolbarButtonSx}
                    >
                      Nowa grupa
                    </Button>
                  </Stack>
                </Stack>

                {groupsError && <Alert severity="warning">{groupsError}</Alert>}

                <Paper
                  elevation={0}
                  sx={panelToolbarSx}
                >
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
                    isOptionEqualToValue={(option, value) => option.id === value.id}
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
                      <Paper key={group.id} elevation={0} sx={panelListRowSx}>
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
                              <Typography variant="body2" color="text.secondary">
                                Właściciel:{" "}
                                <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                                  {teacherNameById.get(group.teacherId ?? -1) ?? "Brak danych"}
                                </Box>
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
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
                                  sx={actionButtonSx}
                                >Skład grupy</Button>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignSelf={{ xs: "flex-end", sm: "center" }}
                            >
                              <IconButton
                                aria-label={`Edytuj ${group.name}`}
                                onClick={() => openEditGroupDialog(group)}
                                sx={{ ...panelIconButtonSx, color: "primary.main" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                aria-label={`Usuń ${group.name}`}
                                onClick={() =>
                                  openDeleteDialog({
                                    type: "group",
                                    id: group.id,
                                    label: group.name,
                                    detail: group.description,
                                  })
                                }
                                sx={{ ...panelIconButtonSx, color: "error.main" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Grid container spacing={2}>
                    {filteredGroups.map((group) => (
                      <Grid key={group.id} size={{ xs: 12, md: 6, xl: 4 }}>
                        <Card elevation={0} sx={panelGridCardSx}>
                          <CardContent sx={panelGridCardContentSx}>
                            <Stack spacing={1.5} sx={{ width: "100%", minHeight: "100%" }}>
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
                                    <Box
                                      component="span"
                                      sx={{ fontWeight: 700, color: "text.primary" }}
                                    >
                                      {teacherNameById.get(group.teacherId ?? -1) ??
                                        "Brak danych"}
                                    </Box>
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

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                  label={`Utworzono ${formatDate(group.createdAt)}`}
                                  size="small"
                                  variant="outlined"
                                  sx={outlinedMetaChipSx}
                                />
                              </Stack>

                              <Box sx={panelCardFooterSx}>
                                <Box>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<SchoolIcon />}
                                    onClick={() => openMembershipDialog(group)}
                                    sx={actionButtonSx}
                                  >Skład grupy</Button>
                                </Box>
                                <Box sx={panelActionClusterSx}>
                                  <IconButton
                                    aria-label={`Edytuj ${group.name}`}
                                    onClick={() => openEditGroupDialog(group)}
                                    sx={{
                                      ...panelIconButtonSx,
                                      color: "primary.main",
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    aria-label={`Usuń ${group.name}`}
                                    onClick={() =>
                                      openDeleteDialog({
                                        type: "group",
                                        id: group.id,
                                        label: group.name,
                                        detail: group.description,
                                      })
                                    }
                                    sx={{
                                      ...panelIconButtonSx,
                                      color: "error.main",
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Stack>
                          </CardContent>
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
          paperSx={{ width: { xs: "calc(100% - 24px)", sm: uiTokens.modal.compactWidth } }}
        >
          <AppDialogHeader
            icon={
              userDialogMode === "create" ? (
                <SparklesIcon />
              ) : (
                <EditIcon />
              )
            }
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
                    (userDialogMode === "create" ? userDialogRole : "TEACHER")) as UserRole,
                )}
                size="small"
                color={getRoleChipColor(
                  ((selectedUser?.role as UserRole | undefined) ?? userDialogRole) as UserRole,
                )}
                sx={{ fontWeight: 700 }}
              />
            }
          />
          <AppDialogBody>
            <Stack spacing={2.25}>
              <FormSection>
                <Stack spacing={2.25}>
              <FormField>
                <TextField
                  label="Nazwa użytkownika"
                  value={userDraft.username}
                  onChange={(event) =>
                    setUserDraft((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </FormField>
              <FormField>
                <TextField
                  label="Adres e-mail"
                  type="email"
                  value={userDraft.email}
                  onChange={(event) =>
                    setUserDraft((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </FormField>
              {(userDialogMode === "create" || userDialogRole === "STUDENT") && (
                <>
                  {userDialogMode === "create" && (
                    <FormField>
                      <TextField
                        label="Hasło"
                        type="password"
                        value={userDraft.password}
                        onChange={(event) =>
                          setUserDraft((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        fullWidth
                      />
                    </FormField>
                  )}

                  {userDialogRole === "STUDENT" && (
                    <FormField>
                      <TextField
                        select
                        label="Grupa"
                        value={userDraft.groupId}
                        onChange={(event) =>
                          setUserDraft((current) => ({
                            ...current,
                            groupId:
                              event.target.value === ""
                                ? ""
                                : Number(event.target.value),
                          }))
                        }
                        fullWidth
                        helperText={
                          assignableGroups.length === 0
                            ? "Brak grup do wyboru"
                            : "Wybór grupy jest opcjonalny."
                        }
                      >
                        <MenuItem value="">Bez grupy</MenuItem>
                        {assignableGroups.map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </FormField>
                  )}
                </>
              )}
                </Stack>
              </FormSection>
            </Stack>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button onClick={closeUserDialog} sx={{ ...actionButtonSx, color: "text.secondary" }}>
                Anuluj
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={submitUserDialog}
                disabled={userDialogLoading}
                sx={actionButtonSx}
              >
                {userDialogLoading ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <AppDialog
          open={groupDialogOpen}
          onClose={closeGroupDialog}
          maxWidth="xs"
          paperSx={{ width: { xs: "calc(100% - 24px)", sm: uiTokens.modal.compactWidth } }}
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
            <FormSection>
              <Stack spacing={2.25}>
              <FormField>
                <TextField
                  label="Nazwa grupy"
                  value={groupDraft.name}
                  onChange={(event) =>
                    setGroupDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </FormField>
              <FormField>
                <TextField
                  label="Opis grupy"
                  value={groupDraft.description}
                  onChange={(event) =>
                    setGroupDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  multiline
                  minRows={4}
                  fullWidth
                />
              </FormField>
              <FormField>
                <TextField
                  select
                  label="Właściciel grupy"
                  value={groupDraft.teacherId}
                  onChange={(event) =>
                    setGroupDraft((current) => ({
                      ...current,
                      teacherId:
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                    }))
                  }
                  helperText="Wybierz nauczyciela, który ma zarządzać grupą."
                  fullWidth
                >
                  <MenuItem value="">Bez właściciela</MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.username}
                    </MenuItem>
                  ))}
                </TextField>
              </FormField>
              </Stack>
            </FormSection>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button onClick={closeGroupDialog} sx={{ ...actionButtonSx, color: "text.secondary" }}>
                Anuluj
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={submitGroupDialog}
                disabled={groupDialogLoading}
                sx={actionButtonSx}
              >
                {groupDialogLoading ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <AppDialog open={Boolean(deleteDialog)} onClose={closeDeleteDialog} maxWidth="xs">
          <AppDialogHeader
            icon={<DeleteIcon sx={{ color: "error.main" }} />}
            title={deleteDialog?.type === "user" ? "Usuń konto" : "Usuń grupę"}
            subtitle="Ta operacja jest nieodwracalna i natychmiast usuwa wskazany element."
            badge={<Chip label="Ostrzeżenie" size="small" color="error" sx={{ fontWeight: 700 }} />}
          />
          <AppDialogBody>
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
              <Button onClick={closeDeleteDialog} sx={{ ...actionButtonSx, color: "text.secondary" }}>
                Anuluj
              </Button>
              <Button
                color="error"
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={confirmDelete}
                disabled={deleteLoading}
                sx={actionButtonSx}
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
          paperSx={{ width: { xs: "calc(100% - 24px)", sm: uiTokens.modal.comfortableWidth } }}
        >
          <AppDialogHeader
            icon={<SchoolIcon />}
            title="Skład grupy"
            subtitle="Sprawdź aktualnych uczniów i dodaj nowe osoby przypisane do właściciela tej grupy."
            badge={<Chip label="Członkowie" size="small" color="primary" sx={{ fontWeight: 700 }} />}
          />
          <AppDialogBody>
            <Stack spacing={3}>
              <FormSection>
                <Stack spacing={0.75}>
                  <Typography variant="body1" fontWeight={700}>
                    {membershipDialog?.groupName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Właściciel:{" "}
                    <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {teacherNameById.get(membershipDialog?.teacherId ?? -1) ??
                        "Brak danych"}
                    </Box>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uczniowie w grupie: {currentMembershipStudents.length}
                  </Typography>
                </Stack>
              </FormSection>

              <FormSection title="Aktualni członkowie">
                {currentMembershipStudents.length === 0 ? (
                  <Alert severity="info">Ta grupa nie ma jeszcze żadnych uczniów.</Alert>
                ) : (
                  <Stack spacing={1}>
                    {currentMembershipStudents.map((student) => (
                      <Paper
                        key={student.id}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
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
                          <IconButton
                            aria-label={`Usuń ${student.username} z grupy`}
                            onClick={() => removeMembershipStudent(student.id)}
                            disabled={membershipLoading}
                            sx={{ ...panelIconButtonSx, color: "error.main" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </FormSection>

              <FormSection
                title="Dodaj ucznia"
                description="Lista pokazuje tylko uczni?w przypisanych do w?a?ciciela tej grupy."
              >
                <Autocomplete
                  size="small"
                  options={availableMembershipStudents.filter(
                    (student) => student.groupId !== membershipDialog?.groupId,
                  )}
                  value={
                    availableMembershipStudents.find(
                      (student) => student.id === membershipStudentId,
                    ) ?? null
                  }
                  onChange={(_, value) => setMembershipStudentId(value?.id ?? "")}
                  getOptionLabel={(option) => `${option.username} (${option.email})`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText="Brak wolnych uczni?w dla tego nauczyciela"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Wybierz ucznia"
                      helperText="Wyb?r ucznia od razu przygotuje go do dodania do tej grupy."
                    />
                  )}
                />
              </FormSection>
            </Stack>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button onClick={closeMembershipDialog} sx={{ ...actionButtonSx, color: "text.secondary" }}>
                Anuluj
              </Button>
              <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={addMembershipStudent}
                disabled={membershipLoading}
                sx={actionButtonSx}
              >
                {membershipLoading ? "Zapisywanie..." : "Dodaj ucznia"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <Snackbar
          open={Boolean(toast)}
          autoHideDuration={4000}
          onClose={() => setToast(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setToast(null)}
            severity={toast?.severity ?? "success"}
            sx={{ width: "100%" }}
          >
            {toast?.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

