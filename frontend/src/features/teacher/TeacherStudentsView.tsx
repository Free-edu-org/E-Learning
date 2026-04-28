import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
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
  ExpandMoreOutlined as ExpandMoreIcon,
  GroupOutlined as GroupIcon,
  PersonAddOutlined as PersonAddIcon,
  RefreshOutlined as RefreshIcon,
  SaveOutlined as SaveIcon,
  SearchOutlined as SearchIcon,
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
import {
  panelSurfaceSx,
  panelToolbarSx,
} from "@/components/ui/panel/panelStyles";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";
import { uiTokens } from "@/theme/uiTokens";
import { getApiErrorMessage } from "@/utils/dashboardUtils";
import { INPUT_LIMITS } from "@/utils/inputLimits";

type DialogFeedbackState = {
  severity: "success" | "error" | "warning" | "info";
  message: string;
};

const operationErrorMessages: Record<string, string> = {
  EMAIL_ALREADY_TAKEN: "Ten adres e-mail jest już zajęty.",
  USERNAME_ALREADY_TAKEN: "Ta nazwa użytkownika jest już zajęta.",
  USER_GROUP_NOT_FOUND: "Wybrana grupa nie istnieje.",
  INVALID_ROLE_FOR_GROUP:
    "Do grupy można przypisać tylko użytkownika z rolą ucznia.",
  GROUP_NAME_ALREADY_EXISTS: "Grupa o tej nazwie już istnieje.",
  STUDENT_ALREADY_IN_GROUP: "Uczeń jest już przypisany do grupy.",
};

const getOperationErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    const code = error.problem.code ?? error.problem.title;
    if (code && operationErrorMessages[code]) {
      return operationErrorMessages[code];
    }
    return getApiErrorMessage(error, fallback, {
      username: "Nazwa użytkownika",
      email: "E-mail",
      password: "Hasło",
      groupId: "Grupa",
      name: "Nazwa",
      description: "Opis",
    });
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
  const [searchQuery, setSearchQuery] = useState("");
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
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(
    () => new Set(),
  );

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
        getOperationErrorMessage(error, "Nie udało się pobrać uczniów i grup."),
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

  useEffect(() => {
    setExpandedGroupIds(new Set(availableGroups.map((group) => group.id)));
  }, [availableGroups]);

  const groupsWithStudents = useMemo(
    () =>
      availableGroups.map((group) => ({
        ...group,
        students: students.filter((student) => student.groupId === group.id),
      })),
    [availableGroups, students],
  );

  const filteredGroupsWithStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groupsWithStudents;

    return groupsWithStudents
      .map((group) => {
        const groupMatches = [
          group.name,
          group.description ?? "",
          String(group.id),
        ].some((value) => value.toLowerCase().includes(query));
        const matchingStudents = group.students.filter((student) =>
          [student.username, student.email, String(student.id)].some((value) =>
            value.toLowerCase().includes(query),
          ),
        );

        return {
          ...group,
          totalStudentCount: group.students.length,
          students: groupMatches ? group.students : matchingStudents,
          matchesSearch: groupMatches || matchingStudents.length > 0,
        };
      })
      .filter((group) => group.matchesSearch);
  }, [groupsWithStudents, searchQuery]);

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

  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;
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

        <DashboardHeader
          loading={loadingUser}
          username={user?.username}
          subtitle="Zarządzanie grupami i uczniami"
          fallbackName="Nauczycielu"
          user={user}
          onUserUpdated={setUser}
        />

        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/teacher")}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            mb: 2,
            mt: -1, // Subtle pull up to header
            color: "text.secondary",
            "&:hover": { bgcolor: "transparent", color: "primary.main" },
          }}
        >
          Wróć do panelu
        </Button>

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
              Rozwiń grupę, aby zobaczyć uczniów. Przeciągnij ucznia na inną
              grupę, aby zmienić przypisanie.
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

        {!loadingData && availableGroups.length > 0 && (
          <Box sx={{ ...panelToolbarSx, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Szukaj grupy, ucznia, e-maila lub ID"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                minWidth: 220,
                flex: "1 1 260px",
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={600}
              sx={{ px: 0.5, whiteSpace: "nowrap" }}
            >
              {searchQuery.trim()
                ? `Wyniki: ${filteredGroupsWithStudents.length} z ${groupsWithStudents.length} grup`
                : `${groupsWithStudents.length} grup`}
            </Typography>
          </Box>
        )}

        {loadingData ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        ) : availableGroups.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nie masz jeszcze grup. Utwórz pierwszą grupę, aby dodać uczniów.
          </Alert>
        ) : filteredGroupsWithStudents.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Brak grup lub uczniów pasujących do wyszukiwania.
          </Alert>
        ) : (
          <Stack spacing={1.25}>
            {filteredGroupsWithStudents.map((group) => {
              const isDropTarget = dragOverGroupId === group.id;
              const isExpanded = expandedGroupIds.has(group.id);
              const visibleStudentCount = group.students.length;
              const totalStudentCount =
                "totalStudentCount" in group
                  ? group.totalStudentCount
                  : group.students.length;
              const studentCountLabel =
                searchQuery.trim() && visibleStudentCount !== totalStudentCount
                  ? `${visibleStudentCount} z ${totalStudentCount} uczniów`
                  : `${totalStudentCount} uczniów`;
              return (
                <Box
                  key={group.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverGroupId(group.id);
                  }}
                  onDragLeave={() => setDragOverGroupId(null)}
                  onDrop={(event) => handleDrop(event, group.id)}
                  sx={{
                    ...panelSurfaceSx,
                    borderColor: isDropTarget ? "primary.main" : "divider",
                    bgcolor: isDropTarget ? "action.hover" : "background.paper",
                    overflow: "hidden",
                    transition:
                      "border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
                    boxShadow: isDropTarget
                      ? "0 14px 30px rgba(15, 23, 42, 0.12)"
                      : "none",
                  }}
                >
                  <ButtonBase
                    onClick={() => toggleGroupExpanded(group.id)}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      p: 2,
                      textAlign: "left",
                      minHeight: 78,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ minWidth: 0, flex: 1 }}
                    >
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2,
                          bgcolor: "action.hover",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <GroupIcon color="primary" />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          fontWeight={800}
                          sx={{
                            overflowWrap: "anywhere",
                          }}
                        >
                          {group.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflowWrap: "anywhere",
                          }}
                        >
                          {group.description || "Brak opisu grupy."}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ flexShrink: 0 }}
                    >
                      <Chip
                        label={studentCountLabel}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <ExpandMoreIcon
                        sx={{
                          color: "text.secondary",
                          transition: "transform 150ms ease",
                          transform: isExpanded ? "rotate(180deg)" : "none",
                        }}
                      />
                    </Stack>
                  </ButtonBase>

                  <Collapse in={isExpanded} timeout={180} unmountOnExit>
                    <Divider />

                    {group.students.length === 0 ? (
                      <Box sx={{ p: 2 }}>
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
                                minHeight: 72,
                                opacity:
                                  draggingStudentId === student.id || isMoving
                                    ? 0.55
                                    : 1,
                                cursor:
                                  movingStudentId === null ? "grab" : "default",
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
                                <UserAvatar
                                  avatarUrl={student.avatarUrl}
                                  username={student.username}
                                  size={32}
                                  sx={{ flexShrink: 0 }}
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
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
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
                    name="teacher-create-student-username"
                    autoComplete="off"
                    value={createStudentDraft.username}
                    onChange={(event) =>
                      setCreateStudentDraft((draft) => ({
                        ...draft,
                        username: event.target.value.slice(
                          0,
                          INPUT_LIMITS.username,
                        ),
                      }))
                    }
                    inputProps={{ maxLength: INPUT_LIMITS.username }}
                    helperText={`${createStudentDraft.username.length}/${INPUT_LIMITS.username}`}
                    fullWidth
                    size="small"
                    disabled={createStudentLoading}
                  />
                </FormField>
                <FormField>
                  <TextField
                    label="E-mail"
                    name="teacher-create-student-email"
                    autoComplete="off"
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
                    name="teacher-create-student-password"
                    autoComplete="new-password"
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
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={createStudentLoading}
                  >
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
                    name="teacher-edit-student-username"
                    autoComplete="off"
                    value={editStudentDraft.username}
                    onChange={(event) =>
                      setEditStudentDraft((draft) => ({
                        ...draft,
                        username: event.target.value.slice(
                          0,
                          INPUT_LIMITS.username,
                        ),
                      }))
                    }
                    inputProps={{ maxLength: INPUT_LIMITS.username }}
                    helperText={`${editStudentDraft.username.length}/${INPUT_LIMITS.username}`}
                    fullWidth
                    size="small"
                    disabled={editStudentLoading}
                  />
                </FormField>
                <FormField>
                  <TextField
                    label="E-mail"
                    name="teacher-edit-student-email"
                    autoComplete="off"
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
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={editStudentLoading}
                  >
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
                        name: event.target.value.slice(
                          0,
                          INPUT_LIMITS.groupName,
                        ),
                      }))
                    }
                    inputProps={{ maxLength: INPUT_LIMITS.groupName }}
                    helperText={`${createGroupDraft.name.length}/${INPUT_LIMITS.groupName}`}
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
                        description: event.target.value.slice(
                          0,
                          INPUT_LIMITS.groupDescription,
                        ),
                      }))
                    }
                    inputProps={{ maxLength: INPUT_LIMITS.groupDescription }}
                    helperText={`${createGroupDraft.description.length}/${INPUT_LIMITS.groupDescription}`}
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
