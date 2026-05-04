import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  CancelOutlined as IncorrectIcon,
  ExpandMoreOutlined as ExpandMoreIcon,
} from "@mui/icons-material";
import type { LessonResultDetailsResponse } from "@/api/studentService";
import { panelSurfaceSx } from "@/components/ui/panel/panelStyles";
import { formatPercent } from "@/utils/dashboardUtils";

interface LessonResultDetailsPanelProps {
  result: LessonResultDetailsResponse;
  performerLabel?: string;
}

function getTaskTypeLabel(
  taskType: LessonResultDetailsResponse["tasks"][number]["taskType"],
): string {
  switch (taskType) {
    case "choose":
      return "Wybór";
    case "write":
      return "Pisanie";
    case "scatter":
      return "Rozsypanka";
    case "speak":
      return "Mówienie";
    default:
      return taskType;
  }
}

function splitPipeList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function LessonResultDetailsPanel({
  result,
  performerLabel,
}: LessonResultDetailsPanelProps) {
  const correctCount = result.tasks.filter((task) => task.isCorrect).length;
  const incorrectCount = result.tasks.length - correctCount;

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr 1fr" },
          gap: 2,
        }}
      >
        <Box
          sx={{
            ...panelSurfaceSx,
            p: 3,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
          }}
        >
          <Typography variant="overline" color="text.secondary">
            Lekcja
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {result.lessonTitle}
          </Typography>
          {performerLabel && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75 }}
            >
              Wykonał: {performerLabel}
            </Typography>
          )}
        </Box>

        <Box sx={{ ...panelSurfaceSx, p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Wynik
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {formatPercent(result.resultPercent)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {result.score} / {result.maxScore} punktów
          </Typography>
        </Box>

        <Box sx={{ ...panelSurfaceSx, p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Poprawne
          </Typography>
          <Typography variant="h5" fontWeight={700} color="success.main">
            {correctCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            zadań
          </Typography>
        </Box>

        <Box sx={{ ...panelSurfaceSx, p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Błędne
          </Typography>
          <Typography variant="h5" fontWeight={700} color="error.main">
            {incorrectCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            zadań
          </Typography>
        </Box>
      </Box>

      <Box sx={{ ...panelSurfaceSx, p: 0, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography variant="h6" fontWeight={700}>
            Szczegóły odpowiedzi
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Każde zadanie pokazuje odpowiedź ucznia, poprawną odpowiedź i status
            poprawności.
          </Typography>
        </Box>

        <Stack spacing={1.5} sx={{ p: 2 }}>
          {result.tasks.map((task, index) => {
            const possibleAnswers = splitPipeList(task.possibleAnswers);
            const scatterWords = splitPipeList(task.words);

            return (
              <Accordion
                key={`${task.taskType}_${task.taskPublicId}`}
                disableGutters
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(
                      task.isCorrect
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                      0.18,
                    ),
                  boxShadow: "none",
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: (theme) =>
                      alpha(
                        task.isCorrect
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                        0.05,
                      ),
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      minWidth: 0,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Zadanie {index + 1}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.section ? `${task.section} • ` : ""}
                      Rodzaj: {getTaskTypeLabel(task.taskType)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={task.isCorrect ? <CorrectIcon /> : <IncorrectIcon />}
                    label={task.isCorrect ? "Poprawne" : "Błędne"}
                    color={task.isCorrect ? "success" : "error"}
                    variant="outlined"
                    sx={{ ml: "auto", mr: 1 }}
                  />
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2.5 }}>
                  <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
                    {task.taskText}
                  </Typography>

                  {task.hint && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {task.hint}
                    </Alert>
                  )}

                  {possibleAnswers.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 1 }}
                      >
                        Zestaw odpowiedzi
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        {possibleAnswers.map((answer) => (
                          <Chip
                            key={answer}
                            label={answer}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {scatterWords.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 1 }}
                      >
                        Pula wyrazów
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        {scatterWords.map((word) => (
                          <Chip
                            key={word}
                            label={word}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (theme) =>
                          alpha(
                            task.isCorrect
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                            0.07,
                          ),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Odpowiedź ucznia
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ mt: 0.75 }}
                      >
                        {task.userAnswer?.trim()
                          ? task.userAnswer
                          : "Brak odpowiedzi"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.06),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Poprawna odpowiedź
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ mt: 0.75 }}
                      >
                        {task.correctAnswer?.trim()
                          ? task.correctAnswer
                          : "Brak zapisanej poprawnej odpowiedzi"}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}
