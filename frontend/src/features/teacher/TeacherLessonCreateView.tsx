import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBackOutlined as BackIcon,
  AttachFileOutlined as AttachIcon,
  CheckCircleOutlineOutlined as ReadyIcon,
  GroupsOutlined as GroupsIcon,
  SaveOutlined as SaveIcon,
  MicOutlined as SpeakIcon,
  RadioButtonCheckedOutlined as ChooseIcon,
  ReorderOutlined as ScatterIcon,
  TaskAltOutlined as TasksIcon,
  EditNoteOutlined as WriteIcon,
} from "@mui/icons-material";
import { lessonService } from "@/api/lessonService";
import { userService, type UserProfile } from "@/api/userService";
import { TaskEditor } from "@/components/teacher/TaskEditor";
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
  LESSON_TITLE_MAX_LENGTH,
  type DialogFeedbackState,
  type LessonDraft,
} from "./lessonEditor";

export function TeacherLessonCreateView() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [availableGroups, setAvailableGroups] = useState<
    Awaited<ReturnType<typeof lessonService.getTeacherGroups>>
  >([]);
  const [draft, setDraft] = useState<LessonDraft>(emptyLessonDraft);
  const [feedback, setFeedback] = useState<DialogFeedbackState | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [savedDraftSignature, setSavedDraftSignature] = useState(() =>
    JSON.stringify(emptyLessonDraft),
  );
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
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
    lessonService
      .getTeacherGroups()
      .then(setAvailableGroups)
      .catch((loadError) =>
        setError(
          getLessonEditorErrorMessage(
            loadError,
            "Nie udało się wczytać grup nauczyciela.",
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleBack = () => {
    if (draftSignature === savedDraftSignature) {
      navigate("/teacher");
      return;
    }

    setLeaveDialogOpen(true);
  };

  const handleCreate = async () => {
    if (saving) {
      return;
    }

    const taskValidationError = draft.tasks
      .map((task, index) => getTaskValidationError(task, index))
      .find((message): message is string => Boolean(message));

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
      const createdLesson = await lessonService.createLesson({
        title: draft.title,
        theme: draft.theme,
        groupIds: groupIds.length > 0 ? groupIds : undefined,
      });

      const taskOperations = draft.tasks.map((task) =>
        createLessonTask(createdLesson.id, task),
      );

      let nextFeedback: DialogFeedbackState;
      let attachmentFailed = false;

      if (taskOperations.length > 0) {
        const results = await Promise.allSettled(taskOperations);
        const failedCount = results.filter(
          (result) => result.status === "rejected",
        ).length;

        nextFeedback =
          failedCount > 0
            ? {
                severity: "warning",
                message:
                  failedCount === taskOperations.length
                    ? "Lekcja została utworzona, ale nie udało się dodać żadnego zadania."
                    : `Lekcja została utworzona. Nie udało się dodać ${failedCount} z ${taskOperations.length} zadań.`,
              }
            : {
                severity: "success",
                message: `Lekcja i ${taskOperations.length} zadań zostały utworzone.`,
              };
      } else {
        nextFeedback = {
          severity: "success",
          message: "Lekcja została utworzona.",
        };
      }

      if (attachmentFile) {
        try {
          await lessonService.uploadAttachment(
            createdLesson.id,
            attachmentFile,
          );
        } catch {
          attachmentFailed = true;
        }
      }

      if (attachmentFailed) {
        nextFeedback = {
          severity: "warning",
          message:
            (nextFeedback.severity === "success"
              ? nextFeedback.message
              : nextFeedback.message + " ") +
            " Nie udało się przesłać załącznika — możesz dodać go w widoku edycji.",
        };
      }

      setFeedback(nextFeedback);
      setSavedDraftSignature(draftSignature);
      window.setTimeout(
        () => navigate(`/teacher/lessons/${createdLesson.id}/edit`),
        700,
      );
    } catch (createError) {
      setFeedback({
        severity: "error",
        message: getLessonEditorErrorMessage(
          createError,
          "Nie udało się utworzyć lekcji.",
        ),
      });
    } finally {
      setSaving(false);
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
                Utwórz lekcję
              </Typography>
              <Chip label="Nowa" size="small" color="primary" />
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75, maxWidth: { md: 680 } }}
            >
              Podaj tytuł, temat i opcjonalnie dodaj zadania od razu.
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!error && (
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
                          title: event.target.value.slice(
                            0,
                            LESSON_TITLE_MAX_LENGTH,
                          ),
                        }))
                      }
                      inputProps={{ maxLength: LESSON_TITLE_MAX_LENGTH }}
                      helperText={`${draft.title.length}/${LESSON_TITLE_MAX_LENGTH}`}
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
                title="Załącznik (opcjonalnie)"
                description="Plik z notatkami do lekcji (PDF, TXT, DOCX, DOC, ODT, max 10 MB)."
              >
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
                    onChange={(e) =>
                      setAttachmentFile(e.target.files?.[0] ?? null)
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AttachIcon />}
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    Wybierz plik
                  </Button>
                  {attachmentFile ? (
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
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Brak wybranego pliku
                    </Typography>
                  )}
                  {attachmentFile && (
                    <Button
                      size="small"
                      onClick={() => {
                        setAttachmentFile(null);
                        if (attachmentInputRef.current)
                          attachmentInputRef.current.value = "";
                      }}
                    >
                      Usuń
                    </Button>
                  )}
                </Box>
              </FormSection>

              <FormSection
                title="Zadania (opcjonalnie)"
                description="Dodaj zadania, które mają zostać utworzone razem z lekcją."
              >
                <TaskEditor
                  tasks={draft.tasks}
                  onChange={(tasks) =>
                    setDraft((current) => ({
                      ...current,
                      tasks,
                    }))
                  }
                />
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
                      onClick={handleCreate}
                      disabled={saving || loading || Boolean(error)}
                      fullWidth
                      sx={panelFooterButtonSx}
                    >
                      {saving ? "Tworzenie..." : "Utwórz lekcję"}
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
            title="Opuścić tworzenie lekcji?"
            subtitle="Niezapisane zmiany zostaną usunięte."
          />
          <AppDialogBody>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Jeśli wrócisz teraz, wpisany tytuł, temat i dodane zadania nie
                zostaną zapisane.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Możesz też utworzyć lekcję teraz, a potem dokończyć ją lub
                poprawić w widoku edycji.
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
