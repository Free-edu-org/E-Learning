import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  TextField,
  Typography,
  Switch,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  LogoutOutlined as LogoutIcon,
  GroupOutlined as GroupIcon,
  PersonAddOutlined as PersonAddIcon,
  AddCircleOutlined as AddIcon,
  SchoolOutlined as SchoolIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useAppTheme } from "@/context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/api/userService";
import { lessonService } from "@/api/lessonService";
import { taskService } from "@/api/taskService";
import type { UserProfile } from "@/api/userService";
import type { Group, Lesson, TeacherStats } from "@/api/lessonService";
import { ApiError } from "@/api/apiClient";
import { StatsCard } from "@/components/teacher/StatsCard";
import { ActionButton } from "@/components/teacher/ActionButton";
import { LessonCard } from "@/components/teacher/LessonCard";
import {
  LessonToolbar,
  type StatusFilter,
  type SortMode,
  type ViewMode,
} from "@/components/teacher/LessonToolbar";

export function TeacherDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { toggleColorMode } = useAppTheme();

  // ── Data state ──
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);
  const [errorData, setErrorData] = useState<string | null>(null);

  // ── Toolbar state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("date_desc");
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);

  // ── Create lesson overlay state ──
  const [showCreateOverlay, setShowCreateOverlay] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [newGroups, setNewGroups] = useState<Group[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Fetch user profile ──
  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          if (err.problem.status === 403) {
            setErrorUser("Brak uprawnień do panelu nauczyciela.");
            return;
          }
          setErrorUser(err.problem.detail || "Nie udało się pobrać profilu.");
        } else {
          setErrorUser("Błąd połączenia z serwerem.");
        }
      })
      .finally(() => setLoadingUser(false));
  }, []);

  // ── Fetch stats, lessons, and available groups ──
  useEffect(() => {
    Promise.all([
      lessonService.getTeacherStats(),
      lessonService.getTeacherLessons(),
      lessonService.getTeacherGroups(),
    ])
      .then(([s, l, g]) => {
        setStats(s);
        setLessons(l);
        setAvailableGroups(g);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.problem.status === 403) {
          setErrorData("Brak uprawnień do panelu nauczyciela.");
          return;
        }
        setErrorData("Nie udało się pobrać danych. Spróbuj ponownie.");
      })
      .finally(() => setLoadingData(false));
  }, []);

  // ── Derived: filtered + sorted lessons ──
  const displayedLessons = useMemo(() => {
    let result = lessons;

    // Search filter (title or theme)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.theme.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((l) => l.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((l) => !l.isActive);
    }

    // Group filter – lesson must have at least one selected group
    if (selectedGroups.length > 0) {
      const selectedIds = new Set(selectedGroups.map((g) => g.id));
      result = result.filter((l) =>
        l.groups.some((g) => selectedIds.has(g.id)),
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortMode) {
        case "date_asc":
          return a.createdAt.localeCompare(b.createdAt);
        case "date_desc":
          return b.createdAt.localeCompare(a.createdAt);
        case "title_az":
          return a.title.localeCompare(b.title, "pl");
        case "title_za":
          return b.title.localeCompare(a.title, "pl");
        default:
          return 0;
      }
    });

    return result;
  }, [lessons, searchQuery, statusFilter, selectedGroups, sortMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleOpenCreateOverlay = () => {
    setNewTitle("");
    setNewTheme("");
    setNewGroups([]);
    setCreateError(null);
    setShowCreateOverlay(true);
  };

  const handleCreateLesson = async () => {
    if (!newTitle.trim() || !newTheme.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await lessonService.createLesson({
        title: newTitle.trim(),
        theme: newTheme.trim(),
        groupIds: newGroups.length > 0 ? newGroups.map((g) => g.id) : undefined,
      });
      setShowCreateOverlay(false);
      navigate(`/teacher/lesson/${created.id}/tasks`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setCreateError(err.problem.detail || "Nie udało się utworzyć lekcji.");
      } else {
        setCreateError("Błąd połączenia z serwerem.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (lessonId: number, newActive: boolean) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, isActive: newActive } : l)),
    );
    try {
      await lessonService.toggleLessonStatus(lessonId, newActive);
      const [newStats] = await Promise.all([lessonService.getStats()]);
      setStats(newStats);
    } catch {
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId ? { ...l, isActive: !newActive } : l,
        ),
      );
    }
  };

  const handleAssignGroups = async (lessonId: number, groupIds: number[]) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    await lessonService.updateLesson(lessonId, {
      title: lesson.title,
      theme: lesson.theme,
      groupIds,
    });
    const updated = await lessonService.getLessons();
    setLessons(updated);
  };

  const handleOpenStudents = async (lessonId: number) => {
    const [allStudents, assignedStudents] = await Promise.all([
      lessonService.getAllStudents(),
      lessonService.getAssignedStudents(lessonId),
    ]);
    return { allStudents, assignedStudents };
  };

  const handleAssignStudent = async (lessonId: number, userId: number) => {
    await lessonService.assignStudent(lessonId, userId);
  };

  const handleRemoveStudent = async (lessonId: number, userId: number) => {
    await lessonService.removeStudent(lessonId, userId);
  };

  const handleResetStudent = async (lessonId: number, userId: number) => {
    await taskService.resetStudent(lessonId, userId);
  };

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        {/* ── TOP RIGHT BAR ── */}
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

        {/* ── HEADER ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
              <SchoolIcon sx={{ color: "primary.main" }} />
            </Box>
            <Box>
              {loadingUser ? (
                <Skeleton width={180} height={28} />
              ) : (
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  Witaj, {user?.username ?? "Nauczyciel"}!
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Panel nauczyciela
              </Typography>
            </Box>
          </Box>
        </Box>

        {errorUser && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            {errorUser}
          </Alert>
        )}

        {/* ── STATS ── */}
        {loadingData ? (
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={90}
                sx={{ flex: 1, borderRadius: 3 }}
              />
            ))}
          </Box>
        ) : errorData ? (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {errorData}
          </Alert>
        ) : (
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <StatsCard label="Liczba lekcji" value={stats?.totalLessons ?? 0} />
            <StatsCard
              label="Aktywne lekcje"
              value={stats?.activeLessons ?? 0}
              highlightColor={theme.palette.primary.main}
            />
            <StatsCard
              label="Aktywni uczniowie"
              value={stats?.activeStudents ?? 0}
            />
            <StatsCard
              label="Średnia wyników"
              value={`${stats?.avgScore ?? 0}%`}
            />
          </Box>
        )}

        {/* ── ACTIONS ── */}
        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          <ActionButton
            icon={<PersonAddIcon sx={{ fontSize: 32 }} />}
            title="Zarządzaj uczniami"
            subtitle="Dodaj, edytuj, archiwizuj"
          />
          <ActionButton
            icon={<GroupIcon sx={{ fontSize: 32 }} />}
            title="Zarządzaj grupami"
            subtitle="Twórz grupy, przydzielaj uczniów"
          />
          <ActionButton
            icon={<AddIcon sx={{ fontSize: 32 }} />}
            title="Utwórz lekcję"
            subtitle="Nowa lekcja z zadaniami"
            onClick={handleOpenCreateOverlay}
          />
        </Box>

        {/* ── LESSONS HEADER ── */}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="primary.main"
          sx={{ mb: 1.5 }}
        >
          Moje lekcje
        </Typography>

        {/* ── TOOLBAR ── */}
        <LessonToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          availableGroups={availableGroups}
          selectedGroups={selectedGroups}
          onSelectedGroupsChange={setSelectedGroups}
        />

        {/* ── LESSON LIST ── */}
        {loadingData ? (
          <Grid container spacing={2}>
            {[...Array(8)].map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Skeleton
                  variant="rounded"
                  height={220}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : displayedLessons.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {lessons.length === 0
              ? 'Nie masz jeszcze żadnych lekcji. Kliknij "Utwórz lekcję", aby dodać pierwszą.'
              : "Brak lekcji pasujących do wybranych filtrów."}
          </Alert>
        ) : viewMode === "list" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {displayedLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} listView onToggleStatus={handleToggleStatus} onAssignGroups={handleAssignGroups} availableGroups={availableGroups} onOpenStudents={handleOpenStudents} onAssignStudent={handleAssignStudent} onRemoveStudent={handleRemoveStudent} onResetStudent={handleResetStudent} />
            ))}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {displayedLessons.map((lesson) => (
              <Grid key={lesson.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LessonCard lesson={lesson} onToggleStatus={handleToggleStatus} onAssignGroups={handleAssignGroups} availableGroups={availableGroups} onOpenStudents={handleOpenStudents} onAssignStudent={handleAssignStudent} onRemoveStudent={handleRemoveStudent} onResetStudent={handleResetStudent} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ── CREATE LESSON OVERLAY ── */}
      {showCreateOverlay && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            bgcolor: pageBg,
            overflow: "auto",
          }}
        >
          <Container maxWidth="sm" sx={{ pt: 4, pb: 6 }}>
            {/* Overlay header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 4,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: 1,
                  }}
                >
                  <AddIcon sx={{ color: "primary.main" }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                    Utwórz lekcję
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Nowa lekcja z zadaniami
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setShowCreateOverlay(false)}
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Form */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {createError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {createError}
                </Alert>
              )}

              <TextField
                label="Tytuł lekcji"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                fullWidth
                autoFocus
                sx={{ mb: 2.5 }}
              />

              <TextField
                label="Temat"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2.5 }}
              />

              <Autocomplete
                multiple
                options={availableGroups}
                getOptionLabel={(o) => o.name}
                value={newGroups}
                onChange={(_, v) => setNewGroups(v)}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...rest } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.name}
                        size="small"
                        {...rest}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Grupy (opcjonalnie)"
                    helperText="Przypisz lekcję do grup, aby uczniowie mieli do niej dostęp"
                  />
                )}
                sx={{ mb: 3 }}
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={handleCreateLesson}
                disabled={creating || !newTitle.trim() || !newTheme.trim()}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.5,
                }}
              >
                {creating ? "Tworzenie..." : "Utwórz i dodaj zadania"}
              </Button>
            </Paper>
          </Container>
        </Box>
      )}
    </Box>
  );
}
