import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Tooltip as MuiTooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  ArrowBack as ArrowBackIcon,
  Replay as ReplayIcon,
  Visibility as VisibilityIcon,
  WarningAmberOutlined as WarningIcon,
} from "@mui/icons-material";
import {
  Bar,
  BarChart,
  Cell,
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
import { StatsCard } from "@/components/teacher/StatsCard";
import {
  outlinedMetaChipSx,
  panelDeleteButtonSx,
  panelFooterButtonSx,
  panelInlineActionsSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";
import { formatPercent } from "@/utils/dashboardUtils";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const date = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
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

function getPerformanceTier(percent: number): "success" | "warning" | "error" {
  if (percent >= 80) return "success";
  if (percent >= 50) return "warning";
  return "error";
}

export function LessonStatsView() {
  const { lessonPublicId } = useParams<{ lessonPublicId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
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
  const [resettingUserPublicIds, setResettingUserPublicIds] = useState<
    string[]
  >([]);
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
    if (!lessonPublicId) return;

    Promise.all([
      lessonService.getLessonStats(lessonPublicId),
      lessonService.getTeacherLessons(),
    ])
      .then(([statsData, lessons]) => {
        setStats(statsData);
        const lesson = lessons.find((l) => l.publicId === lessonPublicId);
        if (lesson) setLessonTitle(lesson.title);
      })
      .catch(() => setError("Nie udało się wczytać wyników lekcji."))
      .finally(() => setLoading(false));
  }, [lessonPublicId]);

  const handleResetStudentProgress = async (
    student: LessonStatsStudentResult,
  ) => {
    if (!lessonPublicId) return;

    setActionFeedback(null);
    setResettingUserPublicIds((prev) => [...prev, student.userPublicId]);

    try {
      await lessonService.resetStudentLessonProgress(
        lessonPublicId,
        student.userPublicId,
      );
      const refreshedStats = await lessonService.getLessonStats(lessonPublicId);
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
      setResettingUserPublicIds((prev) =>
        prev.filter((userPublicId) => userPublicId !== student.userPublicId),
      );
      setResetConfirmStudent(null);
    }
  };

  const studentChartData =
    stats?.studentResults.map((r) => ({
      name: r.username,
      value: Number(r.resultPercent.toFixed(1)),
    })) ?? [];

  const distributionData = stats
    ? buildDistributionData(stats.studentResults)
    : [];

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
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 1,
            mb: { xs: 1.6, sm: 2.2 },
            mt: { xs: 0.5, sm: 1 },
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/teacher")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "primary.main",
              "&:hover": {
                bgcolor: "transparent",
                color: "primary.dark",
              },
            }}
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
                display: "flex",
                gap: 2,
                mb: 3,
                flexWrap: "wrap",
              }}
            >
              <StatsCard
                label="Średni wynik"
                value={formatPercent(stats.avgScore)}
                highlightColor={theme.palette.success.main}
              />
              <StatsCard
                label="Uczniowie, którzy ukończyli"
                value={String(stats.studentsCompleted)}
                highlightColor={theme.palette.primary.main}
              />
              <StatsCard
                label="Najlepszy wynik"
                value={formatPercent(stats.bestScore)}
                highlightColor={theme.palette.warning.main}
              />
            </Box>

            {/* Charts row */}
            {stats.studentResults.length > 0 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 1.5,
                  mb: 2.25,
                }}
              >
                {/* Per-student bar chart */}
                <Box
                  sx={{
                    ...panelSurfaceSx,
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                    Wyniki uczniów
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={1.35}
                    sx={{ opacity: 0.8 }}
                  >
                    Porównanie wyników procentowych
                  </Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={studentChartData} margin={{ bottom: 40 }}>
                      <defs>
                        <linearGradient
                          id="lessonStatsStudentBars"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#7c8cff"
                            stopOpacity={0.95}
                          />
                          <stop
                            offset="100%"
                            stopColor="#5b6ded"
                            stopOpacity={0.62}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke={chartGridColor}
                        strokeDasharray="4 6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: chartLabelColor }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        tickLine={false}
                        axisLine={{
                          stroke: alpha(theme.palette.text.primary, 0.14),
                        }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: chartAxisColor }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(v) => [formatPercent(Number(v)), "Wynik"]}
                        cursor={{
                          fill: alpha(theme.palette.primary.main, 0.09),
                        }}
                        contentStyle={chartTooltipStyle}
                        labelStyle={{ color: "#cbd5e1", fontWeight: 600 }}
                      />
                      <Bar
                        dataKey="value"
                        fill="url(#lessonStatsStudentBars)"
                        radius={[10, 10, 0, 0]}
                        barSize={22}
                      >
                        {studentChartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.value >= 80
                                ? "url(#lessonStatsStudentBars)"
                                : alpha("#7c8cff", 0.84)
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                {/* Distribution bar chart */}
                <Box
                  sx={{
                    ...panelSurfaceSx,
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                    Rozkład wyników
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={1.35}
                    sx={{ opacity: 0.8 }}
                  >
                    Liczba uczniów w przedziałach procentowych
                  </Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={distributionData} margin={{ bottom: 10 }}>
                      <defs>
                        <linearGradient
                          id="lessonStatsDistributionBars"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#34d399"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor="#0ea5a4"
                            stopOpacity={0.55}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke={chartGridColor}
                        strokeDasharray="4 6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: chartLabelColor }}
                        tickLine={false}
                        axisLine={{
                          stroke: alpha(theme.palette.text.primary, 0.14),
                        }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: chartAxisColor }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(v) => [v, "Uczniów"]}
                        cursor={{
                          fill: alpha(theme.palette.success.main, 0.1),
                        }}
                        contentStyle={chartTooltipStyle}
                        labelStyle={{ color: "#cbd5e1", fontWeight: 600 }}
                      />
                      <Bar
                        dataKey="value"
                        fill="url(#lessonStatsDistributionBars)"
                        radius={[10, 10, 0, 0]}
                        barSize={22}
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
                sx={{ px: 2.5, py: 1.5 }}
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
                <Box sx={{ p: 1.25, display: "grid", gap: 0.85 }}>
                  {stats.studentResults.map((student) => {
                    const pointsPercent =
                      student.maxScore > 0
                        ? (student.score / student.maxScore) * 100
                        : 0;
                    const pointsTier = getPerformanceTier(pointsPercent);
                    const percentTier = getPerformanceTier(
                      student.resultPercent,
                    );

                    return (
                      <Box
                        key={student.userPublicId}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          px: 1.5,
                          py: 1.2,
                          gap: 1.25,
                          borderRadius: 2.25,
                          border: "1px solid",
                          borderColor: (theme) =>
                            alpha(theme.palette.text.primary, 0.08),
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? alpha(theme.palette.common.black, 0.2)
                              : alpha(theme.palette.common.white, 0.7),
                          boxShadow: (theme) =>
                            theme.palette.mode === "dark"
                              ? "0 8px 18px rgba(2, 6, 23, 0.2)"
                              : "0 8px 22px rgba(15, 23, 42, 0.035)",
                        }}
                      >
                        {/* Name + date */}
                        <Box
                          component={RouterLink}
                          to={`/teacher/students/${student.userPublicId}/progress?fromLessonPublicId=${lessonPublicId}`}
                          state={{
                            backTo: `/teacher/lessons/${lessonPublicId}/stats`,
                            backLabel: "Wróć do wyników lekcji",
                          }}
                          aria-label={`Przejdź do profilu ucznia ${student.username}`}
                          sx={{
                            display: "inline-flex",
                            flexShrink: 0,
                            borderRadius: "50%",
                            textDecoration: "none",
                            outline: "none",
                            "&:focus-visible": {
                              boxShadow: (theme) =>
                                `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}`,
                            },
                          }}
                        >
                          <UserAvatar
                            avatarUrl={student.avatarUrl}
                            username={student.username}
                            size={36}
                            sx={{
                              transition:
                                "box-shadow 0.2s ease, transform 0.2s ease",
                              "&:hover": {
                                boxShadow: (theme) =>
                                  `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
                                transform: "translateY(-1px)",
                              },
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 180,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: 0.35,
                          }}
                        >
                          <Typography
                            component={RouterLink}
                            to={`/teacher/students/${student.userPublicId}/progress?fromLessonPublicId=${lessonPublicId}`}
                            state={{
                              backTo: `/teacher/lessons/${lessonPublicId}/stats`,
                              backLabel: "Wróć do wyników lekcji",
                            }}
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              color: "text.primary",
                              display: "block",
                              lineHeight: 1.25,
                              maxWidth: "100%",
                              overflowWrap: "anywhere",
                              textDecoration: "none",
                              outline: "none",
                              "&:hover": {
                                color: "primary.main",
                                textDecoration: "underline",
                                textUnderlineOffset: "3px",
                              },
                              "&:focus-visible": {
                                color: "primary.main",
                                textDecoration: "underline",
                                textUnderlineOffset: "3px",
                              },
                            }}
                          >
                            {student.username}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", lineHeight: 1.3 }}
                          >
                            Ukończono: {formatDate(student.completedAt)}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            ml: "auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                            }}
                          >
                            <Chip
                              label={`Punkty: ${student.score} / ${student.maxScore}`}
                              variant="outlined"
                              sx={{
                                ...outlinedMetaChipSx,
                                height: 32,
                                borderRadius: 999,
                                color: `${pointsTier}.main`,
                                borderColor: (theme) =>
                                  alpha(theme.palette[pointsTier].main, 0.34),
                                bgcolor: (theme) =>
                                  alpha(theme.palette[pointsTier].main, 0.09),
                                "& .MuiChip-label": {
                                  px: 1.15,
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                },
                              }}
                            />
                            <Chip
                              label={`Procent: ${formatPercent(student.resultPercent)}`}
                              variant="outlined"
                              sx={{
                                ...outlinedMetaChipSx,
                                height: 32,
                                borderRadius: 999,
                                color: `${percentTier}.main`,
                                borderColor: (theme) =>
                                  alpha(theme.palette[percentTier].main, 0.34),
                                bgcolor: (theme) =>
                                  alpha(theme.palette[percentTier].main, 0.09),
                                "& .MuiChip-label": {
                                  px: 1.15,
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                },
                              }}
                            />
                            <Box
                              sx={{
                                width: 20,
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              {student.totalTabSwitchCount > 0 && (
                                <MuiTooltip
                                  title={`Uczen wychodzil z zakladek: ${student.totalTabSwitchCount}`}
                                >
                                  <WarningIcon
                                    sx={{ color: "warning.main", fontSize: 18 }}
                                  />
                                </MuiTooltip>
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ ...panelInlineActionsSx, gap: 0.5 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ReplayIcon fontSize="small" />}
                              sx={{
                                ...panelDeleteButtonSx,
                                minHeight: 32,
                                borderRadius: 999,
                                px: 1.15,
                                fontSize: "0.76rem",
                                boxShadow: "none",
                                "& .MuiButton-startIcon": {
                                  marginRight: 0.4,
                                  marginLeft: 0,
                                },
                              }}
                              disabled={resettingUserPublicIds.includes(
                                student.userPublicId,
                              )}
                              onClick={() => setResetConfirmStudent(student)}
                            >
                              {resettingUserPublicIds.includes(
                                student.userPublicId,
                              )
                                ? "Resetowanie..."
                                : "Resetuj wynik"}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon fontSize="small" />}
                              sx={{
                                ...panelFooterButtonSx,
                                minHeight: 32,
                                borderRadius: 999,
                                px: 1.15,
                                fontSize: "0.76rem",
                                boxShadow: "none",
                                "& .MuiButton-startIcon": {
                                  marginRight: 0.4,
                                  marginLeft: 0,
                                },
                              }}
                              onClick={() =>
                                navigate(
                                  `/teacher/lessons/${lessonPublicId}/students/${student.userPublicId}/result`,
                                )
                              }
                            >
                              Szczegóły
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </>
        )}

        <AppDialog
          open={Boolean(resetConfirmStudent)}
          onClose={() => {
            if (
              resetConfirmStudent &&
              resettingUserPublicIds.includes(resetConfirmStudent.userPublicId)
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
                    ? resettingUserPublicIds.includes(
                        resetConfirmStudent.userPublicId,
                      )
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
                  resettingUserPublicIds.includes(
                    resetConfirmStudent.userPublicId,
                  )
                }
                onClick={() => {
                  if (!resetConfirmStudent) return;
                  void handleResetStudentProgress(resetConfirmStudent);
                }}
                sx={panelFooterButtonSx}
              >
                {resetConfirmStudent &&
                resettingUserPublicIds.includes(
                  resetConfirmStudent.userPublicId,
                )
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
