import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import {
  ArrowBackOutlined as BackIcon,
  ArrowForwardOutlined as NextIcon,
  AttachFileOutlined as AttachFileIcon,
  CloseOutlined as CloseIcon,
  DownloadOutlined as DownloadIcon,
  LightbulbOutlined as HintIcon,
  SendOutlined as SubmitIcon,
  WarningAmberOutlined as WarningIcon,
  ZoomInOutlined as ZoomInIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  taskService,
  type LessonTasksResponse,
  type ChooseTaskResponse,
  type WriteTaskResponse,
  type ScatterTaskResponse,
  type SpeakTaskResponse,
  type SpeakTranscriptionResponse,
} from "@/api/taskService";
import {
  studentService,
  type SubmitAnswerItem,
  type SubmitAnswerDetail,
  type SubmitAnswersResponse,
} from "@/api/studentService";
import { lessonService } from "@/api/lessonService";
import type { LessonAttachment } from "@/api/lessonService";
import { ApiError } from "@/api/apiClient";
import { fetchApiBlob } from "@/api/apiClient";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/dashboardUtils";
import { ChooseTaskSolver } from "@/components/student/ChooseTaskSolver";
import { WriteTaskSolver } from "@/components/student/WriteTaskSolver";
import { ScatterTaskSolver } from "@/components/student/ScatterTaskSolver";
import { SpeakTaskSolver } from "@/components/student/SpeakTaskSolver";
import { LessonResultDialog } from "@/components/student/LessonResultDialog";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/ui/dialog/AppDialog";
import { CheckCircleOutlined as AnsweredIcon } from "@mui/icons-material";
import {
  taskCardSx,
  taskTypeMeta,
  sidebarCardSx,
  taskNavRailSx,
  taskNavDotBaseSx,
} from "@/components/student/taskSolverStyles";

// ── Types ────────────────────────────────────────────────────────────────────

interface FlatTask {
  taskPublicId: string;
  taskType: SubmitAnswerItem["taskType"];
  section: string | null;
  hint: string | null;
  hintImageUrl: string | null;
  taskData:
    | ChooseTaskResponse
    | WriteTaskResponse
    | ScatterTaskResponse
    | SpeakTaskResponse;
}

