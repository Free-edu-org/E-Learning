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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  studentService,
  type StudentLesson,
  type StudentLessonAttachment,
  type StudentProgress,
  type StudentStats,
} from "@/api/studentService";
import { lessonService } from "@/api/lessonService";
import { userService, type UserProfile } from "@/api/userService";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  panelCardFooterSx,
  panelFooterButtonSx,
  panelGridCardContentSx,
  panelGridCardSx,
  panelSurfaceSx,
  panelToolbarSx,
} from "@/components/ui/panel/panelStyles";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import {
  formatPercent,
  getErrorMessage,
} from "@/utils/dashboardUtils";

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
  onOpenDetails: (lessonId: number) => void;
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
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ResultIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" fontWeight={700}>
            Wynik lekcji
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {lesson.title}
        </Typography>
        <Box
          sx={{
            ...panelSurfaceSx,
            p: 2.5,
            textAlign: "center",
            bgcolor: alpha(theme.palette.success.main, 0.07),
            mb: 2,
          }}
        >
          <Typography variant="h3" fontWeight={800} color="success.main">
            {formatPercent(lesson.resultPercent)}
          </Typography>
          {lesson.score != null && lesson.maxScore != null && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {lesson.score} / {lesson.maxScore} punktów
            </Typography>
          )}
        </Box>
        <Chip
          icon={<CompletedIcon />}
          label="Lekcja ukończona"
          color="success"
          variant="outlined"
          sx={{ width: "100%", justifyContent: "center" }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Zamknij
        </Button>
        <Button
          variant="contained"
          onClick={() => onOpenDetails(lesson.id)}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
        >
          Przejdź do szczegółów
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Progress Dialog ───────────────────────────────────────────────────────────

interface ProgressDialogProps {
  progress: StudentProgress | null;
  stats: StudentStats | null;
  onClose: () => void;
}

function ProgressDialog({ progress, stats, onClose }: ProgressDialogProps) {
  const theme = useTheme();
  const progressPercent =
    stats && stats.totalLessons > 0
      ? (stats.completedLessons / stats.totalLessons) * 100
      : 0;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InsightsIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" fontWeight={700}>
            Twoje postępy
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box
            sx={{
              ...panelSurfaceSx,
              p: 2,
              textAlign: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.06),
            }}
          >
            <Typography variant="h3" fontWeight={800} color="primary.main">
              {formatPercent(progressPercent)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ogólny postęp
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Chip
              icon={<CompletedIcon />}
              label={`Ukończono: ${progress?.completedLessons ?? 0}`}
              color="success"
              variant="outlined"
              sx={{ flex: 1, justifyContent: "center" }}
            />
          </Stack>

          {stats && (
            <Box sx={{ ...panelSurfaceSx, p: 1.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}
              >
                Średni wynik
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {formatPercent(stats.averageScore)}
              </Typography>
            </Box>
          )}

          {progress?.summary && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.7 }}
            >
              {progress.summary}
            </Typography>
          )}
        </Stack>
      </DialogContent>
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
  downloadingAttachmentId: number | null;
  downloadError: string | null;
  onClose: () => void;
  onDownload: (lessonId: number, attachment: StudentLessonAttachment) => void;
}

