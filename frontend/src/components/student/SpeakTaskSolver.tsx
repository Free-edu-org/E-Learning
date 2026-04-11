import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  RecordVoiceOverOutlined as SpeakDoneIcon,
} from "@mui/icons-material";
import type { SpeakTaskResponse } from "@/api/taskService";
import type { SubmitAnswerDetail } from "@/api/studentService";
import {
  taskCardSx,
  taskHeaderSx,
  taskHintSx,
  taskFeedbackCorrectSx,
  taskTypeMeta,
} from "./taskSolverStyles";

interface SpeakTaskSolverProps {
  task: SpeakTaskResponse;
  value: string;
  onChange: (answer: string) => void;
  result: SubmitAnswerDetail | null;
  disabled: boolean;
}

export function SpeakTaskSolver({
  task,
  value,
  onChange,
  result,
  disabled,
}: SpeakTaskSolverProps) {
  const meta = taskTypeMeta.speak;
  const isDone = value === "done";

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

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Przeczytaj powyższy tekst na głos, a następnie potwierdź.
      </Typography>

      <Button
        variant={isDone ? "contained" : "outlined"}
        color={isDone ? "success" : "primary"}
        startIcon={<SpeakDoneIcon />}
        disabled={disabled}
        onClick={() => onChange(isDone ? "" : "done")}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 2,
        }}
      >
        {isDone ? "Przeczytano na głos" : "Potwierdzam przeczytanie"}
      </Button>

      {task.hint && (
        <Typography sx={taskHintSx}>Podpowiedź: {task.hint}</Typography>
      )}

      {result && (
        <Box sx={taskFeedbackCorrectSx}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CorrectIcon color="success" fontSize="small" />
            <Typography variant="body2" fontWeight={600}>
              Poprawna odpowiedź!
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
