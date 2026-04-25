import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBackOutlined as BackIcon,
  AttachFileOutlined as AttachIcon,
  CheckCircleOutlineOutlined as ReadyIcon,
  DeleteOutlineOutlined as DeleteIcon,
  DownloadOutlined as DownloadIcon,
  GroupsOutlined as GroupsIcon,
  MicOutlined as SpeakIcon,
  RadioButtonCheckedOutlined as ChooseIcon,
  ReorderOutlined as ScatterIcon,
  SaveOutlined as SaveIcon,
  TaskAltOutlined as TasksIcon,
  EditNoteOutlined as WriteIcon,
} from "@mui/icons-material";
import { lessonService, type Lesson, type LessonAttachment } from "@/api/lessonService";
import { taskService } from "@/api/taskService";
import { userService, type UserProfile } from "@/api/userService";
import { TaskEditor } from "@/components/teacher/TaskEditor";
import type { LessonTaskDraft } from "@/components/teacher/TaskCard";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/ui/dialog/AppDialog";
import { FormField, FormSection } from "@/components/ui/form/FormLayout";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  panelFooterButtonSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";
import { useAuth } from "@/context/AuthContext";
import {
  createLessonTask,
  emptyLessonDraft,
  getLessonEditorErrorMessage,
  getTaskValidationError,
  parseBackendDraftId,
  tasksResponseToDrafts,
  updateLessonTask,
  type DialogFeedbackState,
  type LessonDraft,
} from "./lessonEditor";

function buildDraftFromLesson(
  lesson: Lesson,
  tasks: LessonTaskDraft[],
): LessonDraft {
  return {
    title: lesson.title,
    theme: lesson.theme,
    groupIds: lesson.groups,
    tasks,
  };
}

