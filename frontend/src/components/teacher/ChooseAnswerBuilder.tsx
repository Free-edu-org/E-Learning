import { useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  AddCircleOutline as AddIcon,
  CheckCircle as CorrectIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from "@mui/icons-material";
import { uiTokens } from "@/theme/uiTokens";
import { INPUT_LIMITS } from "@/utils/inputLimits";

interface ChooseAnswerBuilderProps {
  possibleAnswers: string;
  correctAnswer: string;
  correctAnswers?: string;
  onChange: (possibleAnswers: string, correctAnswer: string) => void;
}

export function ChooseAnswerBuilder({
  possibleAnswers,
  correctAnswer,
  correctAnswers,
  onChange,
}: ChooseAnswerBuilderProps) {
  const [inputValue, setInputValue] = useState("");

  const answers = possibleAnswers
    ? possibleAnswers.split("|").filter(Boolean)
    : [];
  const correctIndex = correctAnswer !== "" ? Number(correctAnswer) : -1;
  const selectedIndexes = new Set(
    (correctAnswers || correctAnswer)
      .split("|")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value)),
  );

  const addAnswer = () => {
    const trimmed = inputValue.trim().slice(0, INPUT_LIMITS.taskChoiceAnswer);
    if (!trimmed || answers.length >= INPUT_LIMITS.taskChoiceMaxAnswers) return;
    const updated = [...answers, trimmed];
    onChange(updated.join("|"), correctAnswer);
    setInputValue("");
  };

  const removeAnswer = (index: number) => {
    const updated = answers.filter((_, i) => i !== index);
    let newCorrect = correctIndex;
    const updatedSelectedIndexes = new Set<number>();
    selectedIndexes.forEach((selectedIndex) => {
      if (selectedIndex === index) return;
      updatedSelectedIndexes.add(
        selectedIndex > index ? selectedIndex - 1 : selectedIndex,
      );
    });
    if (index === correctIndex) {
      newCorrect = updatedSelectedIndexes.values().next().value ?? -1;
    } else if (index < correctIndex) {
      newCorrect = correctIndex - 1;
    }
    onChange(
      updated.join("|"),
      [...updatedSelectedIndexes].join("|") ||
        (newCorrect >= 0 ? String(newCorrect) : ""),
    );
  };

  const setCorrect = (index: number) => {
    const updated = new Set(selectedIndexes);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    onChange(possibleAnswers, [...updated].sort((a, b) => a - b).join("|"));
  };

  return (
    <Stack spacing={1.25}>
      <Typography variant="body2" fontWeight={600}>
        Odpowiedzi
      </Typography>

      {answers.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {answers.map((answer, index) => (
            <Tooltip
              key={index}
              title={
                selectedIndexes.has(index)
                  ? "Poprawna odpowiedź"
                  : "Kliknij aby oznaczyć jako poprawną"
              }
              arrow
              placement="top"
            >
              <Chip
                icon={
                  selectedIndexes.has(index) ? (
                    <CorrectIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <UncheckedIcon sx={{ fontSize: 18 }} />
                  )
                }
                label={answer}
                onDelete={() => removeAnswer(index)}
                onClick={() => setCorrect(index)}
                sx={{
                  borderRadius: uiTokens.radius.control,
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  border: "1.5px solid",
                  borderColor: (theme) =>
                    selectedIndexes.has(index)
                      ? theme.palette.success.main
                      : alpha(theme.palette.divider, 0.4),
                  bgcolor: (theme) =>
                    selectedIndexes.has(index)
                      ? alpha(theme.palette.success.main, 0.1)
                      : "transparent",
                  "& .MuiChip-icon": {
                    color: (theme) =>
                      selectedIndexes.has(index)
                        ? theme.palette.success.main
                        : theme.palette.text.disabled,
                  },
                  "&:hover": {
                    borderColor: (theme) =>
                      selectedIndexes.has(index)
                        ? theme.palette.success.main
                        : theme.palette.primary.main,
                  },
                  "@keyframes chipAppear": {
                    from: { opacity: 0, transform: "scale(0.85)" },
                    to: { opacity: 1, transform: "scale(1)" },
                  },
                  animation: "chipAppear 0.2s ease-out",
                }}
              />
            </Tooltip>
          ))}
        </Box>
      )}

      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          size="small"
          placeholder="Wpisz odpowiedź i dodaj..."
          value={inputValue}
          onChange={(e) =>
            setInputValue(
              e.target.value.slice(0, INPUT_LIMITS.taskChoiceAnswer),
            )
          }
          inputProps={{ maxLength: INPUT_LIMITS.taskChoiceAnswer }}
          helperText={`${inputValue.length}/${INPUT_LIMITS.taskChoiceAnswer} • ${answers.length}/${INPUT_LIMITS.taskChoiceMaxAnswers} odpowiedzi`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addAnswer();
            }
          }}
          fullWidth
          sx={{ flex: 1 }}
        />
        <IconButton
          onClick={addAnswer}
          color="primary"
          disabled={
            !inputValue.trim() ||
            answers.length >= INPUT_LIMITS.taskChoiceMaxAnswers
          }
          sx={{
            mt: 0.75,
            transition: "transform 0.15s ease",
            "&:hover": { transform: "scale(1.1)" },
          }}
        >
          <AddIcon />
        </IconButton>
      </Stack>

      {answers.length > 0 && selectedIndexes.size === 0 && (
        <Typography variant="caption" color="warning.main">
          Kliknij na odpowiedź, aby oznaczyć ją jako poprawną.
        </Typography>
      )}
      {answers.length >= INPUT_LIMITS.taskChoiceMaxAnswers && (
        <Typography variant="caption" color="text.secondary">
          Osiągnięto limit {INPUT_LIMITS.taskChoiceMaxAnswers} odpowiedzi.
        </Typography>
      )}
    </Stack>
  );
}
