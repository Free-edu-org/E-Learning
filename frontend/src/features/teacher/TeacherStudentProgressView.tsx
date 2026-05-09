import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  ArrowBackOutlined as BackIcon,
  CheckCircleOutlined as CompletedIcon,
  EmojiEventsOutlined as AchievementIcon,
  StarsOutlined as PointsIcon,
  TrendingUpOutlined as TrendIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  lessonService,
  type SkillStat,
  type TeacherStudentStatsResponse,
} from "@/api/lessonService";
import { userService, type UserProfile } from "@/api/userService";
import { useAuth } from "@/context/AuthContext";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";
import {
  panelGridCardContentSx,
  panelGridCardSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";
import { StatCard } from "@/components/ui/panel/StatCard";
import { formatPercent } from "@/utils/dashboardUtils";

type NormalizedSkill = SkillStat & {
  correctPct: number;
  wrongPct: number;
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function scoreColor(percent: number): string {
  if (percent >= 80) return "#16a34a";
  if (percent >= 60) return "#ca8a04";
  return "#dc2626";
}

export function TeacherStudentProgressView() {
  const { studentPublicId } = useParams<{ studentPublicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();
  const theme = useTheme();
  const fromLessonPublicId = searchParams.get("fromLessonPublicId");
  const routeState = location.state as {
    backTo?: string;
    backLabel?: string;
  } | null;
  const backTo = fromLessonPublicId
    ? `/teacher/lessons/${fromLessonPublicId}/stats`
    : (routeState?.backTo ?? "/teacher/students");
  const backLabel = fromLessonPublicId
    ? "Wróć do wyników lekcji"
    : (routeState?.backLabel ?? "Wróć do uczniów");

  const [stats, setStats] = useState<TeacherStudentStatsResponse | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (!studentPublicId) return;
    lessonService
      .getStudentStats(studentPublicId)
      .then(setStats)
      .catch(() => setError("Nie udało się wczytać danych ucznia."))
      .finally(() => setLoading(false));
  }, [studentPublicId]);

  const progressChartData = useMemo(
    () =>
      (stats?.progressHistory ?? []).map((item) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString("pl-PL", {
          month: "numeric",
          day: "numeric",
        }),
      })),
    [stats],
  );

  const normalizedSkillsData = useMemo<NormalizedSkill[]>(() => {
    return (stats?.skillStats ?? []).map((s) => {
      const total = (s.correct ?? 0) + (s.wrong ?? 0);
      if (total <= 0) return { ...s, correctPct: 0, wrongPct: 0 };
      const correctPct = Math.round((s.correct / total) * 100);
      return { ...s, correctPct, wrongPct: 100 - correctPct };
    });
  }, [stats]);

  const correctAnswers = useMemo(
    () =>
      (stats?.skillStats ?? []).reduce((sum, s) => sum + (s.correct ?? 0), 0),
    [stats],
  );

  const totalAnswers = useMemo(
    () =>
      (stats?.skillStats ?? []).reduce(
        (sum, s) => sum + (s.correct ?? 0) + (s.wrong ?? 0),
        0,
      ),
    [stats],
  );

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        <DashboardTopBar
          onLogout={() => {
            logout();
            navigate("/login");
          }}
        />

        <DashboardHeader
          loading={loadingUser}
          username={user?.username}
          subtitle="Panel nauczyciela"
          fallbackName="Nauczycielu"
          user={user}
          onUserUpdated={setUser}
        />

        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, mb: 3 }}
        >
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(backTo)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              mb: 2,
              mt: -1,
              color: "primary.main",
              px: 3,
              "&:hover": { bgcolor: "transparent", color: "text.secondary" },
            }}
          >
            {backLabel}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Student profile */}
        {!loading && stats && (
          <Box
            sx={{
              ...panelSurfaceSx,
              p: 2.5,
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <UserAvatar
              avatarUrl={stats.student.avatarUrl}
              username={stats.student.username}
              size={64}
            />
            <Stack gap={0.25}>
              <Typography variant="h6" fontWeight={700}>
                {stats.student.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.student.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Dołączył/a:{" "}
                {new Date(stats.student.createdAt).toLocaleDateString("pl-PL")}
              </Typography>
            </Stack>
          </Box>
        )}

        {loading ? (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[...Array(3)].map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={200} />
              </Grid>
            ))}
          </Grid>
        ) : (
          stats && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard
                  icon={CompletedIcon}
                  title="Ukończone lekcje"
                  value={stats.completedLessons}
                  subtitle={`z ${stats.totalLessons} lekcji`}
                  color="success"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard
                  icon={TrendIcon}
                  title="Średni wynik"
                  value={`${Math.round(stats.avgScore)}%`}
                  subtitle="ukończonych lekcji"
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard
                  icon={PointsIcon}
                  title="Poprawne odpowiedzi"
                  value={correctAnswers}
                  subtitle={`${totalAnswers} odpowiedzi łącznie`}
                  color="info"
                />
              </Grid>
            </Grid>
          )
        )}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ ...panelGridCardSx, minHeight: 350 }}>
              <Box sx={panelGridCardContentSx}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <TrendIcon sx={{ color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Postęp w czasie
                  </Typography>
                </Box>

                {loading ? (
                  <Skeleton variant="rounded" height={280} />
                ) : progressChartData.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Historia pojawi się po ukończeniu pierwszej lekcji.
                  </Alert>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={progressChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={alpha(theme.palette.divider, 0.5)}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: 12 }}
                        interval={Math.max(
                          0,
                          Math.floor(progressChartData.length / 5) - 1,
                        )}
                      />
                      <YAxis
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: 12 }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: theme.palette.divider,
                          backgroundColor: theme.palette.background.paper,
                        }}
                        formatter={(v) => [`${v}%`, "Wynik"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ ...panelGridCardSx, minHeight: 350 }}>
              <Box sx={panelGridCardContentSx}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <TrendIcon sx={{ color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Silne i słabe strony
                  </Typography>
                </Box>

                {loading ? (
                  <Skeleton variant="rounded" height={280} />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={normalizedSkillsData}
                      margin={{ top: 12, right: 20, bottom: 8, left: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={alpha(theme.palette.divider, 0.5)}
                      />
                      <XAxis
                        dataKey="category"
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: 12 }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: theme.palette.divider,
                          backgroundColor: theme.palette.background.paper,
                        }}
                        labelStyle={{
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                        }}
                        formatter={(value: unknown, name: unknown, item) => {
                          const entry = item.payload as
                            | NormalizedSkill
                            | undefined;
                          const pct =
                            typeof value === "number" ? `${value}%` : "";
                          if (name === "Dobrze")
                            return [
                              `${pct} (${entry?.correct ?? 0})`,
                              "Dobrze",
                            ];
                          return [`${pct} (${entry?.wrong ?? 0})`, "Źle"];
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="correctPct"
                        stackId="a"
                        name="Dobrze"
                        fill={theme.palette.success.main}
                        radius={[0, 0, 4, 4]}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="wrongPct"
                        stackId="a"
                        name="Źle"
                        fill={theme.palette.error.main}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Completed lessons list */}
        {!loading && stats && stats.lessonResults.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Paper elevation={0} sx={{ ...panelGridCardSx }}>
              <Box sx={panelGridCardContentSx}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
                >
                  <AchievementIcon sx={{ color: "warning.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Ukończone lekcje
                  </Typography>
                </Box>

                <Stack gap={1}>
                  {stats.lessonResults.map((lesson) => (
                    <Box
                      key={lesson.lessonPublicId}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ overflowWrap: "anywhere" }}
                        >
                          {lesson.lessonTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ukończono: {formatDate(lesson.completedAt)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          color: scoreColor(lesson.resultPercent),
                          minWidth: 48,
                          textAlign: "right",
                        }}
                      >
                        {formatPercent(lesson.resultPercent)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: 60, textAlign: "right" }}
                      >
                        {lesson.score}/{lesson.maxScore} pkt
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: (t) => alpha(t.palette.divider, 0.5),
                          color: "text.secondary",
                          "&:hover": {
                            borderColor: "primary.main",
                            color: "primary.main",
                          },
                        }}
                        onClick={() =>
                          navigate(
                            `/teacher/lessons/${lesson.lessonPublicId}/students/${studentPublicId}/result`,
                          )
                        }
                      >
                        Szczegóły
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
}