interface SpeakAttemptState {
  attempts: number;
  result: SpeakTranscriptionResponse | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Composite key that avoids accidental collisions across task type namespaces. */
function answerKey(taskType: string, taskPublicId: string): string {
  return `${taskType}_${taskPublicId}`;
}

function flattenTasks(lessonData: LessonTasksResponse): FlatTask[] {
  const tasks: FlatTask[] = [];
  for (const section of lessonData.sections) {
    for (const t of section.chooseTasks)
      tasks.push({
        taskPublicId: t.publicId,
        taskType: "choose",
        section: section.section,
        hint: t.hint ?? null,
        hintImageUrl: t.hintImageUrl ?? null,
        taskData: t,
      });
    for (const t of section.writeTasks)
      tasks.push({
        taskPublicId: t.publicId,
        taskType: "write",
        section: section.section,
        hint: t.hint ?? null,
        hintImageUrl: t.hintImageUrl ?? null,
        taskData: t,
      });
    for (const t of section.scatterTasks)
      tasks.push({
        taskPublicId: t.publicId,
        taskType: "scatter",
        section: section.section,
        hint: t.hint ?? null,
        hintImageUrl: t.hintImageUrl ?? null,
        taskData: t,
      });
    for (const t of section.speakTasks)
      tasks.push({
        taskPublicId: t.publicId,
        taskType: "speak",
        section: section.section,
        hint: t.hint ?? null,
        hintImageUrl: t.hintImageUrl ?? null,
        taskData: t,
      });
  }
  return tasks;
}

// ── Component ────────────────────────────────────────────────────────────────

export function LessonSolver() {
  const { lessonPublicId } = useParams<{ lessonPublicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const theme = useTheme();
  const unloadSubmitSentRef = useRef(false);

  const stateAttachments =
    (location.state as { attachments?: LessonAttachment[] } | null)
      ?.attachments ?? null;
  const [attachments, setAttachments] = useState<LessonAttachment[]>(
    stateAttachments ?? [],
  );
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
    string | null
  >(null);
  const [attachmentDownloadError, setAttachmentDownloadError] = useState<
    string | null
  >(null);

  // Fallback: if navigation state had no attachments (refresh / direct URL),
  // fetch them from the student lessons list.
  useEffect(() => {
    if (stateAttachments !== null || !lessonPublicId) return;
    let cancelled = false;
    void studentService.getLessons().then((lessons) => {
      if (cancelled) return;
      const lesson = lessons.find((l) => l.publicId === lessonPublicId);
      if (lesson) setAttachments(lesson.attachments);
    });
    return () => {
      cancelled = true;
    };
  }, [lessonPublicId, stateAttachments]);

  const handleDownloadAttachment = async (att: LessonAttachment) => {
    if (!lessonPublicId) return;
    setDownloadingAttachmentId(att.publicId);
    setAttachmentDownloadError(null);
    try {
      const blob = await lessonService.downloadAttachment(
        lessonPublicId,
        att.publicId,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.originalFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setAttachmentDownloadError("Nie udało się pobrać załącznika.");
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const [lessonData, setLessonData] = useState<LessonTasksResponse | null>(
    null,
  );
  const [answers, setAnswers] = useState<Record<string, SubmitAnswerItem>>({});
  const [speakAttempts, setSpeakAttempts] = useState<
    Record<string, SpeakAttemptState>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] =
    useState<SubmitAnswersResponse | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [tabSwitchNoticeOpen, setTabSwitchNoticeOpen] = useState(false);

  // Step-based navigation
  const [currentStep, setCurrentStep] = useState(0);
  const [showUnansweredAlert, setShowUnansweredAlert] = useState(false);

  // Hint image — loaded as blob because endpoint requires auth
  const [hintImageBlobUrl, setHintImageBlobUrl] = useState<string | null>(null);
  const [hintImageExpanded, setHintImageExpanded] = useState(false);

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  // Load lesson tasks
  useEffect(() => {
    if (!lessonPublicId) {
      setError("Nieprawidłowy identyfikator lekcji.");
      setLoading(false);
      return;
    }

    taskService
      .getLessonTasks(lessonPublicId)
      .then(setLessonData)
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          const code = err.problem.code;
          if (code === "LESSON_ALREADY_COMPLETED") {
            setError("Ta lekcja została już ukończona.");
          } else if (code === "STUDENT_NO_ACCESS") {
            setError("Nie masz dostępu do tej lekcji.");
          } else {
            setError(
              getErrorMessage(err, "Nie udało się pobrać zadań lekcji."),
            );
          }
        } else {
          setError(getErrorMessage(err, "Nie udało się pobrać zadań lekcji."));
        }
      })
      .finally(() => setLoading(false));
  }, [lessonPublicId]);

  // Flatten all tasks
  const flatTasks = useMemo(
    () => (lessonData ? flattenTasks(lessonData) : []),
    [lessonData],
  );

  const totalTaskCount = flatTasks.length;
  const currentTask = flatTasks[currentStep] ?? null;
  const isLastStep = currentStep === totalTaskCount - 1;
  const isSubmitted = submitResult != null;
  const shouldBlockExit =
    lessonData != null && totalTaskCount > 0 && !isSubmitted;

  // Load hint image blob URL whenever the current task's hintImageUrl changes
  useEffect(() => {
    setHintImageExpanded(false);
    if (!currentTask?.hintImageUrl) {
      setHintImageBlobUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    fetchApiBlob(currentTask.hintImageUrl)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setHintImageBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setHintImageBlobUrl(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentTask?.hintImageUrl]);

  const answeredCount = Object.values(answers).filter(
    (a) => a.answer !== "",
  ).length;

  // Results map for per-task feedback (keyed by "taskType_taskPublicId")
  const resultsMap = useMemo(() => {
    if (!submitResult) return null;
    const map = new Map<string, SubmitAnswerDetail>();
    for (const d of submitResult.details) {
      map.set(answerKey(d.taskType, d.taskPublicId), d);
    }
    return map;
  }, [submitResult]);

  const handleAnswer = (
    taskPublicId: string,
    taskType: SubmitAnswerItem["taskType"],
    answer: string,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [answerKey(taskType, taskPublicId)]: { taskPublicId, taskType, answer },
    }));
  };

