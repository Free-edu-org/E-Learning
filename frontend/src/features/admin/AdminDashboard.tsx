import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  DarkMode as DarkModeIcon,
  DeleteOutline as DeleteIcon,
  GroupOutlined as GroupIcon,
  LightMode as LightModeIcon,
  LogoutOutlined as LogoutIcon,
  ManageAccountsOutlined as ManageAccountsIcon,
  PeopleOutline as PeopleIcon,
  PersonOutline as PersonIcon,
  RefreshOutlined as RefreshIcon,
  SaveOutlined as SaveIcon,
  SchoolOutlined as SchoolIcon,
  SearchOutlined as SearchIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  adminService,
  type AdminCreateStudentRequest,
  type AdminStats,
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
}

interface MembershipDialogState {
  groupId: number;
  groupName: string;
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

export function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { toggleColorMode } = useAppTheme();

  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [userFilter, setUserFilter] = useState<UserFilter>("ALL");
  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentUserError, setCurrentUserError] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
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
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDraft, setUserDraft] = useState<UserDraft>(emptyUserDraft);
  const [userDialogLoading, setUserDialogLoading] = useState(false);
  const [userLookupId, setUserLookupId] = useState("");
  const [userLookupLoading, setUserLookupLoading] = useState(false);
  const [userLookupError, setUserLookupError] = useState<string | null>(null);

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
  const [membershipMode, setMembershipMode] = useState<"add" | "remove">(
    "add",
  );
  const [membershipUserId, setMembershipUserId] = useState("");
  const [membershipLoading, setMembershipLoading] = useState(false);

  const allUsers = useMemo(
    () => [
      ...teachers.map((user) => ({ ...user, role: "TEACHER" as const })),
      ...students.map((user) => ({ ...user, role: "STUDENT" as const })),
    ],
    [teachers, students],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = userSearch.trim().toLowerCase();
    return allUsers.filter((user) => {
      if (userFilter !== "ALL" && user.role !== userFilter) {
        return false;
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
  }, [allUsers, userFilter, userSearch]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = groupSearch.trim().toLowerCase();
    return groups.filter((group) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        group.name.toLowerCase().includes(normalizedQuery) ||
        group.description.toLowerCase().includes(normalizedQuery) ||
        String(group.id).includes(normalizedQuery)
      );
    });
  }, [groupSearch, groups]);

  const assignableGroups = useMemo(() => {
    if (userDraft.teacherId === "") {
      return [];
    }

    return groups.filter((group) => group.teacherId === userDraft.teacherId);
  }, [groups, userDraft.teacherId]);

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
    setUserLookupError(null);
  };

  const openEditUserDialog = (user: UserProfile) => {
    setUserDialogMode("edit");
    setUserDialogRole(user.role as UserRole);
    setSelectedUser(user);
    setUserDraft({
      username: user.username,
      email: user.email,
      password: "",
      teacherId: user.teacherId ?? "",
      groupId: "",
    });
    setUserDialogOpen(true);
    setUserLookupError(null);
  };

  const closeUserDialog = () => {
    if (userDialogLoading || userLookupLoading) {
      return;
    }
    setUserDialogOpen(false);
    setSelectedUser(null);
    setUserDraft(emptyUserDraft);
    setUserLookupId("");
    setUserLookupError(null);
  };

  const handleLookupUser = async () => {
    const parsedId = Number(userLookupId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setUserLookupError("Podaj poprawne dodatnie ID uzytkownika.");
      return;
    }

    setUserLookupLoading(true);
    setUserLookupError(null);
    try {
      const user = await userService.getUserById(parsedId);
      openEditUserDialog(user);
      setUserDialogOpen(true);
      setUserLookupId(String(user.id));
    } catch (error) {
      setUserLookupError(
        getErrorMessage(error, "Nie udalo sie pobrac uzytkownika po ID."),
      );
    } finally {
      setUserLookupLoading(false);
    }
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
        const payload: UpdateUserRequest = {
          username: userDraft.username,
          email: userDraft.email,
        };
        const updated = await userService.updateUser(selectedUser.id, payload);
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

  const openMembershipDialog = (
    group: UserGroup,
    mode: "add" | "remove",
  ) => {
    setMembershipDialog({ groupId: group.id, groupName: group.name });
    setMembershipMode(mode);
    setMembershipUserId("");
  };

  const closeMembershipDialog = () => {
    if (membershipLoading) {
      return;
    }
    setMembershipDialog(null);
    setMembershipUserId("");
  };

  const submitMembershipDialog = async () => {
    if (!membershipDialog) {
      return;
    }
    if (membershipLoading) {
      return;
    }

    const parsedId = Number(membershipUserId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      showToast("error", "Podaj poprawne ID ucznia.");
      return;
    }

    setMembershipLoading(true);
    try {
      if (membershipMode === "add") {
        await userGroupService.addStudentToGroup(membershipDialog.groupId, parsedId);
        showToast("success", `Uczen ${parsedId} zostal dodany do grupy.`);
      } else {
        await userGroupService.removeStudentFromGroup(
          membershipDialog.groupId,
          parsedId,
        );
        showToast("success", `Uczen ${parsedId} zostal usuniety z grupy.`);
      }
      await loadGroups();
      closeMembershipDialog();
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
                      startIcon={<RefreshIcon />}
                      onClick={loadUsers}
                      disabled={usersLoading}
                      sx={topToolbarButtonSx}
                    >
                      Odswiez
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AddCircleIcon />}
                      onClick={() => openCreateUserDialog("TEACHER")}
                      sx={topToolbarButtonSx}
                    >
                      Nauczyciel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AddCircleIcon />}
                      onClick={() => openCreateUserDialog("STUDENT")}
                      sx={topToolbarButtonSx}
                    >
                      Uczen
                    </Button>
                  </Stack>
                </Stack>

                {usersError && <Alert severity="warning">{usersError}</Alert>}
                {userLookupError && <Alert severity="warning">{userLookupError}</Alert>}

                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    flexWrap: { xs: "wrap", lg: "nowrap" },
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
                      flex: { xs: "1 1 100%", lg: "1 1 320px" },
                    }}
                  />

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", lg: "block" } }}
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
                        borderRadius: "8px !important",
                      }}
                    >
                      Wszyscy
                    </ToggleButton>
                    <ToggleButton
                      value="TEACHER"
                      sx={{ textTransform: "none", px: 1.5 }}
                    >
                      Nauczyciele
                    </ToggleButton>
                    <ToggleButton
                      value="STUDENT"
                      sx={{ textTransform: "none", px: 1.5 }}
                    >
                      Uczniowie
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", lg: "block" } }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flex: { xs: "1 1 100%", lg: "0 0 auto" },
                      width: { xs: "100%", lg: "auto" },
                    }}
                  >
                    <TextField
                      label="ID"
                      size="small"
                      value={userLookupId}
                      onChange={(event) => setUserLookupId(event.target.value)}
                      sx={{
                        width: { xs: "100%", sm: 112 },
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          minHeight: 40,
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={
                        userLookupLoading ? (
                          <CircularProgress size={14} />
                        ) : (
                          <SearchIcon />
                        )
                      }
                      onClick={handleLookupUser}
                      disabled={userLookupLoading}
                      sx={{
                        ...topToolbarButtonSx,
                        minWidth: 116,
                        alignSelf: "stretch",
                      }}
                    >
                      Otworz
                    </Button>
                  </Box>
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
                                {user.role === "STUDENT" && (
                                  <Chip
                                    label={`Teacher ID: ${user.teacherId ?? "brak"}`}
                                    size="small"
                                    variant="outlined"
                                    sx={outlinedChipSx}
                                  />
                                )}
                              </Stack>

                              <Divider />

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<SaveIcon />}
                                  onClick={() => openEditUserDialog(user)}
                                  sx={actionButtonSx}
                                >
                                  Edytuj
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<DeleteIcon />}
                                  onClick={() =>
                                    openDeleteDialog({
                                      type: "user",
                                      id: user.id,
                                      label: user.username,
                                    })
                                  }
                                  sx={actionButtonSx}
                                >
                                  Usun
                                </Button>
                              </Stack>
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
                      startIcon={<RefreshIcon />}
                      onClick={loadGroups}
                      disabled={groupsLoading}
                      sx={topToolbarButtonSx}
                    >
                      Odswiez
                    </Button>
                    <Button
                      variant="contained"
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
                    sx={{ ...toolbarFieldSx, flex: "1 1 260px" }}
                  />
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

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<SaveIcon />}
                                  onClick={() => openEditGroupDialog(group)}
                                  sx={actionButtonSx}
                                >
                                  Edytuj
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<SchoolIcon />}
                                  onClick={() => openMembershipDialog(group, "add")}
                                  sx={actionButtonSx}
                                >
                                  Dodaj ucznia
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => openMembershipDialog(group, "remove")}
                                  sx={actionButtonSx}
                                >
                                  Usun ucznia
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<DeleteIcon />}
                                  onClick={() =>
                                    openDeleteDialog({
                                      type: "group",
                                      id: group.id,
                                      label: group.name,
                                    })
                                  }
                                  sx={actionButtonSx}
                                >
                                  Usun
                                </Button>
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
        >
          <DialogTitle>
            {userDialogMode === "create"
              ? userDialogRole === "TEACHER"
                ? "Nowe konto nauczyciela"
                : "Nowe konto ucznia"
              : `Edycja konta ${selectedUser?.username ?? ""}`}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
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
                    <Chip
                      label={`Teacher ID: ${selectedUser.teacherId ?? "brak"}`}
                      size="small"
                    />
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
              {userDialogMode === "create" && (
                <>
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
            <Button onClick={closeUserDialog}>Anuluj</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={submitUserDialog}
              disabled={
                userDialogLoading ||
                (userDialogMode === "create" &&
                  userDialogRole === "STUDENT" &&
                  userDraft.teacherId === "")
              }
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
        >
          <DialogTitle>
            {groupDialogMode === "create" ? "Nowa grupa" : "Edycja grupy"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
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
            <Button onClick={closeGroupDialog}>Anuluj</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={submitGroupDialog}
              disabled={groupDialogLoading}
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
        >
          <DialogTitle>
            {deleteDialog?.type === "user" ? "Usun konto" : "Usun grupe"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              {deleteDialog?.type === "user"
                ? `Czy na pewno chcesz usunac konto "${deleteDialog?.label}"?`
                : `Czy na pewno chcesz usunac grupe "${deleteDialog?.label}"?`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Operacji nie da sie cofnac.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeDeleteDialog}>Anuluj</Button>
            <Button
              color="error"
              variant="contained"
              startIcon={<DeleteIcon />}
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Usuwanie..." : "Potwierdz usuniecie"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={Boolean(membershipDialog)}
          onClose={closeMembershipDialog}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            {membershipMode === "add" ? "Dodaj ucznia" : "Usun ucznia"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Grupa: {membershipDialog?.groupName}
              </Typography>
              <TextField
                label="ID ucznia"
                value={membershipUserId}
                onChange={(event) => setMembershipUserId(event.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeMembershipDialog}>Anuluj</Button>
            <Button
              variant="contained"
              onClick={submitMembershipDialog}
              disabled={membershipLoading}
            >
              {membershipLoading
                ? "Zapisywanie..."
                : membershipMode === "add"
                  ? "Dodaj"
                  : "Usun"}
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
