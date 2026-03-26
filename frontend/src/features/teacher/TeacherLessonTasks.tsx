import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  Select,
  Skeleton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  RecordVoiceOver as SpeakIcon,
  Quiz as ChooseIcon,
  Create as WriteIcon,
  Shuffle as ScatterIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAppTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { taskService } from "@/api/taskService";
import type { TaskResponse, LessonTasksResponse } from "@/api/taskService";
import { ApiError } from "@/api/apiClient";

const TASK_TYPES = [
  { value: "choose", label: "Wielokrotny wybór", icon: <ChooseIcon /> },
  { value: "write", label: "Uzupełnianie luk", icon: <WriteIcon /> },
  { value: "scatter", label: "Rozsypanka", icon: <ScatterIcon /> },
  { value: "speak", label: "Wypowiedź ustna", icon: <SpeakIcon /> },
];

function taskTypeLabel(taskType: string): string {
  switch (taskType) {
    case "choose_tasks":
      return "Wielokrotny wybór";
    case "write_tasks":
      return "Uzupełnianie luk";
    case "scatter_tasks":
      return "Rozsypanka";
    case "speak_tasks":
      return "Wypowiedź ustna";
    default:
      return taskType;
  }
}

function taskTypeIcon(taskType: string) {
  switch (taskType) {
    case "choose_tasks":
      return <ChooseIcon fontSize="small" sx={{ color: "primary.main" }} />;
    case "write_tasks":
      return <WriteIcon fontSize="small" sx={{ color: "primary.main" }} />;
    case "scatter_tasks":
      return <ScatterIcon fontSize="small" sx={{ color: "primary.main" }} />;
    case "speak_tasks":
      return <SpeakIcon fontSize="small" sx={{ color: "primary.main" }} />;
    default:
      return null;
  }
}

// Maps backend taskType to URL path param
function taskTypePath(taskType: string): string {
  return taskType.replace("_tasks", "");
}

interface TaskFormState {
  task: string;
  possibleAnswers: string;
  correctAnswer: string;
  words: string;
  hint: string;
  section: string;
  chooseOptions: string[];
  correctOptionIndex: number;
}

const emptyForm: TaskFormState = {
  task: "",
  possibleAnswers: "",
  correctAnswer: "",
  words: "",
  hint: "",
  section: "",
  chooseOptions: ["", ""],
  correctOptionIndex: 0,
};

