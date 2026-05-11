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
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  ArrowBackOutlined as BackIcon,
  EditOutlined as EditIcon,
  EmojiEventsOutlined as AchievementIcon,
  TrendingUpOutlined as TrendIcon,
  Visibility as VisibilityIcon,
  PersonOutlined as PersonIcon,
  EmailOutlined as EmailIcon,
  SchoolOutlined as SchoolIcon,
  LockResetOutlined as LockResetIcon,
  CheckOutlined as CheckIcon,
  CloseOutlined as CloseIcon,
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
  type Group,
  type SkillStat,
  type TeacherStudentStatsResponse,
} from "@/api/lessonService";
import { authService } from "@/api/authService";
import { userService, type UserProfile } from "@/api/userService";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/apiClient";
import {
  AppDialog,
  AppDialogBody,
  AppDialogHeader,
  AppDialogStatus,
} from "@/components/ui/dialog/AppDialog";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";
import {
  panelGridCardContentSx,
  panelGridCardSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";
import { StatsCard } from "@/components/teacher/StatsCard";
import { uiTokens } from "@/theme/uiTokens";
import { INPUT_LIMITS } from "@/utils/inputLimits";
import {
  formatPercent,
  translateApiMessage,
  getApiErrorMessage,
} from "@/utils/dashboardUtils";

type NormalizedSkill = SkillStat & {
  correctPct: number;
  wrongPct: number;
};

type EditStudentFieldErrors = Partial<
  Record<"username" | "email" | "emailConfirm" | "groupPublicId", string>
>;

type EditStudentFeedback = {
  severity: "success" | "error";
  message: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const dialogFieldLabelSx = {
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "text.primary",
  letterSpacing: "0.01em",
};

const settingsPanelSurfaceSx: SxProps<Theme> = {
  borderRadius: 3,
  bgcolor: (theme) =>
    theme.palette.mode === "light"
      ? "rgba(255, 255, 255, 0.78)"
      : "rgba(255, 255, 255, 0.03)",
  border: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? "rgba(148, 163, 184, 0.14)"
      : "rgba(255, 255, 255, 0.06)",
  backdropFilter: "blur(14px)",
  boxShadow: (theme) =>
    theme.palette.mode === "light"
      ? "0 16px 32px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.6)"
      : "0 12px 24px rgba(0, 0, 0, 0.18)",
  overflow: "hidden",
};

const settingsRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 2.5,
};

const settingsRowIconTileSx: SxProps<Theme> = {
  width: 40,
  height: 40,
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: (theme) =>
    theme.palette.mode === "light"
      ? alpha("#6366F1", 0.1)
      : alpha("#6366F1", 0.15),
  color: "#6366F1",
  flexShrink: 0,
};

const settingsRowLabelSx: SxProps<Theme> = {
  color: "text.secondary",
  fontWeight: 600,
  display: "block",
  mb: 0.25,
};

const inlineChangeButtonSx: SxProps<Theme> = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: 2,
  px: 2,
  py: 0.75,
  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
  color: "primary.main",
  "&:hover": {
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.14),
  },
};

const inlineEditIconButtonSx = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: "1px solid",
  borderColor: (theme: Theme) => alpha(theme.palette.text.primary, 0.08),
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.common.white, 0.9)
      : alpha(theme.palette.common.white, 0.03),
  boxShadow: (theme: Theme) =>
    theme.palette.mode === "light"
      ? "0 6px 14px rgba(15, 23, 42, 0.06)"
      : "none",
  "& .MuiSvgIcon-root": {
    fontSize: 18,
  },
};

const compactInlineConfirmButtonSx = {
  ...inlineEditIconButtonSx,
  width: 32,
  height: 32,
  bgcolor: alpha("#10B981", 0.08),
  color: "#10B981",
  border: "1px solid",
  borderColor: alpha("#10B981", 0.2),
  "&:hover": {
    bgcolor: alpha("#10B981", 0.15),
    borderColor: alpha("#10B981", 0.3),
  },
  "&.Mui-disabled": {
    bgcolor: alpha("#64748B", 0.05),
    borderColor: alpha("#64748B", 0.1),
  },
};

const compactInlineCancelButtonSx = {
  ...inlineEditIconButtonSx,
  width: 32,
  height: 32,
  bgcolor: alpha("#64748B", 0.06),
  color: "#64748B",
  border: "1px solid",
  borderColor: alpha("#64748B", 0.15),
  "&:hover": {
    bgcolor: alpha("#64748B", 0.12),
    borderColor: alpha("#64748B", 0.25),
  },
};

