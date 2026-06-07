import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBackOutlined as BackIcon,
  Inventory2Outlined as BankIcon,
  SaveOutlined as SaveIcon,
  WarningAmberRounded as WarningIcon,
} from "@mui/icons-material";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/ui/dialog/AppDialog";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { FormSection } from "@/components/ui/form/FormLayout";
import {
  panelFooterButtonSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/apiClient";
import { userService, type UserProfile } from "@/api/userService";
import { lessonService, type Lesson } from "@/api/lessonService";
import { taskService, type TaskType } from "@/api/taskService";
import { TaskEditor } from "@/components/teacher/TaskEditor";
import type { LessonTaskDraft } from "@/components/teacher/TaskCard";
import {
  getLessonEditorErrorMessage,
  getTaskValidationError,
  parseBackendDraftId,
  tasksResponseToDrafts,
} from "./lessonEditor";

function buildSelectedLessonsState(
  drafts: LessonTaskDraft[],
  lessons: Lesson[],
): Record<string, Lesson[]> {
  const lessonsByPublicId = new Map(
    lessons.map((lesson) => [lesson.publicId, lesson]),
  );

  return Object.fromEntries(
    drafts.map((task) => {
      const lesson = task.sourceLessonPublicId
        ? (lessonsByPublicId.get(task.sourceLessonPublicId) ?? null)
        : null;
      return [task.id, lesson ? [lesson] : []];
    }),
  );
}

function areTaskDraftListsEqual(
  left: LessonTaskDraft[],
  right: LessonTaskDraft[],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function createBankTask(task: LessonTaskDraft) {
  const hint = task.hint.trim() || undefined;
  const section = task.section.trim() || undefined;
  const points = task.points;

  if (task.type === "choose") {
    const correctAnswers = (task.correctAnswers || task.correctAnswer)
      .split("|")
      .map((answer) => Number(answer.trim()))
      .filter((answer) => Number.isInteger(answer));

    return taskService.createTeacherBankChooseTask({
      task: (task.task ?? "").trim(),
      possibleAnswers: task.possibleAnswers.trim(),
      correctAnswer: correctAnswers[0],
      correctAnswers,
      hint,
      section,
      points,
    });
  }

  if (task.type === "write") {
    const correctAnswers = (task.correctAnswers || task.correctAnswer)
      .split("\n")
      .map((answer) => answer.trim())
      .filter(Boolean);

    return taskService.createTeacherBankWriteTask({
      task: (task.task ?? "").trim(),
      correctAnswer: correctAnswers[0],
      correctAnswers,
      hint,
      section,
      points,
    });
  }

  if (task.type === "scatter") {
    const correctAnswers = (task.correctAnswers || task.correctAnswer)
      .split("\n")
      .map((answer) => answer.trim())
      .filter(Boolean);

    return taskService.createTeacherBankScatterTask({
      task: (task.task ?? "").trim(),
      words: task.words.trim(),
      correctAnswer: correctAnswers[0],
      correctAnswers,
      hint,
      section,
      points,
    });
  }

  const expectedText =
    (task.correctAnswers || task.correctAnswer)
      .split("\n")
      .map((answer) => answer.trim())
      .filter(Boolean)[0] ?? "";

  return taskService.createTeacherBankSpeakTask({
    expectedText,
    hint,
    section,
    points,
  });
}

async function updateBankTask(
  taskType: TaskType,
  taskPublicId: string,
  task: LessonTaskDraft,
) {
  const hint = task.hint.trim() || undefined;
  const section = task.section.trim() || undefined;
  const points = task.points;

  if (taskType === "choose") {
    const correctAnswers = (task.correctAnswers || task.correctAnswer)
      .split("|")
      .map((answer) => Number(answer.trim()))
      .filter((answer) => Number.isInteger(answer));

    return taskService.updateTeacherBankChooseTask(taskPublicId, {
      task: (task.task ?? "").trim(),
      possibleAnswers: task.possibleAnswers.trim(),
      correctAnswer: correctAnswers[0],
      correctAnswers,
      hint,
      section,
      points,
    });
  }

  if (taskType === "write") {
    const correctAnswers = (task.correctAnswers || task.correctAnswer)
      .split("\n")
      .map((answer) => answer.trim())
      .filter(Boolean);

    return taskService.updateTeacherBankWriteTask(taskPublicId, {
      task: (task.task ?? "").trim(),
      correctAnswer: correctAnswers[0],
      correctAnswers,
      hint,
      section,
      points,
    });
  }

  if (taskType === "scatter") {
    const correctAnswers = (task.correctAnswers || task.correctAnswer)
      .split("\n")
      .map((answer) => answer.trim())
      .filter(Boolean);

    return taskService.updateTeacherBankScatterTask(taskPublicId, {
      task: (task.task ?? "").trim(),
      words: task.words.trim(),
      correctAnswer: correctAnswers[0],
      correctAnswers,
      hint,
      section,
      points,
    });
  }

  const expectedText =
    (task.correctAnswers || task.correctAnswer)
      .split("\n")
      .map((answer) => answer.trim())
      .filter(Boolean)[0] ?? "";

  return taskService.updateTeacherBankSpeakTask(taskPublicId, {
    expectedText,
    hint,
    section,
    points,
  });
}

function getTaskBankValidationError(tasks: LessonTaskDraft[]): string | null {
  return (
    tasks
      .map((task, index) => getTaskValidationError(task, index))
      .find((message): message is string => Boolean(message)) ?? null
  );
}

function getTaskTypeLabel(type: TaskType): string {
  switch (type) {
    case "choose":
      return "Wybór";
    case "write":
      return "Pisanie";
    case "scatter":
      return "Rozsypanka";
    case "speak":
      return "Mówienie";
  }
}

function countTaskEditLockErrors(
  results: PromiseSettledResult<unknown>[],
): number {
  return results.filter(
    (result) =>
      result.status === "rejected" &&
      result.reason instanceof ApiError &&
      result.reason.problem.code === "TASK_EDIT_LOCKED_AFTER_USE",
  ).length;
}

type LessonFilterOption =
  | { kind: "all"; label: string }
  | { kind: "unassigned"; label: string }
  | { kind: "lesson"; label: string; lesson: Lesson };

type TaskTypeFilterOption =
  | { kind: "all"; label: string }
  | { kind: "type"; label: string; value: TaskType };

export function TeacherTaskBankView() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    severity: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [draftTasks, setDraftTasks] = useState<LessonTaskDraft[]>([]);
  const [originalTasks, setOriginalTasks] = useState<LessonTaskDraft[]>([]);
  const [teacherLessons, setTeacherLessons] = useState<Lesson[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<
    Record<string, Lesson[]>
  >({});
  const [lessonFilter, setLessonFilter] = useState<LessonFilterOption>({
    kind: "all",
    label: "Wszystkie lekcje",
  });
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilterOption>({
    kind: "all",
    label: "Wszystkie typy",
  });
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leavingAfterSave, setLeavingAfterSave] = useState(false);

  const hasUnsavedChanges = !areTaskDraftListsEqual(draftTasks, originalTasks);
  const availableTasks = useMemo(
    () => draftTasks.filter((task) => !task.sourceLessonPublicId),
    [draftTasks],
  );
  const lessonSummaries = useMemo(
    () =>
      teacherLessons
        .map((lesson) => {
          const tasks = draftTasks.filter(
            (task) => task.sourceLessonPublicId === lesson.publicId,
          );
          const typeCounts = {
            choose: tasks.filter((task) => task.type === "choose").length,
            write: tasks.filter((task) => task.type === "write").length,
            scatter: tasks.filter((task) => task.type === "scatter").length,
            speak: tasks.filter((task) => task.type === "speak").length,
          };

          return {
            lesson,
            tasks,
            taskCount: tasks.length,
            totalPoints: tasks.reduce(
              (sum, task) => sum + (Number(task.points) || 0),
              0,
            ),
            typeCounts,
          };
        })
        .sort(
          (a, b) =>
            b.taskCount - a.taskCount ||
            a.lesson.title.localeCompare(b.lesson.title, "pl"),
        ),
    [draftTasks, teacherLessons],
  );
  const lessonFilterOptions = useMemo<LessonFilterOption[]>(
    () => [
      { kind: "all", label: "Wszystkie lekcje" },
      { kind: "unassigned", label: "Nieprzypisane" },
      ...teacherLessons.map((lesson) => ({
        kind: "lesson" as const,
        label: lesson.title,
        lesson,
      })),
    ],
    [teacherLessons],
  );
  const taskTypeFilterOptions = useMemo<TaskTypeFilterOption[]>(
    () => [
      { kind: "all", label: "Wszystkie typy" },
      { kind: "type", label: getTaskTypeLabel("choose"), value: "choose" },
      { kind: "type", label: getTaskTypeLabel("write"), value: "write" },
      { kind: "type", label: getTaskTypeLabel("scatter"), value: "scatter" },
      { kind: "type", label: getTaskTypeLabel("speak"), value: "speak" },
    ],
    [],
  );
  const filteredDraftTasks = useMemo(() => {
    return draftTasks.filter((task) => {
      const matchesLesson =
        lessonFilter.kind === "all"
          ? true
          : lessonFilter.kind === "unassigned"
            ? !task.sourceLessonPublicId
            : task.sourceLessonPublicId === lessonFilter.lesson.publicId;

      const matchesType =
        taskTypeFilter.kind === "all"
          ? true
          : task.type === taskTypeFilter.value;

      return matchesLesson && matchesType;
    });
  }, [draftTasks, lessonFilter, taskTypeFilter]);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch(() => undefined)
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFeedback(null);

      try {
        const [taskBankResponse, lessons] = await Promise.all([
          taskService.getTeacherTaskBank(),
          lessonService.getTeacherLessons(),
        ]);

        if (cancelled) {
          return;
        }

        const drafts = tasksResponseToDrafts(taskBankResponse);
        setDraftTasks(drafts);
        setOriginalTasks(drafts);
        setTeacherLessons(lessons);
        setSelectedLessons(buildSelectedLessonsState(drafts, lessons));
      } catch (error) {
        if (!cancelled) {
          setFeedback({
            severity: "error",
            message: getLessonEditorErrorMessage(
              error,
              "Nie udało się załadować bazy zadań.",
            ),
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const taskValidationError = getTaskBankValidationError(draftTasks);

    if (taskValidationError) {
      setFeedback({ severity: "error", message: taskValidationError });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const originalIds = new Set(originalTasks.map((task) => task.id));
      const currentIds = new Set(draftTasks.map((task) => task.id));

      const tasksToDelete = originalTasks.filter(
        (task) => !currentIds.has(task.id),
      );
      const tasksToCreate = draftTasks.filter(
        (task) => !parseBackendDraftId(task.id),
      );
      const tasksToUpdate = draftTasks.filter(
        (task) => parseBackendDraftId(task.id) && originalIds.has(task.id),
      );

      const operations: Array<{
        draftTaskId: string;
        kind: "delete" | "update" | "create";
        promise: Promise<unknown>;
      }> = [];

      for (const task of tasksToDelete) {
        const parsed = parseBackendDraftId(task.id);
        if (parsed) {
          operations.push({
            draftTaskId: task.id,
            kind: "delete",
            promise: taskService.deleteTeacherBankTask(
              task.type,
              parsed.taskPublicId,
            ),
          });
        }
      }

      for (const task of tasksToUpdate) {
        const parsed = parseBackendDraftId(task.id);
        if (parsed) {
          operations.push({
            draftTaskId: task.id,
            kind: "update",
            promise: updateBankTask(
              parsed.type as TaskType,
              parsed.taskPublicId,
              task,
            ),
          });
        }
      }

      for (const task of tasksToCreate) {
        operations.push({
          draftTaskId: task.id,
          kind: "create",
          promise: createBankTask(task),
        });
      }

      let failedCount = 0;
      let failedTaskEditLockCount = 0;
      const failedDeleteTaskIds = new Set<string>();
      const failedChangedTaskIds = new Set<string>();

      if (operations.length > 0) {
        const results = await Promise.allSettled(
          operations.map((operation) => operation.promise),
        );
        failedCount = results.filter(
          (result) => result.status === "rejected",
        ).length;
        failedTaskEditLockCount = countTaskEditLockErrors(results);

        results.forEach((result, index) => {
          if (result.status !== "rejected") {
            return;
          }
          const failedOperation = operations[index];
          if (failedOperation.kind === "delete") {
            failedDeleteTaskIds.add(failedOperation.draftTaskId);
            return;
          }
          failedChangedTaskIds.add(failedOperation.draftTaskId);
        });

        setFeedback(
          failedCount > 0
            ? {
                severity: "warning",
                message:
                  failedTaskEditLockCount > 0
                    ? failedTaskEditLockCount === failedCount
                      ? "Nie zapisano części zmian, bo niektóre zadania zostały już użyte w wynikach uczniów i nie mogą być edytowane z poziomu bazy zadań."
                      : `Zapisano zmiany, ale ${failedCount} z ${operations.length} operacji się nie powiodło. ${failedTaskEditLockCount} zad. zostało zablokowanych, bo są już użyte w wynikach uczniów.`
                    : `Zapisano zmiany, ale ${failedCount} z ${operations.length} operacji na zadaniach się nie powiodło.`,
              }
            : {
                severity: "success",
                message: "Baza zadań została zaktualizowana.",
              },
        );
      }

      const refreshed = await taskService.getTeacherTaskBank();
      const refreshedDrafts = tasksResponseToDrafts(refreshed);
      if (failedCount > 0) {
        const localDraftsById = new Map(
          draftTasks.map((task) => [task.id, task]),
        );
        const mergedDrafts = refreshedDrafts
          .filter((task) => !failedDeleteTaskIds.has(task.id))
          .map((task) =>
            failedChangedTaskIds.has(task.id)
              ? (localDraftsById.get(task.id) ?? task)
              : task,
          );

        const mergedDraftIds = new Set(mergedDrafts.map((task) => task.id));
        failedChangedTaskIds.forEach((taskId) => {
          if (mergedDraftIds.has(taskId)) {
            return;
          }
          const localTask = localDraftsById.get(taskId);
          if (localTask) {
            mergedDrafts.push(localTask);
            mergedDraftIds.add(taskId);
          }
        });

        setDraftTasks(mergedDrafts);
        setOriginalTasks(refreshedDrafts);
        setSelectedLessons(
          buildSelectedLessonsState(mergedDrafts, teacherLessons),
        );
      } else {
        setDraftTasks(refreshedDrafts);
        setOriginalTasks(refreshedDrafts);
        setSelectedLessons(
          buildSelectedLessonsState(refreshedDrafts, teacherLessons),
        );
      }
      if (leavingAfterSave) {
        setLeaveDialogOpen(false);
        setLeavingAfterSave(false);
        navigate("/teacher");
      }
    } catch (error) {
      setLeavingAfterSave(false);
      setFeedback({
        severity: "error",
        message: getLessonEditorErrorMessage(
          error,
          "Nie udało się zapisać zmian w bazie zadań.",
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAttemptLeave = () => {
    if (saving) {
      return;
    }

    if (!hasUnsavedChanges) {
      navigate("/teacher");
      return;
    }

    setLeaveDialogOpen(true);
  };

  const handleLeaveWithoutSaving = () => {
    setLeaveDialogOpen(false);
    setLeavingAfterSave(false);
    navigate("/teacher");
  };

  const handleSaveAndLeave = async () => {
    const taskValidationError = getTaskBankValidationError(draftTasks);
    if (taskValidationError) {
      setLeaveDialogOpen(false);
      setFeedback({ severity: "error", message: taskValidationError });
      return;
    }

    setLeavingAfterSave(true);
    await handleSave();
  };

  const handleAssign = async (task: LessonTaskDraft) => {
    const parsed = parseBackendDraftId(task.id);
    if (!parsed) {
      return;
    }

    const taskId = task.id;
    const lessons = selectedLessons[taskId] ?? [];
    if (lessons.length === 0 || assigningTaskId) {
      return;
    }

    setAssigningTaskId(taskId);
    setFeedback(null);

    try {
      await taskService.assignTeacherBankTaskToLesson(
        parsed.type as TaskType,
        parsed.taskPublicId,
        {
          lessonPublicIds: lessons.map((lesson) => lesson.publicId),
        },
      );

      setSelectedLessons((current) => ({ ...current, [taskId]: [] }));
      const isUnassignedTask = !task.sourceLessonPublicId;
      setFeedback({
        severity: "success",
        message:
          lessons.length === 1
            ? isUnassignedTask
              ? `Zadanie zostało przypisane do lekcji „${lessons[0].title}”.`
              : `Zadanie zostało skopiowane do lekcji „${lessons[0].title}”.`
            : `Zadanie zostało skopiowane do ${lessons.length} lekcji.`,
      });

      const refreshed = await taskService.getTeacherTaskBank();
      const refreshedDrafts = tasksResponseToDrafts(refreshed);
      setDraftTasks(refreshedDrafts);
      setOriginalTasks(refreshedDrafts);
      setSelectedLessons(
        buildSelectedLessonsState(refreshedDrafts, teacherLessons),
      );
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getLessonEditorErrorMessage(
          error,
          "Nie udało się dodać zadania do wybranych lekcji.",
        ),
      });
    } finally {
      setAssigningTaskId(null);
    }
  };

  const handleFilteredTaskChange = (
    updatedFilteredTasks: LessonTaskDraft[],
  ) => {
    const filteredTaskIds = new Set(filteredDraftTasks.map((task) => task.id));
    const reorderedVisibleTasks = [...updatedFilteredTasks];

    const mergedTasks = draftTasks.flatMap((task) => {
      if (!filteredTaskIds.has(task.id)) {
        return [task];
      }

      const nextVisibleTask = reorderedVisibleTasks.shift();
      return nextVisibleTask ? [nextVisibleTask] : [];
    });

    if (reorderedVisibleTasks.length > 0) {
      mergedTasks.push(...reorderedVisibleTasks);
    }

    setDraftTasks(mergedTasks);
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
        sx={{ pt: { xs: 2, sm: 3, md: 4 }, pb: 6, position: "relative" }}
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

        <Button
          startIcon={<BackIcon />}
          onClick={handleAttemptLeave}
          sx={{ textTransform: "none", fontWeight: 600, mb: 2 }}
        >
          Powrót do panelu nauczyciela
        </Button>

        <Stack spacing={3}>
          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="h5" fontWeight={700}>
                Baza zadań
              </Typography>
              <Chip
                icon={<BankIcon />}
                label="Katalog nauczyciela"
                color="primary"
                variant="outlined"
              />
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75, maxWidth: 760 }}
            >
              W bazie są zarówno zadania nieprzypisane, jak i te już użyte w
              lekcjach. Zadania bez lekcji możesz przypisać do jednej wybranej
              lekcji, a zadania już użyte skopiować dalej.
            </Typography>
          </Box>

          {feedback && (
            <Alert severity={feedback.severity}>{feedback.message}</Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 380px" },
                gap: 3,
                alignItems: "start",
              }}
            >
              <FormSection
                title="Zadania w bazie"
                description="Możesz je edytować, grupować sekcjami i przechowywać jako katalog do ponownego użycia."
              >
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(0, 1fr) minmax(0, 1fr) auto",
                      },
                      gap: 1.25,
                      alignItems: "start",
                    }}
                  >
                    <Autocomplete
                      size="small"
                      options={lessonFilterOptions}
                      value={lessonFilter}
                      onChange={(_, value) =>
                        setLessonFilter(
                          value ?? { kind: "all", label: "Wszystkie lekcje" },
                        )
                      }
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) =>
                        option.kind === value.kind &&
                        (option.kind !== "lesson" ||
                          value.kind !== "lesson" ||
                          option.lesson.publicId === value.lesson.publicId)
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Filtruj po lekcji" />
                      )}
                    />
                    <Autocomplete
                      size="small"
                      options={taskTypeFilterOptions}
                      value={taskTypeFilter}
                      onChange={(_, value) =>
                        setTaskTypeFilter(
                          value ?? { kind: "all", label: "Wszystkie typy" },
                        )
                      }
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) =>
                        option.kind === value.kind &&
                        (option.kind !== "type" ||
                          value.kind !== "type" ||
                          option.value === value.value)
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Filtruj po typie" />
                      )}
                    />
                    <Button
                      variant="text"
                      onClick={() => {
                        setLessonFilter({
                          kind: "all",
                          label: "Wszystkie lekcje",
                        });
                        setTaskTypeFilter({
                          kind: "all",
                          label: "Wszystkie typy",
                        });
                      }}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        minHeight: 40,
                      }}
                    >
                      Wyczyść filtry
                    </Button>
                  </Box>
                  <TaskEditor
                    tasks={filteredDraftTasks}
                    onChange={handleFilteredTaskChange}
                    defaultExpanded={false}
                    teacherLessons={teacherLessons}
                    assignmentStateByTaskId={Object.fromEntries(
                      filteredDraftTasks.map((task) => [
                        task.id,
                        {
                          lessons: selectedLessons[task.id] ?? [],
                          assigning: assigningTaskId === task.id,
                        },
                      ]),
                    )}
                    onAssignmentChange={(taskId, lessons) =>
                      setSelectedLessons((current) => ({
                        ...current,
                        [taskId]: lessons,
                      }))
                    }
                    onAssignToLessons={(task) => void handleAssign(task)}
                  />
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={saving}
                      sx={panelFooterButtonSx}
                    >
                      {saving ? "Zapisywanie..." : "Zapisz bazę zadań"}
                    </Button>
                  </Box>
                </Stack>
              </FormSection>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <FormSection
                  title="Podsumowanie lekcji"
                  description="Szybki przegląd liczby zadań, typów i punktów w każdej lekcji."
                  sx={panelSurfaceSx}
                >
                  <Stack spacing={1.5}>
                    {lessonSummaries.length === 0 ? (
                      <Alert severity="info">Brak lekcji nauczyciela.</Alert>
                    ) : (
                      lessonSummaries.map((summary) => (
                        <Box
                          key={summary.lesson.publicId}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                          }}
                        >
                          <Stack spacing={1}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 1,
                                alignItems: "flex-start",
                              }}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={700}
                                >
                                  {summary.lesson.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Zadań: {summary.taskCount} •{" "}
                                  {summary.totalPoints} pkt do zdobycia
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={String(summary.taskCount)}
                                color={
                                  summary.taskCount > 0 ? "primary" : "default"
                                }
                                variant="outlined"
                              />
                            </Box>
                            <Stack
                              direction="row"
                              spacing={0.75}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              {(
                                Object.entries(summary.typeCounts) as Array<
                                  [TaskType, number]
                                >
                              )
                                .filter(([, count]) => count > 0)
                                .map(([type, count]) => (
                                  <Chip
                                    key={type}
                                    size="small"
                                    label={`${getTaskTypeLabel(type)}: ${count}`}
                                    variant="outlined"
                                  />
                                ))}
                              {summary.taskCount === 0 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Ta lekcja nie ma jeszcze przypisanych zadań.
                                </Typography>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      ))
                    )}
                  </Stack>
                </FormSection>

                <FormSection
                  title="Zadania bez lekcji"
                  description="Zadania, które nie są jeszcze przypisane do żadnej lekcji."
                  sx={panelSurfaceSx}
                >
                  <Stack spacing={1.25}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Zadania bez lekcji
                      </Typography>
                      <Chip
                        size="small"
                        label={String(availableTasks.length)}
                        color={
                          availableTasks.length > 0 ? "success" : "default"
                        }
                        variant="outlined"
                      />
                    </Box>
                  </Stack>
                </FormSection>
              </Box>
            </Box>
          )}
        </Stack>
      </Container>

      <AppDialog
        open={leaveDialogOpen}
        onClose={() => {
          if (!saving) {
            setLeaveDialogOpen(false);
            setLeavingAfterSave(false);
          }
        }}
        maxWidth="sm"
      >
        <AppDialogHeader
          icon={<WarningIcon />}
          title="Masz niezapisane zmiany"
          subtitle="Jeśli teraz opuścisz widok, wprowadzone zmiany w bazie zadań zostaną utracone."
        />
        <AppDialogBody>
          <Typography variant="body2" color="text.secondary">
            Możesz wrócić i dokończyć edycję, wyjść bez zapisywania albo
            najpierw zapisać zmiany i dopiero opuścić widok.
          </Typography>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            variant="text"
            onClick={() => {
              setLeaveDialogOpen(false);
              setLeavingAfterSave(false);
            }}
            disabled={saving}
          >
            Wróć i dokończ
          </Button>
          <Button
            variant="text"
            color="warning"
            onClick={handleLeaveWithoutSaving}
            disabled={saving}
          >
            Opuść bez zapisywania
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveAndLeave()}
            disabled={saving}
          >
            {saving && leavingAfterSave ? "Zapisywanie..." : "Zapisz i wyjdź"}
          </Button>
        </AppDialogFooter>
      </AppDialog>
    </Box>
  );
}
