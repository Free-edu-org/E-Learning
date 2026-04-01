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

interface ChooseAnswerBuilderProps {
  possibleAnswers: string;
  correctAnswer: string;
  onChange: (possibleAnswers: string, correctAnswer: string) => void;
}

export function ChooseAnswerBuilder({
  possibleAnswers,
  correctAnswer,
  onChange,
}: ChooseAnswerBuilderProps) {
  const [inputValue, setInputValue] = useState("");

  const answers = possibleAnswers
    ? possibleAnswers.split("|").filter(Boolean)
    : [];
  const correctIndex = correctAnswer !== "" ? Number(correctAnswer) : -1;

  const addAnswer = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const updated = [...answers, trimmed];
    onChange(updated.join("|"), correctAnswer);
    setInputValue("");
  };

  const removeAnswer = (index: number) => {
    const updated = answers.filter((_, i) => i !== index);
    let newCorrect = correctIndex;
    if (index === correctIndex) {
      newCorrect = -1;
    } else if (index < correctIndex) {
      newCorrect = correctIndex - 1;
    }
    onChange(updated.join("|"), newCorrect >= 0 ? String(newCorrect) : "");
  };

  const setCorrect = (index: number) => {
    onChange(possibleAnswers, String(index));
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
                index === correctIndex
                  ? "Poprawna odpowiedź"
                  : "Kliknij aby oznaczyć jako poprawną"
              }
              arrow
              placement="top"
            >
              <Chip
                icon={
                  index === correctIndex ? (
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
                    index === correctIndex
                      ? theme.palette.success.main
                      : alpha(theme.palette.divider, 0.4),
                  bgcolor: (theme) =>
                    index === correctIndex
                      ? alpha(theme.palette.success.main, 0.1)
                      : "transparent",
                  "& .MuiChip-icon": {
                    color: (theme) =>
                      index === correctIndex
                        ? theme.palette.success.main
                        : theme.palette.text.disabled,
                  },
                  "&:hover": {
                    borderColor: (theme) =>
                      index === correctIndex
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

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          placeholder="Wpisz odpowiedź i dodaj..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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
          disabled={!inputValue.trim()}
          sx={{
            transition: "transform 0.15s ease",
            "&:hover": { transform: "scale(1.1)" },
          }}
        >
          <AddIcon />
        </IconButton>
      </Stack>

      {answers.length > 0 && correctIndex < 0 && (
        <Typography variant="caption" color="warning.main">
          Kliknij na odpowiedź, aby oznaczyć ją jako poprawną.
        </Typography>
      )}
    </Stack>
  );
}
