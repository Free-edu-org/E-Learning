import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  CancelOutlined as IncorrectIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import type { ScatterTaskResponse } from "@/api/taskService";
import type { SubmitAnswerDetail } from "@/api/studentService";
import {
  taskCardSx,
  taskHeaderSx,
  taskHintSx,
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

  // Clear selectedIndices when value is externally reset to empty
  useEffect(() => {
    if (!value) {
      setSelectedIndices([]);
    }
  }, [value]);

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

      {/* Sentence area */}
      <Box
        sx={{
          minHeight: 48,
          p: 1.5,
          mb: 1.5,
          borderRadius: 2,
          border: "2px dashed",
          borderColor: (theme) =>
            alpha(theme.palette.primary.main, 0.25),
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.04 : 0.03,
            ),
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          alignItems: "center",
        }}
      >
        {selectedIndices.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Kliknij słowa poniżej, aby ułożyć zdanie...
          </Typography>
        ) : (
          selectedIndices.map((wordIndex, pos) => (
            <Chip
              key={pos}
              label={words[wordIndex]}
              onDelete={disabled ? undefined : () => handleRemove(pos)}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ))
        )}
      </Box>

      {/* Word pool */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {words.map((word, index) => {
          const isUsed = selectedIndices.includes(index);
          return (
            <Chip
              key={index}
              label={word}
              onClick={isUsed || disabled ? undefined : () => handleSelect(index)}
              size="small"
              sx={{
                fontWeight: 600,
                cursor: isUsed || disabled ? "default" : "pointer",
                opacity: isUsed ? 0.3 : 1,
                transition: "opacity 0.15s",
              }}
            />
          );
        })}
      </Box>

      {selectedIndices.length > 0 && !disabled && (
        <Typography
          variant="caption"
          color="primary"
          onClick={handleClear}
          sx={{ cursor: "pointer", mt: 1, display: "inline-block" }}
        >
          Wyczyść
        </Typography>
      )}

      {task.hint && (
        <Typography sx={taskHintSx}>Podpowiedź: {task.hint}</Typography>
      )}

      {result && (
        <Box sx={result.isCorrect ? taskFeedbackCorrectSx : taskFeedbackIncorrectSx}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {result.isCorrect ? (
              <CorrectIcon color="success" fontSize="small" />
            ) : (
              <IncorrectIcon color="error" fontSize="small" />
            )}
            <Typography variant="body2" fontWeight={600}>
              {result.isCorrect ? "Poprawna odpowiedź!" : "Niepoprawna odpowiedź"}
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
