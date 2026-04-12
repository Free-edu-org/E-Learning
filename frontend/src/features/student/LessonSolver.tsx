import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
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
  SendOutlined as SubmitIcon,
  LightbulbOutlined as HintIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import {
  taskService,
  type LessonTasksResponse,
  type ChooseTaskResponse,
  type WriteTaskResponse,
  type ScatterTaskResponse,
  type SpeakTaskResponse,
} from "@/api/taskService";
import {
  studentService,
  type SubmitAnswerItem,
  type SubmitAnswerDetail,
  type SubmitAnswersResponse,
} from "@/api/studentService";
import { ApiError } from "@/api/apiClient";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/dashboardUtils";
import { ChooseTaskSolver } from "@/components/student/ChooseTaskSolver";
import { WriteTaskSolver } from "@/components/student/WriteTaskSolver";
import { ScatterTaskSolver } from "@/components/student/ScatterTaskSolver";
import { SpeakTaskSolver } from "@/components/student/SpeakTaskSolver";
import { LessonResultDialog } from "@/components/student/LessonResultDialog";
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
  taskId: number;
  taskType: SubmitAnswerItem["taskType"];
  section: string | null;
  hint: string | null;
  taskData:
    | ChooseTaskResponse
    | WriteTaskResponse
    | ScatterTaskResponse
    | SpeakTaskResponse;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Composite key that avoids ID collisions across task tables */
function answerKey(taskType: string, taskId: number): string {
  return `${taskType}_${taskId}`;
}

function flattenTasks(lessonData: LessonTasksResponse): FlatTask[] {
  const tasks: FlatTask[] = [];
  for (const section of lessonData.sections) {
    for (const t of section.chooseTasks)
      tasks.push({
        taskId: t.id,
        taskType: "choose",
        section: section.section,
        hint: t.hint ?? null,
        taskData: t,
      });
    for (const t of section.writeTasks)
      tasks.push({
        taskId: t.id,
        taskType: "write",
        section: section.section,
        hint: t.hint ?? null,
        taskData: t,
      });
    for (const t of section.scatterTasks)
      tasks.push({
        taskId: t.id,
        taskType: "scatter",
        section: section.section,
        hint: t.hint ?? null,
        taskData: t,
      });
    for (const t of section.speakTasks)
      tasks.push({
        taskId: t.id,
        taskType: "speak",
        section: section.section,
        hint: t.hint ?? null,
        taskData: t,
      });
  }
  return tasks;
}

// ── Component ────────────────────────────────────────────────────────────────

