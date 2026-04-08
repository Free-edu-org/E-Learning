import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AddCircleOutlined as AddIcon,
  AutoAwesomeOutlined as SparklesIcon,
  DarkMode as DarkModeIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditLessonIcon,
  GroupOutlined as GroupIcon,
  LightMode as LightModeIcon,
  LogoutOutlined as LogoutIcon,
  PersonAddOutlined as PersonAddIcon,
  SaveOutlined as SaveIcon,
  SchoolOutlined as SchoolIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import { lessonService } from "@/api/lessonService";
import type { Group, Lesson, TeacherStats } from "@/api/lessonService";
import { taskService } from "@/api/taskService";
import type { LessonTasksResponse } from "@/api/taskService";
import { userService, type UserProfile } from "@/api/userService";
import { ActionButton } from "@/components/teacher/ActionButton";
import { LessonCard } from "@/components/teacher/LessonCard";
import {
  LessonToolbar,
  type SortMode,
  type StatusFilter,
  type ViewMode,
} from "@/components/teacher/LessonToolbar";
import { StatsCard } from "@/components/teacher/StatsCard";
import { TaskEditor } from "@/components/teacher/TaskEditor";
import type { LessonTaskDraft } from "@/components/teacher/TaskCard";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogStatus,
} from "@/components/ui/dialog/AppDialog";
import {
  FormActions,
  FormField,
  FormSection,
} from "@/components/ui/form/FormLayout";
import {
  panelFooterButtonSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { uiTokens } from "@/theme/uiTokens";

interface DialogFeedbackState {
  severity: "success" | "error" | "warning";
  message: string;
}

interface LessonDraft {
  title: string;
  theme: string;
  groupIds: Group[];
  tasks: LessonTaskDraft[];
}

const emptyLessonDraft: LessonDraft = {
  title: "",
  theme: "",
  groupIds: [],
  tasks: [],
};

const validationMessageTranslations: Record<string, string> = {
  "Title is required": "Tytuł jest wymagany.",
  "Theme is required": "Temat jest wymagany.",
  "must not be blank": "Pole jest wymagane.",
};

function translateBackendMessage(message: string) {
  let translated = message;
  for (const [source, target] of Object.entries(
    validationMessageTranslations,
  )) {
    translated = translated.replaceAll(source, target);
  }

  if (translated.startsWith("Validation failed:")) {
    const rawDetails = translated.replace("Validation failed:", "").trim();
    const fieldLabels: Record<string, string> = {
      title: "Tytuł",
      theme: "Temat",
    };
    const parts = rawDetails
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf(":");
        if (separatorIndex === -1) return part;
        const field = part.slice(0, separatorIndex).trim();
        const detail = part.slice(separatorIndex + 1).trim();
        const label = fieldLabels[field] ?? field;
        return `${label}: ${detail}`;
      });
    return `Błąd walidacji: ${parts.join(", ")}`.replaceAll(" .", ".").trim();
  }

  return translated;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const message = error.problem.detail || error.problem.title;
    return message ? translateBackendMessage(message) : fallback;
  }
  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak połączenia z serwerem.";
  }
  return fallback;
}

function getTaskValidationError(
  task: LessonTaskDraft,
  index: number,
): string | null {
  const position = `Zadanie ${index + 1}`;

  if (!task.task.trim()) {
    return `${position}: treść zadania jest wymagana.`;
  }

  if (task.type === "choose") {
    if (!task.possibleAnswers.trim()) {
      return `${position}: podaj odpowiedzi oddzielone znakiem |.`;
    }
    const trimmedCorrect = task.correctAnswer.trim();
    if (trimmedCorrect === "") {
      return `${position}: podaj indeks poprawnej odpowiedzi (np. 0).`;
    }
    const correctIndex = Number(trimmedCorrect);
    if (!Number.isInteger(correctIndex)) {
      return `${position}: indeks poprawnej odpowiedzi musi być liczbą całkowitą.`;
    }
    const answers = task.possibleAnswers
      .split("|")
      .map((answer) => answer.trim())
      .filter(Boolean);
    if (correctIndex < 0 || correctIndex >= answers.length) {
      return `${position}: indeks poprawnej odpowiedzi musi wskazywać jedną z dostępnych odpowiedzi (od 0 do ${Math.max(answers.length - 1, 0)}).`;
    }
  }

  if (task.type === "write") {
    if (!task.correctAnswer.trim()) {
      return `${position}: poprawna odpowiedź jest wymagana.`;
    }
  }

  if (task.type === "scatter") {
    if (!task.words.trim()) {
      return `${position}: podaj słowa oddzielone znakiem |.`;
    }
    if (!task.correctAnswer.trim()) {
      return `${position}: poprawna odpowiedź jest wymagana.`;
    }
  }

  return null;
}

