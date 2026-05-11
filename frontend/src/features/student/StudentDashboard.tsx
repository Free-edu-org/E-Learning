import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AttachFileOutlined as AttachFileIcon,
  AutoStoriesOutlined as LessonIcon,
  CheckCircleOutlined as CompletedIcon,
  CloseOutlined as CloseIcon,
  DownloadOutlined as DownloadIcon,
  InsightsOutlined as InsightsIcon,
  LockOutlined as LockIcon,
  SortOutlined as SortIcon,
  TrendingUpOutlined as ResultIcon,
  PlayArrowOutlined as PlayIcon,
  MicNoneOutlined as MicIcon,
  AutoAwesomeOutlined as AIIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  studentService,
  type StudentLesson,
  type StudentLessonAttachment,
  type StudentStats,
} from "@/api/studentService";
import { StudentAchievementNotifications } from "@/components/achievements/StudentAchievementNotifications";
import { lessonService } from "@/api/lessonService";
import { userService, type UserProfile } from "@/api/userService";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  panelGridCardContentSx,
  panelGridCardSx,
  panelSurfaceSx,
  panelToolbarSx,
} from "@/components/ui/panel/panelStyles";
import { StatsCard } from "@/components/teacher/StatsCard";
import { useAuth } from "@/context/AuthContext";
import { formatPercent, getErrorMessage } from "@/utils/dashboardUtils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLessonStatusTag(lesson: StudentLesson) {
  if (lesson.status === "COMPLETED") {
    return (
      <Chip
        label="Ukończona"
        size="small"
        sx={{
          bgcolor: (t) => alpha(t.palette.success.main, 0.12),
          color: "success.main",
          fontWeight: 700,
          borderRadius: 1.5,
          height: 24,
          fontSize: "0.72rem",
        }}
      />
    );
  }
  if (!lesson.isActive) {
    return (
      <Chip
        label="Nieaktywna"
        size="small"
        sx={{
          bgcolor: (t) => alpha(t.palette.text.disabled, 0.12),
          color: "text.disabled",
          fontWeight: 700,
          borderRadius: 1.5,
          height: 24,
          fontSize: "0.72rem",
        }}
      />
    );
  }
  if (lesson.status === "IN_PROGRESS") {
    return (
      <Chip
        label="W trakcie"
        size="small"
        sx={{
          bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
          color: "primary.main",
          fontWeight: 700,
          borderRadius: 1.5,
          height: 24,
          fontSize: "0.72rem",
        }}
      />
    );
  }
  return (
    <Chip
      label="Do rozpoczęcia"
      size="small"
      sx={{
        bgcolor: (t) => alpha(t.palette.info.main, 0.12),
        color: "info.main",
        fontWeight: 700,
        borderRadius: 1.5,
        height: 24,
        fontSize: "0.72rem",
      }}
    />
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

// ── Result Dialog ─────────────────────────────────────────────────────────────

interface ResultDialogProps {
  lesson: StudentLesson | null;
  onClose: () => void;
  onOpenDetails: (lessonPublicId: string) => void;
}

function ResultDialog({ lesson, onClose, onOpenDetails }: ResultDialogProps) {
  const theme = useTheme();
  if (!lesson) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, backgroundImage: "none" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          pt: 3,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: "success.main",
            }}
          >
            <ResultIcon />
          </Box>
          <Typography variant="h6" fontWeight={800}>
            Wynik lekcji
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {lesson.title}
        </Typography>
        <Box
          sx={{
            ...panelSurfaceSx,
            p: 4,
            textAlign: "center",
            background:
              theme.palette.mode === "light"
                ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`
                : alpha(theme.palette.success.main, 0.05),
            mb: 3,
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
          }}
        >
          <Typography
            variant="h2"
            fontWeight={900}
            color="success.main"
            sx={{ letterSpacing: "-0.05em", lineHeight: 1 }}
          >
            {formatPercent(lesson.resultPercent)}
          </Typography>
          {lesson.score != null && lesson.maxScore != null && (
            <Typography
              variant="subtitle1"
              fontWeight={600}
              color="text.secondary"
              sx={{ mt: 1.5, opacity: 0.8 }}
            >
              {lesson.score} / {lesson.maxScore} punktów
            </Typography>
          )}
        </Box>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.success.main, 0.05),
            border: `1px dashed ${alpha(theme.palette.success.main, 0.2)}`,
          }}
        >
          <CompletedIcon color="success" />
          <Typography variant="body2" fontWeight={700} color="success.main">
            Lekcja ukończona pomyślnie
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => onOpenDetails(lesson.publicId)}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 3,
            py: 1.2,
            boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
          }}
        >
          Przejdź do szczegółów
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Attachment Dialog ─────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentDialogProps {
  lesson: StudentLesson | null;
  downloadingAttachmentId: string | null;
  downloadError: string | null;
  onClose: () => void;
  onDownload: (
    lessonPublicId: string,
    attachment: StudentLessonAttachment,
  ) => void;
}

function AttachmentDialog({
  lesson,
  downloadingAttachmentId,
  downloadError,
  onClose,
  onDownload,
}: AttachmentDialogProps) {
  const theme = useTheme();
  if (!lesson || lesson.attachments.length === 0) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, backgroundImage: "none" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          pt: 3,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: "info.main",
            }}
          >
            <AttachFileIcon />
          </Box>
          <Typography variant="h6" fontWeight={800}>
            Materiały
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: -1, mr: -1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {lesson.title}
        </Typography>

        <Stack spacing={1.5}>
          {lesson.attachments.map((att) => {
            const isDownloading = downloadingAttachmentId === att.publicId;
            return (
              <Box
                key={att.publicId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: (t) => alpha(t.palette.info.main, 0.05),
                  border: "1px solid",
                  borderColor: (t) => alpha(t.palette.info.main, 0.12),
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: (t) => alpha(t.palette.info.main, 0.08),
                    borderColor: (t) => alpha(t.palette.info.main, 0.25),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: "info.main",
                    flexShrink: 0,
                  }}
                >
                  <AttachFileIcon sx={{ fontSize: 18 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {att.originalFileName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, opacity: 0.8 }}
                  >
                    {formatBytes(att.fileSize)} ·{" "}
                    {att.contentType.split("/").pop()?.toUpperCase()}
                  </Typography>
                </Box>
                <Tooltip title="Pobierz plik">
                  <IconButton
                    size="small"
                    disabled={isDownloading}
                    onClick={() => onDownload(lesson.publicId, att)}
                    sx={{
                      flexShrink: 0,
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                      },
                    }}
                  >
                    {isDownloading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DownloadIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
        </Stack>

        {downloadError && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2.5 }}>
            {downloadError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 3,
            py: 1,
          }}
        >
          Zamknij
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<StudentLesson["status"], number> = {
  IN_PROGRESS: 0,
  NOT_STARTED: 1,
  COMPLETED: 2,
};

export function StudentDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [resultLesson, setResultLesson] = useState<StudentLesson | null>(null);
  const [confirmStartLesson, setConfirmStartLesson] =
    useState<StudentLesson | null>(null);
  const [attachmentLesson, setAttachmentLesson] =
    useState<StudentLesson | null>(null);

  // Filtering & sorting
  type LessonFilter = "ALL" | "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
  type LessonSort = "title_asc" | "title_desc" | "status";
  const [lessonFilter, setLessonFilter] = useState<LessonFilter>("ALL");
  const [lessonSort, setLessonSort] = useState<LessonSort>("status");
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
    string | null
  >(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadAttachment = async (
    lessonPublicId: string,
    attachment: StudentLessonAttachment,
  ) => {
    setDownloadingAttachmentId(attachment.publicId);
    setDownloadError(null);
    try {
      const blob = await lessonService.downloadAttachment(
        lessonPublicId,
        attachment.publicId,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.originalFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Nie udało się pobrać załącznika.");
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  useEffect(() => {
    Promise.all([
      userService.getCurrentUser(),
      studentService.getStats(),
      studentService.getLessons(),
    ])
      .then(([currentUser, nextStats, nextLessons]) => {
        setUser(currentUser);
        setStats(nextStats);
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
        ? "linear-gradient(135deg, rgba(79,70,229,0.94) 0%, rgba(168,85,247,0.92) 100%)"
        : "linear-gradient(135deg, rgba(67,56,202,0.88) 0%, rgba(147,51,234,0.84) 100%)",
    [theme.palette.mode],
  );

  const progressPercent =
    stats && stats.totalLessons > 0
      ? (stats.completedLessons / stats.totalLessons) * 100
      : 0;

  const displayedLessons = useMemo(() => {
    let result = lessons.filter((l) => {
      if (lessonFilter === "ALL") return true;
      if (lessonFilter === "NOT_STARTED")
        return l.status === "NOT_STARTED" && l.isActive;
      return l.status === lessonFilter;
    });

    result = [...result].sort((a, b) => {
      if (lessonSort === "title_asc")
        return a.title.localeCompare(b.title, "pl");
      if (lessonSort === "title_desc")
        return b.title.localeCompare(a.title, "pl");
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    });

    return result;
  }, [lessons, lessonFilter, lessonSort]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        {/* ── Top bar ── */}
        <DashboardTopBar onLogout={handleLogout} />

        {/* ── Greeting header ── */}
        <DashboardHeader
          loading={loading}
          username={user?.username}
          subtitle="Twoja strefa nauki"
          fallbackName="Uczniu"
          user={user}
          onUserUpdated={setUser}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <StudentAchievementNotifications />

        {/* ── Hero banner ── */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: { xs: 3, md: 4 },
            color: "#fff",
            borderRadius: 5,
            background: heroGradient,
            boxShadow: "0 24px 48px rgba(79, 70, 229, 0.28)",
            position: "relative",
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              top: "-50%",
              right: "-10%",
              width: "40%",
              height: "200%",
              background: "rgba(255,255,255,0.06)",
              transform: "rotate(15deg)",
              pointerEvents: "none",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={4}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box sx={{ maxWidth: 600 }}>
              <Typography
                variant="overline"
                sx={{ opacity: 0.9, fontWeight: 700, letterSpacing: "0.1em" }}
              >
                Twój postęp nauki
              </Typography>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{ mb: 2, mt: 1, letterSpacing: "-0.02em" }}
              >
                {progressPercent === 0
                  ? "Zacznij od pierwszej lekcji — każdy krok się liczy!"
                  : progressPercent === 100
                    ? "Świetnie! Ukończyłeś wszystkie przypisane lekcje 🎉"
                    : `Brawo! Masz już ${formatPercent(progressPercent)} planu za sobą.`}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Button
                  variant="contained"
                  color="inherit"
                  startIcon={<InsightsIcon />}
                  onClick={() => navigate("/student/progress")}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    color: "#fff",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 2.5,
                    px: 3,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.25)",
                    },
                  }}
                >
                  Szczegółowe statystyki
                </Button>
              </Box>
            </Box>
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                borderRadius: 4,
                px: 5,
                py: 3,
                textAlign: "center",
                flexShrink: 0,
                minWidth: 160,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Typography variant="h2" fontWeight={900} sx={{ lineHeight: 1 }}>
                {formatPercent(progressPercent)}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ opacity: 0.9, fontWeight: 600, mt: 0.5 }}
              >
                ukończono
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* ── Stats Grid ── */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatsCard
              label="Ukończone lekcje"
              value={stats?.completedLessons ?? 0}
              helperText={`z ${stats?.totalLessons ?? 0} lekcji`}
              highlightColor={theme.palette.success.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatsCard
              label="Średni wynik"
              value={`${Math.round(stats?.averageScore ?? 0)}%`}
              helperText="wszystkich lekcji"
              highlightColor={theme.palette.primary.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatsCard
              label="Punkty"
              value={stats?.points ?? 0}
              highlightColor={theme.palette.info.main}
            />
          </Grid>
        </Grid>

        {/* ── Lesson list header ── */}
        <Box
          sx={{
            ...panelToolbarSx,
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            mb: 3,
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            color="text.primary"
            sx={{ mr: "auto" }}
          >
            Twoje lekcje
          </Typography>

          {!loading && lessons.length > 0 && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <ToggleButtonGroup
                value={lessonFilter}
                exclusive
                onChange={(_, v) => {
                  if (v) setLessonFilter(v);
                }}
                size="small"
                sx={{
                  bgcolor:
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.primary.main, 0.04)
                      : "background.paper",
                  p: 0.5,
                  borderRadius: 2.5,
                  "& .MuiToggleButton-root": {
                    border: "none",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 2,
                    fontSize: "0.8rem",
                    "&.Mui-selected": {
                      bgcolor: "background.paper",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      color: "primary.main",
                      "&:hover": {
                        bgcolor: "background.paper",
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="ALL">Wszystkie</ToggleButton>
                <ToggleButton value="COMPLETED">Ukończone</ToggleButton>
                <ToggleButton value="NOT_STARTED">Do zrobienia</ToggleButton>
              </ToggleButtonGroup>

              <Select
                value={lessonSort}
                onChange={(e) =>
                  setLessonSort(e.target.value as typeof lessonSort)
                }
                size="small"
                startAdornment={
                  <SortIcon
                    sx={{ mr: 1, fontSize: 18, color: "text.secondary" }}
                  />
                }
                sx={{
                  minWidth: 170,
                  borderRadius: 2.5,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  bgcolor: "background.paper",
                }}
              >
                <MenuItem value="status">Domyślnie</MenuItem>
                <MenuItem value="title_asc">Tytuł: A → Z</MenuItem>
                <MenuItem value="title_desc">Tytuł: Z → A</MenuItem>
              </Select>
            </Stack>
          )}
        </Box>

        {loading ? (
          <Grid container spacing={2}>
            {[...Array(6)].map((_, index) => (
              <Grid key={index} size={{ xs: 12, md: 6, lg: 4 }}>
                <Skeleton
                  variant="rounded"
                  height={200}
                  sx={{ borderRadius: 4 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : lessons.length === 0 ? (
          <Paper
            sx={{
              ...panelSurfaceSx,
              p: 6,
              textAlign: "center",
              borderRadius: 4,
            }}
          >
            <LessonIcon
              sx={{ fontSize: 64, color: "text.disabled", mb: 2, opacity: 0.3 }}
            />
            <Typography variant="h6" fontWeight={700} color="text.secondary">
              Nie masz jeszcze przypisanych lekcji.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gdy Twój nauczyciel udostępni materiały, pojawią się one tutaj.
            </Typography>
          </Paper>
        ) : displayedLessons.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Brak lekcji pasujących do wybranych filtrów.
          </Alert>
        ) : (
          <Grid container spacing={2.5}>
            {displayedLessons.map((lesson) => {
              const isCompleted = lesson.status === "COMPLETED";
              const isLocked = !lesson.isActive && !isCompleted;

              return (
                <Grid key={lesson.publicId} size={{ xs: 12, md: 6, lg: 4 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      ...panelGridCardSx,
                      borderRadius: 4,
                      cursor: isLocked ? "default" : "pointer",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: "divider",
                      ...(!isLocked && {
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                      }),
                      ...(isLocked && {
                        opacity: 0.7,
                        bgcolor: alpha(
                          theme.palette.action.disabledBackground,
                          0.05,
                        ),
                      }),
                    }}
                    onClick={() => {
                      if (isLocked) return;
                      if (isCompleted) {
                        setResultLesson(lesson);
                      } else {
                        setConfirmStartLesson(lesson);
                      }
                    }}
                  >
                    <Box sx={{ ...panelGridCardContentSx, p: 3 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        sx={{ mb: 2.5 }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: "primary.main",
                          }}
                        >
                          {isLocked ? (
                            <LockIcon fontSize="small" />
                          ) : (
                            <LessonIcon />
                          )}
                        </Box>
                        {getLessonStatusTag(lesson)}
                      </Stack>

                      <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{
                          mb: 1,
                          lineHeight: 1.3,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: "2.6em",
                        }}
                      >
                        {lesson.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 3,
                          fontWeight: 600,
                          opacity: 0.8,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {lesson.theme || "Temat nieokreślony"}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: "auto", pt: 1 }}
                      >
                        {lesson.attachments.length > 0 && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<AttachFileIcon sx={{ fontSize: 16 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachmentLesson(lesson);
                            }}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              color: "info.main",
                              fontSize: "0.75rem",
                              borderRadius: 1.5,
                              px: 1.5,
                              "&:hover": {
                                bgcolor: alpha(theme.palette.info.main, 0.08),
                              },
                            }}
                          >
                            Materiały ({lesson.attachments.length})
                          </Button>
                        )}

                        <Box sx={{ ml: "auto" }}>
                          {isCompleted ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<ResultIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                textTransform: "none",
                                fontWeight: 800,
                                borderRadius: 2,
                                fontSize: "0.75rem",
                                pointerEvents: "none",
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: "success.main",
                                boxShadow: "none",
                              }}
                            >
                              {formatPercent(lesson.resultPercent)}
                            </Button>
                          ) : !isLocked ? (
                            <Button
                              size="small"
                              variant="contained"
                              endIcon={<PlayIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                                fontSize: "0.75rem",
                                px: 2,
                                boxShadow: "none",
                              }}
                            >
                              Rozpocznij
                            </Button>
                          ) : null}
                        </Box>
                      </Stack>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* ── Dialogs ── */}
        <ResultDialog
          lesson={resultLesson}
          onClose={() => setResultLesson(null)}
          onOpenDetails={(id) => navigate(`/student/lessons/${id}/result`)}
        />

        <Dialog
          open={Boolean(confirmStartLesson)}
          onClose={() => setConfirmStartLesson(null)}
          PaperProps={{ sx: { borderRadius: 4, backgroundImage: "none" } }}
        >
          <DialogTitle sx={{ pt: 3, px: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                }}
              >
                <PlayIcon />
              </Box>
              <Typography variant="h6" fontWeight={800}>
                Rozpocząć lekcję?
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pb: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              {confirmStartLesson?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Czy jesteś gotowy, aby rozpocząć? Po przejściu do zadań nie będzie
              można wrócić bez ukończenia lekcji.
            </Typography>

            <Stack
              spacing={1.5}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: "info.main",
                  }}
                >
                  <MicIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                >
                  Lekcja wykorzystuje rozpoznawanie mowy — upewnij się, że
                  mikrofon działa.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: "secondary.main",
                  }}
                >
                  <AIIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                >
                  Twoje odpowiedzi będą analizowane przez sztuczną inteligencję
                  (AI).
                </Typography>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
            <Button
              onClick={() => setConfirmStartLesson(null)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Anuluj
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (confirmStartLesson) {
                  navigate(`/student/lessons/${confirmStartLesson.publicId}`);
                  setConfirmStartLesson(null);
                }
              }}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2.5,
                px: 3,
                boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              Rozpocznij lekcję
            </Button>
          </DialogActions>
        </Dialog>

        <AttachmentDialog
          lesson={attachmentLesson}
          downloadingAttachmentId={downloadingAttachmentId}
          downloadError={downloadError}
          onClose={() => setAttachmentLesson(null)}
          onDownload={handleDownloadAttachment}
        />
      </Container>
    </Box>
  );
}
