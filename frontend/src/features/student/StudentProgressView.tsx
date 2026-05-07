import { useEffect, useMemo, useState } from "react";
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
import { userService, type UserProfile } from "@/api/userService";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  panelGridCardContentSx,
  panelGridCardSx,
} from "@/components/ui/panel/panelStyles";
import { StatCard } from "@/components/ui/panel/StatCard";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/dashboardUtils";
import { generateAchievements } from "@/utils/progressMockData";

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

  const achievements = useMemo(() => generateAchievements(), []);
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
      const correctRaw = (s.correct / total) * 100;
      const correctPct = Math.round(correctRaw);
      const wrongPct = 100 - correctPct;
      return { ...s, correctPct, wrongPct };
    });
  }, [skillsData]);

  const totalPoints = useMemo(
    () => skillsData.reduce((sum, item) => sum + (item.correct ?? 0), 0),
    [skillsData],
  );

  const totalAnswers = useMemo(
    () =>
      skillsData.reduce(
        (sum, item) => sum + (item.correct ?? 0) + (item.wrong ?? 0),
        0,
      ),
    [skillsData],
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    Promise.all([
      userService.getCurrentUser(),
      studentService.getStats(),
      studentService.getProgress(),
      studentService.getSkills(),
    ])
      .then(([currentUser, nextStats, nextProgressHistory, nextSkills]) => {
        setUser(currentUser);
        setStats(nextStats);
        setProgressHistory(nextProgressHistory);
        setSkillsData(nextSkills);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, "Nie udało się pobrać danych postępu."));
      })
      .finally(() => setLoading(false));
  }, []);

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        <DashboardTopBar onLogout={handleLogout} />

        <DashboardHeader
          loading={loading}
          username={user?.username}
          subtitle="Twoje postępy"
          fallbackName="Uczniu"
          user={user}
          onUserUpdated={setUser}
        />

        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, mb: 3 }}
        >
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate("/student")}
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
            Wróć do pulpitu
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
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
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={CompletedIcon}
                title="Ukończone lekcje"
                value={stats?.completedLessons ?? 0}
                subtitle={`z ${stats?.totalLessons ?? 0} lekcji`}
                color="success"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={TrendIcon}
                title="Średni wynik"
                value={`${Math.round(stats?.averageScore ?? 0)}%`}
                subtitle="wszystkich lekcji"
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={PointsIcon}
                title="Punkty"
                value={stats?.points ?? totalPoints}
                subtitle={`${totalAnswers} odpowiedzi łącznie`}
                color="info"
              />
            </Grid>
          </Grid>
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
                    Twój postęp w czasie
                  </Typography>
                </Box>

                {loading ? (
                  <Skeleton variant="rounded" height={280} />
                ) : progressChartData.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Historia sredniego wyniku pojawi sie po ukonczeniu pierwszej
                    lekcji.
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
                        tickFormatter={(value) => `${value}%`}
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
                        }}
                        formatter={(
                          value:
                            | number
                            | string
                            | readonly (number | string)[]
                            | undefined,
                        ) => [
                          `${Array.isArray(value) ? value[0] : (value ?? 0)}%`,
                          "Wynik",
                        ]}
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
                          const percentage =
                            typeof value === "number" ? `${value}%` : "";
                          if (name === "Dobrze") {
                            return [
                              `${percentage} (${entry?.correct ?? 0})`,
                              "Dobrze",
                            ];
                          }
                          return [
                            `${percentage} (${entry?.wrong ?? 0})`,
                            "Źle",
                          ];
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

        <Box sx={{ mb: 4 }}>
          <Paper elevation={0} sx={{ ...panelGridCardSx }}>
            <Box sx={panelGridCardContentSx}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <AchievementIcon sx={{ color: "warning.main" }} />
                <Typography variant="h6" fontWeight={700}>
                  Twoje osiągnięcia
                </Typography>
              </Box>

              {loading ? (
                <Stack spacing={1}>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={80} />
                  ))}
                </Stack>
              ) : (
                <Grid container spacing={2}>
                  {achievements.map((achievement) => (
                    <Grid key={achievement.id} size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          textAlign: "center",
                          borderRadius: 2,
                          bgcolor: achievement.unlocked
                            ? (t) =>
                                alpha(t.palette[achievement.color].main, 0.08)
                            : (t) => alpha(t.palette.text.disabled, 0.05),
                          border: "1px solid",
                          borderColor: achievement.unlocked
                            ? (t) =>
                                alpha(t.palette[achievement.color].main, 0.2)
                            : (t) => alpha(t.palette.divider, 0.3),
                          opacity: achievement.unlocked ? 1 : 0.6,
                        }}
                      >
                        <Typography variant="h4" sx={{ mb: 1, fontSize: 32 }}>
                          {achievement.icon}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ mb: 0.5 }}
                        >
                          {achievement.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {achievement.description}
                        </Typography>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{
                              mt: 1,
                              color: (t) => t.palette[achievement.color].main,
                              fontWeight: 600,
                            }}
                          >
                            Zdobyte
                          </Typography>
                        )}
                      </Paper>
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
