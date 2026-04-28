import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
  Alert,
  Button,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  CheckCircleOutlined as CompletedIcon,
  TrendingUpOutlined as TrendIcon,
  EmojiEventsOutlined as AchievementIcon,
  ArrowBackOutlined as BackIcon,
  StarsOutlined as PointsIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  studentService,
  type StudentStats,
} from "@/api/studentService";
import { userService, type UserProfile } from "@/api/userService";
import {
  panelGridCardSx,
  panelGridCardContentSx,
} from "@/components/ui/panel/panelStyles";
import { StatCard } from "@/components/ui/panel/StatCard";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/dashboardUtils";
import {
  generateProgressChartData,
  generateSkillsData,
  generateAchievements,
} from "@/utils/progressMockData";

export function StudentProgressView() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data — will be replaced with API calls when backend is ready
  const progressChartData = useMemo(() => generateProgressChartData(), []);
  const skillsData = useMemo(() => generateSkillsData(), []);
  const achievements = useMemo(() => generateAchievements(), []);

  // Normalize skills data so each category sums to 100% (shows relative correct/wrong)
  const normalizedSkillsData = useMemo(() => {
    return skillsData.map((s) => {
      const total = (s.correct ?? 0) + (s.wrong ?? 0);
      if (total <= 0) {
        return { ...s, correctPct: 0, wrongPct: 0 };
      }
      const correctRaw = (s.correct / total) * 100;
      const correctPct = Math.round(correctRaw);
      // ensure sums to 100 to avoid tiny rounding gaps
      const wrongPct = 100 - correctPct;
      return { ...s, correctPct, wrongPct };
    });
  }, [skillsData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    Promise.all([
      userService.getCurrentUser(),
      studentService.getStats(),
      studentService.getProgress(),
    ])
      .then(([currentUser, nextStats]) => {
        setUser(currentUser);
        setStats(nextStats);
      })
      .catch((err: unknown) => {
        setError(
          getErrorMessage(err, "Nie udało się pobrać danych postępu."),
        );
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
        {/* ── Top bar ── */}
        <DashboardTopBar onLogout={handleLogout} />

        {/* ── Header (profile) ── */}
        <DashboardHeader
          loading={loading}
          username={user?.username}
          subtitle="Twoje postępy"
          fallbackName="Uczniu"
          user={user}
          onUserUpdated={setUser}
        />

        {/* ── Back button (placed under profile/header) ── */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, mb: 3 }}>
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

        {/* ── Stats cards row ── */}
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
                value={0} // TODO: System punktów i ich pobieranie z backendu
                subtitle="pkt"
                color="info"
              />
            </Grid>
          </Grid>
        )}

        {/* ── Charts row: Progress line chart + Skills radar ── */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Progress over time */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ ...panelGridCardSx, minHeight: 350 }}>
              <Box sx={panelGridCardContentSx}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendIcon sx={{ color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Twój postęp w czasie
                  </Typography>
                </Box>

                {loading ? (
                  <Skeleton variant="rounded" height={280} />
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
                        interval={Math.floor(progressChartData.length / 5)}
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
                        }}
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

          {/* Skills radar chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ ...panelGridCardSx, minHeight: 350 }}>
              <Box sx={panelGridCardContentSx}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendIcon sx={{ color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Silne i słabe strony
                  </Typography>
                </Box>

                {loading ? (
                  <Skeleton variant="rounded" height={280} />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={normalizedSkillsData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
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
                        }}
                        formatter={(value: unknown) => {
                          const v = value as number | undefined;
                          return v == null ? "" : `${v}%`;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="correctPct" stackId="a" name="Dobrze" fill={theme.palette.success.main} isAnimationActive={false} />
                      <Bar dataKey="wrongPct" stackId="a" name="Źle" fill={theme.palette.error.main} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* ── Achievements section ── */}
        <Box sx={{ mb: 4 }}>
          <Paper elevation={0} sx={{ ...panelGridCardSx }}>
            <Box sx={panelGridCardContentSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
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
                                alpha(
                                  t.palette[achievement.color].main,
                                  0.08,
                                )
                            : (t) =>
                                alpha(t.palette.text.disabled, 0.05),
                          border: "1px solid",
                          borderColor: achievement.unlocked
                            ? (t) =>
                                alpha(
                                  t.palette[achievement.color].main,
                                  0.2,
                                )
                            : (t) =>
                                alpha(t.palette.divider, 0.3),
                          opacity: achievement.unlocked ? 1 : 0.6,
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{ mb: 1, fontSize: 32 }}
                        >
                          {achievement.icon}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
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
                              color: (t) =>
                                t.palette[achievement.color].main,
                              fontWeight: 600,
                            }}
                          >
                            ✓ Zdobyte
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



