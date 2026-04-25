import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowBack as ArrowBackIcon,
  EmojiEvents as TrophyIcon,
  Replay as ReplayIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { lessonService } from "@/api/lessonService";
import type {
  LessonStatsResponse,
  LessonStatsStudentResult,
} from "@/api/lessonService";
import { userService, type UserProfile } from "@/api/userService";
import { useAuth } from "@/context/AuthContext";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/ui/dialog/AppDialog";
import { FormActions } from "@/components/ui/form/FormLayout";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";
import {
  panelGridCardSx,
  panelFooterButtonSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const date = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
}

function scoreColor(percent: number): string {
  if (percent >= 80) return "#16a34a";
  if (percent >= 60) return "#ca8a04";
  return "#dc2626";
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        ...panelGridCardSx,
        minWidth: 0,
        px: 1.75,
        py: 1.25,
        display: "flex",
        alignItems: "center",
        gap: 1,
        minHeight: 72,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", lineHeight: 1.1, mb: 0.35 }}
        >
          {label}
        </Typography>
        <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.05 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function buildDistributionData(results: LessonStatsStudentResult[]) {
  const buckets = [
    { range: "0-20%", min: 0, max: 20, count: 0 },
    { range: "20-40%", min: 20, max: 40, count: 0 },
    { range: "40-60%", min: 40, max: 60, count: 0 },
    { range: "60-80%", min: 60, max: 80, count: 0 },
    { range: "80-100%", min: 80, max: 101, count: 0 },
  ];
  for (const r of results) {
    const bucket = buckets.find(
      (b) => r.resultPercent >= b.min && r.resultPercent < b.max,
    );
    if (bucket) bucket.count++;
  }
  return buckets.map((b) => ({ name: b.range, value: b.count }));
}

export function LessonStatsView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState<LessonStatsResponse | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string>("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);
  const [resettingUserIds, setResettingUserIds] = useState<number[]>([]);
  const [resetConfirmStudent, setResetConfirmStudent] =
    useState<LessonStatsStudentResult | null>(null);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (!lessonId) return;
    const id = Number(lessonId);

    Promise.all([
      lessonService.getLessonStats(id),
      lessonService.getTeacherLessons(),
    ])
      .then(([statsData, lessons]) => {
        setStats(statsData);
        const lesson = lessons.find((l) => l.id === id);
        if (lesson) setLessonTitle(lesson.title);
      })
      .catch(() => setError("Nie udało się wczytać wyników lekcji."))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleResetStudentProgress = async (
    student: LessonStatsStudentResult,
  ) => {
    if (!lessonId) return;
    const numericLessonId = Number(lessonId);
    if (isNaN(numericLessonId)) return;

    setActionFeedback(null);
    setResettingUserIds((prev) => [...prev, student.userId]);

    try {
      await lessonService.resetStudentLessonProgress(
        numericLessonId,
        student.userId,
      );
      const refreshedStats =
        await lessonService.getLessonStats(numericLessonId);
      setStats(refreshedStats);
      setActionFeedback({
        severity: "success",
        message: `Zresetowano wynik ucznia ${student.username}.`,
      });
    } catch {
      setActionFeedback({
        severity: "error",
        message: `Nie udało się zresetować wyniku ucznia ${student.username}.`,
      });
    } finally {
      setResettingUserIds((prev) => prev.filter((id) => id !== student.userId));
      setResetConfirmStudent(null);
    }
  };

  const studentChartData =
    stats?.studentResults.map((r) => ({
      name: r.username,
      value: Math.round(r.resultPercent),
    })) ?? [];

  const distributionData = stats
    ? buildDistributionData(stats.studentResults)
    : [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "background.default" : "#eef1f8",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          pt: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 4, md: 6 },
          px: { xs: 2, sm: 3 },
          position: "relative",
        }}
      >
        <DashboardTopBar onLogout={logout} />
        <DashboardHeader
          loading={loadingUser}
          username={user?.username}
          subtitle="Panel nauczyciela"
          fallbackName="Nauczycielu"
          user={user}
          onUserUpdated={setUser}
        />

        {/* Back + title */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: { xs: 1.5, sm: 2 },
            mb: { xs: 2, sm: 3 },
            mt: { xs: 0.5, sm: 1 },
            flexWrap: "wrap",
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/teacher")}
            sx={{ textTransform: "none", fontWeight: 600, mt: 0.25 }}
          >
            Powrót
          </Button>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ fontSize: { xs: "1.6rem", sm: "2rem" }, lineHeight: 1.15 }}
            >
              Wyniki lekcji
            </Typography>
            {lessonTitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.75, maxWidth: { md: 720 } }}
              >
                {lessonTitle}
              </Typography>
            )}
          </Box>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {actionFeedback && (
          <Alert severity={actionFeedback.severity} sx={{ mb: 3 }}>
            {actionFeedback.message}
          </Alert>
        )}

        {stats && !loading && (
          <>
            {/* Top stat cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                gap: 1.25,
                mb: 2.25,
              }}
            >
              <StatCard
                label="Średni wynik"
                value={`${Math.round(stats.avgScore)}%`}
                icon={
                  <TrendingUpIcon
                    sx={{ color: "success.main", fontSize: 16 }}
                  />
                }
              />
              <StatCard
                label="Uczniowie, którzy ukończyli"
                value={String(stats.studentsCompleted)}
                icon={
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                }
              />
              <StatCard
                label="Najlepszy wynik"
                value={`${Math.round(stats.bestScore)}%`}
                icon={<TrophyIcon sx={{ color: "#ca8a04", fontSize: 16 }} />}
              />
            </Box>

            {/* Charts row */}
            {stats.studentResults.length > 0 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                  mb: 3,
                }}
              >
                {/* Per-student bar chart */}
                <Box
                  sx={{
                    ...panelSurfaceSx,
                    p: 2.5,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                    Wyniki uczniów
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={2}
                  >
                    Porównanie wyników procentowych
                  </Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={studentChartData} margin={{ bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v}%`, "Wynik"]} />
                      <Bar
                        dataKey="value"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                {/* Distribution bar chart */}
                <Box
                  sx={{
                    ...panelSurfaceSx,
                    p: 2.5,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                    Rozkład wyników
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={2}
                  >
                    Liczba uczniów w przedziałach procentowych
                  </Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={distributionData} margin={{ bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [v, "Uczniów"]} />
                      <Bar
                        dataKey="value"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}

            {/* Detailed results */}
            <Box sx={{ ...panelSurfaceSx, p: 0, overflow: "hidden" }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ px: 3, py: 2 }}
              >
                Szczegółowe wyniki
              </Typography>
              <Divider />

              {stats.studentResults.length === 0 ? (
                <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Brak wyników - żaden uczeń nie ukończył jeszcze tej lekcji.
                  </Typography>
                </Box>
              ) : (
                stats.studentResults.map((student, idx) => (
                  <Box key={student.userId}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        px: 3,
                        py: 1.75,
                        gap: 2,
                      }}
                    >
                      {/* Name + date */}
                      <UserAvatar
                        avatarUrl={student.avatarUrl}
                        username={student.username}
                        size={36}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {student.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ukończono: {formatDate(student.completedAt)}
                        </Typography>
                      </Box>

                      {/* Score */}
                      <Box sx={{ textAlign: "right", minWidth: 60 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Punkty
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {student.score} / {student.maxScore}
                        </Typography>
                      </Box>

                      {/* Percent */}
                      <Box sx={{ textAlign: "right", minWidth: 60 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Procent
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ color: scoreColor(student.resultPercent) }}
                        >
                          {Math.round(student.resultPercent)}%
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center" }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<ReplayIcon fontSize="small" />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            borderRadius: 2,
                          }}
                          disabled={resettingUserIds.includes(student.userId)}
                          onClick={() => setResetConfirmStudent(student)}
                        >
                          {resettingUserIds.includes(student.userId)
                            ? "Resetowanie..."
                            : "Resetuj wynik"}
                        </Button>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon fontSize="small" />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: (theme) =>
                              alpha(theme.palette.divider, 0.5),
                            color: "text.secondary",
                            "&:hover": {
                              borderColor: "primary.main",
                              color: "primary.main",
                            },
                          }}
                          onClick={() =>
                            navigate(
                              `/teacher/lessons/${lessonId}/students/${student.userId}/result`,
                            )
                          }
                        >
                          Szczegóły
                        </Button>
                      </Box>
                    </Box>
                    {idx < stats.studentResults.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </Box>
          </>
        )}

        <AppDialog
          open={Boolean(resetConfirmStudent)}
          onClose={() => {
            if (
              resetConfirmStudent &&
              resettingUserIds.includes(resetConfirmStudent.userId)
            ) {
              return;
            }
            setResetConfirmStudent(null);
          }}
          maxWidth="xs"
        >
          <AppDialogHeader
            icon={<ReplayIcon />}
            title="Resetuj wynik"
            subtitle={
              resetConfirmStudent
                ? `Zresetować wynik ucznia "${resetConfirmStudent.username}"?`
                : undefined
            }
          />
          <AppDialogBody>
            <Typography variant="body2" color="text.secondary">
              Ta operacja usunie bieżący wynik i pozwoli uczniowi rozpocząć
              lekcję od nowa.
            </Typography>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={() => setResetConfirmStudent(null)}
                disabled={
                  resetConfirmStudent
                    ? resettingUserIds.includes(resetConfirmStudent.userId)
                    : false
                }
                sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<ReplayIcon />}
                disabled={
                  !resetConfirmStudent ||
                  resettingUserIds.includes(resetConfirmStudent.userId)
                }
                onClick={() => {
                  if (!resetConfirmStudent) return;
                  void handleResetStudentProgress(resetConfirmStudent);
                }}
                sx={panelFooterButtonSx}
              >
                {resetConfirmStudent &&
                resettingUserIds.includes(resetConfirmStudent.userId)
                  ? "Resetowanie..."
                  : "Potwierdź reset"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>
      </Container>
    </Box>
  );
}
