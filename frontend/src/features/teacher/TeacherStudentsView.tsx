import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AddCircleOutlined as AddIcon,
  ArrowBackOutlined as BackIcon,
  DragIndicatorOutlined as DragIcon,
  EditOutlined as EditIcon,
  EmailOutlined as EmailIcon,
  GroupOutlined as GroupIcon,
  PersonAddOutlined as PersonAddIcon,
  PersonOutlined as PersonIcon,
  RefreshOutlined as RefreshIcon,
  SaveOutlined as SaveIcon,
  SchoolOutlined as SchoolIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import {
  lessonService,
  type Group,
  type TeacherStudentResponse,
} from "@/api/lessonService";
import { userGroupService } from "@/api/userGroupService";
import { userService, type UserProfile } from "@/api/userService";
import { useAuth } from "@/context/AuthContext";
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
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { uiTokens } from "@/theme/uiTokens";

type DialogFeedbackState = {
  severity: "success" | "error" | "warning" | "info";
  message: string;
};

const validationMessageTranslations: Record<string, string> = {
  "Username is required": "Nazwa użytkownika jest wymagana.",
  "Email is required": "E-mail jest wymagany.",
  "Invalid email format": "Podaj poprawny adres e-mail.",
  "Group ID is required": "Grupa jest wymagana.",
  "Password is required": "Hasło jest wymagane.",
  "Name is required": "Nazwa grupy jest wymagana.",
  "must not be blank": "Pole jest wymagane.",
};

const operationErrorMessages: Record<string, string> = {
  EMAIL_ALREADY_TAKEN: "Ten adres e-mail jest już zajęty.",
  USERNAME_ALREADY_TAKEN: "Ta nazwa użytkownika jest już zajęta.",
  USER_GROUP_NOT_FOUND: "Wybrana grupa nie istnieje.",
  INVALID_ROLE_FOR_GROUP: "Wskazana grupa nie należy do Twojego konta.",
  GROUP_NAME_ALREADY_EXISTS: "Grupa o tej nazwie już istnieje.",
  STUDENT_ALREADY_IN_GROUP: "Uczeń jest już przypisany do grupy.",
};

function translateBackendMessage(message: string) {
  let translated = message;
  for (const [source, target] of Object.entries(validationMessageTranslations)) {
    translated = translated.replaceAll(source, target);
  }

  if (translated.startsWith("Validation failed:")) {
    const rawDetails = translated.replace("Validation failed:", "").trim();
    const fieldLabels: Record<string, string> = {
      username: "Nazwa użytkownika",
      email: "E-mail",
      password: "Hasło",
      groupId: "Grupa",
      name: "Nazwa",
      description: "Opis",
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

const getOperationErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    const code = error.problem.code ?? error.problem.title;
    if (code && operationErrorMessages[code]) {
      return operationErrorMessages[code];
    }
    return error.problem.detail
      ? translateBackendMessage(error.problem.detail)
      : fallback;
  }
  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak połączenia z serwerem.";
  }
  return fallback;
};

const emptyStudentDraft = {
  username: "",
  email: "",
  password: "",
  groupId: "" as number | "",
};

const emptyGroupDraft = {
  name: "",
  description: "",
};

