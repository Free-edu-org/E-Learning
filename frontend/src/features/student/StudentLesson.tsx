import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Skeleton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Cancel as WrongIcon,
  EmojiEvents as TrophyIcon,
  RecordVoiceOver as SpeakIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";
import { useAppTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { taskService } from "@/api/taskService";
import type {
  LessonTasksResponse,
  TaskResponse,
  SubmitAnswerItem,
  SubmitResultResponse,
} from "@/api/taskService";
import { ApiError } from "@/api/apiClient";

export function StudentLesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { toggleColorMode } = useAppTheme();
  const { logout } = useAuth();

  const [data, setData] = useState<LessonTasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // Answers: taskType-taskId -> answer string
  const storageKey = `lesson-answers-${lessonId}`;
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResultResponse | null>(null);

  // Pre-shuffled words for scatter tasks (taskType-taskId -> shuffled word array)
  const [shuffledWords, setShuffledWords] = useState<Record<string, string[]>>({});

  const id = Number(lessonId);

  useEffect(() => {
    setLoading(true);
    setError(null);
    taskService
      .getLessonTasks(id)
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          if (err.problem.code === "LESSON_ALREADY_COMPLETED") {
            setLocked(true);
            setError("Ta lekcja została już ukończona. Nie możesz jej ponownie rozwiązać.");
          } else {
            setError(err.problem.detail || "Nie udało się pobrać zadań.");
          }
        } else {
          setError("Błąd połączenia z serwerem.");
        }
      })
      .finally(() => setLoading(false));
  }, [lessonId]);

  // Shuffle scatter words once when data loads
  useEffect(() => {
    if (!data) return;
    const map: Record<string, string[]> = {};
    for (const tasks of Object.values(data.sections)) {
      for (const task of tasks) {
        if (task.taskType === "scatter_tasks" && task.words) {
          const words = task.words.split(",").map((w) => w.trim());
          for (let i = words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [words[i], words[j]] = [words[j], words[i]];
          }
          map[`${task.taskType}-${task.id}`] = words;
        }
      }
    }
    setShuffledWords(map);
  }, [data]);

  const answerKey = (task: TaskResponse) => `${task.taskType}-${task.id}`;

  const handleAnswerChange = (task: TaskResponse, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [answerKey(task)]: value };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch { /* quota exceeded — ignore */ }
      return next;
    });
  };

  const allTasks: TaskResponse[] = data
    ? Object.values(data.sections).flat()
    : [];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const submitAnswers: SubmitAnswerItem[] = allTasks.map((task) => ({
        taskId: task.id,
        taskType: task.taskType,
        answer: answers[answerKey(task)] || "",
      }));
      const res = await taskService.submitAnswers(id, submitAnswers);
      localStorage.removeItem(storageKey);
      setResult(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.problem.detail || "Nie udało się wysłać odpowiedzi.");
      } else {
        setError("Błąd połączenia z serwerem.");
      }
    } finally {
      setSubmitting(false);
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

  // Render result screen
  if (result) {
    const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
        <Container maxWidth="sm" sx={{ pt: 8, textAlign: "center" }}>
          <TrophyIcon
            sx={{
              fontSize: 80,
              color: percentage >= 50 ? "success.main" : "warning.main",
              mb: 2,
            }}
          />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Lekcja ukończona!
          </Typography>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Twój wynik:{" "}
            <Box component="span" fontWeight={700} color="primary.main">
              {result.score}/{result.maxScore}
            </Box>{" "}
            ({percentage}%)
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {percentage === 100
              ? "Doskonale! Wszystkie odpowiedzi poprawne!"
              : percentage >= 70
                ? "Dobra robota! Kilka odpowiedzi do poprawy."
                : percentage >= 50
                  ? "Nieźle, ale jest jeszcze nad czym pracować."
                  : "Spróbuj jeszcze raz po powtórzeniu materiału."}
          </Typography>

          {/* Per-task results */}
          <Box sx={{ textAlign: "left", mb: 4 }}>
            {result.results.map((r, i) => {
              const task = allTasks.find(
                (t) => t.id === r.taskId && t.taskType === r.taskType,
              );
              return (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: r.isCorrect ? "success.light" : "error.light",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  {r.isCorrect ? (
                    <CheckIcon color="success" />
                  ) : (
                    <WrongIcon color="error" />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {task?.task || `Zadanie #${r.taskId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Twoja odpowiedź: {answers[`${r.taskType}-${r.taskId}`] || "—"}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/student")}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 4 }}
          >
            Powrót do lekcji
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="md" sx={{ pt: 4 }}>
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
            onClick={() => navigate("/student")}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Powrót
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
          {loading ? (
            <Skeleton width={300} height={36} />
          ) : (
            <Typography variant="h5" fontWeight={700}>
              {data?.lessonTitle || "Lekcja"}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Rozwiąż wszystkie zadania, a następnie wyślij odpowiedzi
          </Typography>
        </Box>

        {error && (
          <Alert severity={locked ? "warning" : "error"} sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={120}
                sx={{ borderRadius: 3 }}
              />
            ))}
          </Box>
        ) : locked ? null : (
          <>
            {data &&
              Object.entries(data.sections).map(([section, tasks]) => (
                <Box key={section} sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="primary.main"
                    sx={{ mb: 1.5 }}
                  >
                    {section === "default" ? "Zadania" : section}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    {tasks.map((task, idx) => (
                      <Card
                        key={`${task.taskType}-${task.id}`}
                        elevation={0}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Chip
                              label={`${idx + 1}`}
                              size="small"
                              color="primary"
                              sx={{
                                fontWeight: 700,
                                minWidth: 28,
                                height: 24,
                              }}
                            />
                            <Typography variant="body1" fontWeight={600}>
                              {task.task}
                            </Typography>
                          </Box>

                          {task.hint && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "block",
                                mb: 1.5,
                                fontStyle: "italic",
                              }}
                            >
                              Podpowiedź: {task.hint}
                            </Typography>
                          )}

                          {/* CHOOSE task */}
                          {task.taskType === "choose_tasks" &&
                            task.possibleAnswers && (
                              <RadioGroup
                                value={answers[answerKey(task)] || ""}
                                onChange={(e) =>
                                  handleAnswerChange(task, e.target.value)
                                }
                              >
                                {task.possibleAnswers
                                  .split(",")
                                  .map((opt, optIdx) => (
                                    <FormControlLabel
                                      key={optIdx}
                                      value={String(optIdx)}
                                      control={<Radio size="small" />}
                                      label={opt.trim()}
                                      sx={{
                                        border: "1px solid",
                                        borderColor:
                                          answers[answerKey(task)] ===
                                          String(optIdx)
                                            ? "primary.main"
                                            : "divider",
                                        borderRadius: 2,
                                        mx: 0,
                                        mb: 0.5,
                                        px: 1,
                                        transition: "border-color 0.15s",
                                      }}
                                    />
                                  ))}
                              </RadioGroup>
                            )}

                          {/* WRITE task */}
                          {task.taskType === "write_tasks" && (
                            <TextField
                              placeholder="Wpisz swoją odpowiedź..."
                              value={answers[answerKey(task)] || ""}
                              onChange={(e) =>
                                handleAnswerChange(task, e.target.value)
                              }
                              fullWidth
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}

                          {/* SCATTER task */}
                          {task.taskType === "scatter_tasks" && (
                            <Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                  mb: 1.5,
                                }}
                              >
                                {(() => {
                                  const words =
                                    shuffledWords[answerKey(task)] ||
                                    task.words?.split(",").map((w) => w.trim()) ||
                                    [];
                                  const typed = (answers[answerKey(task)] || "")
                                    .trim()
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .map((w) => w.toLowerCase());
                                  const remaining = [...typed];
                                  return words.map((word, wi) => {
                                    const idx = remaining.indexOf(word.toLowerCase());
                                    const used = idx !== -1;
                                    if (used) remaining.splice(idx, 1);
                                    return (
                                      <Chip
                                        key={wi}
                                        label={word}
                                        variant={used ? "filled" : "outlined"}
                                        size="small"
                                        color={used ? "primary" : "default"}
                                        sx={{
                                          fontWeight: 600,
                                          opacity: used ? 0.5 : 1,
                                          textDecoration: used ? "line-through" : "none",
                                          transition: "all 0.15s",
                                        }}
                                      />
                                    );
                                  });
                                })()}
                              </Box>
                              <TextField
                                placeholder="Ułóż słowa w poprawnej kolejności..."
                                value={answers[answerKey(task)] || ""}
                                onChange={(e) =>
                                  handleAnswerChange(task, e.target.value)
                                }
                                fullWidth
                                size="small"
                              />
                            </Box>
                          )}

                          {/* SPEAK task */}
                          {task.taskType === "speak_tasks" && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: "action.hover",
                              }}
                            >
                              <SpeakIcon color="disabled" />
                              <Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Moduł mówienia — wkrótce
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                  Ten typ zadania będzie dostępny w przyszłej
                                  aktualizacji. Odpowiedź zostanie
                                  automatycznie zaliczona.
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              ))}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={submitting}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 6,
                  py: 1.5,
                }}
              >
                {submitting ? "Wysyłanie..." : "Wyślij odpowiedzi"}
              </Button>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
