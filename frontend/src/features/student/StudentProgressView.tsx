import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  ArrowBackOutlined as BackIcon,
  EmojiEventsOutlined as AchievementIcon,
  TrendingUpOutlined as TrendIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
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
  studentService,
  type StudentProgressPoint,
  type StudentSkillStats,
  type StudentStats,
} from "@/api/studentService";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { StudentAchievementNotifications } from "@/components/achievements/StudentAchievementNotifications";
import { userService, type UserProfile } from "@/api/userService";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  panelGridCardContentSx,
  panelGridCardSx,
} from "@/components/ui/panel/panelStyles";
import { StatsCard } from "@/components/teacher/StatsCard";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/dashboardUtils";

type NormalizedSkill = StudentSkillStats & {
  correctPct: number;
  wrongPct: number;
};

export function StudentProgressView() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [progressHistory, setProgressHistory] = useState<
    StudentProgressPoint[]
  >([]);
  const [skillsData, setSkillsData] = useState<StudentSkillStats[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState(
    [] as Awaited<ReturnType<typeof studentService.getStudentAchievements>>,
  );
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [achievementsError, setAchievementsError] = useState<string | null>(
    null,
  );

  const progressChartData = useMemo(
    () =>
      progressHistory.map((item) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString("pl-PL", {
          month: "numeric",
          day: "numeric",
        }),
      })),
    [progressHistory],
  );

  const normalizedSkillsData = useMemo<NormalizedSkill[]>(() => {
    return skillsData.map((s) => {
      const total = (s.correct ?? 0) + (s.wrong ?? 0);
      if (total <= 0) {
        return { ...s, correctPct: 0, wrongPct: 0 };
      }
      const correctPct = Math.round((s.correct / total) * 100);
      return { ...s, correctPct, wrongPct: 100 - correctPct };
    });
  }, [skillsData]);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      userService.getCurrentUser(),
      studentService.getStats(),
      studentService.getProgress(),
      studentService.getSkills(),
      studentService.getStudentAchievements(),
    ])
      .then(
        ([
          currentUser,
          nextStats,
          nextProgressHistory,
          nextSkills,
          nextAchievements,
        ]) => {
          if (ignore) return;
          setUser(currentUser);
          setStats(nextStats);
          setProgressHistory(nextProgressHistory);
          setSkillsData(nextSkills);
          setAchievements(nextAchievements);
          setAchievementsError(null);
        },
      )
      .catch((err: unknown) => {
        if (ignore) return;
        const message = getErrorMessage(
          err,
          "Nie udało się pobrać danych postępu.",
        );
        setError(message);
        setAchievementsError(message);
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
          setAchievementsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  const chartGridColor = alpha(
    theme.palette.text.primary,
    theme.palette.mode === "dark" ? 0.14 : 0.08,
  );
  const chartAxisColor = alpha(theme.palette.text.secondary, 0.92);
  const chartLabelColor = alpha(theme.palette.text.secondary, 0.75);
  const chartTooltipStyle = {
    background:
      theme.palette.mode === "dark"
        ? "rgba(12, 18, 32, 0.92)"
        : "rgba(15, 23, 42, 0.94)",
    border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
    borderRadius: 12,
    boxShadow: "0 12px 30px rgba(2, 6, 23, 0.35)",
    color: "#e2e8f0",
    fontSize: "12px",
  };

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
          loading={loading}
          username={user?.username}
          subtitle="Twoje postępy"
          fallbackName="Uczniu"
          user={user}
          onUserUpdated={setUser}
        />

        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/student")}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            mb: 2,
            mt: -1,
            color: "primary.main",
            px: 2,
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
          }}
        >
          Wróć do pulpitu
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <StudentAchievementNotifications showFetchErrorAlert={false} />

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatsCard
              label="Ukończone lekcje"
              value={stats?.completedLessons ?? 0}
              helperText={`z ${stats?.totalLessons ?? 0} lekcji`}
              highlightColor={theme.palette.success.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatsCard
              label="Średni wynik"
              value={`${Math.round(stats?.averageScore ?? 0)}%`}
              helperText="wszystkich lekcji"
              highlightColor={theme.palette.primary.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatsCard
              label="Punkty"
              value={stats?.points ?? 0}
              highlightColor={theme.palette.info.main}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{ ...panelGridCardSx, borderRadius: 3.5, minHeight: 350 }}
            >
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
                  <Alert severity="info" sx={{ borderRadius: 3.5 }}>
                    Historia średniego wyniku pojawi się po ukończeniu pierwszej
                    lekcji.
                  </Alert>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={progressChartData}>
                      <CartesianGrid
                        stroke={chartGridColor}
                        strokeDasharray="4 6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: chartLabelColor }}
                        tickLine={false}
                        axisLine={{
                          stroke: alpha(theme.palette.text.primary, 0.14),
                        }}
                        interval={Math.max(
                          0,
                          Math.floor(progressChartData.length / 5) - 1,
                        )}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: chartAxisColor }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        labelStyle={{ color: "#cbd5e1", fontWeight: 600 }}
                        formatter={(v) => [`${v}%`, "Wynik"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2.5}
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
            <Paper
              elevation={0}
              sx={{ ...panelGridCardSx, borderRadius: 3.5, minHeight: 350 }}
            >
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
                      <defs>
                        <linearGradient
                          id="studentSkillsCorrectBars"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={theme.palette.success.main}
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor={theme.palette.success.main}
                            stopOpacity={0.58}
                          />
                        </linearGradient>
                        <linearGradient
                          id="studentSkillsWrongBars"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={theme.palette.error.main}
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor={theme.palette.error.main}
                            stopOpacity={0.58}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke={chartGridColor}
                        strokeDasharray="4 6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 11, fill: chartLabelColor }}
                        tickLine={false}
                        axisLine={{
                          stroke: alpha(theme.palette.text.primary, 0.14),
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: chartAxisColor }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        labelStyle={{ color: "#cbd5e1", fontWeight: 600 }}
                        formatter={(value: unknown, name: unknown, item) => {
                          const entry = item.payload as
                            | NormalizedSkill
                            | undefined;
                          const pct =
                            typeof value === "number" ? `${value}%` : "";
                          if (name === "Dobrze") {
                            return [
                              `${pct} (${entry?.correct ?? 0})`,
                              "Dobrze",
                            ];
                          }
                          return [`${pct} (${entry?.wrong ?? 0})`, "Źle"];
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="correctPct"
                        stackId="a"
                        name="Dobrze"
                        fill="url(#studentSkillsCorrectBars)"
                        radius={[0, 0, 4, 4]}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="wrongPct"
                        stackId="a"
                        name="Źle"
                        fill="url(#studentSkillsWrongBars)"
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

        <Box sx={{ mb: 4 }}>
          <Paper
            elevation={0}
            sx={{ ...panelGridCardSx, borderRadius: 3.5, overflow: "visible" }}
          >
            <Box sx={panelGridCardContentSx}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <AchievementIcon sx={{ color: "warning.main" }} />
                <Typography variant="h6" fontWeight={700}>
                  Twoje osiągnięcia
                </Typography>
              </Box>

              {achievementsLoading ? (
                <Grid container spacing={2}>
                  {[...Array(4)].map((_, i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                      <Skeleton variant="rounded" height={180} />
                    </Grid>
                  ))}
                </Grid>
              ) : achievementsError ? (
                <Alert severity="error" sx={{ borderRadius: 3.5 }}>
                  {achievementsError}
                </Alert>
              ) : achievements.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 3.5 }}>
                  Nie masz jeszcze odblokowanych osiągnięć. Rozwiązuj lekcje,
                  aby je zdobywać!
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {achievements.map((achievement) => (
                    <Grid
                      key={achievement.id}
                      size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                    >
                      <AchievementCard achievement={achievement} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