export function LessonSolver() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const theme = useTheme();

  const [lessonData, setLessonData] = useState<LessonTasksResponse | null>(
    null,
  );
  const [answers, setAnswers] = useState<Record<string, SubmitAnswerItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] =
    useState<SubmitAnswersResponse | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

  // Step-based navigation
  const [currentStep, setCurrentStep] = useState(0);
  const [showUnansweredAlert, setShowUnansweredAlert] = useState(false);

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  // Load lesson tasks
  useEffect(() => {
    const id = Number(lessonId);
    if (isNaN(id)) {
      setError("Nieprawidłowy identyfikator lekcji.");
      setLoading(false);
      return;
    }

    taskService
      .getLessonTasks(id)
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
  }, [lessonId]);

  // Flatten all tasks
  const flatTasks = useMemo(
    () => (lessonData ? flattenTasks(lessonData) : []),
    [lessonData],
  );

  const totalTaskCount = flatTasks.length;
  const currentTask = flatTasks[currentStep] ?? null;
  const isLastStep = currentStep === totalTaskCount - 1;
  const isSubmitted = submitResult != null;

  const answeredCount = Object.values(answers).filter(
    (a) => a.answer !== "",
  ).length;

  // Results map for per-task feedback (keyed by "taskType_taskId")
  const resultsMap = useMemo(() => {
    if (!submitResult) return null;
    const map = new Map<string, SubmitAnswerDetail>();
    for (const d of submitResult.details) {
      map.set(answerKey(d.taskType, d.taskId), d);
    }
    return map;
  }, [submitResult]);

  const handleAnswer = (
    taskId: number,
    taskType: SubmitAnswerItem["taskType"],
    answer: string,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [answerKey(taskType, taskId)]: { taskId, taskType, answer },
    }));
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
      // Navigate to the first unanswered task so the user can see which one
      const firstUnansweredIdx = flatTasks.findIndex(
        (t) => (answers[answerKey(t.taskType, t.taskId)]?.answer ?? "") === "",
      );
      if (firstUnansweredIdx >= 0) {
        setCurrentStep(firstUnansweredIdx);
      }
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    if (!lessonData) return;
    const id = Number(lessonId);

    const completeAnswers: SubmitAnswerItem[] = flatTasks.map(
      ({ taskId, taskType }) =>
        answers[answerKey(taskType, taskId)] ?? {
          taskId,
          taskType,
          answer: "",
        },
    );

    setSubmitting(true);
    setError(null);
    setShowUnansweredAlert(false);

    try {
      const result = await studentService.submitAnswers(id, {
        answers: completeAnswers,
      });
      setSubmitResult(result);
      setResultDialogOpen(true);
      setCurrentStep(0);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goBack = () => navigate("/student");

  const hasNoTasks = lessonData != null && totalTaskCount === 0;
  const progressPercent =
    totalTaskCount > 0 ? ((currentStep + 1) / totalTaskCount) * 100 : 0;

  // ── Render current task solver ─────────────────────────────────────────────

  function renderCurrentTask() {
    if (!currentTask) return null;

    const taskResult =
      resultsMap?.get(answerKey(currentTask.taskType, currentTask.taskId)) ??
      null;
    const currentAnswer =
      answers[answerKey(currentTask.taskType, currentTask.taskId)]?.answer ??
      "";
    const disabled = submitting || isSubmitted;

    switch (currentTask.taskType) {
      case "choose":
        return (
          <ChooseTaskSolver
            key={`choose_${currentTask.taskId}`}
            task={currentTask.taskData as ChooseTaskResponse}
            value={currentAnswer}
            onChange={(answer) =>
              handleAnswer(currentTask.taskId, "choose", answer)
            }
            result={taskResult}
            disabled={disabled}
          />
        );
      case "write":
        return (
          <WriteTaskSolver
            key={`write_${currentTask.taskId}`}
            task={currentTask.taskData as WriteTaskResponse}
            value={currentAnswer}
            onChange={(answer) =>
              handleAnswer(currentTask.taskId, "write", answer)
            }
            result={taskResult}
            disabled={disabled}
          />
        );
      case "scatter":
        return (
          <ScatterTaskSolver
            key={`scatter_${currentTask.taskId}`}
            task={currentTask.taskData as ScatterTaskResponse}
            value={currentAnswer}
            onChange={(answer) =>
              handleAnswer(currentTask.taskId, "scatter", answer)
            }
            result={taskResult}
            disabled={disabled}
          />
        );
      case "speak":
        return (
          <SpeakTaskSolver
            key={`speak_${currentTask.taskId}`}
            task={currentTask.taskData as SpeakTaskResponse}
            value={currentAnswer}
            onChange={(answer) =>
              handleAnswer(currentTask.taskId, "speak", answer)
            }
            result={taskResult}
            disabled={disabled}
          />
        );
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        <DashboardTopBar onLogout={handleLogout} />

        {/* Back button */}
        <Button
          startIcon={<BackIcon />}
          onClick={goBack}
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

            {/* Unanswered alert */}
            {showUnansweredAlert &&
              answeredCount < totalTaskCount &&
              (() => {
                const unansweredIndices = flatTasks
                  .map((t, i) => ({ idx: i, t }))
                  .filter(
                    ({ t }) =>
                      (answers[answerKey(t.taskType, t.taskId)]?.answer ??
                        "") === "",
                  )
                  .map(({ idx }) => idx);

                return (
                  <Alert
                    severity="warning"
                    sx={{ mb: 2, borderRadius: 2 }}
                    action={
                      <Stack direction="row" spacing={1}>
                        <Button
                          color="inherit"
                          size="small"
                          onClick={() => setShowUnansweredAlert(false)}
                        >
                          Wróć do pytań
                        </Button>
                        <Button
                          color="warning"
                          size="small"
                          variant="contained"
                          onClick={doSubmit}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Wyślij mimo to
                        </Button>
                      </Stack>
                    }
                  >
                    Nie odpowiedziano na {totalTaskCount - answeredCount} z{" "}
                    {totalTaskCount} pytań (
                    {unansweredIndices.map((i) => `zad. ${i + 1}`).join(", ")}
                    ). Puste odpowiedzi będą ocenione jako błędne.
                  </Alert>
                );
              })()}

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
                {flatTasks.map((ft, idx) => {
                  const key = answerKey(ft.taskType, ft.taskId);
                  const isAnswered = (answers[key]?.answer ?? "") !== "";
                  const isCurrent = idx === currentStep;
                  const meta = taskTypeMeta[ft.taskType];
                  const taskResult = resultsMap?.get(key) ?? null;

                  // Show section divider before first task of a new section
                  const prevSection =
                    idx > 0 ? flatTasks[idx - 1].section : null;
                  const showDivider = idx > 0 && ft.section !== prevSection;

                  return (
                    <Box
                      key={key}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {showDivider && (
                        <Box
                          sx={{
                            width: 20,
                            height: 1,
                            bgcolor: "divider",
                            my: 0.5,
                          }}
                        />
                      )}
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="caption" fontWeight={700}>
                              {`${idx + 1}. ${meta.label}`}
                            </Typography>
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
                                {taskResult.isCorrect ? "Poprawne" : "Błędne"}
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
                                      borderColor: alpha(meta.color, 0.35),
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
                                        borderColor: alpha(meta.color, 0.5),
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
                              idx + 1
                            )
                          ) : isAnswered ? (
                            <AnsweredIcon sx={{ fontSize: 18 }} />
                          ) : (
                            idx + 1
                          )}
                        </Box>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>

              {/* Right: Task + hint columns */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Grid container spacing={3}>
                  {/* Left: Task card */}
                  <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                    <Paper elevation={0} sx={{ ...taskCardSx, p: 3 }}>
                      {/* Inner task card */}
                      <Box
                        sx={{
                          p: 2.5,
                          mb: 3,
                          borderRadius: 3,
                          bgcolor: (t) =>
                            alpha(
                              t.palette.common.white,
                              t.palette.mode === "dark" ? 0.02 : 0.6,
                            ),
                          border: "1px solid",
                          borderColor: (t) =>
                            alpha(
                              t.palette.divider,
                              t.palette.mode === "dark" ? 0.15 : 0.2,
                            ),
                        }}
                      >
                        {renderCurrentTask()}
                      </Box>

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
                        {currentTask.hint
                          ? "Podpowiedź"
                          : (currentTask.section ?? "Informacja")}
                      </Typography>

                      {currentTask.hint && (
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

                      {!currentTask.hint && currentTask.section && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ lineHeight: 1.7 }}
                        >
                          Sekcja: {currentTask.section}
                        </Typography>
                      )}

                      {!currentTask.hint && !currentTask.section && (
                        <Typography variant="body2" color="text.secondary">
                          Rozwiąż zadanie po lewej stronie.
                        </Typography>
                      )}

                      {/* Task type badge */}
                      <Box
                        sx={{
                          mt: 2,
                          pt: 2,
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              color: taskTypeMeta[currentTask.taskType].color,
                            }}
                          >
                            {taskTypeMeta[currentTask.taskType].icon}
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            Typ: {taskTypeMeta[currentTask.taskType].label}
                          </Typography>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </>
        )}
      </Container>

      {/* Result dialog */}
      <LessonResultDialog
        open={resultDialogOpen}
        result={submitResult}
        onClose={() => setResultDialogOpen(false)}
        onBackToDashboard={goBack}
      />
    </Box>
  );
}
