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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";

type UserRole = "TEACHER" | "STUDENT";
type UserFilter = "ALL" | UserRole;
type AdminTab = "users" | "groups";
type AdminListUser = UserProfile | AdminStudentProfile;
type AdminViewMode = "grid" | "list";

interface UserDraft {
  username: string;
  email: string;
  password: string;
  teacherId: number | "";
  groupId: number | "";
}

interface GroupDraft {
  name: string;
  description: string;
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
  teacherId: "",
  groupId: "",
};
const emptyGroupDraft: GroupDraft = { name: "", description: "" };

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.problem.detail || error.problem.title || fallback;
  }
  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak polaczenia z serwerem.";
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
  minHeight: 40,
  px: 2,
  whiteSpace: "nowrap",
};

const outlinedChipSx = {
  borderRadius: "6px",
  maxWidth: "100%",
  "& .MuiChip-label": {
    overflowWrap: "anywhere",
  },
};

const modalPaperSx = {
  borderRadius: 4,
  overflow: "hidden",
  boxShadow: "0 24px 64px rgba(15, 23, 42, 0.18)",
};

const modalHeaderSx = {
  px: 3,
  py: 2.5,
  borderBottom: "1px solid",
  borderColor: "divider",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.96) 100%)",
};

const bottomIconButtonSx = {
  width: 38,
  height: 38,
  borderRadius: 2.5,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
  },
};

