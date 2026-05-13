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
import { alpha, useTheme } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  CancelOutlined as IncorrectIcon,
  ExpandMoreOutlined as ExpandMoreIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
} from "@mui/icons-material";
import type { LessonResultDetailsResponse } from "@/api/studentService";
import { StatsCard } from "@/components/teacher/StatsCard";
import { panelSurfaceSx } from "@/components/ui/panel/panelStyles";
import { formatPercent } from "@/utils/dashboardUtils";

interface LessonResultDetailsPanelProps {
  result: LessonResultDetailsResponse;
  performerLabel?: string;
  showTabSwitchInfo?: boolean;
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
  showTabSwitchInfo = false,
}: LessonResultDetailsPanelProps) {
  const theme = useTheme();
  const correctCount = result.tasks.filter((task) => task.isCorrect).length;
  const incorrectCount = result.tasks.length - correctCount;

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr 1fr" },
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            ...panelSurfaceSx,
            borderRadius: 3.5,
            p: 2.25,
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

        <StatsCard
          label="Wynik"
          value={formatPercent(result.resultPercent)}
          helperText={`${result.score} / ${result.maxScore} punktów`}
          highlightColor={theme.palette.primary.main}
        />

        <StatsCard
          label="Poprawne"
          value={correctCount}
          helperText="zadań"
          highlightColor={theme.palette.success.main}
        />

        <StatsCard
          label="Błędne"
          value={incorrectCount}
          helperText="zadań"
          highlightColor={theme.palette.error.main}
        />
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
            const statusColor = task.isCorrect ? "success.main" : "error.main";

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
                      0.22,
                    ),
                  borderLeft: "2px solid",
                  borderLeftColor: (theme) =>
                    alpha(
                      task.isCorrect
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                      0.55,
                    ),
                  boxShadow: (theme) =>
                    `0 6px 16px ${alpha(
                      task.isCorrect
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                      0.06,
                    )}`,
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon
                      sx={{ color: "text.secondary", opacity: 0.75 }}
                    />
                  }
                  sx={{
                    px: 2,
                    py: 0.75,
                    minHeight: 56,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.common.black, 0.14)
                        : alpha(theme.palette.common.black, 0.02),
                    "& .MuiAccordionSummary-content": {
                      my: 0.5,
                    },
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
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      sx={{ fontSize: "1.02rem" }}
                    >
                      Zadanie {index + 1}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ opacity: 0.85, letterSpacing: "0.01em" }}
                    >
                      {task.section ? `${task.section} • ` : ""}
                      Rodzaj: {getTaskTypeLabel(task.taskType)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={task.isCorrect ? <CorrectIcon /> : <IncorrectIcon />}
                    label={task.isCorrect ? "Poprawne" : "Błędne"}
                    variant="outlined"
                    size="small"
                    sx={{
                      ml: "auto",
                      mr: 1,
                      height: 24,
                      fontSize: "0.69rem",
                      fontWeight: 700,
                      color: statusColor,
                      borderColor: (theme) =>
                        alpha(
                          theme.palette[task.isCorrect ? "success" : "error"]
                            .main,
                          0.36,
                        ),
                      bgcolor: (theme) =>
                        alpha(
                          theme.palette[task.isCorrect ? "success" : "error"]
                            .main,
                          0.08,
                        ),
                      "& .MuiChip-icon": {
                        fontSize: 14,
                        color: "inherit",
                        mr: 0.25,
                      },
                    }}
                  />
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2 }}>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{ mb: 1.25, lineHeight: 1.4 }}
                  >
                    {task.taskText}
                  </Typography>

                  {showTabSwitchInfo && (
                    <Box sx={{ mb: 1.25 }}>
                      <Chip
                        icon={<VisibilityOffIcon />}
                        label={
                          task.tabSwitchCount > 0
                            ? `Zmiana zakladki: ${task.tabSwitchCount}`
                            : "Bez zmiany zakladki"
                        }
                        variant="outlined"
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          color: (theme) =>
                            task.tabSwitchCount > 0
                              ? alpha(theme.palette.warning.light, 0.92)
                              : alpha(theme.palette.text.secondary, 0.95),
                          bgcolor: (theme) =>
                            task.tabSwitchCount > 0
                              ? alpha(theme.palette.warning.main, 0.1)
                              : theme.palette.mode === "dark"
                                ? alpha(theme.palette.common.black, 0.22)
                                : alpha(theme.palette.text.primary, 0.04),
                          borderColor: (theme) =>
                            task.tabSwitchCount > 0
                              ? alpha(theme.palette.warning.main, 0.28)
                              : alpha(theme.palette.text.primary, 0.16),
                          "& .MuiChip-icon": {
                            fontSize: 13,
                            color: "inherit",
                            mr: 0.25,
                          },
                        }}
                      />
                    </Box>
                  )}

                  {task.hint && (
                    <Alert severity="info" sx={{ mb: 1.25 }}>
                      {task.hint}
                    </Alert>
                  )}

                  {possibleAnswers.length > 0 && (
                    <Box sx={{ mb: 1.25 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.75 }}
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
                    <Box sx={{ mb: 1.25 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.75 }}
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
                      gap: 1.25,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: (theme) =>
                          alpha(
                            task.isCorrect
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                            0.24,
                          ),
                        borderLeft: "2px solid",
                        borderLeftColor: (theme) =>
                          alpha(
                            task.isCorrect
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                            0.6,
                          ),
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? alpha(theme.palette.common.black, 0.22)
                            : alpha(theme.palette.common.black, 0.012),
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ opacity: 0.85 }}
                      >
                        Odpowiedź ucznia
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          mt: 0.5,
                          lineHeight: 1.45,
                          color: "text.primary",
                        }}
                      >
                        {task.userAnswer?.trim()
                          ? task.userAnswer
                          : "Brak odpowiedzi"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: (theme) =>
                          alpha(theme.palette.primary.main, 0.22),
                        borderLeft: "2px solid",
                        borderLeftColor: (theme) =>
                          alpha(theme.palette.primary.main, 0.52),
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? alpha(theme.palette.common.black, 0.18)
                            : alpha(theme.palette.primary.main, 0.045),
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ opacity: 0.85 }}
                      >
                        Poprawna odpowiedź
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          mt: 0.5,
                          lineHeight: 1.45,
                          color: "text.primary",
                        }}
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
