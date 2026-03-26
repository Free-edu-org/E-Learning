import { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Switch,
  Chip,
  Button,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  EditOutlined as EditIcon,
  BarChartOutlined as BarChartIcon,
  MenuBook as BookIcon,
  GroupAdd as GroupAddIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { Lesson, Group, StudentUser, LessonStudent } from "@/api/lessonService";

interface LessonCardProps {
  lesson: Lesson;
  listView?: boolean;
  onToggleStatus?: (lessonId: number, newActive: boolean) => void;
  onAssignGroups?: (lessonId: number, groupIds: number[]) => Promise<void>;
  availableGroups?: Group[];
  onOpenStudents?: (lessonId: number) => Promise<{
    allStudents: StudentUser[];
    assignedStudents: LessonStudent[];
  }>;
  onAssignStudent?: (lessonId: number, userId: number) => Promise<void>;
  onRemoveStudent?: (lessonId: number, userId: number) => Promise<void>;
  onResetStudent?: (lessonId: number, userId: number) => Promise<void>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        bgcolor: active ? "success.main" : "text.disabled",
        flexShrink: 0,
      }}
    />
  );
}

const MAX_CHIPS_VISIBLE = 2;

function GroupChips({ groups }: { groups: Lesson["groups"] }) {
  if (groups.length === 0) {
    return (
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ fontStyle: "italic" }}
      >
        Brak grup
      </Typography>
    );
  }

  const visible = groups.slice(0, MAX_CHIPS_VISIBLE);
  const overflow = groups.slice(MAX_CHIPS_VISIBLE);

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {visible.map((g) => (
        <Chip
          key={g.id}
          label={g.name}
          size="small"
          variant="outlined"
          sx={{
            fontSize: "0.68rem",
            height: 20,
            borderRadius: "6px",
            color: "text.secondary",
            borderColor: "divider",
          }}
        />
      ))}
      {overflow.length > 0 && (
        <Tooltip
          title={overflow.map((g) => g.name).join(", ")}
          arrow
          placement="top"
        >
          <Chip
            label={`+${overflow.length} ${overflow.length === 1 ? "inna" : "inne"}`}
            size="small"
            sx={{
              fontSize: "0.68rem",
              height: 20,
              borderRadius: "6px",
              bgcolor: "action.hover",
              color: "text.secondary",
              cursor: "default",
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
}

export function LessonCard({
  lesson,
  listView = false,
  onToggleStatus,
  onAssignGroups,
  availableGroups = [],
  onOpenStudents,
  onAssignStudent,
  onRemoveStudent,
  onResetStudent,
}: LessonCardProps) {
  const navigate = useNavigate();

  // Group dialog state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);

  // Student dialog state
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentUser[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<LessonStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentToAdd, setStudentToAdd] = useState<StudentUser | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const openGroupDialog = () => {
    setSelectedGroups(lesson.groups);
    setGroupDialogOpen(true);
  };

  const handleSaveGroups = async () => {
    if (!onAssignGroups) return;
    setSaving(true);
    try {
      await onAssignGroups(lesson.id, selectedGroups.map((g) => g.id));
      setGroupDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const openStudentDialog = async () => {
    if (!onOpenStudents) return;
    setStudentDialogOpen(true);
    setLoadingStudents(true);
    try {
      const data = await onOpenStudents(lesson.id);
      setAllStudents(data.allStudents);
      setAssignedStudents(data.assignedStudents);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAssignStudent = async () => {
    if (!studentToAdd || !onAssignStudent) return;
    setBusyAction(`assign-${studentToAdd.id}`);
    try {
      await onAssignStudent(lesson.id, studentToAdd.id);
      setAssignedStudents((prev) => [...prev, studentToAdd]);
      setStudentToAdd(null);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemoveStudent = async (userId: number) => {
    if (!onRemoveStudent) return;
    setBusyAction(`remove-${userId}`);
    try {
      await onRemoveStudent(lesson.id, userId);
      setAssignedStudents((prev) => prev.filter((s) => s.id !== userId));
    } finally {
      setBusyAction(null);
    }
  };

  const handleResetStudent = async (userId: number) => {
    if (!onResetStudent) return;
    setBusyAction(`reset-${userId}`);
    try {
      await onResetStudent(lesson.id, userId);
    } finally {
      setBusyAction(null);
    }
  };

  const unassignedStudents = allStudents.filter(
    (s) => !assignedStudents.some((a) => a.id === s.id),
  );

  // ── Shared dialogs (rendered once at the end) ──
  const dialogs = (
    <>
      {/* Group assignment dialog */}
      <Dialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Przypisz grupy</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Wybierz grupy, które mają mieć dostęp do lekcji &quot;{lesson.title}
            &quot;
          </Typography>
          <Autocomplete
            multiple
            options={availableGroups}
            getOptionLabel={(o) => o.name}
            value={selectedGroups}
            onChange={(_, v) => setSelectedGroups(v)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...rest } = getTagProps({ index });
                return (
                  <Chip key={key} label={option.name} size="small" {...rest} />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Grupy"
                placeholder="Szukaj grupy..."
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setGroupDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveGroups}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {saving ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student management dialog */}
      <Dialog
        open={studentDialogOpen}
        onClose={() => setStudentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Uczniowie — {lesson.title}
        </DialogTitle>
        <DialogContent>
          {loadingStudents ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Add student */}
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: 600 }}
              >
                Dodaj ucznia do lekcji
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                <Autocomplete
                  options={unassignedStudents}
                  getOptionLabel={(o) => `${o.username} (${o.email})`}
                  value={studentToAdd}
                  onChange={(_, v) => setStudentToAdd(v)}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Szukaj ucznia..."
                    />
                  )}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={handleAssignStudent}
                  disabled={
                    !studentToAdd ||
                    busyAction === `assign-${studentToAdd?.id}`
                  }
                  sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  Dodaj
                </Button>
              </Box>

              {/* Assigned students list */}
              <Typography
                variant="subtitle2"
                sx={{ mb: 0.5, fontWeight: 600 }}
              >
                Przypisani uczniowie ({assignedStudents.length})
              </Typography>
              {assignedStudents.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: "center", fontStyle: "italic" }}
                >
                  Brak bezpośrednio przypisanych uczniów
                </Typography>
              ) : (
                <List dense disablePadding>
                  {assignedStudents.map((student) => (
                    <ListItem
                      key={student.id}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <ListItemText
                        primary={student.username}
                        secondary={student.email}
                        primaryTypographyProps={{ fontWeight: 600, variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Resetuj postep lekcji" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleResetStudent(student.id)}
                            disabled={busyAction === `reset-${student.id}`}
                            sx={{ color: "warning.main" }}
                          >
                            {busyAction === `reset-${student.id}` ? (
                              <CircularProgress size={18} />
                            ) : (
                              <ResetIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Usun przypisanie" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveStudent(student.id)}
                            disabled={busyAction === `remove-${student.id}`}
                            sx={{ color: "error.main" }}
                          >
                            {busyAction === `remove-${student.id}` ? (
                              <CircularProgress size={18} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setStudentDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Zamknij
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (listView) {
    return (
      <>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 2,
            py: 1.25,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            transition: "box-shadow 0.15s, border-color 0.15s",
            "&:hover": { boxShadow: 2, borderColor: "primary.light" },
          }}
        >
          <StatusDot active={lesson.isActive} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              color="primary.main"
              noWrap
            >
              {lesson.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {lesson.theme}
            </Typography>
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 0.5,
              maxWidth: 220,
            }}
          >
            <GroupChips groups={lesson.groups} />
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0, display: { xs: "none", sm: "block" } }}
          >
            {formatDate(lesson.createdAt)}
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              flexShrink: 0,
              alignItems: "center",
            }}
          >
            <Tooltip title={lesson.isActive ? "Dezaktywuj" : "Aktywuj"} arrow>
              <Switch
                size="small"
                checked={lesson.isActive}
                onChange={() => onToggleStatus?.(lesson.id, !lesson.isActive)}
              />
            </Tooltip>
            <Button
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => navigate(`/teacher/lesson/${lesson.id}/tasks`)}
              sx={{ textTransform: "none", fontWeight: 600, minWidth: 0 }}
            >
              Edytuj
            </Button>
            <Button
              size="small"
              startIcon={<BarChartIcon fontSize="small" />}
              sx={{ textTransform: "none", fontWeight: 600, minWidth: 0 }}
            >
              Wyniki
            </Button>
            <Button
              size="small"
              startIcon={<GroupAddIcon fontSize="small" />}
              onClick={openGroupDialog}
              sx={{ textTransform: "none", fontWeight: 600, minWidth: 0 }}
            >
              Grupy
            </Button>
            <Button
              size="small"
              startIcon={<PersonAddIcon fontSize="small" />}
              onClick={openStudentDialog}
              sx={{ textTransform: "none", fontWeight: 600, minWidth: 0 }}
            >
              Uczniowie
            </Button>
          </Box>
        </Box>
        {dialogs}
      </>
    );
  }

  // ── Grid card view ──
  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transition: "box-shadow 0.2s, transform 0.15s",
          "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
        }}
      >
        <CardContent sx={{ flex: 1, pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              mb: 0.5,
            }}
          >
            <BookIcon
              sx={{
                color: "primary.main",
                fontSize: 18,
                mt: 0.3,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body1"
              fontWeight={700}
              color="primary.main"
              sx={{ lineHeight: 1.4 }}
            >
              {lesson.title}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, ml: "26px" }}
          >
            {lesson.theme}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Status:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {lesson.isActive ? (
                <Chip
                  label="Aktywna"
                  size="small"
                  sx={{
                    bgcolor: "#1a1a2e",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 22,
                  }}
                />
              ) : (
                <Chip
                  label="Nieaktywna"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }}
                />
              )}
              <Switch
                size="small"
                checked={lesson.isActive}
                onChange={() => onToggleStatus?.(lesson.id, !lesson.isActive)}
              />
            </Box>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 1 }}
          >
            Utworzona: {formatDate(lesson.createdAt)}
          </Typography>

          <GroupChips groups={lesson.groups} />
        </CardContent>

        <Divider />

        <CardActions sx={{ px: 2, py: 1, gap: 0.5, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon fontSize="small" />}
            onClick={() => navigate(`/teacher/lesson/${lesson.id}/tasks`)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, flex: 1, minWidth: 0 }}
          >
            Edytuj
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<GroupAddIcon fontSize="small" />}
            onClick={openGroupDialog}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, flex: 1, minWidth: 0 }}
          >
            Grupy
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PersonAddIcon fontSize="small" />}
            onClick={openStudentDialog}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, flex: 1, minWidth: 0 }}
          >
            Uczniowie
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<BarChartIcon fontSize="small" />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, flex: 1, minWidth: 0 }}
          >
            Wyniki
          </Button>
        </CardActions>
      </Card>
      {dialogs}
    </>
  );
}