async function createLessonTask(lessonId: number, task: LessonTaskDraft) {
  const hint = task.hint.trim() || undefined;
  const section = task.section.trim() || undefined;

  if (task.type === "choose") {
    return taskService.createChooseTask(lessonId, {
      task: task.task.trim(),
      possibleAnswers: task.possibleAnswers.trim(),
      correctAnswer: Number(task.correctAnswer.trim()),
      hint,
      section,
    });
  }

  if (task.type === "write") {
    return taskService.createWriteTask(lessonId, {
      task: task.task.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  if (task.type === "scatter") {
    return taskService.createScatterTask(lessonId, {
      task: task.task.trim(),
      words: task.words.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  return taskService.createSpeakTask(lessonId, {
    task: task.task.trim(),
    hint,
    section,
  });
}

async function updateLessonTask(
  lessonId: number,
  backendId: number,
  task: LessonTaskDraft,
) {
  const hint = task.hint.trim() || undefined;
  const section = task.section.trim() || undefined;

  if (task.type === "choose") {
    return taskService.updateChooseTask(lessonId, backendId, {
      task: task.task.trim(),
      possibleAnswers: task.possibleAnswers.trim(),
      correctAnswer: Number(task.correctAnswer.trim()),
      hint,
      section,
    });
  }
  if (task.type === "write") {
    return taskService.updateWriteTask(lessonId, backendId, {
      task: task.task.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }
  if (task.type === "scatter") {
    return taskService.updateScatterTask(lessonId, backendId, {
      task: task.task.trim(),
      words: task.words.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }
  return taskService.updateSpeakTask(lessonId, backendId, {
    task: task.task.trim(),
    hint,
    section,
  });
}

/**
 * Convert backend LessonTasksResponse to flat LessonTaskDraft[].
 * Each draft gets `backendId:<type>:<id>` as its `id` so we can track
 * which ones already exist on the server.
 */
function tasksResponseToDrafts(
  response: LessonTasksResponse,
): LessonTaskDraft[] {
  const drafts: LessonTaskDraft[] = [];
  for (const section of response.sections) {
    const sec = section.section ?? "";
    for (const t of section.chooseTasks) {
      drafts.push({
        id: `backendId:choose:${t.id}`,
        type: "choose",
        task: t.task,
        possibleAnswers: t.possibleAnswers,
        correctAnswer: t.correctAnswer != null ? String(t.correctAnswer) : "",
        words: "",
        hint: t.hint ?? "",
        section: sec,
      });
    }
    for (const t of section.writeTasks) {
      drafts.push({
        id: `backendId:write:${t.id}`,
        type: "write",
        task: t.task,
        possibleAnswers: "",
        correctAnswer: t.correctAnswer ?? "",
        words: "",
        hint: t.hint ?? "",
        section: sec,
      });
    }
    for (const t of section.scatterTasks) {
      drafts.push({
        id: `backendId:scatter:${t.id}`,
        type: "scatter",
        task: t.task,
        possibleAnswers: "",
        correctAnswer: t.correctAnswer ?? "",
        words: t.words,
        hint: t.hint ?? "",
        section: sec,
      });
    }
    for (const t of section.speakTasks) {
      drafts.push({
        id: `backendId:speak:${t.id}`,
        type: "speak",
        task: t.task,
        possibleAnswers: "",
        correctAnswer: "",
        words: "",
        hint: t.hint ?? "",
        section: sec,
      });
    }
  }
  return drafts;
}

function parseBackendDraftId(
  draftId: string,
): { type: string; backendId: number } | null {
  const match = /^backendId:(\w+):(\d+)$/.exec(draftId);
  if (!match) return null;
  return { type: match[1], backendId: Number(match[2]) };
}

export function TeacherDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { toggleColorMode } = useAppTheme();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);
  const [errorData, setErrorData] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("date_desc");
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(emptyLessonDraft);
  const [createDialogLoading, setCreateDialogLoading] = useState(false);
  const [createDialogFeedback, setCreateDialogFeedback] =
    useState<DialogFeedbackState | null>(null);

  // ── Edit dialog state ──
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editDraft, setEditDraft] = useState<LessonDraft>(emptyLessonDraft);
  const [editOriginalTasks, setEditOriginalTasks] = useState<LessonTaskDraft[]>(
    [],
  );
  const [editDialogLoading, setEditDialogLoading] = useState(false);
  const [editDialogFeedback, setEditDialogFeedback] =
    useState<DialogFeedbackState | null>(null);
  const [editTasksLoading, setEditTasksLoading] = useState(false);

  // ── Delete confirmation state ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [deleteDialogLoading, setDeleteDialogLoading] = useState(false);
  const [deleteDialogFeedback, setDeleteDialogFeedback] =
    useState<DialogFeedbackState | null>(null);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          if (err.problem.status === 403) {
            setErrorUser("Brak uprawnień do panelu nauczyciela.");
            return;
          }
          setErrorUser(err.problem.detail || "Nie udało się pobrać profilu.");
        } else {
          setErrorUser("Błąd połączenia z serwerem.");
        }
      })
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    Promise.all([
      lessonService.getTeacherStats(),
      lessonService.getTeacherLessons(),
      lessonService.getTeacherGroups(),
    ])
      .then(([s, l, g]) => {
        setStats(s);
        setLessons(l);
        setAvailableGroups(g);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.problem.status === 403) {
          setErrorData("Brak uprawnień do panelu nauczyciela.");
          return;
        }
        setErrorData("Nie udało się pobrać danych. Spróbuj ponownie.");
      })
      .finally(() => setLoadingData(false));
  }, []);

  const refreshDashboardData = async () => {
    const [s, l, g] = await Promise.all([
      lessonService.getTeacherStats(),
      lessonService.getTeacherLessons(),
      lessonService.getTeacherGroups(),
    ]);
    setStats(s);
    setLessons(l);
    setAvailableGroups(g);
  };

  const openCreateLessonDialog = () => {
    setLessonDraft(emptyLessonDraft);
    setCreateDialogFeedback(null);
    setCreateDialogOpen(true);
  };

  const closeCreateLessonDialog = () => {
    if (createDialogLoading) return;
    setCreateDialogOpen(false);
  };

  const resetCreateDialogState = () => {
    setLessonDraft(emptyLessonDraft);
    setCreateDialogFeedback(null);
  };

  const submitCreateLessonDialog = async () => {
    if (createDialogLoading) return;

    const taskValidationError = lessonDraft.tasks
      .map((task, index) => getTaskValidationError(task, index))
      .find((error): error is string => Boolean(error));
    if (taskValidationError) {
      setCreateDialogFeedback({
        severity: "error",
        message: taskValidationError,
      });
      return;
    }

    setCreateDialogFeedback(null);
    setCreateDialogLoading(true);
    try {
      const groupIds = lessonDraft.groupIds.map((g) => g.id);
      const createdLesson = await lessonService.createLesson({
        title: lessonDraft.title,
        theme: lessonDraft.theme,
        groupIds: groupIds.length > 0 ? groupIds : undefined,
      });

      const taskDrafts = lessonDraft.tasks;
      if (taskDrafts.length > 0) {
        const taskResults = await Promise.allSettled(
          taskDrafts.map((task) => createLessonTask(createdLesson.id, task)),
        );
        const failedTaskCount = taskResults.filter(
          (result) => result.status === "rejected",
        ).length;

        if (failedTaskCount > 0) {
          setCreateDialogFeedback({
            severity: "warning",
            message:
              failedTaskCount === taskDrafts.length
                ? "Lekcja została utworzona, ale nie udało się dodać żadnego zadania."
                : `Lekcja została utworzona. Nie udało się dodać ${failedTaskCount} z ${taskDrafts.length} zadań.`,
          });
        } else {
          setCreateDialogFeedback({
            severity: "success",
            message: `Lekcja i ${taskDrafts.length} zadań zostały utworzone.`,
          });
        }
      } else {
        setCreateDialogFeedback({
          severity: "success",
          message: "Lekcja została utworzona.",
        });
      }

      await refreshDashboardData();
      window.setTimeout(() => closeCreateLessonDialog(), 900);
    } catch (error) {
      setCreateDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się utworzyć lekcji."),
      });
    } finally {
      setCreateDialogLoading(false);
    }
  };

  // ── Edit dialog handlers ──

  const openEditLessonDialog = useCallback(async (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditDraft({
      title: lesson.title,
      theme: lesson.theme,
      groupIds: lesson.groups,
      tasks: [],
    });
    setEditDialogFeedback(null);
    setEditDialogOpen(true);
    setEditTasksLoading(true);

    try {
      const tasksResponse = await taskService.getLessonTasks(lesson.id);
      const drafts = tasksResponseToDrafts(tasksResponse);
      setEditDraft((prev) => ({ ...prev, tasks: drafts }));
      setEditOriginalTasks(drafts);
    } catch {
      setEditDialogFeedback({
        severity: "warning",
        message: "Nie udało się załadować zadań. Możesz edytować dane lekcji.",
      });
      setEditOriginalTasks([]);
    } finally {
      setEditTasksLoading(false);
    }
  }, []);

  const closeEditLessonDialog = () => {
    if (editDialogLoading) return;
    setEditDialogOpen(false);
  };

  const resetEditDialogState = () => {
    setEditingLesson(null);
    setEditDraft(emptyLessonDraft);
    setEditOriginalTasks([]);
    setEditDialogFeedback(null);
  };

  const submitEditLessonDialog = async () => {
    if (editDialogLoading || !editingLesson) return;

    const taskValidationError = editDraft.tasks
      .map((task, index) => getTaskValidationError(task, index))
      .find((error): error is string => Boolean(error));
    if (taskValidationError) {
      setEditDialogFeedback({
        severity: "error",
        message: taskValidationError,
      });
      return;
    }

    setEditDialogFeedback(null);
    setEditDialogLoading(true);

    try {
      const lessonId = editingLesson.id;
      const groupIds = editDraft.groupIds.map((g) => g.id);

      // 1. Update lesson metadata
      await lessonService.updateLesson(lessonId, {
        title: editDraft.title,
        theme: editDraft.theme,
        groupIds,
      });

      // 2. Diff tasks: find creates, updates, deletes
      const originalIds = new Set(editOriginalTasks.map((t) => t.id));
      const currentIds = new Set(editDraft.tasks.map((t) => t.id));

      const tasksToDelete = editOriginalTasks.filter(
        (t) => !currentIds.has(t.id),
      );
      const tasksToCreate = editDraft.tasks.filter(
        (t) => !parseBackendDraftId(t.id),
      );
      const tasksToUpdate = editDraft.tasks.filter(
        (t) => parseBackendDraftId(t.id) && originalIds.has(t.id),
      );

      const allTaskOps: Promise<unknown>[] = [];

      // Deletes
      for (const task of tasksToDelete) {
        const parsed = parseBackendDraftId(task.id);
        if (parsed) {
          allTaskOps.push(
            taskService.deleteTask(lessonId, task.type, parsed.backendId),
          );
        }
      }

      // Updates
      for (const task of tasksToUpdate) {
        const parsed = parseBackendDraftId(task.id);
        if (parsed) {
          allTaskOps.push(updateLessonTask(lessonId, parsed.backendId, task));
        }
      }

      // Creates
      for (const task of tasksToCreate) {
        allTaskOps.push(createLessonTask(lessonId, task));
      }

      if (allTaskOps.length > 0) {
        const results = await Promise.allSettled(allTaskOps);
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          setEditDialogFeedback({
            severity: "warning",
            message: `Lekcja zaktualizowana. Nie udało się przetworzyć ${failed} z ${allTaskOps.length} operacji na zadaniach.`,
          });
        } else {
          setEditDialogFeedback({
            severity: "success",
            message: "Lekcja i zadania zostały zaktualizowane.",
          });
        }
      } else {
        setEditDialogFeedback({
          severity: "success",
          message: "Lekcja została zaktualizowana.",
        });
      }

      await refreshDashboardData();
      window.setTimeout(() => closeEditLessonDialog(), 900);
    } catch (error) {
      setEditDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zaktualizować lekcji."),
      });
    } finally {
      setEditDialogLoading(false);
    }
  };

  // ── Toggle lesson status ──

  const handleToggleLessonStatus = useCallback(async (lesson: Lesson) => {
    try {
      await lessonService.updateLessonStatus(lesson.id, !lesson.isActive);
      await refreshDashboardData();
    } catch {
      // silently ignore, user can retry
    }
  }, []);

  // ── Delete dialog handlers ──

  const openDeleteDialog = useCallback((lesson: Lesson) => {
    setDeletingLesson(lesson);
    setDeleteDialogFeedback(null);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = () => {
    if (deleteDialogLoading) return;
    setDeleteDialogOpen(false);
  };

  const resetDeleteDialogState = () => {
    setDeletingLesson(null);
    setDeleteDialogFeedback(null);
  };

  const submitDeleteLesson = async () => {
    if (deleteDialogLoading || !deletingLesson) return;
    setDeleteDialogLoading(true);
    setDeleteDialogFeedback(null);
    try {
      await lessonService.deleteLesson(deletingLesson.id);
      setDeleteDialogFeedback({
        severity: "success",
        message: "Lekcja została usunięta.",
      });
      await refreshDashboardData();
      window.setTimeout(() => closeDeleteDialog(), 700);
    } catch (error) {
      setDeleteDialogFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się usunąć lekcji."),
      });
    } finally {
      setDeleteDialogLoading(false);
    }
  };

  const displayedLessons = useMemo(() => {
    let result = lessons;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(q) ||
          lesson.theme.toLowerCase().includes(q),
      );
    }

    if (statusFilter === "active") {
      result = result.filter((lesson) => lesson.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((lesson) => !lesson.isActive);
    }

    if (selectedGroups.length > 0) {
      const selectedIds = new Set(selectedGroups.map((group) => group.id));
      result = result.filter((lesson) =>
        lesson.groups.some((group) => selectedIds.has(group.id)),
      );
    }

    result = [...result].sort((a, b) => {
      switch (sortMode) {
        case "date_asc":
          return a.createdAt.localeCompare(b.createdAt);
        case "date_desc":
          return b.createdAt.localeCompare(a.createdAt);
        case "title_az":
          return a.title.localeCompare(b.title, "pl");
        case "title_za":
          return b.title.localeCompare(a.title, "pl");
        default:
          return 0;
      }
    });

    return result;
  }, [lessons, searchQuery, selectedGroups, sortMode, statusFilter]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        <Box
          sx={{
            position: { xs: "relative", md: "absolute" },
            top: { md: 32 },
            right: { md: 24 },
            mb: { xs: 3, md: 0 },
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 3,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LightModeIcon
              fontSize="small"
              sx={{
                color:
                  theme.palette.mode === "light"
                    ? "primary.main"
                    : "text.disabled",
                mr: 0.5,
              }}
            />
            <Switch
              size="small"
              checked={theme.palette.mode === "dark"}
              onChange={toggleColorMode}
            />
            <DarkModeIcon
              fontSize="small"
              sx={{
                color:
                  theme.palette.mode === "dark"
                    ? "primary.main"
                    : "text.disabled",
                ml: 0.5,
              }}
            />
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "background.paper",
            }}
          >
            Wyloguj
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                ...panelSurfaceSx,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: 1,
              }}
            >
              <SchoolIcon sx={{ color: "primary.main" }} />
            </Box>
            <Box>
              {loadingUser ? (
                <Skeleton width={180} height={28} />
              ) : (
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  Witaj, {user?.username ?? "Nauczyciel"}!
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Panel nauczyciela
              </Typography>
            </Box>
          </Box>
        </Box>

        {errorUser && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            {errorUser}
          </Alert>
        )}

        {loadingData ? (
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={90}
                sx={{ flex: 1, borderRadius: 3 }}
              />
            ))}
          </Box>
        ) : errorData ? (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {errorData}
          </Alert>
        ) : (
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <StatsCard label="Liczba lekcji" value={stats?.totalLessons ?? 0} />
            <StatsCard
              label="Aktywne lekcje"
              value={stats?.activeLessons ?? 0}
              highlightColor={theme.palette.primary.main}
            />
            <StatsCard
              label="Aktywni uczniowie"
              value={stats?.activeStudents ?? 0}
            />
            <StatsCard
              label="Średnia wyników"
              value={`${stats?.avgScore ?? 0}%`}
            />
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          <ActionButton
            icon={<PersonAddIcon sx={{ fontSize: 32 }} />}
            title="Zarządzaj uczniami"
            subtitle="Dodaj, edytuj, archiwizuj"
          />
          <ActionButton
            icon={<GroupIcon sx={{ fontSize: 32 }} />}
            title="Zarządzaj grupami"
            subtitle="Twórz grupy i przydzielaj uczniów"
          />
          <ActionButton
            icon={<AddIcon sx={{ fontSize: 32 }} />}
            title="Utwórz lekcję"
            subtitle="Nowa lekcja z zadaniami"
            onClick={openCreateLessonDialog}
          />
        </Box>

        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="primary.main"
          sx={{ mb: 1.5 }}
        >
          Moje lekcje
        </Typography>

        <LessonToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          availableGroups={availableGroups}
          selectedGroups={selectedGroups}
          onSelectedGroupsChange={setSelectedGroups}
        />

        {loadingData ? (
          <Grid container spacing={2}>
            {[...Array(8)].map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Skeleton
                  variant="rounded"
                  height={220}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : displayedLessons.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {lessons.length === 0
              ? 'Nie masz jeszcze żadnych lekcji. Kliknij "Utwórz lekcję", aby dodać pierwszą.'
              : "Brak lekcji pasujących do wybranych filtrów."}
          </Alert>
        ) : viewMode === "list" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {displayedLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                listView
                onEdit={openEditLessonDialog}
                onDelete={openDeleteDialog}
                onToggleStatus={handleToggleLessonStatus}
              />
            ))}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {displayedLessons.map((lesson) => (
              <Grid key={lesson.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LessonCard
                  lesson={lesson}
                  onEdit={openEditLessonDialog}
                  onDelete={openDeleteDialog}
                  onToggleStatus={handleToggleLessonStatus}
                />
              </Grid>
            ))}
          </Grid>
        )}
        <AppDialog
          open={createDialogOpen}
          onClose={closeCreateLessonDialog}
          onExited={resetCreateDialogState}
          maxWidth="md"
          paperSx={{
            width: {
              xs: "calc(100% - 24px)",
              sm: uiTokens.modal.comfortableWidth,
              md: 720,
            },
          }}
        >
          <AppDialogHeader
            icon={<SparklesIcon />}
            title="Nowa lekcja"
            subtitle="Podaj tytuł i temat lekcji. Opcjonalnie przypisz ją do grup."
            badge={
              <Chip
                label="Nowa"
                size="small"
                color="primary"
                sx={{ fontWeight: 700 }}
              />
            }
          />
          <AppDialogBody>
            {createDialogFeedback && (
              <AppDialogStatus severity={createDialogFeedback.severity}>
                {createDialogFeedback.message}
              </AppDialogStatus>
            )}
            <Stack spacing={2.25}>
              <FormSection>
                <Stack spacing={2.25}>
                  <FormField>
                    <TextField
                      label="Tytuł lekcji"
                      value={lessonDraft.title}
                      onChange={(event) =>
                        setLessonDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      fullWidth
                    />
                  </FormField>
                  <FormField>
                    <TextField
                      label="Temat lekcji"
                      value={lessonDraft.theme}
                      onChange={(event) =>
                        setLessonDraft((current) => ({
                          ...current,
                          theme: event.target.value,
                        }))
                      }
                      multiline
                      minRows={3}
                      fullWidth
                    />
                  </FormField>
                </Stack>
              </FormSection>
              <FormSection
                title="Przypisanie do grup"
                description="Wybierz grupy, które mają mieć dostęp do tej lekcji."
              >
                <Autocomplete
                  multiple
                  size="small"
                  options={availableGroups}
                  value={lessonDraft.groupIds}
                  onChange={(_, value) =>
                    setLessonDraft((current) => ({
                      ...current,
                      groupIds: value,
                    }))
                  }
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disableCloseOnSelect
                  noOptionsText="Brak dostępnych grup"
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...rest } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.name}
                          size="small"
                          sx={{ fontSize: "0.7rem", height: 20 }}
                          {...rest}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={
                        lessonDraft.groupIds.length === 0
                          ? "Wybierz grupy..."
                          : undefined
                      }
                    />
                  )}
                />
              </FormSection>
              <FormSection
                title="Zadania (opcjonalnie)"
                description="Dodaj zadania, które mają zostać utworzone razem z lekcją."
              >
                <TaskEditor
                  tasks={lessonDraft.tasks}
                  onChange={(tasks) =>
                    setLessonDraft((current) => ({ ...current, tasks }))
                  }
                />
              </FormSection>
            </Stack>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeCreateLessonDialog}
                sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={submitCreateLessonDialog}
                disabled={createDialogLoading}
                sx={panelFooterButtonSx}
              >
                {createDialogLoading ? "Tworzenie..." : "Utwórz lekcję"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        {/* ── Edit Lesson Dialog ── */}
        <AppDialog
          open={editDialogOpen}
          onClose={closeEditLessonDialog}
          onExited={resetEditDialogState}
          maxWidth="md"
          paperSx={{
            width: {
              xs: "calc(100% - 24px)",
              sm: uiTokens.modal.comfortableWidth,
              md: 720,
            },
          }}
        >
          <AppDialogHeader
            icon={<EditLessonIcon />}
            title="Edytuj lekcję"
            subtitle="Zmień dane lekcji, przypisanie do grup lub zadania."
            badge={
              <Chip
                label="Edycja"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            }
          />
          <AppDialogBody>
            {editDialogFeedback && (
              <AppDialogStatus severity={editDialogFeedback.severity}>
                {editDialogFeedback.message}
              </AppDialogStatus>
            )}
            <Stack spacing={2.25}>
              <FormSection>
                <Stack spacing={2.25}>
                  <FormField>
                    <TextField
                      label="Tytuł lekcji"
                      value={editDraft.title}
                      onChange={(event) =>
                        setEditDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      fullWidth
                    />
                  </FormField>
                  <FormField>
                    <TextField
                      label="Temat lekcji"
                      value={editDraft.theme}
                      onChange={(event) =>
                        setEditDraft((current) => ({
                          ...current,
                          theme: event.target.value,
                        }))
                      }
                      multiline
                      minRows={3}
                      fullWidth
                    />
                  </FormField>
                </Stack>
              </FormSection>
              <FormSection
                title="Przypisanie do grup"
                description="Wybierz grupy, które mają mieć dostęp do tej lekcji."
              >
                <Autocomplete
                  multiple
                  size="small"
                  options={availableGroups}
                  value={editDraft.groupIds}
                  onChange={(_, value) =>
                    setEditDraft((current) => ({
                      ...current,
                      groupIds: value,
                    }))
                  }
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disableCloseOnSelect
                  noOptionsText="Brak dostępnych grup"
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...rest } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.name}
                          size="small"
                          sx={{ fontSize: "0.7rem", height: 20 }}
                          {...rest}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={
                        editDraft.groupIds.length === 0
                          ? "Wybierz grupy..."
                          : undefined
                      }
                    />
                  )}
                />
              </FormSection>
              <FormSection
                title="Zadania"
                description="Edytuj, dodaj lub usuń zadania przypisane do lekcji."
              >
                {editTasksLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      py: 4,
                    }}
                  >
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <TaskEditor
                    tasks={editDraft.tasks}
                    onChange={(tasks) =>
                      setEditDraft((current) => ({ ...current, tasks }))
                    }
                  />
                )}
              </FormSection>
            </Stack>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeEditLessonDialog}
                sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={submitEditLessonDialog}
                disabled={editDialogLoading || editTasksLoading}
                sx={panelFooterButtonSx}
              >
                {editDialogLoading ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        {/* ── Delete Lesson Confirmation Dialog ── */}
        <AppDialog
          open={deleteDialogOpen}
          onClose={closeDeleteDialog}
          onExited={resetDeleteDialogState}
          maxWidth="xs"
        >
          <AppDialogHeader
            icon={<DeleteIcon />}
            title="Usuń lekcję"
            subtitle={`Czy na pewno chcesz usunąć lekcję "${deletingLesson?.title ?? ""}"? Ta operacja jest nieodwracalna.`}
          />
          <AppDialogBody>
            {deleteDialogFeedback && (
              <AppDialogStatus severity={deleteDialogFeedback.severity}>
                {deleteDialogFeedback.message}
              </AppDialogStatus>
            )}
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeDeleteDialog}
                sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={submitDeleteLesson}
                disabled={deleteDialogLoading}
                sx={panelFooterButtonSx}
              >
                {deleteDialogLoading ? "Usuwanie..." : "Usuń lekcję"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>
      </Container>
    </Box>
  );
}