export function TeacherStudentsView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  const [students, setStudents] = useState<TeacherStudentResponse[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [pageFeedback, setPageFeedback] = useState<DialogFeedbackState | null>(
    null,
  );

  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [createStudentDraft, setCreateStudentDraft] =
    useState(emptyStudentDraft);
  const [createStudentLoading, setCreateStudentLoading] = useState(false);
  const [createStudentFeedback, setCreateStudentFeedback] =
    useState<DialogFeedbackState | null>(null);

  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<TeacherStudentResponse | null>(null);
  const [editStudentDraft, setEditStudentDraft] = useState({
    username: "",
    email: "",
    groupId: "" as number | "",
  });
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [editStudentFeedback, setEditStudentFeedback] =
    useState<DialogFeedbackState | null>(null);

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createGroupDraft, setCreateGroupDraft] = useState(emptyGroupDraft);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [createGroupFeedback, setCreateGroupFeedback] =
    useState<DialogFeedbackState | null>(null);

  const [draggingStudentId, setDraggingStudentId] = useState<number | null>(
    null,
  );
  const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);
  const [movingStudentId, setMovingStudentId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setErrorData(null);
    try {
      const [studentsData, groupsData] = await Promise.all([
        lessonService.getTeacherStudents(),
        lessonService.getTeacherGroups(),
      ]);
      setStudents(studentsData);
      setAvailableGroups(groupsData);
    } catch (error) {
      setErrorData(
        getOperationErrorMessage(
          error,
          "Nie udało się pobrać uczniów i grup.",
        ),
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch((error: unknown) => {
        setErrorUser(
          getOperationErrorMessage(
            error,
            "Nie udało się pobrać profilu nauczyciela.",
          ),
        );
      })
      .finally(() => setLoadingUser(false));

    fetchData();
  }, [fetchData]);

  const groupsWithStudents = useMemo(
    () =>
      availableGroups.map((group) => ({
        ...group,
        students: students.filter((student) => student.groupId === group.id),
      })),
    [availableGroups, students],
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openCreateStudentDialog = () => {
    setCreateStudentDraft(emptyStudentDraft);
    setCreateStudentFeedback(null);
    setCreateStudentOpen(true);
  };

  const closeCreateStudentDialog = () => {
    if (createStudentLoading) return;
    setCreateStudentOpen(false);
  };

  const submitCreateStudent = async () => {
    if (createStudentLoading) return;
    if (
      !createStudentDraft.username.trim() ||
      !createStudentDraft.email.trim() ||
      !createStudentDraft.password.trim()
    ) {
      setCreateStudentFeedback({
        severity: "error",
        message: "Wypełnij wszystkie pola formularza.",
      });
      return;
    }
    if (createStudentDraft.groupId === "") {
      setCreateStudentFeedback({
        severity: "error",
        message: "Wybierz grupę, do której przypisać ucznia.",
      });
      return;
    }

    setCreateStudentFeedback(null);
    setCreateStudentLoading(true);
    try {
      await lessonService.createTeacherStudent({
        username: createStudentDraft.username.trim(),
        email: createStudentDraft.email.trim(),
        password: createStudentDraft.password.trim(),
        groupId: createStudentDraft.groupId,
      });
      setCreateStudentFeedback({
        severity: "success",
        message: "Uczeń został dodany.",
      });
      await fetchData();
      window.setTimeout(() => closeCreateStudentDialog(), 700);
    } catch (error) {
      setCreateStudentFeedback({
        severity: "error",
        message: getOperationErrorMessage(error, "Nie udało się dodać ucznia."),
      });
    } finally {
      setCreateStudentLoading(false);
    }
  };

  const openEditStudentDialog = (student: TeacherStudentResponse) => {
    setEditingStudent(student);
    setEditStudentDraft({
      username: student.username,
      email: student.email,
      groupId: student.groupId,
    });
    setEditStudentFeedback(null);
    setEditStudentOpen(true);
  };

  const closeEditStudentDialog = () => {
    if (editStudentLoading) return;
    setEditStudentOpen(false);
    setEditingStudent(null);
  };

  const submitEditStudent = async () => {
    if (editStudentLoading || !editingStudent) return;
    if (!editStudentDraft.username.trim() || !editStudentDraft.email.trim()) {
      setEditStudentFeedback({
        severity: "error",
        message: "Wypełnij nazwę użytkownika i e-mail.",
      });
      return;
    }
    if (editStudentDraft.groupId === "") {
      setEditStudentFeedback({
        severity: "error",
        message: "Wybierz docelową grupę.",
      });
      return;
    }

    setEditStudentFeedback(null);
    setEditStudentLoading(true);
    try {
      await lessonService.updateTeacherStudent(editingStudent.id, {
        username: editStudentDraft.username.trim(),
        email: editStudentDraft.email.trim(),
        groupId: editStudentDraft.groupId,
      });
      setEditStudentFeedback({
        severity: "success",
        message: "Dane ucznia zostały zapisane.",
      });
      await fetchData();
      window.setTimeout(() => closeEditStudentDialog(), 700);
    } catch (error) {
      setEditStudentFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się zapisać zmian ucznia.",
        ),
      });
    } finally {
      setEditStudentLoading(false);
    }
  };

  const openCreateGroupDialog = () => {
    setCreateGroupDraft(emptyGroupDraft);
    setCreateGroupFeedback(null);
    setCreateGroupOpen(true);
  };

  const closeCreateGroupDialog = () => {
    if (createGroupLoading) return;
    setCreateGroupOpen(false);
  };

  const submitCreateGroup = async () => {
    if (createGroupLoading) return;
    if (!createGroupDraft.name.trim()) {
      setCreateGroupFeedback({
        severity: "error",
        message: "Podaj nazwę grupy.",
      });
      return;
    }

    setCreateGroupFeedback(null);
    setCreateGroupLoading(true);
    try {
      await userGroupService.createGroup({
        name: createGroupDraft.name.trim(),
        description: createGroupDraft.description.trim(),
      });
      setCreateGroupFeedback({
        severity: "success",
        message: "Grupa została utworzona.",
      });
      await fetchData();
      window.setTimeout(() => closeCreateGroupDialog(), 700);
    } catch (error) {
      setCreateGroupFeedback({
        severity: "error",
        message: getOperationErrorMessage(error, "Nie udało się dodać grupy."),
      });
    } finally {
      setCreateGroupLoading(false);
    }
  };

  const moveStudentToGroup = async (
    student: TeacherStudentResponse,
    targetGroupId: number,
  ) => {
    if (student.groupId === targetGroupId || movingStudentId !== null) return;

    const previousGroupId = student.groupId;
    setMovingStudentId(student.id);
    setPageFeedback({
      severity: "info",
      message: "Przenoszenie ucznia do nowej grupy...",
    });
    setStudents((current) =>
      current.map((item) =>
        item.id === student.id ? { ...item, groupId: targetGroupId } : item,
      ),
    );

    try {
      await lessonService.updateTeacherStudent(student.id, {
        username: student.username,
        email: student.email,
        groupId: targetGroupId,
      });
      const targetGroup = availableGroups.find(
        (group) => group.id === targetGroupId,
      );
      setPageFeedback({
        severity: "success",
        message: `Uczeń został przeniesiony do grupy ${targetGroup?.name ?? ""}.`,
      });
      await fetchData();
    } catch (error) {
      setStudents((current) =>
        current.map((item) =>
          item.id === student.id ? { ...item, groupId: previousGroupId } : item,
        ),
      );
      setPageFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się przenieść ucznia.",
        ),
      });
    } finally {
      setMovingStudentId(null);
      setDraggingStudentId(null);
      setDragOverGroupId(null);
    }
  };

  const handleDrop = (event: DragEvent, targetGroupId: number) => {
    event.preventDefault();
    const rawStudentId = event.dataTransfer.getData("text/plain");
    const studentId = Number(rawStudentId);
    const student = students.find((item) => item.id === studentId);
    if (student) {
      moveStudentToGroup(student, targetGroupId);
    }
  };

  const pageBg =
    theme.palette.mode === "light" ? "#e8eef7" : theme.palette.background.default;
  const buttonSx = {
    px: 3,
    py: 1,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        <DashboardTopBar onLogout={handleLogout} />

        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate("/teacher")}
          sx={{ ...buttonSx, bgcolor: "background.paper", mb: 2 }}
        >
          Powrót do kokpitu
        </Button>

        <DashboardHeader
          loading={loadingUser}
          username={user?.username}
          subtitle="Zarządzanie grupami i uczniami"
          fallbackName="Nauczycielu"
          icon={<GroupIcon sx={{ color: "primary.main" }} />}
        />

        {errorUser && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            {errorUser}
          </Alert>
        )}
        {errorData && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {errorData}
          </Alert>
        )}
        {pageFeedback && (
          <Alert
            severity={pageFeedback.severity}
            onClose={() => setPageFeedback(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {pageFeedback.message}
          </Alert>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Klasy i uczniowie
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Przeciągnij ucznia na inną kartę grupy, aby zmienić przypisanie.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <IconButton
              aria-label="Odśwież listę"
              onClick={fetchData}
              disabled={loadingData}
              sx={{
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
              }}
            >
              <RefreshIcon />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={openCreateGroupDialog}
              sx={{ ...buttonSx, bgcolor: "background.paper" }}
            >
              Dodaj grupę
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={openCreateStudentDialog}
              disabled={availableGroups.length === 0}
              sx={buttonSx}
            >
              Dodaj ucznia
            </Button>
          </Stack>
        </Stack>

        {loadingData ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        ) : availableGroups.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nie masz jeszcze grup. Utwórz pierwszą grupę, aby dodać uczniów.
          </Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
              alignItems: "start",
            }}
          >
            {groupsWithStudents.map((group) => {
              const isDropTarget = dragOverGroupId === group.id;
              return (
                <Paper
                  key={group.id}
                  elevation={0}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverGroupId(group.id);
                  }}
                  onDragLeave={() => setDragOverGroupId(null)}
                  onDrop={(event) => handleDrop(event, group.id)}
                  sx={{
                    border: 1,
                    borderColor: isDropTarget ? "primary.main" : "divider",
                    borderRadius: uiTokens.radius.card,
                    bgcolor: isDropTarget ? "action.hover" : "background.paper",
                    minHeight: 190,
                    overflow: "hidden",
                    transition:
                      "border-color 120ms ease, background-color 120ms ease",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ p: 2 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ minWidth: 0 }}
                      >
                        <GroupIcon color="primary" />
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          sx={{ overflowWrap: "anywhere" }}
                        >
                          {group.name}
                        </Typography>
                      </Stack>
                      {group.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5, overflowWrap: "anywhere" }}
                        >
                          {group.description}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={`${group.students.length} uczniów`}
                      size="small"
                      sx={{ flexShrink: 0, fontWeight: 700 }}
                    />
                  </Stack>

                  <Divider />

                  {group.students.length === 0 ? (
                    <Box sx={{ p: 2.5 }}>
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        Brak uczniów w tej grupie.
                      </Alert>
                    </Box>
                  ) : (
                    <Stack divider={<Divider flexItem />}>
                      {group.students.map((student) => {
                        const isMoving = movingStudentId === student.id;
                        return (
                          <Box
                            key={student.id}
                            draggable={movingStudentId === null}
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData(
                                "text/plain",
                                String(student.id),
                              );
                              setDraggingStudentId(student.id);
                            }}
                            onDragEnd={() => {
                              setDraggingStudentId(null);
                              setDragOverGroupId(null);
                            }}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1.5,
                              px: 2,
                              py: 1.5,
                              opacity:
                                draggingStudentId === student.id || isMoving
                                  ? 0.55
                                  : 1,
                              cursor: movingStudentId === null ? "grab" : "default",
                              "&:hover": { bgcolor: "action.hover" },
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.25}
                              alignItems="center"
                              sx={{ minWidth: 0 }}
                            >
                              <DragIcon
                                fontSize="small"
                                sx={{ color: "text.disabled", flexShrink: 0 }}
                              />
                              <PersonIcon
                                sx={{ color: "primary.main", flexShrink: 0 }}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="body1"
                                  fontWeight={700}
                                  sx={{ overflowWrap: "anywhere" }}
                                >
                                  {student.username}
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                  sx={{ minWidth: 0 }}
                                >
                                  <EmailIcon
                                    sx={{
                                      fontSize: 14,
                                      color: "text.secondary",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
                                  >
                                    {student.email}
                                  </Typography>
                                </Stack>
                              </Box>
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ flexShrink: 0 }}
                            >
                              {isMoving && <CircularProgress size={18} />}
                              <IconButton
                                aria-label="Edytuj ucznia"
                                size="small"
                                color="primary"
                                onClick={() => openEditStudentDialog(student)}
                                disabled={isMoving}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}

        <AppDialog
          open={createStudentOpen}
          onClose={closeCreateStudentDialog}
          maxWidth="sm"
          paperSx={{
            width: {
              xs: "calc(100% - 24px)",
              sm: uiTokens.modal.comfortableWidth,
            },
          }}
        >
          <AppDialogHeader
            icon={<PersonAddIcon />}
            title="Dodaj ucznia"
            subtitle="Utworzenie konta ucznia i przypisanie do grupy."
          />
          <AppDialogBody>
            <FormSection title="Dane ucznia">
              {createStudentFeedback && (
                <AppDialogStatus severity={createStudentFeedback.severity}>
                  {createStudentFeedback.message}
                </AppDialogStatus>
              )}
              <Stack spacing={2}>
                <FormField>
                  <TextField
                    label="Nazwa użytkownika"
                    value={createStudentDraft.username}
                    onChange={(event) =>
                      setCreateStudentDraft((draft) => ({
                        ...draft,
                        username: event.target.value,
                      }))
                    }
                    fullWidth
                    size="small"
                    disabled={createStudentLoading}
                  />
                </FormField>
                <FormField>
                  <TextField
                    label="E-mail"
                    type="email"
                    value={createStudentDraft.email}
                    onChange={(event) =>
                      setCreateStudentDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }))
                    }
                    fullWidth
                    size="small"
                    disabled={createStudentLoading}
                  />
                </FormField>
                <FormField>
                  <TextField
                    label="Hasło"
                    type="password"
                    value={createStudentDraft.password}
                    onChange={(event) =>
                      setCreateStudentDraft((draft) => ({
                        ...draft,
                        password: event.target.value,
                      }))
                    }
                    fullWidth
                    size="small"
                    disabled={createStudentLoading}
                  />
                </FormField>
                <FormField>
                  <FormControl fullWidth size="small" disabled={createStudentLoading}>
                    <InputLabel>Grupa ucznia</InputLabel>
                    <Select
                      label="Grupa ucznia"
                      value={createStudentDraft.groupId}
                      onChange={(event) =>
                        setCreateStudentDraft((draft) => ({
                          ...draft,
                          groupId: event.target.value as number | "",
                        }))
                      }
                    >
                      {availableGroups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </FormField>
              </Stack>
            </FormSection>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeCreateStudentDialog}
                sx={{ ...buttonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                onClick={submitCreateStudent}
                disabled={createStudentLoading}
                startIcon={<SaveIcon />}
                sx={buttonSx}
              >
                Utwórz
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <AppDialog
          open={editStudentOpen}
          onClose={closeEditStudentDialog}
          maxWidth="sm"
          paperSx={{
            width: {
              xs: "calc(100% - 24px)",
              sm: uiTokens.modal.comfortableWidth,
            },
          }}
        >
          <AppDialogHeader
            icon={<EditIcon />}
            title="Edytuj ucznia"
            subtitle="Zmiana danych ucznia i przypisanej grupy."
          />
          <AppDialogBody>
            <FormSection title="Dane profilowe">
              {editStudentFeedback && (
                <AppDialogStatus severity={editStudentFeedback.severity}>
                  {editStudentFeedback.message}
                </AppDialogStatus>
              )}
              <Stack spacing={2}>
                <FormField>
                  <TextField
                    label="Nazwa użytkownika"
                    value={editStudentDraft.username}
                    onChange={(event) =>
                      setEditStudentDraft((draft) => ({
                        ...draft,
                        username: event.target.value,
                      }))
                    }
                    fullWidth
                    size="small"
                    disabled={editStudentLoading}
                  />
                </FormField>
                <FormField>
                  <TextField
                    label="E-mail"
                    type="email"
                    value={editStudentDraft.email}
                    onChange={(event) =>
                      setEditStudentDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }))
                    }
                    fullWidth
                    size="small"
                    disabled={editStudentLoading}
                  />
                </FormField>
                <FormField>
                  <FormControl fullWidth size="small" disabled={editStudentLoading}>
                    <InputLabel>Grupa ucznia</InputLabel>
                    <Select
                      label="Grupa ucznia"
                      value={editStudentDraft.groupId}
                      onChange={(event) =>
                        setEditStudentDraft((draft) => ({
                          ...draft,
                          groupId: event.target.value as number | "",
                        }))
                      }
                    >
                      {availableGroups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </FormField>
              </Stack>
            </FormSection>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeEditStudentDialog}
                sx={{ ...buttonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                onClick={submitEditStudent}
                disabled={editStudentLoading}
                startIcon={<SaveIcon />}
                sx={buttonSx}
              >
                Zapisz zmiany
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>

        <AppDialog
          open={createGroupOpen}
          onClose={closeCreateGroupDialog}
          maxWidth="sm"
          paperSx={{
            width: {
              xs: "calc(100% - 24px)",
              sm: uiTokens.modal.comfortableWidth,
            },
          }}
        >
          <AppDialogHeader
            icon={<SchoolIcon />}
            title="Dodaj grupę"
            subtitle="Utworzenie klasy widocznej w panelu nauczyciela."
          />
          <AppDialogBody>
            <FormSection title="Dane grupy">
              {createGroupFeedback && (
                <AppDialogStatus severity={createGroupFeedback.severity}>
                  {createGroupFeedback.message}
                </AppDialogStatus>
              )}
              <Stack spacing={2}>
                <FormField>
                  <TextField
                    label="Nazwa grupy"
                    value={createGroupDraft.name}
                    onChange={(event) =>
                      setCreateGroupDraft((draft) => ({
                        ...draft,
                        name: event.target.value,
                      }))
                    }
                    fullWidth
                    size="small"
                    disabled={createGroupLoading}
                  />
                </FormField>
                <FormField>
                  <TextField
                    label="Opis"
                    value={createGroupDraft.description}
                    onChange={(event) =>
                      setCreateGroupDraft((draft) => ({
                        ...draft,
                        description: event.target.value,
                      }))
                    }
                    fullWidth
                    size="small"
                    minRows={3}
                    multiline
                    disabled={createGroupLoading}
                  />
                </FormField>
              </Stack>
            </FormSection>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeCreateGroupDialog}
                sx={{ ...buttonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                onClick={submitCreateGroup}
                disabled={createGroupLoading}
                startIcon={<SaveIcon />}
                sx={buttonSx}
              >
                Utwórz grupę
              </Button>
            </FormActions>
          </AppDialogFooter>
        </AppDialog>
      </Container>
    </Box>
  );
}