function AttachmentDialog({
  lesson,
  downloadingAttachmentId,
  downloadError,
  onClose,
  onDownload,
}: AttachmentDialogProps) {
  if (!lesson || lesson.attachments.length === 0) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AttachFileIcon sx={{ color: "info.main" }} />
          <Typography variant="h6" fontWeight={700}>
            Materiały do lekcji
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {lesson.title}
        </Typography>

        <Stack spacing={1}>
          {lesson.attachments.map((att) => {
            const isDownloading = downloadingAttachmentId === att.id;
            return (
              <Box
                key={att.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: (t) => alpha(t.palette.info.main, 0.07),
                  border: "1px solid",
                  borderColor: (t) => alpha(t.palette.info.main, 0.18),
                }}
              >
                <AttachFileIcon
                  sx={{ fontSize: 18, color: "info.main", flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {att.originalFileName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(att.fileSize)} · {att.contentType}
                  </Typography>
                </Box>
                <Tooltip title="Pobierz">
                  <span>
                    <IconButton
                      size="small"
                      disabled={isDownloading}
                      onClick={() => onDownload(lesson.id, att)}
                      sx={{
                        flexShrink: 0,
                        color: "info.main",
                        "&:hover": {
                          bgcolor: (t) => alpha(t.palette.info.main, 0.12),
                        },
                      }}
                    >
                      {isDownloading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DownloadIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            );
          })}
        </Stack>

        {downloadError && (
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
            {downloadError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600 }}
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
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [resultLesson, setResultLesson] = useState<StudentLesson | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
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
    number | null
  >(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadAttachment = async (
    lessonId: number,
    attachment: StudentLessonAttachment,
  ) => {
    setDownloadingAttachmentId(attachment.id);
    setDownloadError(null);
    try {
      const blob = await lessonService.downloadAttachment(
        lessonId,
        attachment.id,
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
      // status: in_progress first, then not_started, then completed
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
          subtitle="Panel ucznia"
          fallbackName="Uczniu"
          user={user}
          onUserUpdated={setUser}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* ── Hero banner ── */}
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
              <Typography variant="body2" sx={{ opacity: 0.82, mb: 0.5 }}>
                Twój postęp nauki
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                {progressPercent === 0
                  ? "Zacznij od pierwszej lekcji — każdy krok się liczy!"
                  : progressPercent === 100
                    ? "Świetnie! Ukończyłeś wszystkie przypisane lekcje 🎉"
                    : `Ukończyłeś ${formatPercent(progressPercent)} przypisanych lekcji — tak trzymaj!`}
              </Typography>
              {progress && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {progress.summary}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                bgcolor: alpha("#fff", 0.12),
                borderRadius: 3,
                px: 3,
                py: 2,
                textAlign: "center",
                flexShrink: 0,
                minWidth: 110,
              }}
            >
              <Typography variant="h4" fontWeight={800}>
              {formatPercent(progressPercent)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                ukończono
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* ── Info grid: Postępy ── */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Postępy - uproszczone */}
          <Grid size={{ xs: 12 }}>
            <Paper elevation={0} sx={{ ...panelGridCardSx, minHeight: 200 }}>
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
                  <Stack spacing={1.5}>
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
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7 }}
                    >
                      {progress.summary}
                    </Typography>
                    <Box sx={{ mt: "auto", pt: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<InsightsIcon />}
                        onClick={() => setProgressOpen(true)}
                        sx={{ ...panelFooterButtonSx }}
                      >
                        Szczegóły postępów
                      </Button>
                    </Box>
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Brak danych postępu do wyświetlenia.
                  </Alert>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* ── Lesson list ── */}
        <Box
          sx={{
            ...panelToolbarSx,
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="primary.main"
            sx={{ mr: "auto" }}
          >
            Dostępne lekcje
          </Typography>

          {!loading && lessons.length > 0 && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ ml: "auto" }}
            >
              {/* Status filter */}
              <ToggleButtonGroup
                value={lessonFilter}
                exclusive
                onChange={(_, v) => {
                  if (v) setLessonFilter(v);
                }}
                size="small"
                sx={{
                  flexShrink: 0,
                  bgcolor: "background.paper",
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    fontSize: "0.82rem",
                  },
                }}
              >
                <ToggleButton value="ALL">Wszystkie</ToggleButton>
                <ToggleButton value="COMPLETED">Ukończone</ToggleButton>
                <ToggleButton value="NOT_STARTED">Do rozpoczęcia</ToggleButton>
              </ToggleButtonGroup>

              {/* Sort */}
              <Select
                value={lessonSort}
                onChange={(e) =>
                  setLessonSort(e.target.value as typeof lessonSort)
                }
                size="small"
                startAdornment={
                  <SortIcon
                    sx={{ mr: 0.75, fontSize: 18, color: "text.secondary" }}
                  />
                }
                sx={{
                  minWidth: 165,
                  borderRadius: 2,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  bgcolor: "background.paper",
                }}
              >
                <MenuItem value="status">Sortuj: Status</MenuItem>
                <MenuItem value="title_asc">Sortuj: A → Z</MenuItem>
                <MenuItem value="title_desc">Sortuj: Z → A</MenuItem>
              </Select>
            </Stack>
          )}
        </Box>

        {loading ? (
          <Grid container spacing={2}>
            {[...Array(3)].map((_, index) => (
              <Grid key={index} size={{ xs: 12, md: 4 }}>
                <Skeleton
                  variant="rounded"
                  height={220}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : lessons.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nie masz jeszcze przypisanych lekcji.
          </Alert>
        ) : displayedLessons.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Brak lekcji pasujących do wybranego filtra.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {displayedLessons.map((lesson) => {
              const isCompleted = lesson.status === "COMPLETED";
              const isInProgress = lesson.status === "IN_PROGRESS";
              const isLocked = !lesson.isActive && !isCompleted;

              return (
                <Grid key={lesson.id} size={{ xs: 12, md: 6, xl: 4 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      ...panelGridCardSx,
                      cursor: isLocked ? "default" : "pointer",
                      transition: "box-shadow 0.15s, border-color 0.15s",
                      ...(!isLocked && {
                        "&:hover": {
                          boxShadow: 2,
                          borderColor: "primary.light",
                        },
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
                    <Box sx={panelGridCardContentSx}>
                      {/* Header row: icon + title + status icon */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 1.5,
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1.5, minWidth: 0 }}>
                          <LessonIcon
                            sx={{
                              color: "primary.main",
                              mt: 0.25,
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body1" fontWeight={700}>
                              {lesson.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.25 }}
                            >
                              {lesson.theme}
                            </Typography>
                          </Box>
                        </Box>
                        {getLessonStatusTag(lesson)}
                      </Box>

                      {/* Wynik — only for completed lessons */}
                      {isCompleted && lesson.resultPercent != null && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 2,
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.success.main, 0.08),
                            border: "1px solid",
                            borderColor: alpha(theme.palette.success.main, 0.2),
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Wynik
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight={700}
                            color="success.main"
                          >
                            {formatPercent(lesson.resultPercent)}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mt: "auto" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <UserAvatar
                            avatarUrl={lesson.teacherAvatarUrl}
                            username={lesson.teacherName}
                            size={20}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={500}
                          >
                            {lesson.teacherName}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Footer actions */}
                      <Box
                        sx={panelCardFooterSx}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isCompleted ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ width: "100%" }}
                          >
                            {lesson.attachments.length > 0 && (
                              <Tooltip
                                title={`${lesson.attachments.length} ${lesson.attachments.length === 1 ? "plik" : "pliki"}`}
                              >
                                <Button
                                  variant="outlined"
                                  startIcon={<AttachFileIcon />}
                                  onClick={() => setAttachmentLesson(lesson)}
                                  sx={{
                                    ...panelFooterButtonSx,
                                    px: 2,
                                    flexShrink: 0,
                                    color: "info.main",
                                    borderColor: (t) =>
                                      alpha(t.palette.info.main, 0.5),
                                    "&:hover": {
                                      borderColor: "info.main",
                                      bgcolor: (t) =>
                                        alpha(t.palette.info.main, 0.06),
                                    },
                                  }}
                                >
                                  Materiały
                                </Button>
                              </Tooltip>
                            )}
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<ResultIcon />}
                              onClick={() => setResultLesson(lesson)}
                              sx={{
                                ...panelFooterButtonSx,
                                px: 2,
                              }}
                            >
                              Wynik
                            </Button>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() =>
                                navigate(`/student/lessons/${lesson.id}/result`)
                              }
                              sx={{
                                ...panelFooterButtonSx,
                                px: 2,
                              }}
                            >
                              Szczegóły
                            </Button>
                          </Stack>
                        ) : isLocked ? (
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<LockIcon />}
                            disabled
                            sx={panelFooterButtonSx}
                          >
                            Lekcja nieaktywna
                          </Button>
                        ) : lesson.attachments.length > 0 ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ width: "100%" }}
                          >
                            <Tooltip
                              title={`${lesson.attachments.length} ${lesson.attachments.length === 1 ? "plik" : "pliki"}`}
                            >
                              <Button
                                variant="outlined"
                                startIcon={<AttachFileIcon />}
                                onClick={() => setAttachmentLesson(lesson)}
                                sx={{
                                  ...panelFooterButtonSx,
                                  px: 2,
                                  flexShrink: 0,
                                  color: "info.main",
                                  borderColor: (t) =>
                                    alpha(t.palette.info.main, 0.5),
                                  "&:hover": {
                                    borderColor: "info.main",
                                    bgcolor: (t) =>
                                      alpha(t.palette.info.main, 0.06),
                                  },
                                }}
                              >
                                Materiały
                              </Button>
                            </Tooltip>
                            <Button
                              fullWidth
                              variant="contained"
                              sx={{ ...panelFooterButtonSx }}
                              onClick={() => setConfirmStartLesson(lesson)}
                            >
                              {isInProgress
                                ? "Kontynuuj lekcję"
                                : "Rozpocznij lekcję"}
                            </Button>
                          </Stack>
                        ) : (
                          <Button
                            fullWidth
                            variant="contained"
                            sx={panelFooterButtonSx}
                            onClick={() => setConfirmStartLesson(lesson)}
                          >
                            {isInProgress
                              ? "Kontynuuj lekcję"
                              : "Rozpocznij lekcję"}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* ── Dialogs ── */}
      {resultLesson && (
        <ResultDialog
          lesson={resultLesson}
          onClose={() => setResultLesson(null)}
          onOpenDetails={(id) => navigate(`/student/lessons/${id}/result`)}
        />
      )}
      {attachmentLesson && attachmentLesson.attachments.length > 0 && (
        <AttachmentDialog
          lesson={attachmentLesson}
          downloadingAttachmentId={downloadingAttachmentId}
          downloadError={downloadError}
          onClose={() => {
            setAttachmentLesson(null);
            setDownloadError(null);
          }}
          onDownload={(lessonId, att) =>
            void handleDownloadAttachment(lessonId, att)
          }
        />
      )}
      {progressOpen && (
        <ProgressDialog
          progress={progress}
          stats={stats}
          onClose={() => setProgressOpen(false)}
        />
      )}

      {/* Confirm start lesson dialog */}
      <Dialog
        open={confirmStartLesson != null}
        onClose={() => setConfirmStartLesson(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirmStartLesson?.status === "IN_PROGRESS"
            ? "Kontynuować lekcję?"
            : "Rozpocząć lekcję?"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirmStartLesson?.status === "IN_PROGRESS"
              ? `Czy chcesz wrócić do lekcji "${confirmStartLesson?.title}"?`
              : `Czy na pewno chcesz rozpocząć lekcję "${confirmStartLesson?.title}"? Po rozpoczęciu musisz ją ukończyć.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmStartLesson(null)}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (confirmStartLesson) {
                navigate(`/student/lessons/${confirmStartLesson.id}`, {
                  state: { attachments: confirmStartLesson.attachments },
                });
              }
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            {confirmStartLesson?.status === "IN_PROGRESS"
              ? "Kontynuuj"
              : "Rozpocznij"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
