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
  PersonOutlined as PersonIcon,
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
import { GroupInvitationsSection } from "./GroupInvitationsSection";

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
      groupPublicId: "Grupa",
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
  groupPublicId: "" as string | "",
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
  const [editingStudent, seteditingStudent] =
    useState<TeacherStudentResponse | null>(null);

  const [editStudentDraft, setEditStudentDraft] = useState({
    username: "",
    email: "",
    groupPublicId: "" as string | "",
  });
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [editStudentFeedback, setEditStudentFeedback] =
    useState<DialogFeedbackState | null>(null);

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createGroupDraft, setCreateGroupDraft] = useState(emptyGroupDraft);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [createGroupFeedback, setCreateGroupFeedback] =
    useState<DialogFeedbackState | null>(null);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupDraft, setEditGroupDraft] = useState(emptyGroupDraft);
  const [editGroupLoading, setEditGroupLoading] = useState(false);
  const [editGroupFeedback, setEditGroupFeedback] =
    useState<DialogFeedbackState | null>(null);

  const [draggingStudentPublicId, setDraggingStudentPublicId] = useState<
    string | null
  >(null);
  const [dragOverGroupPublicId, setDragOverGroupPublicId] = useState<
    string | null
  >(null);
  const [movingStudentPublicId, setMovingStudentPublicId] = useState<
    string | null
  >(null);
  const [expandedGroupPublicIds, setExpandedGroupPublicIds] = useState<
    Set<string>
  >(() => new Set());

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

  const groupsWithStudents = useMemo(
    () =>
      availableGroups.map((group) => ({
        ...group,
        students: students.filter(
          (student) => student.groupPublicId === group.publicId,
        ),
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
          group.publicId,
        ].some((value) => value.toLowerCase().includes(query));
        const matchingStudents = group.students.filter((student) =>
          [student.username, student.email, String(student.publicId)].some(
            (value) => value.toLowerCase().includes(query),
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
    if (createStudentDraft.groupPublicId === "") {
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
        groupPublicId: createStudentDraft.groupPublicId,
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
    seteditingStudent(student);
    setEditStudentDraft({
      username: student.username,
      email: student.email,
      groupPublicId: student.groupPublicId,
    });
    setEditStudentFeedback(null);
    setEditStudentOpen(true);
  };

  const closeEditStudentDialog = () => {
    if (editStudentLoading) return;
    setEditStudentOpen(false);
    seteditingStudent(null);
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
    if (editStudentDraft.groupPublicId === "") {
      setEditStudentFeedback({
        severity: "error",
        message: "Wybierz docelową grupę.",
      });
      return;
    }

    setEditStudentFeedback(null);
    setEditStudentLoading(true);
    try {
      await lessonService.updateTeacherStudent(editingStudent.publicId, {
        username: editStudentDraft.username.trim(),
        email: editStudentDraft.email.trim(),
        groupPublicId: editStudentDraft.groupPublicId,
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

  const openEditGroupDialog = (group: Group) => {
    setEditingGroup(group);
    setEditGroupDraft({
      name: group.name,
      description: group.description ?? "",
    });
    setEditGroupFeedback(null);
    setEditGroupOpen(true);
  };

  const closeEditGroupDialog = () => {
    if (editGroupLoading) return;
    setEditGroupOpen(false);
    setEditingGroup(null);
  };

  const submitEditGroup = async () => {
    if (!editingGroup || editGroupLoading) return;
    if (!editGroupDraft.name.trim()) {
      setEditGroupFeedback({
        severity: "error",
        message: "Podaj nazwę grupy.",
      });
      return;
    }

    setEditGroupFeedback(null);
    setEditGroupLoading(true);
    try {
      await userGroupService.updateGroup(editingGroup.publicId, {
        name: editGroupDraft.name.trim(),
        description: editGroupDraft.description.trim(),
      });
      setEditGroupFeedback({
        severity: "success",
        message: "Dane grupy zostały zapisane.",
      });
      await fetchData();
      window.setTimeout(() => closeEditGroupDialog(), 700);
    } catch (error) {
      setEditGroupFeedback({
        severity: "error",
        message: getOperationErrorMessage(
          error,
          "Nie udało się zapisać zmian grupy.",
        ),
      });
    } finally {
      setEditGroupLoading(false);
    }
  };

  const moveStudentToGroup = async (
    student: TeacherStudentResponse,
    targetGroupPublicId: string,
  ) => {
    if (
      student.groupPublicId === targetGroupPublicId ||
      movingStudentPublicId !== null
    ) {
      return;
    }

    const previousGroupPublicId = student.groupPublicId;
    setMovingStudentPublicId(student.publicId);
    setPageFeedback({
      severity: "info",
      message: "Przenoszenie ucznia do nowej grupy...",
    });
    setStudents((current) =>
      current.map((item) =>
        item.publicId === student.publicId
          ? { ...item, groupPublicId: targetGroupPublicId }
          : item,
      ),
    );

    try {
      await lessonService.updateTeacherStudent(student.publicId, {
        username: student.username,
        email: student.email,
        groupPublicId: targetGroupPublicId,
      });
      const targetGroup = availableGroups.find(
        (group) => group.publicId === targetGroupPublicId,
      );
      setPageFeedback({
        severity: "success",
        message: `Uczeń został przeniesiony do grupy ${targetGroup?.name ?? ""}.`,
      });
      await fetchData();
    } catch (error) {
      setStudents((current) =>
        current.map((item) =>
          item.publicId === student.publicId
            ? { ...item, groupPublicId: previousGroupPublicId }
            : item,
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
      setMovingStudentPublicId(null);
      setDraggingStudentPublicId(null);
      setDragOverGroupPublicId(null);
    }
  };

  const handleDrop = (event: DragEvent, targetGroupPublicId: string) => {
    event.preventDefault();
    const rawStudentPublicId = event.dataTransfer.getData("text/plain");
    const student = students.find(
      (item) => item.publicId === rawStudentPublicId,
    );
    if (student) {
      moveStudentToGroup(student, targetGroupPublicId);
    }
  };

  const toggleGroupExpanded = (groupPublicId: string) => {
    setExpandedGroupPublicIds((current) => {
      const next = new Set(current);
      if (next.has(groupPublicId)) {
        next.delete(groupPublicId);
      } else {
        next.add(groupPublicId);
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
                ? `Wyniki: ${filteredGroupsWithStudents.length} z ${groupsWithStudents.length} | Liczba grup: ${groupsWithStudents.length}`
                : `Liczba grup: ${groupsWithStudents.length}`}
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
              const isDropTarget = dragOverGroupPublicId === group.publicId;
              const isExpanded = expandedGroupPublicIds.has(group.publicId);
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
                  key={group.publicId}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverGroupPublicId(group.publicId);
                  }}
                  onDragLeave={() => setDragOverGroupPublicId(null)}
                  onDrop={(event) => handleDrop(event, group.publicId)}
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
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ButtonBase
                    onClick={() => toggleGroupExpanded(group.publicId)}
                    sx={{
                      flex: 1,
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
                  <IconButton
                    size="small"
                    aria-label={`Edytuj grupę ${group.name}`}
                    onClick={() => openEditGroupDialog(group)}
                    sx={{ color: "text.secondary", mr: 1 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  </Box>

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
                          const isMoving =
                            movingStudentPublicId === student.publicId;
                          return (
                            <Box
                              key={student.publicId}
                              draggable={movingStudentPublicId === null}
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData(
                                  "text/plain",
                                  String(student.publicId),
                                );
                                setDraggingStudentPublicId(student.publicId);
                              }}
                              onDragEnd={() => {
                                setDraggingStudentPublicId(null);
                                setDragOverGroupPublicId(null);
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
                                  draggingStudentPublicId ===
                                    student.publicId || isMoving
                                    ? 0.55
                                    : 1,
                                cursor:
                                  movingStudentPublicId === null
                                    ? "grab"
                                    : "default",
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
                                  aria-label="Profil ucznia"
                                  size="small"
                                  onClick={() => navigate(`/teacher/students/${student.publicId}/progress`)}
                                  disabled={isMoving}
                                >
                                  <PersonIcon fontSize="small" />
                                </IconButton>
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

                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <GroupInvitationsSection groupPublicId={group.publicId} />
                    </Box>
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
                      value={createStudentDraft.groupPublicId}
                      onChange={(event) =>
                        setCreateStudentDraft((draft) => ({
                          ...draft,
                          groupPublicId: event.target.value as string | "",
                        }))
                      }
                    >
                      {availableGroups.map((group) => (
                        <MenuItem key={group.publicId} value={group.publicId}>
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
                      value={editStudentDraft.groupPublicId}
                      onChange={(event) =>
                        setEditStudentDraft((draft) => ({
                          ...draft,
                          groupPublicId: event.target.value as string | "",
                        }))
                      }
                    >
                      {availableGroups.map((group) => (
                        <MenuItem key={group.publicId} value={group.publicId}>
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
          open={editGroupOpen}
          onClose={closeEditGroupDialog}
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
            title="Edytuj grupę"
            subtitle="Zmiana nazwy grupy i jej opisu."
          />
          <AppDialogBody>
            <FormSection title="Dane grupy">
              {editGroupFeedback && (
                <AppDialogStatus severity={editGroupFeedback.severity}>
                  {editGroupFeedback.message}
                </AppDialogStatus>
              )}
              <Stack spacing={2}>
                <FormField>
                  <TextField
                    label="Nazwa grupy"
                    value={editGroupDraft.name}
                    onChange={(event) =>
                      setEditGroupDraft((draft) => ({
                        ...draft,
                        name: event.target.value.slice(
                          0,
                          INPUT_LIMITS.groupName,
                        ),
                      }))
                    }
                    inputProps={{ maxLength: INPUT_LIMITS.groupName }}
                    helperText={`${editGroupDraft.name.length}/${INPUT_LIMITS.groupName}`}
                    fullWidth
                    size="small"
                    disabled={editGroupLoading}
                  />
                </FormField>
                <FormField>
                  <TextField
                    label="Opis"
                    value={editGroupDraft.description}
                    onChange={(event) =>
                      setEditGroupDraft((draft) => ({
                        ...draft,
                        description: event.target.value.slice(
                          0,
                          INPUT_LIMITS.groupDescription,
                        ),
                      }))
                    }
                    inputProps={{ maxLength: INPUT_LIMITS.groupDescription }}
                    helperText={`${editGroupDraft.description.length}/${INPUT_LIMITS.groupDescription}`}
                    fullWidth
                    size="small"
                    minRows={3}
                    multiline
                    disabled={editGroupLoading}
                  />
                </FormField>
              </Stack>
            </FormSection>
          </AppDialogBody>
          <AppDialogFooter>
            <FormActions>
              <Button
                onClick={closeEditGroupDialog}
                sx={{ ...buttonSx, color: "text.secondary" }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                onClick={submitEditGroup}
                disabled={editGroupLoading}
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
