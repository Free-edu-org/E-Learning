import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  CancelOutlined as IncorrectIcon,
} from "@mui/icons-material";
import type { WriteTaskResponse } from "@/api/taskService";
import type { SubmitAnswerDetail } from "@/api/studentService";
import {
  taskCardSx,
  taskHeaderSx,
  taskFeedbackCorrectSx,
  taskFeedbackIncorrectSx,
  taskTypeMeta,
} from "./taskSolverStyles";

interface WriteTaskSolverProps {
  task: WriteTaskResponse;
  value: string;
  onChange: (answer: string) => void;
  result: SubmitAnswerDetail | null;
  disabled: boolean;
}

export function WriteTaskSolver({
  task,
  value,
  onChange,
  result,
  disabled,
}: WriteTaskSolverProps) {
  const meta = taskTypeMeta.write;

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

      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Wpisz odpowiedź..."
        autoComplete="off"
        fullWidth
        size="small"
        sx={{
          mt: 0.5,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          },
        }}
      />

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
