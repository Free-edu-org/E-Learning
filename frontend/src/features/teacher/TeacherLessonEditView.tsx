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
import {
  lessonService,
  type Lesson,
  type LessonAttachment,
} from "@/api/lessonService";
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
import {
  FormActions,
  FormField,
  FormSection,
} from "@/components/ui/form/FormLayout";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  panelDeleteButtonSx,
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
import { INPUT_LIMITS } from "@/utils/inputLimits";

function buildDraftFromLesson(
  lesson: Lesson,
  tasks: LessonTaskDraft[],
): LessonDraft {
  return {
    title: lesson.title,
    theme: lesson.theme,
    groups: lesson.groups,
    tasks,
  };
}

export function TeacherLessonEditView() {
  const { lessonPublicId } = useParams<{ lessonPublicId: string }>();
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
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    theme?: string;
  }>({});
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [savedDraftSignature, setSavedDraftSignature] = useState<string | null>(
    null,
  );
  const navigateAfterSaveRef = useRef(false);
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);
  const [attachmentFeedback, setAttachmentFeedback] = useState<string | null>(
    null,
  );
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
    if (!lessonPublicId) {
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
          (item) => item.publicId === lessonPublicId,
        );
        if (!matchedLesson) {
          setError("Nie znaleziono lekcji do edycji.");
          setLoading(false);
          setTasksLoading(false);
          return;
        }

        setLesson(matchedLesson);
        setAvailableGroups(groups);
        setAttachments(matchedLesson.attachments ?? []);
        setDraft(buildDraftFromLesson(matchedLesson, []));
        setOriginalTasks([]);
        setLoading(false);

        try {
          const tasksResponse =
            await taskService.getLessonTasks(lessonPublicId);
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
  }, [lessonPublicId]);

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

    const nextFieldErrors: { title?: string; theme?: string } = {};
    if (!draft.title.trim()) {
      nextFieldErrors.title = 'Uzupełnij pole "Tytuł lekcji".';
    }
    if (!draft.theme.trim()) {
      nextFieldErrors.theme = 'Uzupełnij pole "Temat lekcji".';
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
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
    setFieldErrors({});

    try {
      const groupPublicIds = draft.groups.map((group) => group.publicId);

      await lessonService.updateLesson(lesson.publicId, {
        title: draft.title,
        theme: draft.theme,
        groupPublicIds,
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
              taskService.deleteTask(
                lesson.publicId,
                task.type,
                parsed.taskPublicId,
              ),
            );
          }
        }

        for (const task of tasksToUpdate) {
          const parsed = parseBackendDraftId(task.id);
          if (parsed) {
            taskOperations.push(
              updateLessonTask(lesson.publicId, parsed.taskPublicId, task),
            );
          }
        }

        for (const task of tasksToCreate) {
          taskOperations.push(createLessonTask(lesson.publicId, task));
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
          ? taskService.getLessonTasks(lesson.publicId)
          : Promise.resolve(null),
      ]);

      const refreshedLesson = refreshedLessons.find(
        (item) => item.publicId === lesson.publicId,
      ) ?? {
        ...lesson,
        title: draft.title,
        theme: draft.theme,
        groups: draft.groups,
      };

      setLesson(refreshedLesson);
      setAttachments(refreshedLesson.attachments ?? []);

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

      if (navigateAfterSaveRef.current) {
        navigateAfterSaveRef.current = false;
        navigate("/teacher");
        return;
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
    if (attachments.length >= 5) {
      setAttachmentFeedback("Osiągnięto limit 5 załączników.");
      return;
    }
    setAttachmentUploading(true);
    setAttachmentFeedback(null);
    try {
      const result = await lessonService.uploadAttachment(
        lesson.publicId,
        attachmentFile,
      );
      setAttachments((prev) => [...prev, result]);
      setAttachmentFile(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
      setAttachmentFeedback("Plik został przesłany.");
    } catch {
      setAttachmentFeedback(
        "Nie udało się przesłać pliku. Sprawdź format (PDF, TXT, DOCX, DOC, ODT) i rozmiar (max 10 MB).",
      );
    } finally {
      setAttachmentUploading(false);
    }
  };

  const handleDeleteAttachment = async (att: LessonAttachment) => {
    if (!lesson || deletingAttachmentId !== null) return;
    setDeletingAttachmentId(att.publicId);
    setAttachmentFeedback(null);
    try {
      await lessonService.deleteAttachment(lesson.publicId, att.publicId);
      setAttachments((prev) => prev.filter((a) => a.publicId !== att.publicId));
      setAttachmentFeedback("Załącznik został usunięty.");
    } catch {
      setAttachmentFeedback("Nie udało się usunąć załącznika.");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handleDownloadAttachment = async (att: LessonAttachment) => {
    if (!lesson) return;
    try {
      const blob = await lessonService.downloadAttachment(
        lesson.publicId,
        att.publicId,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.originalFileName;
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
                      onChange={(event) => {
                        const value = event.target.value.slice(
                          0,
                          INPUT_LIMITS.lessonTitle,
                        );
                        setDraft((current) => ({
                          ...current,
                          title: value,
                        }));
                        setFieldErrors((current) => ({
                          ...current,
                          title: value.trim()
                            ? undefined
                            : 'Uzupełnij pole "Tytuł lekcji".',
                        }));
                      }}
                      inputProps={{ maxLength: INPUT_LIMITS.lessonTitle }}
                      error={Boolean(fieldErrors.title)}
                      helperText={
                        fieldErrors.title ??
                        `${draft.title.length}/${INPUT_LIMITS.lessonTitle}`
                      }
                      fullWidth
                    />
                  </FormField>
                  <FormField>
                    <TextField
                      label="Temat lekcji"
                      value={draft.theme}
                      onChange={(event) => {
                        const value = event.target.value.slice(
                          0,
                          INPUT_LIMITS.lessonTheme,
                        );
                        setDraft((current) => ({
                          ...current,
                          theme: value,
                        }));
                        setFieldErrors((current) => ({
                          ...current,
                          theme: value.trim()
                            ? undefined
                            : 'Uzupełnij pole "Temat lekcji".',
                        }));
                      }}
                      inputProps={{ maxLength: INPUT_LIMITS.lessonTheme }}
                      error={Boolean(fieldErrors.theme)}
                      helperText={
                        fieldErrors.theme ??
                        `${draft.theme.length}/${INPUT_LIMITS.lessonTheme}`
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
                  value={draft.groups}
                  onChange={(_, value) =>
                    setDraft((current) => ({
                      ...current,
                      groups: value,
                    }))
                  }
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.publicId === value.publicId
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
                        draft.groups.length === 0
                          ? "Wybierz grupy..."
                          : undefined
                      }
                    />
                  )}
                />
              </FormSection>

              <FormSection
                title="Załączniki"
                description={`Opcjonalne pliki z notatkami (PDF, TXT, DOCX, DOC, ODT, max 10 MB). Dostępne dla uczniów mających dostęp do tej lekcji. Limit: 5 plików.`}
              >
                <Stack spacing={1.5}>
                  {attachmentFeedback && (
                    <Alert
                      severity={
                        attachmentFeedback.startsWith("Nie") ||
                        attachmentFeedback.startsWith("Osiągnięto")
                          ? "error"
                          : "success"
                      }
                      onClose={() => setAttachmentFeedback(null)}
                    >
                      {attachmentFeedback}
                    </Alert>
                  )}

                  {attachments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Brak załączników.
                    </Typography>
                  ) : (
                    <Stack spacing={0.75}>
                      {attachments.map((att) => {
                        const isDeleting =
                          deletingAttachmentId === att.publicId;
                        return (
                          <Box
                            key={att.publicId}
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
                              sx={{
                                flex: 1,
                                minWidth: 0,
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
                              sx={{ flexShrink: 0 }}
                            >
                              {(att.fileSize / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                            <Tooltip title="Pobierz">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  void handleDownloadAttachment(att)
                                }
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Usuń">
                              <IconButton
                                size="small"
                                onClick={() => void handleDeleteAttachment(att)}
                                disabled={isDeleting}
                                color="error"
                              >
                                {isDeleting ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}

                  {attachments.length < 5 ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
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
                        Wybierz plik ({attachments.length}/5)
                      </Button>
                      {attachmentFile && (
                        <>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {attachmentFile.name}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={handleUploadAttachment}
                            disabled={attachmentUploading}
                          >
                            {attachmentUploading
                              ? "Przesyłanie..."
                              : "Prześlij"}
                          </Button>
                        </>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Osiągnięto limit 5 załączników.
                    </Typography>
                  )}
                </Stack>
              </FormSection>

              <FormSection
                title="Zadania"
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
                    lessonPublicId={lessonPublicId}
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
                        <Typography
                          variant="body2"
                          sx={{ minWidth: 0, overflowWrap: "anywhere" }}
                        >
                          {draft.title.trim() ? draft.title : "Bez tytułu"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <GroupsIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          Grup: {draft.groups.length}
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
            title="Wyjść bez zapisywania?"
            subtitle="Masz niezapisane zmiany w tej lekcji."
          />
          <AppDialogBody>
            <Typography variant="body2" color="text.secondary">
              Możesz zapisać zmiany i wyjść, albo wyjść bez zapisywania — wtedy
              zmiany w tytule, grupach i zadaniach zostaną utracone.
            </Typography>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={() => setLeaveDialogOpen(false)}
                disabled={saving}
                sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
              >
                Zostań
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => navigate("/teacher")}
                disabled={saving}
                sx={panelDeleteButtonSx}
              >
                Wyjdź bez zapisu
              </Button>
              <Button
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={() => {
                  navigateAfterSaveRef.current = true;
                  void handleSave();
                }}
                disabled={saving || tasksLoading}
                sx={panelFooterButtonSx}
              >
                {saving ? "Zapisywanie..." : "Zapisz i wyjdź"}
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>
      </Container>
    </Box>
  );
}
