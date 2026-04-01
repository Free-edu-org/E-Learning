import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
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
    if (task.correctAnswer.trim() === "") {
      return `${position}: podaj indeks poprawnej odpowiedzi (np. 0).`;
    }
    if (!Number.isInteger(Number(task.correctAnswer.trim()))) {
      return `${position}: indeks poprawnej odpowiedzi musi być liczbą całkowitą.`;
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
              <LessonCard key={lesson.id} lesson={lesson} listView />
            ))}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {displayedLessons.map((lesson) => (
              <Grid key={lesson.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LessonCard lesson={lesson} />
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
      </Container>
    </Box>
  );
}