const listRowPaperSx = {
  p: 2,
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  transition: "box-shadow 0.2s, transform 0.15s",
  "&:hover": {
    boxShadow: 3,
    transform: "translateY(-1px)",
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
      if (userFilter !== "ALL" && user.role !== userFilter) {
        return false;
      }

      if (selectedTeacherIds.size > 0) {
        if (user.role === "TEACHER") {
          if (!selectedTeacherIds.has(user.id)) {
            return false;
          }
        } else if (!selectedTeacherIds.has(user.teacherId ?? -1)) {
          return false;
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
    selectedGroupFilters,
    selectedTeacherFilters,
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
    if (userDraft.teacherId === "") {
      return [];
    }

    return groups.filter((group) => group.teacherId === userDraft.teacherId);
  }, [groups, userDraft.teacherId]);

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
      (student) =>
        student.teacherId === membershipDialog.teacherId &&
        (student.groupId == null || student.groupId === membershipDialog.groupId),
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
        getErrorMessage(error, "Nie udalo sie pobrac list nauczycieli i uczniow."),
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
      teacherId: user.teacherId ?? "",
      groupId: "groupId" in user ? (user.groupId ?? "") : "",
    });
    setUserDialogOpen(true);
  };

  const closeUserDialog = () => {
    if (userDialogLoading) {
      return;
    }
    setUserDialogOpen(false);
    setSelectedUser(null);
    setUserDraft(emptyUserDraft);
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
          showToast("success", "Nauczyciel zostal utworzony.");
        } else {
          if (userDraft.teacherId === "") {
            showToast("error", "Wybierz nauczyciela dla nowego ucznia.");
            return;
          }

          const payload: AdminCreateStudentRequest = {
            username: userDraft.username,
            email: userDraft.email,
            password: userDraft.password,
            teacherId: userDraft.teacherId,
            ...(userDraft.groupId !== "" ? { groupId: userDraft.groupId } : {}),
          };

          await adminService.createStudent(payload);
          showToast("success", "Uczen zostal utworzony.");
        }
      } else if (selectedUser) {
        let updated: AdminListUser;

        if (selectedUser.role === "STUDENT") {
          if (userDraft.teacherId === "") {
            showToast("error", "Wybierz nauczyciela dla ucznia.");
            return;
          }

          const payload: AdminUpdateStudentRequest = {
            username: userDraft.username,
            email: userDraft.email,
            teacherId: userDraft.teacherId,
            ...(userDraft.groupId !== "" ? { groupId: userDraft.groupId } : {}),
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
        showToast("success", "Dane konta zostaly zapisane.");
      }

      await Promise.all([loadUsers(), loadAdminStats()]);
      closeUserDialog();
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udalo sie zapisac zmian konta."),
      );
    } finally {
      setUserDialogLoading(false);
    }
  };

  const openCreateGroupDialog = () => {
    setGroupDialogMode("create");
    setSelectedGroup(null);
    setGroupDraft(emptyGroupDraft);
    setGroupDialogOpen(true);
  };

  const openEditGroupDialog = (group: UserGroup) => {
    setGroupDialogMode("edit");
    setSelectedGroup(group);
    setGroupDraft({
      name: group.name,
      description: group.description,
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
      if (groupDialogMode === "create") {
        await userGroupService.createGroup(groupDraft);
        showToast("success", "Grupa zostala utworzona.");
      } else if (selectedGroup) {
        await userGroupService.updateGroup(selectedGroup.id, groupDraft);
        showToast("success", "Zmiany grupy zostaly zapisane.");
      }

      await Promise.all([loadGroups(), loadAdminStats()]);
      closeGroupDialog();
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udalo sie zapisac zmian grupy."),
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
        showToast("success", "Konto zostalo usuniete.");
      } else {
        await userGroupService.deleteGroup(deleteDialog.id);
        await Promise.all([loadGroups(), loadAdminStats()]);
        showToast("success", "Grupa zostala usunieta.");
      }
      closeDeleteDialog();
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udalo sie usunac wskazanego elementu."),
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
      showToast("success", "Uczen zostal dodany do grupy.");
      await Promise.all([loadGroups(), loadUsers()]);
      setMembershipStudentId("");
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udalo sie zmienic skladu grupy."),
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
      showToast("success", "Uczen zostal usuniety z grupy.");
      await Promise.all([loadGroups(), loadUsers()]);
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(error, "Nie udalo sie zmienic skladu grupy."),
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
                label="Wszyscy uzytkownicy"
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
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
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
                label="Uzytkownicy"
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
                      Konta nauczycieli i uczniow
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Filtruj liste, wyszukuj po nazwie lub ID i otwieraj edycje w
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
                      Odswiez
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddCircleIcon />}
                      onClick={() => openCreateUserDialog("TEACHER")}
                      sx={topToolbarButtonSx}
                    >
                      Nauczyciel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddCircleIcon />}
                      onClick={() => openCreateUserDialog("STUDENT")}
                      sx={topToolbarButtonSx}
                    >
                      Uczen
                    </Button>
                  </Stack>
                </Stack>

                {usersError && <Alert severity="warning">{usersError}</Alert>}

                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
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
                    Brak kont pasujacych do wybranych filtrow.
                  </Alert>
                ) : viewMode === "list" ? (
                  <Stack spacing={1.25}>
                    {filteredUsers.map((user) => (
                      <Paper key={`${user.role}-${user.id}`} elevation={0} sx={listRowPaperSx}>
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
                                color={user.role === "TEACHER" ? "info" : "success"}
                                icon={
                                  user.role === "TEACHER" ? <SchoolIcon /> : <PersonIcon />
                                }
                                label={
                                  user.role === "TEACHER" ? "Nauczyciel" : "Uczen"
                                }
                                size="small"
                              />
                              <Chip
                                label={`ID ${user.id}`}
                                size="small"
                                variant="outlined"
                                sx={outlinedChipSx}
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
                                  Nauczyciel:{" "}
                                  <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                                    {"teacherName" in user && user.teacherName
                                      ? user.teacherName
                                      : "Brak przypisania"}
                                  </Box>
                                </Typography>
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
                              sx={{ ...bottomIconButtonSx, color: "primary.main" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label={`Usun ${user.username}`}
                              onClick={() =>
                                openDeleteDialog({
                                  type: "user",
                                  id: user.id,
                                  label: user.username,
                                  detail:
                                    user.role === "STUDENT" &&
                                    "teacherName" in user &&
                                    user.teacherName
                                      ? `Uczen przypisany do ${user.teacherName}`
                                      : user.email,
                                })
                              }
                              sx={{ ...bottomIconButtonSx, color: "error.main" }}
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
                        <Card
                          elevation={0}
                          sx={{
                            height: "100%",
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            transition: "box-shadow 0.2s, transform 0.15s",
                            "&:hover": {
                              boxShadow: 3,
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <CardContent sx={{ height: "100%" }}>
                            <Stack spacing={2}>
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
                                    sx={{
                                      lineHeight: 1.4,
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {user.username}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
                                  >
                                    {user.email}
                                  </Typography>
                                </Box>
                                <Chip
                                  color={user.role === "TEACHER" ? "info" : "success"}
                                  icon={
                                    user.role === "TEACHER" ? (
                                      <SchoolIcon />
                                    ) : (
                                      <PersonIcon />
                                    )
                                  }
                                  label={user.role === "TEACHER" ? "Nauczyciel" : "Uczen"}
                                  size="small"
                                  sx={{ flexShrink: 0 }}
                                />
                              </Stack>

                              {user.role === "STUDENT" && (
                                <Stack spacing={1}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
                                  >
                                    Nauczyciel:{" "}
                                    <Box
                                      component="span"
                                      sx={{ fontWeight: 700, color: "text.primary" }}
                                    >
                                      {"teacherName" in user && user.teacherName
                                        ? user.teacherName
                                        : "Brak przypisania"}
                                    </Box>
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
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
                                </Stack>
                              )}

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                  label={`ID ${user.id}`}
                                  size="small"
                                  variant="outlined"
                                  sx={outlinedChipSx}
                                />
                                <Chip
                                  label={`Utworzono ${formatDate(user.createdAt)}`}
                                  size="small"
                                  variant="outlined"
                                  sx={outlinedChipSx}
                                />
                              </Stack>

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: 1,
                                  pt: 0.5,
                                }}
                              >
                                <IconButton
                                  aria-label={`Edytuj ${user.username}`}
                                  onClick={() => openEditUserDialog(user)}
                                  sx={{
                                    ...bottomIconButtonSx,
                                    color: "primary.main",
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  aria-label={`Usun ${user.username}`}
                                  onClick={() =>
                                    openDeleteDialog({
                                      type: "user",
                                      id: user.id,
                                      label: user.username,
                                      detail:
                                        user.role === "STUDENT" &&
                                        "teacherName" in user &&
                                        user.teacherName
                                          ? `Uczen przypisany do ${user.teacherName}`
                                          : user.email,
                                    })
                                  }
                                  sx={{
                                    ...bottomIconButtonSx,
                                    color: "error.main",
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
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
                      Grupy i sklad uczniow
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tworz grupy, edytuj je i zarzadzaj czlonkami przez dedykowane
                      okna akcji.
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={loadGroups}
                      disabled={groupsLoading}
                      sx={topToolbarButtonSx}
                    >
                      Odswiez
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
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
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
                    Brak grup pasujacych do aktualnych filtrow.
                  </Alert>
                ) : viewMode === "list" ? (
                  <Stack spacing={1.25}>
                    {filteredGroups.map((group) => (
                      <Paper key={group.id} elevation={0} sx={listRowPaperSx}>
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
                                label={`${group.studentCount} uczniow`}
                                color="warning"
                                size="small"
                              />
                              <Chip
                                label={`ID ${group.id}`}
                                size="small"
                                variant="outlined"
                                sx={outlinedChipSx}
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
                                Wlasciciel:{" "}
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
                            >
                              Sklad grupy
                            </Button>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignSelf={{ xs: "flex-end", sm: "center" }}
                            >
                              <IconButton
                                aria-label={`Edytuj ${group.name}`}
                                onClick={() => openEditGroupDialog(group)}
                                sx={{ ...bottomIconButtonSx, color: "primary.main" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                aria-label={`Usun ${group.name}`}
                                onClick={() =>
                                  openDeleteDialog({
                                    type: "group",
                                    id: group.id,
                                    label: group.name,
                                    detail: group.description,
                                  })
                                }
                                sx={{ ...bottomIconButtonSx, color: "error.main" }}
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
                        <Card
                          elevation={0}
                          sx={{
                            height: "100%",
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            transition: "box-shadow 0.2s, transform 0.15s",
                            "&:hover": {
                              boxShadow: 3,
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <CardContent sx={{ height: "100%" }}>
                            <Stack spacing={2}>
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
                                    sx={{
                                      lineHeight: 1.4,
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {group.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
                                  >
                                    {group.description || "Brak opisu grupy."}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1, overflowWrap: "anywhere" }}
                                  >
                                    Wlasciciel:{" "}
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
                                  label={`${group.studentCount} uczniow`}
                                  color="warning"
                                  size="small"
                                  sx={{ flexShrink: 0 }}
                                />
                              </Stack>

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                  label={`ID ${group.id}`}
                                  size="small"
                                  variant="outlined"
                                  sx={outlinedChipSx}
                                />
                                <Chip
                                  label={`Utworzono ${formatDate(group.createdAt)}`}
                                  size="small"
                                  variant="outlined"
                                  sx={outlinedChipSx}
                                />
                              </Stack>

                              <Divider />

                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent="space-between"
                                flexWrap="wrap"
                                useFlexGap
                              >
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<SchoolIcon />}
                                    onClick={() => openMembershipDialog(group)}
                                    sx={actionButtonSx}
                                  >
                                    Sklad grupy
                                  </Button>
                                </Stack>

                                <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
                                  <IconButton
                                    aria-label={`Edytuj ${group.name}`}
                                    onClick={() => openEditGroupDialog(group)}
                                    sx={{
                                      ...bottomIconButtonSx,
                                      color: "primary.main",
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    aria-label={`Usun ${group.name}`}
                                    onClick={() =>
                                      openDeleteDialog({
                                        type: "group",
                                        id: group.id,
                                        label: group.name,
                                        detail: group.description,
                                      })
                                    }
                                    sx={{
                                      ...bottomIconButtonSx,
                                      color: "error.main",
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Stack>
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

        <Dialog
          open={userDialogOpen}
          onClose={closeUserDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: modalPaperSx }}
        >
          <DialogTitle sx={modalHeaderSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                }}
              >
                {userDialogMode === "create" ? (
                  <SparklesIcon sx={{ color: "primary.main" }} />
                ) : (
                  <EditIcon sx={{ color: "primary.main" }} />
                )}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {userDialogMode === "create"
                    ? userDialogRole === "TEACHER"
                      ? "Nowe konto nauczyciela"
                      : "Nowe konto ucznia"
                    : `Edycja konta ${selectedUser?.username ?? ""}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userDialogRole === "TEACHER"
                    ? "Utworz lub zaktualizuj konto nauczyciela."
                    : "Zarzadzaj danymi ucznia, nauczycielem i grupa."}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Stack spacing={2.5}>
              {selectedUser && userDialogMode === "edit" && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`ID ${selectedUser.id}`} size="small" />
                  <Chip
                    label={
                      selectedUser.role === "TEACHER" ? "Nauczyciel" : "Uczen"
                    }
                    size="small"
                    color={selectedUser.role === "TEACHER" ? "info" : "success"}
                  />
                  {selectedUser.role === "STUDENT" && (
                    <>
                      <Chip
                        label={
                          "teacherName" in selectedUser && selectedUser.teacherName
                            ? `Nauczyciel: ${selectedUser.teacherName}`
                            : "Nauczyciel: brak"
                        }
                        size="small"
                      />
                      <Chip
                        label={
                          "groupName" in selectedUser && selectedUser.groupName
                            ? `Grupa: ${selectedUser.groupName}`
                            : "Grupa: bez przypisania"
                        }
                        size="small"
                      />
                    </>
                  )}
                </Stack>
              )}

              <TextField
                label="Nazwa uzytkownika"
                value={userDraft.username}
                onChange={(event) =>
                  setUserDraft((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Email"
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
              {(userDialogMode === "create" || userDialogRole === "STUDENT") && (
                <>
                  {userDialogMode === "create" && (
                    <TextField
                      label="Haslo"
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
                  )}

                  {userDialogRole === "STUDENT" && (
                    <>
                      <TextField
                        select
                        label="Nauczyciel"
                        value={userDraft.teacherId}
                        onChange={(event) => {
                          const nextTeacherId =
                            event.target.value === ""
                              ? ""
                              : Number(event.target.value);

                          setUserDraft((current) => ({
                            ...current,
                            teacherId: nextTeacherId,
                            groupId:
                              nextTeacherId !== "" &&
                              current.groupId !== "" &&
                              groups.some(
                                (group) =>
                                  group.id === current.groupId &&
                                  group.teacherId === nextTeacherId,
                              )
                                ? current.groupId
                                : "",
                          }));
                        }}
                        fullWidth
                        required
                        helperText="Nowy uczen musi byc przypisany do nauczyciela."
                      >
                        <MenuItem value="">Wybierz nauczyciela</MenuItem>
                        {teachers.map((teacher) => (
                          <MenuItem key={teacher.id} value={teacher.id}>
                            {teacher.username} ({teacher.email})
                          </MenuItem>
                        ))}
                      </TextField>

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
                        disabled={userDraft.teacherId === ""}
                        helperText={
                          userDraft.teacherId === ""
                            ? "Najpierw wybierz nauczyciela."
                            : assignableGroups.length === 0
                              ? "Ten nauczyciel nie ma jeszcze zadnej grupy. Uczen zostanie utworzony bez grupy."
                              : "Przypisanie do grupy jest opcjonalne."
                        }
                      >
                        <MenuItem value="">Bez grupy</MenuItem>
                        {assignableGroups.map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </>
                  )}
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeUserDialog} sx={actionButtonSx}>
              Anuluj
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={submitUserDialog}
              disabled={
                userDialogLoading ||
                (userDialogRole === "STUDENT" && userDraft.teacherId === "")
              }
              sx={actionButtonSx}
            >
              {userDialogLoading ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={groupDialogOpen}
          onClose={closeGroupDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: modalPaperSx }}
        >
          <DialogTitle sx={modalHeaderSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                }}
              >
                <GroupIcon sx={{ color: "primary.main" }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {groupDialogMode === "create" ? "Nowa grupa" : "Edycja grupy"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Utrzymaj czytelny opis i nazwe zgodna z przeznaczeniem grupy.
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Stack spacing={2.5}>
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
              <TextField
                label="Opis"
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
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeGroupDialog} sx={actionButtonSx}>
              Anuluj
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={submitGroupDialog}
              disabled={groupDialogLoading}
              sx={actionButtonSx}
            >
              {groupDialogLoading ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={Boolean(deleteDialog)}
          onClose={closeDeleteDialog}
          fullWidth
          maxWidth="xs"
          PaperProps={{ sx: modalPaperSx }}
        >
          <DialogTitle sx={modalHeaderSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: "rgba(220, 38, 38, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DeleteIcon sx={{ color: "error.main" }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {deleteDialog?.type === "user" ? "Usun konto" : "Usun grupe"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ta operacja jest nieodwracalna.
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
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
            </Paper>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {deleteDialog?.type === "user"
                ? "Usuniecie konta skasuje dostep tego uzytkownika do systemu."
                : "Usuniecie grupy wyczysci tez jej sklad i przypisania."}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeDeleteDialog} sx={actionButtonSx}>
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
              {deleteLoading ? "Usuwanie..." : "Potwierdz usuniecie"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={Boolean(membershipDialog)}
          onClose={closeMembershipDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: modalPaperSx }}
        >
          <DialogTitle sx={modalHeaderSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                }}
              >
                <SchoolIcon sx={{ color: "primary.main" }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Zarzadzaj skladem grupy
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aktualny sklad widzisz od razu, a nowych uczniow dodajesz z listy
                  przypisanego nauczyciela.
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Stack spacing={2.5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Stack spacing={0.75}>
                  <Typography variant="body1" fontWeight={700}>
                    {membershipDialog?.groupName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Wlasciciel:{" "}
                    <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {teacherNameById.get(membershipDialog?.teacherId ?? -1) ??
                        "Brak danych"}
                    </Box>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uczniowie w grupie: {currentMembershipStudents.length}
                  </Typography>
                </Stack>
              </Paper>

              <Stack spacing={1.25}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Aktualni czlonkowie
                </Typography>
                {currentMembershipStudents.length === 0 ? (
                  <Alert severity="info">Ta grupa nie ma jeszcze zadnych uczniow.</Alert>
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
                            aria-label={`Usun ${student.username} z grupy`}
                            onClick={() => removeMembershipStudent(student.id)}
                            disabled={membershipLoading}
                            sx={{ ...bottomIconButtonSx, color: "error.main" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>

              <Divider />

              <Stack spacing={1.25}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Dodaj ucznia
                </Typography>
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
                  noOptionsText="Brak wolnych uczniow dla tego nauczyciela"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Wybierz ucznia"
                      helperText="Pokazujemy tylko uczniow przypisanych do wlasciciela tej grupy."
                    />
                  )}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeMembershipDialog} sx={actionButtonSx}>
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
          </DialogActions>
        </Dialog>

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
