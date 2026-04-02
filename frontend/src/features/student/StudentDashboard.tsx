import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AutoStoriesOutlined as LessonIcon,
  CheckCircleOutlined as CompletedIcon,
  DarkMode as DarkModeIcon,
  InsightsOutlined as InsightsIcon,
  LightMode as LightModeIcon,
  LogoutOutlined as LogoutIcon,
  PlayCircleOutlineOutlined as ProgressIcon,
  SchoolOutlined as SchoolIcon,
  TrendingUpOutlined as TrendingUpIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import {
  studentService,
  type StudentLesson,
  type StudentProgress,
  type StudentStats,
} from "@/api/studentService";
import { userService, type UserProfile } from "@/api/userService";
import { StatsCard } from "@/components/teacher/StatsCard";
import {
  outlinedMetaChipSx,
  panelCardFooterSx,
  panelFooterButtonSx,
  panelGridCardContentSx,
  panelGridCardSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";

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
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.problem.detail || error.problem.title || fallback;
  }

  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak połączenia z serwerem.";
  }

  return fallback;
}

export function StudentDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { toggleColorMode } = useAppTheme();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      userService.getCurrentUser(),
      studentService.getStats(),
      studentService.getProgress(),
      studentService.getLessons(),
    ])
      .then(([currentUser, nextStats, nextProgress, nextLessons]) => {
        setUser(currentUser);
        setStats(nextStats);
        setProgress(nextProgress);
        setLessons(nextLessons);
      })
      .catch((err: unknown) => {
        setError(
          getErrorMessage(err, "Nie udało się pobrać danych panelu ucznia."),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  const heroGradient = useMemo(
    () =>
      theme.palette.mode === "light"
        ? "linear-gradient(135deg, rgba(79,70,229,0.96) 0%, rgba(168,85,247,0.94) 100%)"
        : "linear-gradient(135deg, rgba(67,56,202,0.88) 0%, rgba(147,51,234,0.84) 100%)",
    [theme.palette.mode],
  );

  const completedLessons = lessons.filter(
    (lesson) => lesson.status === "COMPLETED",
  );

  function getStatusChip(lesson: StudentLesson) {
    if (lesson.status === "COMPLETED") {
      return (
        <Chip
          label="Ukończona"
          color="success"
          size="small"
          sx={{ fontWeight: 700 }}
        />
      );
    }

    if (lesson.status === "IN_PROGRESS") {
      return (
        <Chip
          label="W trakcie"
          color="warning"
          size="small"
          sx={{ fontWeight: 700 }}
        />
      );
    }

    return (
      <Chip
        label={lesson.isActive ? "Do rozpoczęcia" : "Nieaktywna"}
        variant="outlined"
        size="small"
        sx={{ fontWeight: 700 }}
      />
    );
  }

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
                ...panelSurfaceSx,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: 1,
              }}
            >
              <SchoolIcon sx={{ color: "primary.main" }} />
            </Box>
            <Box>
              {loading ? (
                <Skeleton width={180} height={28} />
              ) : (
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  Witaj, {user?.username ?? "Uczniu"}!
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Panel ucznia
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {loading ? (
            [...Array(3)].map((_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={90}
                sx={{ flex: 1, minWidth: 170, borderRadius: 3 }}
              />
            ))
          ) : (
            <>
              <StatsCard
                label="Przypisane lekcje"
                value={stats?.totalLessons ?? 0}
                highlightColor={theme.palette.primary.main}
              />
              <StatsCard
                label="Ukończone lekcje"
                value={stats?.completedLessons ?? 0}
              />
              <StatsCard
                label="Średni wynik"
                value={`${stats?.averageScore ?? 0}%`}
              />
              <StatsCard
                label="W trakcie"
                value={stats?.inProgressLessons ?? 0}
              />
            </>
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: { xs: 2.5, md: 3 },
            color: "#fff",
            borderRadius: 4,
            background: heroGradient,
            boxShadow: "0 20px 40px rgba(79, 70, 229, 0.28)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.88, mb: 0.75 }}>
                Twoja strefa nauki
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Wracaj regularnie i śledź własny postęp.
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 620 }}>
                Widok jest już podłączony do realnych danych ucznia: statystyk,
                podsumowania postępu i lekcji przypisanych przez grupę.
              </Typography>
            </Box>
            <Chip
              label="Widok ucznia"
              sx={{
                bgcolor: alpha("#ffffff", 0.16),
                color: "#fff",
                fontWeight: 700,
                borderRadius: 999,
              }}
            />
          </Stack>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                ...panelGridCardSx,
                minHeight: 240,
              }}
            >
              <Box sx={panelGridCardContentSx}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <InsightsIcon sx={{ color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Twoje postępy
                  </Typography>
                </Box>

                {loading ? (
                  <Stack spacing={1.25}>
                    <Skeleton variant="rounded" height={24} />
                    <Skeleton variant="rounded" height={24} width="85%" />
                    <Skeleton variant="rounded" height={24} width="55%" />
                  </Stack>
                ) : progress ? (
                  <>
                    <Typography
                      variant="body1"
                      sx={{ color: "text.primary", mb: 2, lineHeight: 1.7 }}
                    >
                      {progress.summary}
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      flexWrap="wrap"
                    >
                      <Chip
                        icon={<CompletedIcon />}
                        label={`Ukończono: ${progress.completedLessons}`}
                        color="success"
                        variant="outlined"
                      />
                      <Chip
                        icon={<ProgressIcon />}
                        label={`W trakcie: ${progress.inProgressLessons}`}
                        color="warning"
                        variant="outlined"
                      />
                    </Stack>
                  </>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Brak danych postępu do wyświetlenia.
                  </Alert>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                ...panelGridCardSx,
                minHeight: 240,
              }}
            >
              <Box sx={panelGridCardContentSx}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <TrendingUpIcon sx={{ color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Dane konta
                  </Typography>
                </Box>

                {loading ? (
                  <Stack spacing={1.25}>
                    <Skeleton variant="rounded" height={24} />
                    <Skeleton variant="rounded" height={24} width="72%" />
                    <Skeleton variant="rounded" height={24} width="60%" />
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Login
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {user?.username ?? "Brak danych"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        E-mail
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ overflowWrap: "anywhere" }}
                      >
                        {user?.email ?? "Brak danych"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Data utworzenia konta
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(user?.createdAt)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Ukończone lekcje
                      </Typography>
                      <Typography variant="body1">
                        {stats?.completedLessons ?? 0} / {stats?.totalLessons ?? 0}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="primary.main"
          sx={{ mb: 1.5 }}
        >
          Dostępne lekcje
        </Typography>

        {loading ? (
          <Grid container spacing={2}>
            {[...Array(3)].map((_, index) => (
              <Grid key={index} size={{ xs: 12, md: 4 }}>
                <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : lessons.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nie masz jeszcze przypisanych lekcji.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {lessons.map((lesson) => (
              <Grid key={lesson.id} size={{ xs: 12, md: 6, xl: 4 }}>
                <Paper elevation={0} sx={panelGridCardSx}>
                  <Box sx={panelGridCardContentSx}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1.25, minWidth: 0 }}>
                        <LessonIcon sx={{ color: "primary.main", mt: 0.25 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={700}>
                            {lesson.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lesson.theme}
                          </Typography>
                        </Box>
                      </Box>
                      {getStatusChip(lesson)}
                    </Box>

                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {lesson.groups.map((group) => (
                        <Chip
                          key={group.id}
                          label={group.name}
                          size="small"
                          variant="outlined"
                          sx={outlinedMetaChipSx}
                        />
                      ))}
                    </Stack>

                    <Box sx={{ mt: 2.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        Nauczyciel
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {lesson.teacherName}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Utworzono
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(lesson.createdAt)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        ...panelSurfaceSx,
                        p: 1.5,
                        mt: 2.25,
                        bgcolor: lesson.resultPercent
                          ? "success.50"
                          : "background.paper",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        Wynik
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {lesson.resultPercent != null
                          ? `${lesson.resultPercent}%`
                          : lesson.status === "IN_PROGRESS"
                            ? "Lekcja rozpoczęta"
                            : "Brak wyniku"}
                      </Typography>
                      {lesson.score != null && lesson.maxScore != null && (
                        <Typography variant="caption" color="text.secondary">
                          {lesson.score} / {lesson.maxScore} punktów
                        </Typography>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={panelCardFooterSx}>
                      <Button
                        fullWidth
                        variant={lesson.status === "COMPLETED" ? "outlined" : "contained"}
                        disabled={!lesson.isActive}
                        sx={panelFooterButtonSx}
                      >
                        {lesson.status === "COMPLETED"
                          ? "Ukończono"
                          : lesson.status === "IN_PROGRESS"
                            ? "Kontynuacja w przygotowaniu"
                            : lesson.isActive
                              ? "Start lekcji w przygotowaniu"
                              : "Lekcja nieaktywna"}
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && completedLessons.length > 0 && (
          <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
            Masz już ukończone {completedLessons.length} lekcje. Panel pokazuje
            ich wynik procentowy na podstawie zapisanych `UserLesson`.
          </Alert>
        )}
      </Container>
    </Box>
  );
}