const inlineFieldCounterTextSx: SxProps<Theme> = {
  display: "block",
  mt: 0.5,
  pl: 1.5,
  pr: 1.5,
  fontSize: "0.75rem",
  textAlign: "left",
};

const studentEditFieldRowSx: SxProps<Theme> = {
  display: "flex",
  gap: 1,
  alignItems: "center",
  width: "100%",
};

const groupEditActionsWrapSx = {
  width: 72,
  flex: "0 0 72px",
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: 1,
  flexShrink: 0,
};

const inlineEditAccentColor = "#6366F1";

function getInlineEditSectionSx(isEditing: boolean): SxProps<Theme> {
  return {
    p: isEditing ? 2.75 : 2.25,
    bgcolor: isEditing ? alpha(inlineEditAccentColor, 0.035) : "transparent",
    borderLeft: isEditing ? "4px solid" : "none",
    borderLeftColor: inlineEditAccentColor,
    transition: "all 0.25s ease",
    "&:hover": {
      bgcolor: (theme: Theme) =>
        isEditing
          ? alpha(inlineEditAccentColor, 0.05)
          : theme.palette.mode === "light"
            ? alpha(theme.palette.text.primary, 0.01)
            : alpha(theme.palette.common.white, 0.02),
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function scoreColor(percent: number): string {
  if (percent >= 80) return "#16a34a";
  if (percent >= 50) return "#ca8a04";
  return "#dc2626";
}

function parseStudentApiFieldErrors(error: ApiError): EditStudentFieldErrors {
  const code = error.problem.code ?? error.problem.title;
  if (code === "EMAIL_ALREADY_TAKEN") {
    return { email: "Ten adres e-mail jest już zajęty." };
  }
  if (code === "USERNAME_ALREADY_TAKEN") {
    return { username: "Ta nazwa użytkownika jest już zajęta." };
  }

  const detail = error.problem.detail ?? "";
  if (!detail.startsWith("Validation failed:")) {
    return {};
  }

  return detail
    .replace("Validation failed:", "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<EditStudentFieldErrors>((acc, part) => {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex === -1) return acc;

      let field = part.slice(0, separatorIndex).trim();
      // Strip DTO prefixes if present (e.g. UpdateTeacherStudentRequest.email -> email)
      if (field.includes(".")) {
        field = field.split(".").pop() || field;
      }

      const fieldKey = field as keyof EditStudentFieldErrors;
      const validationDetail = part.slice(separatorIndex + 1).trim();

      acc[fieldKey] = translateApiMessage(validationDetail);
      return acc;
    }, {});
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
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [editStudentFeedback, setEditStudentFeedback] =
    useState<EditStudentFeedback | null>(null);
  const [editStudentFieldErrors, setEditStudentFieldErrors] =
    useState<EditStudentFieldErrors>({});
  const [editStudentDraft, setEditStudentDraft] = useState({
    username: "",
    email: "",
    emailConfirm: "",
    groupPublicId: "" as string | "",
  });
  const [editStudentEditingFields, setEditStudentEditingFields] = useState<
    string[]
  >([]);
  const [editStudentInlineSavingField, setEditStudentInlineSavingField] =
    useState<string | null>(null);

  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetStatus, setPasswordResetStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

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

  const openEditStudentDialog = async () => {
    if (!stats?.student) return;
    setEditStudentFeedback(null);
    setEditStudentFieldErrors({});
    setEditStudentLoading(true);
    try {
      const groups = await lessonService.getTeacherGroups();
      setAvailableGroups(groups);
      setEditStudentDraft({
        username: stats.student.username ?? "",
        email: stats.student.email,
        emailConfirm: "",
        groupPublicId: stats.student.groupPublicId,
      });
      setEditStudentEditingFields([]);
      setPasswordResetStatus("idle");
      setEditStudentOpen(true);
    } catch {
      setEditStudentFeedback({
        severity: "error",
        message: "Nie udało się przygotować edycji ucznia.",
      });
    } finally {
      setEditStudentLoading(false);
    }
  };

  const closeEditStudentDialog = () => {
    if (editStudentLoading) return;
    setEditStudentOpen(false);
    setEditStudentFieldErrors({});
  };

  const saveEditStudentInlineField = async (
    field: "username" | "email" | "group",
  ) => {
    if (!studentPublicId || !stats?.student || editStudentLoading) return;

    const nextFieldErrors: EditStudentFieldErrors = {};
    if (field === "username" && !editStudentDraft.username.trim()) {
      nextFieldErrors.username = "Wypełnij nazwę użytkownika.";
    }
    if (field === "email") {
      if (!editStudentDraft.email.trim()) {
        nextFieldErrors.email = "Wypełnij adres e-mail.";
      }
      if (
        editStudentDraft.email.trim() !== editStudentDraft.emailConfirm.trim()
      ) {
        nextFieldErrors.emailConfirm = "Adresy e-mail nie są zgodne.";
      }
    }
    if (field === "group" && !editStudentDraft.groupPublicId) {
      nextFieldErrors.groupPublicId = "Wybierz grupę ucznia.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setEditStudentFieldErrors(nextFieldErrors);
      return;
    }

    setEditStudentFieldErrors({});
    setEditStudentFeedback(null);
    setEditStudentInlineSavingField(field);

    try {
      await lessonService.updateTeacherStudent(studentPublicId, {
        username: editStudentDraft.username.trim(),
        email: editStudentDraft.email.trim(),
        groupPublicId: editStudentDraft.groupPublicId,
      });

      const refreshedStats =
        await lessonService.getStudentStats(studentPublicId);
      setStats(refreshedStats);

      setEditStudentEditingFields((prev) => prev.filter((f) => f !== field));
      setEditStudentFeedback({
        severity: "success",
        message: "Zmiana została zapisana.",
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setEditStudentFieldErrors(parseStudentApiFieldErrors(err));
      }
      const message =
        err instanceof ApiError
          ? getApiErrorMessage(err, "Nie udało się zapisać zmiany.", {
              username: "Nazwa użytkownika",
              email: "Adres e-mail",
              groupPublicId: "Grupa",
            })
          : "Nie udało się zapisać zmiany.";
      setEditStudentFeedback({ severity: "error", message });
    } finally {
      setEditStudentInlineSavingField(null);
    }
  };

  const handleResetPassword = async () => {
    if (!stats?.student?.email || passwordResetLoading) return;

    setPasswordResetLoading(true);
    setPasswordResetStatus("sending");
    setEditStudentFeedback(null);

    try {
      await authService.forgotPassword({ email: stats.student.email });
      setPasswordResetStatus("sent");
    } catch (err) {
      setPasswordResetStatus("error");
      const message =
        err instanceof ApiError
          ? err.message
          : "Nie udało się wysłać linku do resetu hasła.";
      setEditStudentFeedback({ severity: "error", message });
    } finally {
      setPasswordResetLoading(false);
    }
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
          loading={loadingUser}
          username={user?.username}
          subtitle="Panel nauczyciela"
          fallbackName="Nauczycielu"
          user={user}
          onUserUpdated={setUser}
        />

        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(backTo)}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            mb: 2,
            mt: -1,
            color: "primary.main",
            "&:hover": {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
              color: "primary.main",
            },
          }}
        >
          {backLabel}
        </Button>

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
            <Box
              sx={{ ml: "auto", alignSelf: { xs: "stretch", sm: "center" } }}
            >
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={openEditStudentDialog}
                disabled={editStudentLoading}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                Edytuj ucznia
              </Button>
            </Box>
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
                <StatsCard
                  label="Ukończone lekcje"
                  value={stats.completedLessons}
                  helperText={`z ${stats.totalLessons} lekcji`}
                  highlightColor={theme.palette.success.main}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatsCard
                  label="Średni wynik"
                  value={`${Math.round(stats.avgScore)}%`}
                  helperText="ukończonych lekcji"
                  highlightColor={theme.palette.primary.main}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatsCard
                  label="Poprawne odpowiedzi"
                  value={correctAnswers}
                  helperText={`${totalAnswers} odpowiedzi łącznie`}
                  highlightColor={theme.palette.info.main}
                />
              </Grid>
            </Grid>
          )
        )}

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
                    Historia pojawi się po ukończeniu pierwszej lekcji.
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
                          id="progressSkillsCorrectBars"
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
                          id="progressSkillsWrongBars"
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
                          if (name === "Dobrze")
                            return [
                              `${pct} (${entry?.correct ?? 0})`,
                              "Dobrze",
                            ];
                          return [`${pct} (${entry?.wrong ?? 0})`, "Źle"];
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          color: theme.palette.text.secondary,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="correctPct"
                        stackId="a"
                        name="Dobrze"
                        fill="url(#progressSkillsCorrectBars)"
                        radius={[0, 0, 4, 4]}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="wrongPct"
                        stackId="a"
                        name="Źle"
                        fill="url(#progressSkillsWrongBars)"
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
            <Paper elevation={0} sx={{ ...panelGridCardSx, borderRadius: 3.5 }}>
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
                        borderRadius: 3.5,
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
                          borderRadius: 3.5,
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

        <AppDialog
          open={editStudentOpen}
          onClose={closeEditStudentDialog}
          maxWidth="sm"
          paperSx={{
            width: {
              xs: "calc(100% - 24px)",
              sm: uiTokens.modal.comfortableWidth,
            },
          }}
        >
          <AppDialogHeader
            icon={<EditIcon />}
            title="Edytuj ucznia"
            subtitle="Zmiana danych ucznia i przypisanej grupy."
            badge={
              <Chip
                label="Uczeń"
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  px: 0.5,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                  color: "primary.main",
                  borderColor: (t) => alpha(t.palette.primary.main, 0.16),
                }}
              />
            }
          />
          <AppDialogBody
            sx={{
              p: 2.5,
              bgcolor: "transparent",
            }}
          >
            {editStudentFeedback && (
              <AppDialogStatus severity={editStudentFeedback.severity}>
                {editStudentFeedback.message}
              </AppDialogStatus>
            )}

            <Box sx={settingsPanelSurfaceSx}>
              {/* Username row */}
              <Box
                sx={{
                  ...getInlineEditSectionSx(
                    editStudentEditingFields.includes("username"),
                  ),
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                }}
              >
                {editStudentEditingFields.includes("username") ? (
                  <Box sx={settingsRowSx}>
                    <Box
                      sx={{
                        ...settingsRowIconTileSx,
                        alignSelf: "flex-start",
                        mt: 0.25,
                      }}
                    >
                      <PersonIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.75 }}
                      >
                        Edycja nazwy użytkownika
                      </Typography>
                      <Box sx={studentEditFieldRowSx}>
                        <TextField
                          value={editStudentDraft.username}
                          onChange={(event) => {
                            setEditStudentFieldErrors((current) => ({
                              ...current,
                              username: undefined,
                            }));
                            setEditStudentDraft((draft) => ({
                              ...draft,
                              username: event.target.value.slice(
                                0,
                                INPUT_LIMITS.username,
                              ),
                            }));
                          }}
                          inputProps={{ maxLength: INPUT_LIMITS.username }}
                          error={Boolean(editStudentFieldErrors.username)}
                          fullWidth
                          size="small"
                          autoFocus
                          disabled={editStudentLoading}
                        />
                        <Box sx={groupEditActionsWrapSx}>
                          <IconButton
                            size="small"
                            disabled={
                              editStudentLoading ||
                              editStudentDraft.username.trim().length < 3 ||
                              editStudentInlineSavingField === "username"
                            }
                            onClick={() =>
                              void saveEditStudentInlineField("username")
                            }
                            sx={compactInlineConfirmButtonSx}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={editStudentLoading}
                            onClick={() => {
                              setEditStudentDraft((draft) => ({
                                ...draft,
                                username: stats?.student?.username ?? "",
                              }));
                              setEditStudentEditingFields((prev) =>
                                prev.filter((f) => f !== "username"),
                              );
                            }}
                            sx={compactInlineCancelButtonSx}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        color={
                          editStudentFieldErrors.username
                            ? "error"
                            : "text.secondary"
                        }
                        sx={inlineFieldCounterTextSx}
                      >
                        {editStudentFieldErrors.username ??
                          `${editStudentDraft.username.length}/${INPUT_LIMITS.username}`}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      ...settingsRowSx,
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={settingsRowIconTileSx}>
                      <PersonIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" sx={settingsRowLabelSx}>
                        Nazwa użytkownika
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        fontSize="1rem"
                      >
                        {editStudentDraft.username || "—"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() =>
                        setEditStudentEditingFields((prev) => [
                          ...prev,
                          "username",
                        ])
                      }
                      sx={inlineChangeButtonSx}
                    >
                      Zmień
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Email row */}
              <Box
                sx={{
                  ...getInlineEditSectionSx(
                    editStudentEditingFields.includes("email"),
                  ),
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                }}
              >
                {editStudentEditingFields.includes("email") ? (
                  <Box sx={settingsRowSx}>
                    <Box
                      sx={{
                        ...settingsRowIconTileSx,
                        alignSelf: "flex-start",
                        mt: 0.25,
                      }}
                    >
                      <EmailIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.75 }}
                      >
                        Edycja adresu e-mail
                      </Typography>
                      <Stack spacing={1}>
                        <Box sx={studentEditFieldRowSx}>
                          <TextField
                            value={editStudentDraft.email}
                            onChange={(event) => {
                              setEditStudentFieldErrors((current) => ({
                                ...current,
                                email: undefined,
                              }));
                              setEditStudentDraft((draft) => ({
                                ...draft,
                                email: event.target.value,
                              }));
                            }}
                            error={Boolean(editStudentFieldErrors.email)}
                            helperText={editStudentFieldErrors.email}
                            fullWidth
                            size="small"
                            autoFocus
                            disabled={editStudentLoading}
                            placeholder="np. uczen@szkola.pl"
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <EmailIcon
                                      sx={{ color: "text.secondary" }}
                                    />
                                  </InputAdornment>
                                ),
                              },
                            }}
                          />
                          <Box sx={groupEditActionsWrapSx}>
                            <IconButton
                              size="small"
                              disabled={
                                editStudentLoading ||
                                editStudentInlineSavingField === "email"
                              }
                              onClick={() =>
                                void saveEditStudentInlineField("email")
                              }
                              sx={compactInlineConfirmButtonSx}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              disabled={editStudentLoading}
                              onClick={() => {
                                setEditStudentDraft((draft) => ({
                                  ...draft,
                                  email: stats?.student?.email ?? "",
                                  emailConfirm: "",
                                }));
                                setEditStudentFieldErrors((prev) => ({
                                  ...prev,
                                  email: undefined,
                                  emailConfirm: undefined,
                                }));
                                setEditStudentEditingFields((prev) =>
                                  prev.filter((f) => f !== "email"),
                                );
                              }}
                              sx={compactInlineCancelButtonSx}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography
                          sx={{
                            ...dialogFieldLabelSx,
                            mb: 0.25,
                            color: "#a7b0c0",
                            fontSize: "0.75rem",
                            fontWeight: 400,
                          }}
                        >
                          Potwierdź adres e-mail
                        </Typography>
                        <TextField
                          value={editStudentDraft.emailConfirm}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon sx={{ color: "text.secondary" }} />
                                </InputAdornment>
                              ),
                            },
                          }}
                          onChange={(event) => {
                            setEditStudentFieldErrors((current) => ({
                              ...current,
                              emailConfirm: undefined,
                            }));
                            setEditStudentDraft((draft) => ({
                              ...draft,
                              emailConfirm: event.target.value,
                            }));
                          }}
                          fullWidth
                          size="small"
                          disabled={editStudentLoading}
                          error={
                            Boolean(editStudentFieldErrors.emailConfirm) ||
                            (editStudentDraft.emailConfirm.length > 0 &&
                              editStudentDraft.email !==
                                editStudentDraft.emailConfirm)
                          }
                          helperText={
                            editStudentFieldErrors.emailConfirm ??
                            (editStudentDraft.emailConfirm.length > 0 &&
                            editStudentDraft.email !==
                              editStudentDraft.emailConfirm
                              ? "Adresy e-mail nie są zgodne"
                              : "")
                          }
                          placeholder="Powtórz e-mail"
                        />
                      </Stack>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      ...settingsRowSx,
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={settingsRowIconTileSx}>
                      <EmailIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" sx={settingsRowLabelSx}>
                        Adres e-mail
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        fontSize="1rem"
                      >
                        {editStudentDraft.email || "—"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditStudentDraft((draft) => ({
                          ...draft,
                          email: stats?.student?.email ?? "",
                          emailConfirm: "",
                        }));
                        setEditStudentFieldErrors((prev) => ({
                          ...prev,
                          email: undefined,
                          emailConfirm: undefined,
                        }));
                        setEditStudentEditingFields((prev) => [
                          ...prev,
                          "email",
                        ]);
                      }}
                      sx={inlineChangeButtonSx}
                    >
                      Zmień
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Group row */}
              <Box
                sx={{
                  ...getInlineEditSectionSx(
                    editStudentEditingFields.includes("group"),
                  ),
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                }}
              >
                {editStudentEditingFields.includes("group") ? (
                  <Box sx={settingsRowSx}>
                    <Box
                      sx={{
                        ...settingsRowIconTileSx,
                        alignSelf: "flex-start",
                        mt: 0.25,
                      }}
                    >
                      <SchoolIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.75 }}
                      >
                        Edycja przypisanej grupy
                      </Typography>
                      <Box sx={studentEditFieldRowSx}>
                        <TextField
                          select
                          value={editStudentDraft.groupPublicId}
                          onChange={(event) => {
                            setEditStudentFieldErrors((current) => ({
                              ...current,
                              groupPublicId: undefined,
                            }));
                            setEditStudentDraft((draft) => ({
                              ...draft,
                              groupPublicId: event.target.value,
                            }));
                          }}
                          error={Boolean(editStudentFieldErrors.groupPublicId)}
                          helperText={editStudentFieldErrors.groupPublicId}
                          fullWidth
                          size="small"
                          autoFocus
                          disabled={editStudentLoading}
                        >
                          {availableGroups.map((group) => (
                            <MenuItem
                              key={group.publicId}
                              value={group.publicId}
                            >
                              {group.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Box sx={groupEditActionsWrapSx}>
                          <IconButton
                            size="small"
                            disabled={
                              editStudentLoading ||
                              !editStudentDraft.groupPublicId ||
                              editStudentInlineSavingField === "group"
                            }
                            onClick={() =>
                              void saveEditStudentInlineField("group")
                            }
                            sx={compactInlineConfirmButtonSx}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={editStudentLoading}
                            onClick={() => {
                              setEditStudentDraft((draft) => ({
                                ...draft,
                                groupPublicId:
                                  stats?.student?.groupPublicId ?? "",
                              }));
                              setEditStudentEditingFields((prev) =>
                                prev.filter((f) => f !== "group"),
                              );
                            }}
                            sx={compactInlineCancelButtonSx}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      ...settingsRowSx,
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={settingsRowIconTileSx}>
                      <SchoolIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" sx={settingsRowLabelSx}>
                        Przypisana grupa
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        fontSize="1rem"
                      >
                        {availableGroups.find(
                          (g) => g.publicId === editStudentDraft.groupPublicId,
                        )?.name || "—"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() =>
                        setEditStudentEditingFields((prev) => [
                          ...prev,
                          "group",
                        ])
                      }
                      sx={inlineChangeButtonSx}
                    >
                      Zmień
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Password reset row */}
              <Box
                sx={{
                  ...settingsRowSx,
                  p: 2.25,
                  justifyContent: "space-between",
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? alpha("#6366F1", 0.04)
                      : alpha("#6366F1", 0.08),
                  borderTop: "1px solid",
                  borderTopColor: "divider",
                }}
              >
                <Box sx={settingsRowIconTileSx}>
                  <LockResetIcon fontSize="small" />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ ...settingsRowLabelSx, color: "#6366F1" }}
                    fontWeight={700}
                    display="block"
                  >
                    Reset hasła
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.4, fontSize: "0.85rem" }}
                  >
                    Wyślij link do ustawienia nowego hasła.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    passwordResetLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : passwordResetStatus === "sent" ? (
                      <CheckIcon fontSize="small" />
                    ) : (
                      <EmailIcon fontSize="small" />
                    )
                  }
                  onClick={handleResetPassword}
                  disabled={
                    passwordResetLoading ||
                    passwordResetStatus === "sent" ||
                    !EMAIL_REGEX.test(editStudentDraft.email.trim())
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    borderRadius: "10px",
                    px: 1.5,
                    py: 0.6,
                    minHeight: 32,
                    minWidth: 120,
                    whiteSpace: "nowrap",
                    gap: 0.5,
                    "& .MuiButton-startIcon": { mr: 0.5 },
                    borderColor:
                      passwordResetStatus === "sent"
                        ? alpha("#10B981", 0.3)
                        : alpha("#6366F1", 0.2),
                    bgcolor:
                      passwordResetStatus === "sent"
                        ? alpha("#10B981", 0.05)
                        : "transparent",
                    color:
                      passwordResetStatus === "sent" ? "#10B981" : "#6366F1",
                    "&:hover": {
                      borderColor:
                        passwordResetStatus === "sent"
                          ? alpha("#10B981", 0.4)
                          : alpha("#6366F1", 0.4),
                      bgcolor:
                        passwordResetStatus === "sent"
                          ? alpha("#10B981", 0.08)
                          : alpha("#6366F1", 0.04),
                    },
                  }}
                >
                  {passwordResetLoading
                    ? "Wysyłanie..."
                    : passwordResetStatus === "sent"
                      ? "Wysłano"
                      : "Wyślij link"}
                </Button>
              </Box>
            </Box>
          </AppDialogBody>
        </AppDialog>
      </Container>
    </Box>
  );
}