export function TeacherLessonEditView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Lesson["groups"]>([]);
  const [draft, setDraft] = useState<LessonDraft>(emptyLessonDraft);
  const [originalTasks, setOriginalTasks] = useState<LessonTaskDraft[]>([]);
  const [feedback, setFeedback] = useState<DialogFeedbackState | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksAvailable, setTasksAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [savedDraftSignature, setSavedDraftSignature] = useState<string | null>(
    null,
  );
  const [attachment, setAttachment] = useState<LessonAttachment | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentDeleting, setAttachmentDeleting] = useState(false);
  const [attachmentFeedback, setAttachmentFeedback] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const chooseTasksCount = draft.tasks.filter(
    (task) => task.type === "choose",
  ).length;
  const writeTasksCount = draft.tasks.filter(
    (task) => task.type === "write",
  ).length;
  const scatterTasksCount = draft.tasks.filter(
    (task) => task.type === "scatter",
  ).length;
  const speakTasksCount = draft.tasks.filter(
    (task) => task.type === "speak",
  ).length;
  const draftSignature = useMemo(() => JSON.stringify(draft), [draft]);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch(() => undefined)
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    const numericLessonId = Number(lessonId);
    if (Number.isNaN(numericLessonId)) {
      setError("Nieprawidłowy identyfikator lekcji.");
      setLoading(false);
      setTasksLoading(false);
      return;
    }

    let cancelled = false;

    const loadLesson = async () => {
      setLoading(true);
      setTasksLoading(true);
      setError(null);
      setFeedback(null);

      try {
        const [lessons, groups] = await Promise.all([
          lessonService.getTeacherLessons(),
          lessonService.getTeacherGroups(),
        ]);

        if (cancelled) {
          return;
        }

        const matchedLesson = lessons.find(
          (item) => item.id === numericLessonId,
        );
        if (!matchedLesson) {
          setError("Nie znaleziono lekcji do edycji.");
          setLoading(false);
          setTasksLoading(false);
          return;
        }

        setLesson(matchedLesson);
        setAvailableGroups(groups);
        setAttachment(matchedLesson.attachment ?? null);
        setDraft(buildDraftFromLesson(matchedLesson, []));
        setOriginalTasks([]);
        setLoading(false);

        try {
          const tasksResponse =
            await taskService.getLessonTasks(numericLessonId);
          if (cancelled) {
            return;
          }

          const drafts = tasksResponseToDrafts(tasksResponse);
          const nextDraft = buildDraftFromLesson(matchedLesson, drafts);
          setDraft(nextDraft);
          setOriginalTasks(drafts);
          setSavedDraftSignature(JSON.stringify(nextDraft));
          setTasksAvailable(true);
        } catch (taskError) {
          if (cancelled) {
            return;
          }

          setTasksAvailable(false);
          setSavedDraftSignature(
            JSON.stringify(buildDraftFromLesson(matchedLesson, [])),
          );
          setFeedback({
            severity: "warning",
            message: getLessonEditorErrorMessage(
              taskError,
              "Nie udało się załadować zadań. Możesz edytować dane lekcji, ale lista zadań jest tymczasowo niedostępna.",
            ),
          });
        } finally {
          if (!cancelled) {
            setTasksLoading(false);
          }
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          getLessonEditorErrorMessage(
            loadError,
            "Nie udało się wczytać danych lekcji.",
          ),
        );
        setLoading(false);
        setTasksLoading(false);
      }
    };

    void loadLesson();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const handleBack = () => {
    if (
      savedDraftSignature !== null &&
      draftSignature === savedDraftSignature
    ) {
      navigate("/teacher");
      return;
    }

    setLeaveDialogOpen(true);
  };

  const handleSave = async () => {
    if (!lesson || saving) {
      return;
    }

    const taskValidationError = tasksAvailable
      ? draft.tasks
          .map((task, index) => getTaskValidationError(task, index))
          .find((message): message is string => Boolean(message))
      : null;

    if (taskValidationError) {
      setFeedback({
        severity: "error",
        message: taskValidationError,
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const groupIds = draft.groupIds.map((group) => group.id);

      await lessonService.updateLesson(lesson.id, {
        title: draft.title,
        theme: draft.theme,
        groupIds,
      });

      let nextFeedback: DialogFeedbackState = {
        severity: "success",
        message: "Lekcja została zaktualizowana.",
      };

      if (tasksAvailable) {
        const originalIds = new Set(originalTasks.map((task) => task.id));
        const currentIds = new Set(draft.tasks.map((task) => task.id));

        const tasksToDelete = originalTasks.filter(
          (task) => !currentIds.has(task.id),
        );
        const tasksToCreate = draft.tasks.filter(
          (task) => !parseBackendDraftId(task.id),
        );
        const tasksToUpdate = draft.tasks.filter(
          (task) => parseBackendDraftId(task.id) && originalIds.has(task.id),
        );

        const taskOperations: Promise<unknown>[] = [];

        for (const task of tasksToDelete) {
          const parsed = parseBackendDraftId(task.id);
          if (parsed) {
            taskOperations.push(
              taskService.deleteTask(lesson.id, task.type, parsed.backendId),
            );
          }
        }

        for (const task of tasksToUpdate) {
          const parsed = parseBackendDraftId(task.id);
          if (parsed) {
            taskOperations.push(
              updateLessonTask(lesson.id, parsed.backendId, task),
            );
          }
        }

        for (const task of tasksToCreate) {
          taskOperations.push(createLessonTask(lesson.id, task));
        }

        if (taskOperations.length > 0) {
          const results = await Promise.allSettled(taskOperations);
          const failedCount = results.filter(
            (result) => result.status === "rejected",
          ).length;

          nextFeedback =
            failedCount > 0
              ? {
                  severity: "warning",
                  message: `Lekcja zaktualizowana. Nie udało się przetworzyć ${failedCount} z ${taskOperations.length} operacji na zadaniach.`,
                }
              : {
                  severity: "success",
                  message: "Lekcja i zadania zostały zaktualizowane.",
                };
        }
      }

      const [refreshedLessons, refreshedTasksResponse] = await Promise.all([
        lessonService.getTeacherLessons(),
        tasksAvailable
          ? taskService.getLessonTasks(lesson.id)
          : Promise.resolve(null),
      ]);

      const refreshedLesson = refreshedLessons.find(
        (item) => item.id === lesson.id,
      ) ?? {
        ...lesson,
        title: draft.title,
        theme: draft.theme,
        groups: draft.groupIds,
      };

      setLesson(refreshedLesson);
      setAttachment(refreshedLesson.attachment ?? null);

      if (refreshedTasksResponse) {
        const refreshedTasks = tasksResponseToDrafts(refreshedTasksResponse);
        const nextDraft = buildDraftFromLesson(refreshedLesson, refreshedTasks);
        setDraft(nextDraft);
        setOriginalTasks(refreshedTasks);
        setSavedDraftSignature(JSON.stringify(nextDraft));
      } else {
        const nextDraft = buildDraftFromLesson(refreshedLesson, draft.tasks);
        setDraft(nextDraft);
        setSavedDraftSignature(JSON.stringify(nextDraft));
      }

      setFeedback(nextFeedback);
    } catch (saveError) {
      setFeedback({
        severity: "error",
        message: getLessonEditorErrorMessage(
          saveError,
          "Nie udało się zaktualizować lekcji.",
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAttachment = async () => {
    if (!lesson || !attachmentFile || attachmentUploading) return;
    setAttachmentUploading(true);
    setAttachmentFeedback(null);
    try {
      const result = await lessonService.uploadAttachment(lesson.id, attachmentFile);
      setAttachment(result);
      setAttachmentFile(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
      setAttachmentFeedback("Plik został przesłany.");
    } catch {
      setAttachmentFeedback("Nie udało się przesłać pliku. Sprawdź format (PDF, TXT, DOCX, DOC, ODT) i rozmiar (max 10 MB).");
    } finally {
      setAttachmentUploading(false);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!lesson || !attachment || attachmentDeleting) return;
    setAttachmentDeleting(true);
    setAttachmentFeedback(null);
    try {
      await lessonService.deleteAttachment(lesson.id, attachment.id);
      setAttachment(null);
      setAttachmentFeedback("Załącznik został usunięty.");
    } catch {
      setAttachmentFeedback("Nie udało się usunąć załącznika.");
    } finally {
      setAttachmentDeleting(false);
    }
  };

  const handleDownloadAttachment = async () => {
    if (!lesson || !attachment) return;
    try {
      const blob = await lessonService.downloadAttachment(lesson.id, attachment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.originalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setAttachmentFeedback("Nie udało się pobrać pliku.");
    }
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

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: { xs: 1.5, sm: 2 },
            flexWrap: "wrap",
            mb: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ minWidth: 0, width: "100%" }}>
            <Button
              startIcon={<BackIcon />}
              onClick={handleBack}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                mb: 1,
                alignSelf: "flex-start",
              }}
            >
              Powrót do panelu nauczyciela
            </Button>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{
                  fontSize: { xs: "1.6rem", sm: "2rem" },
                  lineHeight: 1.15,
                }}
              >
                Edytuj lekcję
              </Typography>
              {lesson && (
                <Chip
                  label={lesson.isActive ? "Aktywna" : "Nieaktywna"}
                  size="small"
                  color={lesson.isActive ? "success" : "default"}
                  variant={lesson.isActive ? "filled" : "outlined"}
                />
              )}
            </Stack>
            {lesson && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.75, maxWidth: { md: 680 } }}
              >
                {lesson.title}
              </Typography>
            )}
          </Box>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 300px" },
              gap: { xs: 2, md: 3 },
              alignItems: "start",
            }}
          >
            <Stack spacing={{ xs: 2, md: 2.25 }} sx={{ minWidth: 0 }}>
              {feedback && (
                <Alert severity={feedback.severity}>{feedback.message}</Alert>
              )}

              <FormSection>
                <Stack spacing={{ xs: 1.75, md: 2.25 }}>
                  <FormField>
                    <TextField
                      label="Tytuł lekcji"
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((current) => ({
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
                      value={draft.theme}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          theme: event.target.value,
                        }))
                      }
                      multiline
                      minRows={4}
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
                  value={draft.groupIds}
                  onChange={(_, value) =>
                    setDraft((current) => ({
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
                        draft.groupIds.length === 0
                          ? "Wybierz grupy..."
                          : undefined
                      }
                    />
                  )}
                />
              </FormSection>

              <FormSection
                title="Załącznik"
                description="Opcjonalny plik z notatkami nauczyciela (PDF, TXT, DOCX, DOC, ODT, max 10 MB). Dostępny dla uczniów mających dostęp do tej lekcji."
              >
                <Stack spacing={1.5}>
                  {attachmentFeedback && (
                    <Alert
                      severity={attachmentFeedback.includes("udało") && !attachmentFeedback.startsWith("Nie") ? "success" : attachmentFeedback.startsWith("Nie") ? "error" : "success"}
                      onClose={() => setAttachmentFeedback(null)}
                    >
                      {attachmentFeedback}
                    </Alert>
                  )}

                  {attachment ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <AttachIcon fontSize="small" color="action" />
                      <Typography
                        variant="body2"
                        sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {attachment.originalFileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      <Tooltip title="Pobierz">
                        <IconButton size="small" onClick={handleDownloadAttachment}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Usuń">
                        <IconButton size="small" onClick={handleDeleteAttachment} disabled={attachmentDeleting} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Brak załącznika.
                    </Typography>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept="application/pdf,text/plain,.txt,.docx,.doc,.odt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.oasis.opendocument.text"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setAttachmentFile(file);
                        setAttachmentFeedback(null);
                      }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AttachIcon />}
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      Wybierz plik
                    </Button>
                    {attachmentFile && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {attachmentFile.name}
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleUploadAttachment}
                          disabled={attachmentUploading}
                        >
                          {attachmentUploading ? "Przesyłanie..." : "Prześlij"}
                        </Button>
                      </>
                    )}
                  </Box>
                </Stack>
              </FormSection>

              <FormSection
                description="Edytuj, dodaj lub usuń zadania przypisane do lekcji."
              >
                {tasksLoading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 4 }}
                  >
                    <CircularProgress size={32} />
                  </Box>
                ) : tasksAvailable ? (
                  <TaskEditor
                    tasks={draft.tasks}
                    onChange={(tasks) =>
                      setDraft((current) => ({
                        ...current,
                        tasks,
                      }))
                    }
                    defaultExpanded={false}
                  />
                ) : (
                  <Alert severity="warning">
                    Zadania nie zostały załadowane. Spróbuj odświeżyć widok
                    później.
                  </Alert>
                )}
              </FormSection>
            </Stack>

            <Stack
              spacing={2}
              sx={{
                position: { lg: "sticky" },
                top: { lg: 24 },
                order: { xs: -1, lg: 0 },
              }}
            >
              <Card elevation={0} sx={panelSurfaceSx}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack spacing={{ xs: 1.5, sm: 2 }}>
                    <Typography variant="subtitle1" fontWeight={800}>
                      Podsumowanie
                    </Typography>
                    <Stack spacing={1.25}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <ReadyIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          {draft.title.trim() ? draft.title : "Bez tytułu"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <GroupsIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          Grup: {draft.groupIds.length}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <TasksIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          Zadań: {draft.tasks.length}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Typy zadań
                      </Typography>
                      <Box sx={{ display: "grid", gap: 0.75 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minWidth: 0,
                            }}
                          >
                            <ChooseIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ minWidth: 0 }}>
                              Jednokrotny wybór
                            </Typography>
                          </Box>
                          <Chip label={chooseTasksCount} size="small" />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minWidth: 0,
                            }}
                          >
                            <WriteIcon fontSize="small" color="action" />
                            <Typography variant="body2">Pisanie</Typography>
                          </Box>
                          <Chip label={writeTasksCount} size="small" />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minWidth: 0,
                            }}
                          >
                            <ScatterIcon fontSize="small" color="action" />
                            <Typography variant="body2">Rozsypanka</Typography>
                          </Box>
                          <Chip label={scatterTasksCount} size="small" />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minWidth: 0,
                            }}
                          >
                            <SpeakIcon fontSize="small" color="action" />
                            <Typography variant="body2">Mówienie</Typography>
                          </Box>
                          <Chip label={speakTasksCount} size="small" />
                        </Box>
                      </Box>
                    </Stack>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={saving || tasksLoading}
                      fullWidth
                      sx={panelFooterButtonSx}
                    >
                      {saving ? "Zapisywanie..." : "Zapisz zmiany"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}

        <AppDialog
          open={leaveDialogOpen}
          onClose={() => {
            if (saving) {
              return;
            }
            setLeaveDialogOpen(false);
          }}
          maxWidth="sm"
        >
          <AppDialogHeader
            icon={<BackIcon />}
            title="Opuścić edycję lekcji?"
            subtitle="Niezapisane zmiany zostaną usunięte."
          />
          <AppDialogBody>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Jeśli wrócisz teraz, ostatnie zmiany w tytule, grupach i
                zadaniach nie zostaną zapisane.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Możesz też zapisać lekcję teraz i wrócić do dalszych poprawek
                później.
              </Typography>
            </Stack>
          </AppDialogBody>
          <AppDialogFooter>
            <Button
              onClick={() => setLeaveDialogOpen(false)}
              disabled={saving}
              sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
            >
              Zostań
            </Button>
            <Button
              color="warning"
              variant="contained"
              onClick={() => navigate("/teacher")}
              disabled={saving}
              sx={panelFooterButtonSx}
            >
              Opuść bez zapisu
            </Button>
          </AppDialogFooter>
        </AppDialog>
      </Container>
    </Box>
  );
}