export function TeacherLessonTasks() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { toggleColorMode } = useAppTheme();
  const { logout } = useAuth();

  const [data, setData] = useState<LessonTasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedType, setSelectedType] = useState("choose");
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<TaskResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const id = Number(lessonId);

  const fetchTasks = () => {
    setLoading(true);
    setError(null);
    taskService
      .getLessonTasks(id)
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(err.problem.detail || "Nie udało się pobrać zadań.");
        } else {
          setError("Błąd połączenia z serwerem.");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [lessonId]);

  const handleOpenCreate = () => {
    setDialogMode("create");
    setSelectedType("choose");
    setEditingTask(null);
    setForm(emptyForm);
    setDialogError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (task: TaskResponse) => {
    setDialogMode("edit");
    setEditingTask(task);
    setSelectedType(taskTypePath(task.taskType));

    const chooseOptions =
      task.possibleAnswers
        ? task.possibleAnswers.split(",").map((s) => s.trim())
        : ["", ""];
    const correctOptionIndex =
      task.correctAnswerIndex != null ? task.correctAnswerIndex : 0;

    setForm({
      task: task.task,
      possibleAnswers: task.possibleAnswers || "",
      correctAnswer:
        task.correctAnswerIndex != null
          ? String(task.correctAnswerIndex)
          : task.correctAnswerText || "",
      words: task.words || "",
      hint: task.hint || "",
      section: task.section || "",
      chooseOptions,
      correctOptionIndex,
    });
    setDialogError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setDialogError(null);
    try {
      const payload: Record<string, unknown> = {
        task: form.task,
        hint: form.hint || undefined,
        section: form.section || undefined,
      };

      if (selectedType === "choose") {
        payload.possibleAnswers = form.possibleAnswers;
        payload.correctAnswer = Number(form.correctAnswer);
      } else if (selectedType === "write") {
        payload.correctAnswer = form.correctAnswer;
      } else if (selectedType === "scatter") {
        payload.words = form.words;
        payload.correctAnswer = form.correctAnswer;
      }

      if (dialogMode === "create") {
        await taskService.createTask(id, selectedType, payload as never);
      } else if (editingTask) {
        await taskService.updateTask(
          id,
          selectedType,
          editingTask.id,
          payload as never,
        );
      }
      setDialogOpen(false);
      fetchTasks();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setDialogError(
          err.problem.detail || "Nie udało się zapisać zadania.",
        );
      } else {
        setDialogError("Błąd połączenia z serwerem.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await taskService.deleteTask(
        id,
        taskTypePath(deleteTarget.taskType),
        deleteTarget.id,
      );
      setDeleteTarget(null);
      fetchTasks();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.problem.detail || "Nie udało się usunąć zadania.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  const allTasks: TaskResponse[] = data
    ? Object.values(data.sections).flat()
    : [];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Top bar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/teacher")}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Powrót do lekcji
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
        </Box>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            {loading ? (
              <Skeleton width={300} />
            ) : (
              data?.lessonTitle || "Zadania lekcji"
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Zarządzaj zadaniami w tej lekcji
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Add task button */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Dodaj zadanie
          </Button>
        </Box>

        {/* Task list */}
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={80}
                sx={{ borderRadius: 3 }}
              />
            ))}
          </Box>
        ) : allTasks.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Ta lekcja nie ma jeszcze żadnych zadań. Kliknij "Dodaj zadanie",
            aby utworzyć pierwsze.
          </Alert>
        ) : (
          Object.entries(data!.sections).map(([section, tasks]) => (
            <Box key={section} sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="primary.main"
                sx={{ mb: 1 }}
              >
                {section === "default" ? "Bez sekcji" : section}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {tasks.map((task) => (
                  <Paper
                    key={`${task.taskType}-${task.id}`}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      transition: "box-shadow 0.15s",
                      "&:hover": { boxShadow: 2 },
                    }}
                  >
                    {taskTypeIcon(task.taskType)}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {task.task}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {taskTypeLabel(task.taskType)}
                        {task.hint && ` · Podpowiedź: ${task.hint}`}
                      </Typography>
                    </Box>
                    {task.taskType !== "speak_tasks" && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          flexShrink: 0,
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        Odp:{" "}
                        {task.correctAnswerText ||
                          (task.correctAnswerIndex != null
                            ? `Indeks ${task.correctAnswerIndex}`
                            : "—")}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(task)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(task)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          ))
        )}

        {/* Create / Edit dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {dialogMode === "create" ? "Nowe zadanie" : "Edytuj zadanie"}
          </DialogTitle>
          <DialogContent>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {dialogError}
              </Alert>
            )}

            {dialogMode === "create" && (
              <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                <InputLabel>Typ zadania</InputLabel>
                <Select
                  value={selectedType}
                  label="Typ zadania"
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setForm(emptyForm);
                  }}
                >
                  {TASK_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {t.icon} {t.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Treść zadania"
              value={form.task}
              onChange={(e) => setForm({ ...form, task: e.target.value })}
              fullWidth
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            {selectedType === "choose" && (
              <>
                <TextField
                  label="Możliwe odpowiedzi (oddzielone przecinkiem)"
                  value={form.possibleAnswers}
                  onChange={(e) =>
                    setForm({ ...form, possibleAnswers: e.target.value })
                  }
                  fullWidth
                  helperText='Np. "kot,pies,ryba,ptak"'
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Indeks poprawnej odpowiedzi (od 0)"
                  value={form.correctAnswer}
                  onChange={(e) =>
                    setForm({ ...form, correctAnswer: e.target.value })
                  }
                  fullWidth
                  type="number"
                  helperText="Np. 0 = pierwsza odpowiedź"
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {selectedType === "write" && (
              <TextField
                label="Poprawna odpowiedź"
                value={form.correctAnswer}
                onChange={(e) =>
                  setForm({ ...form, correctAnswer: e.target.value })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
            )}

            {selectedType === "scatter" && (
              <>
                <TextField
                  label="Słowa (oddzielone przecinkiem)"
                  value={form.words}
                  onChange={(e) =>
                    setForm({ ...form, words: e.target.value })
                  }
                  fullWidth
                  helperText='Np. "the,cat,sat,on,mat"'
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Poprawna odpowiedź (złożone zdanie)"
                  value={form.correctAnswer}
                  onChange={(e) =>
                    setForm({ ...form, correctAnswer: e.target.value })
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {selectedType === "speak" && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Zadania mówienia nie posiadają klucza odpowiedzi — ocena będzie
                automatycznie zaliczona.
              </Alert>
            )}

            <Divider sx={{ my: 1 }} />

            <TextField
              label="Podpowiedź (opcjonalnie)"
              value={form.hint}
              onChange={(e) => setForm({ ...form, hint: e.target.value })}
              fullWidth
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              label="Sekcja (opcjonalnie)"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              fullWidth
              helperText='Np. "Gra na start", "Ćwiczenia", "Podsumowanie"'
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>
              Anuluj
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !form.task.trim()}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {saving ? "Zapisywanie..." : dialogMode === "create" ? "Utwórz" : "Zapisz"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Usunąć zadanie?</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Czy na pewno chcesz usunąć to zadanie? Tej operacji nie można
              cofnąć.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>
              Anuluj
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={deleting}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {deleting ? "Usuwanie..." : "Usuń"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
