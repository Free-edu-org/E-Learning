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
import { AddCircleOutline as AddIcon } from "@mui/icons-material";
import { uiTokens } from "@/theme/uiTokens";
import { INPUT_LIMITS } from "@/utils/inputLimits";

interface TextAnswerBuilderProps {
  label: string;
  answers: string;
  placeholder: string;
  emptyMessage: string;
  maxAnswers?: number;
  onChange: (answers: string) => void;
}

export function TextAnswerBuilder({
  label,
  answers,
  placeholder,
  emptyMessage,
  maxAnswers,
  onChange,
}: TextAnswerBuilderProps) {
  const [inputValue, setInputValue] = useState("");

  const answerList = answers
    .split("\n")
    .map((answer) => answer.trim())
    .filter(Boolean);

  const addAnswer = () => {
    const trimmed = inputValue.trim().slice(0, INPUT_LIMITS.taskAnswerText);
    if (!trimmed) return;
    if (maxAnswers != null && answerList.length >= maxAnswers) return;

    const isDuplicate = answerList.some(
      (answer) => answer.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
    );
    if (isDuplicate) {
      setInputValue("");
      return;
    }

    onChange([...answerList, trimmed].join("\n"));
    setInputValue("");
  };

  const removeAnswer = (index: number) => {
    onChange(answerList.filter((_, i) => i !== index).join("\n"));
  };

  return (
    <Stack spacing={1.25}>
      <Typography variant="body2" fontWeight={600}>
        {label}
      </Typography>

      {answerList.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {answerList.map((answer, index) => (
            <Chip
              key={`${answer}-${index}`}
              label={answer}
              onDelete={() => removeAnswer(index)}
              sx={{
                borderRadius: uiTokens.radius.control,
                fontWeight: 600,
                border: "1.5px solid",
                borderColor: (theme) => alpha(theme.palette.success.main, 0.45),
                bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                maxWidth: "100%",
                "& .MuiChip-label": {
                  overflowWrap: "anywhere",
                  whiteSpace: "normal",
                },
              }}
            />
          ))}
        </Box>
      )}

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) =>
            setInputValue(e.target.value.slice(0, INPUT_LIMITS.taskAnswerText))
          }
          inputProps={{ maxLength: INPUT_LIMITS.taskAnswerText }}
          helperText={`${inputValue.length}/${INPUT_LIMITS.taskAnswerText} • ${answerList.length} dodanych`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addAnswer();
            }
          }}
          fullWidth
          sx={{ flex: 1 }}
        />
        <Tooltip title="Dodaj odpowiedź" arrow>
          <span>
            <IconButton
              onClick={addAnswer}
              color="primary"
              disabled={
                !inputValue.trim() ||
                (maxAnswers != null && answerList.length >= maxAnswers)
              }
              sx={{
                transition: "transform 0.15s ease",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              <AddIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {answerList.length === 0 && (
        <Typography variant="caption" color="warning.main">
          {emptyMessage}
        </Typography>
      )}
      {maxAnswers != null && answerList.length >= maxAnswers && (
        <Typography variant="caption" color="text.secondary">
          Osiągnięto limit {maxAnswers} odpowiedzi.
        </Typography>
      )}
    </Stack>
  );
}