  const handleSpeakTranscriptionResult = (
    taskPublicId: string,
    result: SpeakTranscriptionResponse,
  ) => {
    setSpeakAttempts((prev) => {
      const key = answerKey("speak", taskPublicId);
      const current = prev[key] ?? { attempts: 0, result: null };
      const bestResult =
        current.result === null || result.score >= current.result.score
          ? result
          : current.result;
      // Keep answer in sync with the best transcription text
      handleAnswer(taskPublicId, "speak", bestResult.text);
      return {
        ...prev,
        [key]: {
          attempts: current.attempts + 1,
          result: bestResult,
        },
      };
    });
  };

  const handleNext = () => {
    if (currentStep < totalTaskCount - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    const unanswered = totalTaskCount - answeredCount;
    if (unanswered > 0) {
      setShowUnansweredAlert(true);
      goToFirstUnansweredTask(false);
      return;
    }
    doSubmit();
  };

  const goToFirstUnansweredTask = (hideAlert = true) => {
    const firstUnansweredIdx = flatTasks.findIndex(
      (t) =>
        (answers[answerKey(t.taskType, t.taskPublicId)]?.answer ?? "") === "",
    );
    if (firstUnansweredIdx >= 0) {
      setCurrentStep(firstUnansweredIdx);
    }
    if (hideAlert) {
      setShowUnansweredAlert(false);
    }
  };

  const buildCompleteAnswers = useCallback(
    (): SubmitAnswerItem[] =>
      flatTasks.map(
        ({ taskPublicId, taskType }) =>
          answers[answerKey(taskType, taskPublicId)] ?? {
            taskPublicId,
            taskType,
            answer: "",
          },
      ),
    [answers, flatTasks],
  );

  const doSubmit = async (options?: { navigateAfterSubmit?: boolean }) => {
    if (!lessonData || !lessonPublicId) return;
    const completeAnswers = buildCompleteAnswers();

    setSubmitting(true);
    unloadSubmitSentRef.current = true;
    setError(null);
    setShowUnansweredAlert(false);

    try {
      const result = await studentService.submitAnswers(lessonPublicId, {
        answers: completeAnswers,
      });
      setSubmitResult(result);
      setResultDialogOpen(!options?.navigateAfterSubmit);
      setCurrentStep(0);
      setExitDialogOpen(false);
      if (options?.navigateAfterSubmit) {
        navigate("/student");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const code = err.problem.code;
        if (code === "LESSON_ALREADY_COMPLETED") {
          setError("Ta lekcja została już ukończona.");
        } else {
          setError(getErrorMessage(err, "Nie udało się wysłać odpowiedzi."));
        }
      } else {
        setError(getErrorMessage(err, "Nie udało się wysłać odpowiedzi."));
      }
      unloadSubmitSentRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goBack = () => navigate("/student");
  const openResultDetails = () => {
    if (!lessonPublicId) return;
    navigate(`/student/lessons/${lessonPublicId}/result`);
  };

  const requestExit = () => {
    if (shouldBlockExit) {
      setExitDialogOpen(true);
      return;
    }
    goBack();
  };

  const confirmExitAndSubmit = () => {
    void doSubmit({ navigateAfterSubmit: true });
  };

  useEffect(() => {
    if (!shouldBlockExit) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handlePopState = () => {
      setExitDialogOpen(true);
      window.history.pushState({ lessonGuard: true }, "", window.location.href);
    };

    const handlePageHide = () => {
      if (unloadSubmitSentRef.current || !lessonPublicId) return;
      unloadSubmitSentRef.current = true;

      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/v1/lessons/${lessonPublicId}/submit`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ answers: buildCompleteAnswers() }),
          keepalive: true,
        },
      ).catch(() => undefined);
    };

    window.history.pushState({ lessonGuard: true }, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [buildCompleteAnswers, lessonPublicId, shouldBlockExit]);

  const hasNoTasks = lessonData != null && totalTaskCount === 0;
  const progressPercent =
    totalTaskCount > 0 ? ((currentStep + 1) / totalTaskCount) * 100 : 0;
  const unansweredIndices = flatTasks
    .map((t, i) => ({ idx: i, t }))
    .filter(
      ({ t }) =>
        (answers[answerKey(t.taskType, t.taskPublicId)]?.answer ?? "") === "",
    )
    .map(({ idx }) => idx);

  useEffect(() => {
    if (!lessonPublicId || !currentTask || isSubmitted) {
      return;
    }

    let lastHiddenAt = 0;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden") {
        return;
      }

      const now = Date.now();
      if (now - lastHiddenAt < 750) {
        return;
      }
      lastHiddenAt = now;

      void studentService
        .recordTaskTabSwitch(lessonPublicId, {
          taskPublicId: currentTask.taskPublicId,
          taskType: currentTask.taskType,
        })
        .then(() => setTabSwitchNoticeOpen(true))
        .catch(() => undefined);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentTask, isSubmitted, lessonPublicId]);

  // ── Render current task solver ─────────────────────────────────────────────

  function renderCurrentTask() {
    if (!currentTask) return null;

    const taskResult =
      resultsMap?.get(
        answerKey(currentTask.taskType, currentTask.taskPublicId),
      ) ?? null;
    const currentAnswer =
      answers[answerKey(currentTask.taskType, currentTask.taskPublicId)]
        ?.answer ?? "";
    const disabled = submitting || isSubmitted;

    switch (currentTask.taskType) {
      case "choose":
        return (
          <ChooseTaskSolver
            key={`choose_${currentTask.taskPublicId}`}
            task={currentTask.taskData as ChooseTaskResponse}
            value={currentAnswer}
            onChange={(answer) =>
              handleAnswer(currentTask.taskPublicId, "choose", answer)
            }
            result={taskResult}
            disabled={disabled}
          />
        );
      case "write":
        return (
          <WriteTaskSolver
            key={`write_${currentTask.taskPublicId}`}
            task={currentTask.taskData as WriteTaskResponse}
            value={currentAnswer}
            onChange={(answer) =>
              handleAnswer(currentTask.taskPublicId, "write", answer)
            }
            result={taskResult}
            disabled={disabled}
          />
        );
      case "scatter":
        return (
          <ScatterTaskSolver
            key={`scatter_${currentTask.taskPublicId}`}
            task={currentTask.taskData as ScatterTaskResponse}
            value={currentAnswer}
            onChange={(answer) =>
              handleAnswer(currentTask.taskPublicId, "scatter", answer)
            }
            result={taskResult}
            disabled={disabled}
          />
        );
      case "speak": {
        const speakAttempt =
          speakAttempts[answerKey("speak", currentTask.taskPublicId)] ?? null;
        return (
          <SpeakTaskSolver
            key={`speak_${currentTask.taskPublicId}`}
            lessonPublicId={lessonPublicId ?? ""}
            task={currentTask.taskData as SpeakTaskResponse}
            transcriptionResult={speakAttempt?.result ?? null}
            attempts={speakAttempt?.attempts ?? 0}
            onChange={(answer) =>
              handleAnswer(currentTask.taskPublicId, "speak", answer)
            }
            onTranscriptionResult={(transcriptionResult) =>
              handleSpeakTranscriptionResult(
                currentTask.taskPublicId,
                transcriptionResult,
              )
            }
            result={taskResult}
            disabled={disabled}
          />
        );
      }
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        <DashboardTopBar onLogout={handleLogout} hideLogout={true} />

        {/* Back button */}
        <Button
          startIcon={<BackIcon />}
          onClick={requestExit}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            mb: 2,
            color: "text.secondary",
          }}
        >
          Wróć do panelu
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={20} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
          </Stack>
        )}

        {/* No tasks */}
        {hasNoTasks && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Ta lekcja nie zawiera jeszcze żadnych zadań.
          </Alert>
        )}

        {/* Main content */}
        {lessonData && totalTaskCount > 0 && currentTask && (
          <>
            {/* Header: Title + Task counter */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="h5" fontWeight={700}>
                {currentTask.section ?? "Lekcja"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
              >
                Zadanie {currentStep + 1} z {totalTaskCount}
              </Typography>
            </Stack>

            {/* Progress bar */}
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                mb: 3,
                height: 8,
                borderRadius: 4,
                bgcolor: (t) =>
                  alpha(
                    t.palette.primary.main,
                    t.palette.mode === "dark" ? 0.12 : 0.1,
                  ),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                },
              }}
            />

            {/* Main layout with task nav rail */}
            <Box sx={{ display: "flex", gap: 2 }}>
              {/* Left: Task navigation rail (hidden on small screens) */}
              <Box
                sx={{
                  ...taskNavRailSx,
                  display: { xs: "none", md: "flex" },
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {(() => {
                  // Group flatTasks by section preserving order
                  type GroupEntry = { ft: (typeof flatTasks)[0]; idx: number };
                  const groups: Array<{
                    section: string | null;
                    tasks: GroupEntry[];
                  }> = [];
                  flatTasks.forEach((ft, idx) => {
                    const last = groups[groups.length - 1];
                    if (last && last.section === ft.section) {
                      last.tasks.push({ ft, idx });
                    } else {
                      groups.push({
                        section: ft.section,
                        tasks: [{ ft, idx }],
                      });
                    }
                  });

                  return groups.map((group, gIdx) => (
                    <Box
                      key={gIdx}
                      sx={{
                        display: "flex",
                        width: "100%",
                        alignItems: "stretch",
                        mt: gIdx > 0 ? 1.5 : 0,
                      }}
                    >
                      {/* Left: vertical label + bracket line — only when section exists */}
                      {group.section && (
                        <Box
                          sx={{
                            width: 28,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "stretch",
                            gap: 0.5,
                            mr: 0.5,
                          }}
                        >
                          <Typography
                            sx={{
                              writingMode: "vertical-rl",
                              transform: "rotate(180deg)",
                              fontSize: "0.52rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "text.disabled",
                              lineHeight: 1,
                              flex: 1,
                              overflow: "hidden",
                              textAlign: "center",
                            }}
                          >
                            {group.section}
                          </Typography>
                          {/* Bracket line */}
                          <Box
                            sx={{
                              width: 2,
                              alignSelf: "stretch",
                              borderRadius: 2,
                              bgcolor: "divider",
                              opacity: 0.6,
                            }}
                          />
                        </Box>
                      )}

                      {/* Right: dots */}
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        {group.tasks.map(({ ft, idx }) => {
                          const key = answerKey(ft.taskType, ft.taskPublicId);
                          const isAnswered =
                            (answers[key]?.answer ?? "") !== "";
                          const isCurrent = idx === currentStep;
                          const meta = taskTypeMeta[ft.taskType];
                          const taskResult = resultsMap?.get(key) ?? null;

                          return (
                            <Tooltip
                              key={key}
                              title={
                                <Box>
                                  <Typography
                                    variant="caption"
                                    fontWeight={700}
                                  >
                                    {`${idx + 1}. ${meta.label}`}
                                  </Typography>
                                  {group.section && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      sx={{ opacity: 0.7 }}
                                    >
                                      {group.section}
                                    </Typography>
                                  )}
                                  {isAnswered && !isSubmitted && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      sx={{ opacity: 0.8 }}
                                    >
                                      Odpowiedziano
                                    </Typography>
                                  )}
                                  {taskResult && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      sx={{ opacity: 0.8 }}
                                    >
                                      {taskResult.isCorrect
                                        ? "Poprawne"
                                        : "Błędne"}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              placement="right"
                              arrow
                            >
                              <Box
                                onClick={() => setCurrentStep(idx)}
                                sx={{
                                  ...taskNavDotBaseSx,
                                  ...(isCurrent
                                    ? {
                                        bgcolor: meta.color,
                                        color: "#fff",
                                        borderColor: meta.color,
                                        boxShadow: `0 0 0 3px ${alpha(meta.color, 0.25)}`,
                                        transform: "scale(1.1)",
                                      }
                                    : taskResult
                                      ? {
                                          bgcolor: alpha(
                                            taskResult.isCorrect
                                              ? theme.palette.success.main
                                              : theme.palette.error.main,
                                            0.12,
                                          ),
                                          color: taskResult.isCorrect
                                            ? theme.palette.success.main
                                            : theme.palette.error.main,
                                          borderColor: alpha(
                                            taskResult.isCorrect
                                              ? theme.palette.success.main
                                              : theme.palette.error.main,
                                            0.4,
                                          ),
                                        }
                                      : isAnswered
                                        ? {
                                            bgcolor: alpha(meta.color, 0.12),
                                            color: meta.color,
                                            borderColor: alpha(
                                              meta.color,
                                              0.35,
                                            ),
                                          }
                                        : {
                                            bgcolor: (t: Theme) =>
                                              alpha(
                                                t.palette.text.primary,
                                                t.palette.mode === "dark"
                                                  ? 0.06
                                                  : 0.05,
                                              ),
                                            color: "text.secondary",
                                            borderColor: (t: Theme) =>
                                              alpha(t.palette.divider, 0.3),
                                            "&:hover": {
                                              borderColor: alpha(
                                                meta.color,
                                                0.5,
                                              ),
                                              bgcolor: alpha(meta.color, 0.08),
                                              color: meta.color,
                                            },
                                          }),
                                }}
                              >
                                {taskResult ? (
                                  taskResult.isCorrect ? (
                                    <AnsweredIcon sx={{ fontSize: 18 }} />
                                  ) : (
                                    <Typography
                                      component="span"
                                      sx={{
                                        fontSize: "0.85rem",
                                        fontWeight: 800,
                                        lineHeight: 1,
                                      }}
                                    >
                                      {idx + 1}
                                    </Typography>
                                  )
                                ) : isAnswered ? (
                                  <AnsweredIcon sx={{ fontSize: 18 }} />
                                ) : (
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontSize: "0.85rem",
                                      fontWeight: 800,
                                      lineHeight: 1,
                                    }}
                                  >
                                    {idx + 1}
                                  </Typography>
                                )}
                                {/* Type icon badge */}
                                <Box
                                  component="span"
                                  sx={{
                                    position: "absolute",
                                    bottom: -4,
                                    right: -4,
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    bgcolor: "background.paper",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.5rem",
                                    color: meta.color,
                                    lineHeight: 1,
                                    pointerEvents: "none",
                                    "& svg": { fontSize: "12px !important" },
                                  }}
                                >
                                  {meta.icon}
                                </Box>
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </Box>
                  ));
                })()}
              </Box>

              {/* Right: Task + hint columns */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Grid container spacing={3}>
                  {/* Left: Task card */}
                  <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                    <Paper elevation={0} sx={{ ...taskCardSx, p: 3 }}>
                      {/* Inner task card */}
                      <Box sx={{ mb: 3 }}>{renderCurrentTask()}</Box>

                      {/* Navigation buttons */}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Button
                          startIcon={<BackIcon />}
                          onClick={handlePrev}
                          disabled={currentStep === 0}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            color: "text.secondary",
                            visibility:
                              currentStep === 0 ? "hidden" : "visible",
                          }}
                        >
                          Wstecz
                        </Button>

                        {isSubmitted ? (
                          isLastStep ? (
                            <Button
                              variant="contained"
                              startIcon={<BackIcon />}
                              onClick={goBack}
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 2,
                                boxShadow: "none",
                              }}
                            >
                              Wróć do panelu
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              endIcon={<NextIcon />}
                              onClick={handleNext}
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 2,
                                boxShadow: "none",
                                bgcolor: "grey.700",
                                "&:hover": { bgcolor: "grey.800" },
                              }}
                            >
                              Dalej
                            </Button>
                          )
                        ) : isLastStep ? (
                          <Button
                            variant="contained"
                            endIcon={
                              submitting ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <SubmitIcon />
                              )
                            }
                            onClick={handleFinish}
                            disabled={submitting}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              borderRadius: 2,
                              boxShadow: "none",
                              px: 3,
                            }}
                          >
                            {submitting ? "Wysyłanie..." : "Zakończ lekcję"}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            endIcon={<NextIcon />}
                            onClick={handleNext}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              borderRadius: 2,
                              boxShadow: "none",
                              bgcolor: "grey.700",
                              "&:hover": { bgcolor: "grey.800" },
                            }}
                          >
                            Dalej
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Right: Sidebar */}
                  <Grid
                    size={{ xs: 12, md: 4, lg: 3 }}
                    sx={{ display: { xs: "none", md: "block" } }}
                  >
                    <Paper elevation={0} sx={sidebarCardSx}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{ mb: 2 }}
                      >
                        {currentTask.hint || currentTask.hintImageUrl
                          ? "Podpowiedź"
                          : (currentTask.section ?? "Informacja")}
                      </Typography>

                      {currentTask.hint ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="flex-start"
                        >
                          <HintIcon
                            sx={{
                              color: "warning.main",
                              fontSize: 20,
                              mt: 0.25,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.7 }}
                          >
                            {currentTask.hint}
                          </Typography>
                        </Stack>
                      )}

                      {hintImageBlobUrl && (
                        <>
                          <Box
                            onClick={() => setHintImageExpanded(true)}
                            sx={{
                              mt: currentTask.hint ? 1.5 : 0,
                              borderRadius: 1,
                              overflow: "hidden",
                              cursor: "zoom-in",
                              position: "relative",
                              display: "inline-block",
                              width: "100%",
                              "&:hover .zoom-overlay": { opacity: 1 },
                            }}
                          >
                            <img
                              src={hintImageBlobUrl}
                              alt="Podpowiedź"
                              style={{
                                display: "block",
                                width: "100%",
                                maxHeight: 240,
                                objectFit: "contain",
                              }}
                            />
                            <Box
                              className="zoom-overlay"
                              sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "rgba(0,0,0,0.35)",
                                opacity: 0,
                                transition: "opacity 0.15s ease",
                              }}
                            >
                              <ZoomInIcon
                                sx={{ color: "#fff", fontSize: 32 }}
                              />
                            </Box>
                          </Box>

                          <Dialog
                            open={hintImageExpanded}
                            onClose={() => setHintImageExpanded(false)}
                            maxWidth={false}
                            PaperProps={{
                              sx: {
                                bgcolor: "transparent",
                                boxShadow: "none",
                                m: 2,
                              },
                            }}
                          >
                            <Box sx={{ position: "relative" }}>
                              <IconButton
                                onClick={() => setHintImageExpanded(false)}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  bgcolor: "rgba(0,0,0,0.55)",
                                  color: "#fff",
                                  "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                                  zIndex: 1,
                                }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                              <img
                                src={hintImageBlobUrl}
                                alt="Podpowiedź"
                                style={{
                                  display: "block",
                                  maxWidth: "90vw",
                                  maxHeight: "90vh",
                                  objectFit: "contain",
                                  borderRadius: 8,
                                }}
                              />
                            </Box>
                          </Dialog>
                        </>
                      )}

                      {!currentTask.hint &&
                        !currentTask.hintImageUrl &&
                        currentTask.section && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.7 }}
                          >
                            Sekcja: {currentTask.section}
                          </Typography>
                        )}

                      {!currentTask.hint &&
                        !currentTask.hintImageUrl &&
                        !currentTask.section && (
                          <Typography variant="body2" color="text.secondary">
                            Rozwiąż zadanie po lewej stronie.
                          </Typography>
                        )}

                      {/* Task type badge */}

                      {/* Attachment section */}
                      {attachments.length > 0 && (
                        <Box
                          sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={700}
                            display="block"
                            sx={{ mb: 1 }}
                          >
                            Materiały ({attachments.length})
                          </Typography>
                          {attachmentDownloadError && (
                            <Typography
                              variant="caption"
                              color="error"
                              display="block"
                              sx={{ mb: 0.5 }}
                            >
                              {attachmentDownloadError}
                            </Typography>
                          )}
                          <Stack spacing={0.75}>
                            {attachments.map((att) => {
                              const isDownloading =
                                downloadingAttachmentId === att.publicId;
                              return (
                                <Box
                                  key={att.publicId}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 1.25,
                                    py: 0.75,
                                    borderRadius: 2,
                                    bgcolor: (t) =>
                                      alpha(t.palette.info.main, 0.07),
                                    border: "1px solid",
                                    borderColor: (t) =>
                                      alpha(t.palette.info.main, 0.18),
                                  }}
                                >
                                  <AttachFileIcon
                                    sx={{
                                      fontSize: 14,
                                      color: "info.main",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      flex: 1,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {att.originalFileName}
                                  </Typography>
                                  <Tooltip title="Pobierz">
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled={isDownloading}
                                        onClick={() =>
                                          void handleDownloadAttachment(att)
                                        }
                                        sx={{ p: 0.25 }}
                                      >
                                        {isDownloading ? (
                                          <CircularProgress size={13} />
                                        ) : (
                                          <DownloadIcon
                                            sx={{
                                              fontSize: 15,
                                              color: "info.main",
                                            }}
                                          />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </>
        )}
      </Container>

      {/* Result dialog */}
      <AppDialog
        open={showUnansweredAlert && answeredCount < totalTaskCount}
        onClose={() => goToFirstUnansweredTask()}
        maxWidth="xs"
      >
        <AppDialogHeader
          icon={<WarningIcon />}
          title="Nie wykonano wszystkich zadań"
          subtitle="Możesz wrócić do pierwszego brakującego zadania albo wysłać obecny wynik."
        />
        <AppDialogBody>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.7 }}
          >
            Brakuje odpowiedzi w {totalTaskCount - answeredCount} z{" "}
            {totalTaskCount} zadań (
            {unansweredIndices.map((i) => `zad. ${i + 1}`).join(", ")}). Jeżeli
            wyślesz teraz, brakujące odpowiedzi zostaną ocenione jako błędne.
          </Typography>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            onClick={() => goToFirstUnansweredTask()}
            disabled={submitting}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            Wróć do pytań
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => void doSubmit()}
            disabled={submitting}
            endIcon={
              submitting ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Wyślij mimo to
          </Button>
        </AppDialogFooter>
      </AppDialog>

      <AppDialog
        open={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        maxWidth="xs"
      >
        <AppDialogHeader
          icon={<WarningIcon />}
          title="Zakończyć lekcję?"
          subtitle="Aktualne odpowiedzi zostaną wysłane i zapisane jako ostateczny wynik tej lekcji."
        />
        <AppDialogBody>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.7 }}
          >
            Jeżeli potwierdzisz, lekcja zostanie zakończona teraz. Puste
            odpowiedzi będą ocenione jako błędne. Możesz też wrócić do lekcji i
            dokończyć zadania.
          </Typography>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            onClick={() => setExitDialogOpen(false)}
            disabled={submitting}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            Nie, dokończę lekcję
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={confirmExitAndSubmit}
            disabled={submitting}
            endIcon={
              submitting ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Wyślij wynik i wyjdź
          </Button>
        </AppDialogFooter>
      </AppDialog>

      <LessonResultDialog
        open={resultDialogOpen}
        result={submitResult}
        onClose={() => setResultDialogOpen(false)}
        onBackToDashboard={goBack}
        onOpenDetails={openResultDetails}
      />

      <AppDialog
        open={tabSwitchNoticeOpen}
        onClose={() => setTabSwitchNoticeOpen(false)}
        maxWidth="xs"
      >
        <AppDialogHeader icon={<WarningIcon />} title="Opuszczono zakładkę" />
        <AppDialogBody>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.7 }}
          >
            W trakcie lekcji wykryto przejście do innej zakładki lub okna. Wróć
            do zadania i kontynuuj rozwiązywanie.
          </Typography>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            variant="contained"
            color="warning"
            onClick={() => setTabSwitchNoticeOpen(false)}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Rozumiem
          </Button>
        </AppDialogFooter>
      </AppDialog>
    </Box>
  );
}
