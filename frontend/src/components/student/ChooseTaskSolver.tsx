import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  CancelOutlined as IncorrectIcon,
} from "@mui/icons-material";
import type { ChooseTaskResponse } from "@/api/taskService";
import type { SubmitAnswerDetail } from "@/api/studentService";
import {
  taskHeaderSx,
  taskFeedbackCorrectSx,
  taskFeedbackIncorrectSx,
  chooseOptionCardSx,
  chooseOptionSelectedSx,
  chooseOptionCorrectSx,
  chooseOptionIncorrectSx,
  chooseOptionNumberSx,
  taskTypeMeta,
} from "./taskSolverStyles";

interface ChooseTaskSolverProps {
  task: ChooseTaskResponse;
  value: string;
  onChange: (answer: string) => void;
  result: SubmitAnswerDetail | null;
  disabled: boolean;
}

export function ChooseTaskSolver({
  task,
  value,
  onChange,
  result,
  disabled,
}: ChooseTaskSolverProps) {
  const options = task.possibleAnswers.split("|");
  const meta = taskTypeMeta.choose;

  const getOptionSx = (index: number) => {
    const indexStr = String(index);
    if (result) {
      const isCorrectOption = String(result.correctAnswer) === indexStr;
      const isSelectedWrong = !result.isCorrect && value === indexStr;
      if (isCorrectOption) return chooseOptionCorrectSx;
      if (isSelectedWrong) return chooseOptionIncorrectSx;
      return { ...chooseOptionCardSx, cursor: "default", "&:hover": {} };
    }
    return value === indexStr ? chooseOptionSelectedSx : chooseOptionCardSx;
  };

  return (
    <Box>
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

      <Stack spacing={1.5}>
        {options.map((option, index) => (
          <Box
            key={index}
            onClick={() => !disabled && !result && onChange(String(index))}
            sx={getOptionSx(index)}
          >
            <Box sx={chooseOptionNumberSx}>{index + 1}</Box>
            <Typography variant="body1" fontWeight={500}>
              {option}
            </Typography>
          </Box>
        ))}
      </Stack>

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
              Prawidłowa odpowiedź:{" "}
              <strong>{options[Number(result.correctAnswer)]}</strong>
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
