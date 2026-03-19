import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
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
} from "@mui/icons-material";
import { useAppTheme } from "@/context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/api/userService";
import { lessonService } from "@/api/lessonService";
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

  // ── Fetch user profile ──
  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
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
      lessonService.getStats(),
      lessonService.getLessons(),
      lessonService.getGroups(),
    ])
      .then(([s, l, g]) => {
        setStats(s);
        setLessons(l);
        setAvailableGroups(g);
      })
      .catch(() => {
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
      result = result.filter((l) => l.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((l) => !l.is_active);
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
          return a.created_at.localeCompare(b.created_at);
        case "date_desc":
          return b.created_at.localeCompare(a.created_at);
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

  const pageBg =
    theme.palette.mode === "light" ? "#e8eef7" : theme.palette.background.default;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="lg" sx={{ pt: 4 }}>

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

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={theme.palette.mode === "dark" ? "Tryb jasny" : "Tryb ciemny"}>
              <IconButton
                onClick={toggleColorMode}
                size="small"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                }}
              >
                {theme.palette.mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Wyloguj
            </Button>
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
              <Skeleton key={i} variant="rounded" height={90} sx={{ flex: 1, borderRadius: 3 }} />
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
            <StatsCard label="Aktywni uczniowie" value={stats?.activeStudents ?? 0} />
            <StatsCard label="Średnia wyników" value={`${stats?.avgScore ?? 0}%`} />
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
            {[...Array(6)].map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : displayedLessons.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {lessons.length === 0
              ? "Nie masz jeszcze żadnych lekcji. Kliknij \"Utwórz lekcję\", aby dodać pierwszą."
              : "Brak lekcji pasujących do wybranych filtrów."}
          </Alert>
        ) : viewMode === "list" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {displayedLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} listView />
            ))}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {displayedLessons.map((lesson) => (
              <Grid key={lesson.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <LessonCard lesson={lesson} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
