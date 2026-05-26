import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Chip,
  Stack,
  Tooltip,
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
import { getAcceptedAnswers } from "@/utils/answerDisplay";
import { formatPercent } from "@/utils/dashboardUtils";

interface LessonResultDetailsPanelProps {
  result: LessonResultDetailsResponse;
  performerLabel?: string;
  showTabSwitchInfo?: boolean;
  allowManualReview?: boolean;
  reviewingTaskPublicId?: string | null;
  onReviewChange?: (taskPublicId: string, isCorrect: boolean) => void;
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
  allowManualReview = false,
  reviewingTaskPublicId = null,
  onReviewChange,
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
        </Box>

        <Stack spacing={1.5} sx={{ p: 2 }}>
          {result.tasks.map((task, index) => {
            const possibleAnswers = splitPipeList(task.possibleAnswers);
            const scatterWords = splitPipeList(task.words);
            const statusColor = task.isCorrect ? "success.main" : "error.main";
            const actionColor = task.isCorrect ? "error" : "success";
            const isReviewing = reviewingTaskPublicId === task.taskPublicId;
            const acceptedAnswers = getAcceptedAnswers(
              task.correctAnswers,
              task.correctAnswer,
            );
            const reviewLabel =
              task.reviewStatus === "MANUAL_CORRECTED_TO_CORRECT"
                ? "Ręcznie poprawione na poprawne"
                : task.reviewStatus === "MANUAL_CORRECTED_TO_INCORRECT"
                  ? "Ręcznie poprawione na błędne"
                  : task.reviewStatus === "MANUAL_CONFIRMED"
                    ? "Ręcznie potwierdzone"
                    : null;

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
                  transition: "border-color 160ms ease, box-shadow 160ms ease",
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
                      alignItems: "center",
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

                  <Box
                    sx={{
                      ml: "auto",
                      mr: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {reviewLabel && (
                      <Tooltip title="Odpowiedź została ręcznie zweryfikowana przez nauczyciela">
                        <Chip
                          label={reviewLabel}
                          variant="outlined"
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: "0.69rem",
                            fontWeight: 700,
                            color: "warning.main",
                            borderColor: (theme) =>
                              alpha(theme.palette.warning.main, 0.32),
                            bgcolor: (theme) =>
                              alpha(theme.palette.warning.main, 0.08),
                          }}
                        />
                      </Tooltip>
                    )}

                    <Chip
                      icon={
                        task.isCorrect ? <CorrectIcon /> : <IncorrectIcon />
                      }
                      label={task.isCorrect ? "Poprawne" : "Błędne"}
                      variant="outlined"
                      size="small"
                      sx={{
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
                  </Box>
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
                            ? `Zmiana zakładki: ${task.tabSwitchCount}`
                            : "Bez zmiany zakładki"
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
                        Poprawne odpowiedzi
                      </Typography>
                      {acceptedAnswers.length > 0 ? (
                        <Stack
                          direction="row"
                          spacing={0.75}
                          useFlexGap
                          flexWrap="wrap"
                          sx={{ mt: 0.75 }}
                        >
                          {acceptedAnswers.map((answer, answerIndex) => (
                            <Chip
                              key={`${answer}-${answerIndex}`}
                              label={answer}
                              size="small"
                              sx={{
                                height: "auto",
                                minHeight: 24,
                                borderRadius: 1.5,
                                fontWeight: 700,
                                "& .MuiChip-label": {
                                  display: "block",
                                  whiteSpace: "normal",
                                  overflowWrap: "anywhere",
                                  py: 0.35,
                                },
                              }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            mt: 0.5,
                            lineHeight: 1.45,
                            color: "text.primary",
                          }}
                        >
                          Brak zapisanej poprawnej odpowiedzi
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {allowManualReview && onReviewChange && (
                    <Box
                      sx={{
                        mt: 1.5,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          width: { xs: "100%", sm: 220 },
                          maxWidth: 220,
                        }}
                      >
                        <Button
                          fullWidth
                          variant="outlined"
                          disabled={isReviewing}
                          startIcon={
                            task.isCorrect ? <IncorrectIcon /> : <CorrectIcon />
                          }
                          onClick={() =>
                            onReviewChange(task.taskPublicId, !task.isCorrect)
                          }
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            px: 1.5,
                            py: 0.7,
                            borderRadius: 2.5,
                            boxShadow: "none",
                            color: `${actionColor}.main`,
                            borderColor: (theme) =>
                              alpha(theme.palette[actionColor].main, 0.24),
                            bgcolor: (theme) =>
                              alpha(theme.palette[actionColor].main, 0.05),
                            transition:
                              "background-color 160ms ease, border-color 160ms ease, color 160ms ease, opacity 160ms ease",
                            "&:hover": {
                              borderColor: (theme) =>
                                alpha(theme.palette[actionColor].main, 0.34),
                              bgcolor: (theme) =>
                                alpha(theme.palette[actionColor].main, 0.1),
                              boxShadow: "none",
                            },
                            "&.Mui-disabled": {
                              color: `${actionColor}.main`,
                              borderColor: (theme) =>
                                alpha(theme.palette[actionColor].main, 0.2),
                              bgcolor: (theme) =>
                                alpha(theme.palette[actionColor].main, 0.05),
                              opacity: 0.72,
                            },
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              opacity: isReviewing ? 0 : 1,
                              transition: "opacity 120ms ease",
                            }}
                          >
                            {task.isCorrect
                              ? "Oznacz jako błędne"
                              : "Oznacz jako poprawne"}
                          </Box>
                        </Button>

                        {isReviewing && (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              pointerEvents: "none",
                            }}
                          >
                            <CircularProgress size={18} />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}
