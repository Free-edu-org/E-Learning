import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  CancelOutlined as IncorrectIcon,
} from "@mui/icons-material";
import { useState } from "react";
import type { ScatterTaskResponse } from "@/api/taskService";
import type { SubmitAnswerDetail } from "@/api/studentService";
import {
  taskCardSx,
  taskHeaderSx,
  taskFeedbackCorrectSx,
  taskFeedbackIncorrectSx,
  taskTypeMeta,
} from "./taskSolverStyles";

interface ScatterTaskSolverProps {
  task: ScatterTaskResponse;
  value: string;
  onChange: (answer: string) => void;
  result: SubmitAnswerDetail | null;
  disabled: boolean;
}

export function ScatterTaskSolver({
  task,
  value,
  onChange,
  result,
  disabled,
}: ScatterTaskSolverProps) {
  const meta = taskTypeMeta.scatter;
  const words = task.words.split("|");

  // Reconstruct selectedIndices from stored answer value (e.g. after navigation)
  const [selectedIndices, setSelectedIndices] = useState<number[]>(() => {
    if (!value) return [];
    const answerWords = value.split(" ");
    const used = new Set<number>();
    const indices: number[] = [];
    for (const aw of answerWords) {
      const idx = words.findIndex((w, i) => w === aw && !used.has(i));
      if (idx >= 0) {
        indices.push(idx);
        used.add(idx);
      }
    }
    return indices;
  });

  const handleSelect = (index: number) => {
    if (disabled) return;
    const next = [...selectedIndices, index];
    setSelectedIndices(next);
    onChange(next.map((i) => words[i]).join(" "));
  };

  const handleRemove = (positionInSentence: number) => {
    if (disabled) return;
    const next = selectedIndices.filter((_, i) => i !== positionInSentence);
    setSelectedIndices(next);
    onChange(next.map((i) => words[i]).join(" "));
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedIndices([]);
    onChange("");
  };

  return (
    <Box sx={taskCardSx}>
      <Box sx={taskHeaderSx}>
        <Chip
          icon={<>{meta.icon}</>}
          label={meta.label}
          size="small"
          sx={{
            bgcolor: alpha(meta.color, 0.12),
            color: meta.color,
            fontWeight: 700,
            fontSize: "0.72rem",
            flexShrink: 0,
          }}
        />
        <Typography variant="body1" fontWeight={600}>
          {task.task}
        </Typography>
      </Box>

      {/* Sentence area — centered, inline words with remove on click */}
      <Box
        sx={{
          minHeight: 52,
          px: 2,
          py: 1.5,
          mb: 2,
          borderRadius: 2.5,
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.05 : 0.03,
            ),
          boxShadow: (theme) =>
            `inset 0 -2px 0 ${alpha(theme.palette.primary.main, 0.18)}`,
          display: "flex",
          flexWrap: "wrap",
          gap: "10px 14px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selectedIndices.length === 0 ? (
          <Typography variant="body2" color="text.disabled" fontStyle="italic">
            Kliknij słowa poniżej, aby ułożyć zdanie…
          </Typography>
        ) : (
          selectedIndices.map((wordIndex, pos) => (
            <Box
              key={pos}
              onClick={disabled ? undefined : () => handleRemove(pos)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: disabled ? "default" : "pointer",
                gap: "2px",
              }}
            >
              <Typography
                component="span"
                variant="body1"
                fontWeight={700}
                sx={{
                  color: "primary.main",
                  borderBottom: (theme) =>
                    `2px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                  pb: "2px",
                  lineHeight: 1.3,
                  transition: "opacity 0.15s",
                  "&:hover": disabled ? {} : { opacity: 0.55 },
                }}
              >
                {words[wordIndex]}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      {/* Word pool — centered */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 12px",
          justifyContent: "center",
          mb: 1,
        }}
      >
        {words.map((word, index) => {
          const isUsed = selectedIndices.includes(index);
          return (
            <Typography
              key={index}
              component="span"
              variant="body2"
              fontWeight={600}
              onClick={
                isUsed || disabled ? undefined : () => handleSelect(index)
              }
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 99,
                bgcolor: (theme) =>
                  alpha(
                    theme.palette.text.primary,
                    theme.palette.mode === "dark" ? 0.07 : 0.05,
                  ),
                color: "text.primary",
                cursor: isUsed || disabled ? "default" : "pointer",
                opacity: isUsed ? 0.22 : 1,
                transition: "opacity 0.15s, box-shadow 0.15s",
                userSelect: "none",
                "&:hover":
                  isUsed || disabled
                    ? {}
                    : {
                        boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
                        opacity: 0.8,
                      },
              }}
            >
              {word}
            </Typography>
          );
        })}
      </Box>

      {selectedIndices.length > 0 && !disabled && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 0.5 }}>
          <Typography
            variant="caption"
            color="text.disabled"
            onClick={handleClear}
            sx={{
              cursor: "pointer",
              "&:hover": { color: "error.main" },
              transition: "color 0.15s",
            }}
          >
            Wyczyść
          </Typography>
        </Box>
      )}

      {result && (
        <Box
          sx={
            result.isCorrect ? taskFeedbackCorrectSx : taskFeedbackIncorrectSx
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {result.isCorrect ? (
              <CorrectIcon color="success" fontSize="small" />
            ) : (
              <IncorrectIcon color="error" fontSize="small" />
            )}
            <Typography variant="body2" fontWeight={600}>
              {result.isCorrect
                ? "Poprawna odpowiedź!"
                : "Niepoprawna odpowiedź"}
            </Typography>
          </Stack>
          {!result.isCorrect && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Prawidłowa odpowiedź: <strong>{result.correctAnswer}</strong>
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
