import { Box, Stack, Typography } from "@mui/material";
import type { TaskSectionDto } from "@/api/taskService";
import type {
  SubmitAnswerItem,
  SubmitAnswerDetail,
} from "@/api/studentService";
import { ChooseTaskSolver } from "./ChooseTaskSolver";
import { WriteTaskSolver } from "./WriteTaskSolver";
import { ScatterTaskSolver } from "./ScatterTaskSolver";
import { SpeakTaskSolver } from "./SpeakTaskSolver";

interface TaskSectionGroupProps {
  lessonId: number;
  section: TaskSectionDto;
  answers: Record<number, SubmitAnswerItem>;
  onAnswer: (
    taskId: number,
    taskType: SubmitAnswerItem["taskType"],
    answer: string,
  ) => void;
  results: Map<number, SubmitAnswerDetail> | null;
  disabled: boolean;
}

export function TaskSectionGroup({
  lessonId,
  section,
  answers,
  onAnswer,
  results,
  disabled,
}: TaskSectionGroupProps) {
  const totalTasks =
    section.chooseTasks.length +
    section.writeTasks.length +
    section.scatterTasks.length +
    section.speakTasks.length;

  if (totalTasks === 0) return null;

  return (
    <Box>
      {section.section && (
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ mb: 2, color: "text.primary" }}
        >
          {section.section}
        </Typography>
      )}

      <Stack spacing={2}>
        {section.chooseTasks.map((task) => (
          <ChooseTaskSolver
            key={`choose-${task.id}`}
            task={task}
            value={answers[task.id]?.answer ?? ""}
            onChange={(answer) => onAnswer(task.id, "choose", answer)}
            result={results?.get(task.id) ?? null}
            disabled={disabled}
          />
        ))}

        {section.writeTasks.map((task) => (
          <WriteTaskSolver
            key={`write-${task.id}`}
            task={task}
            value={answers[task.id]?.answer ?? ""}
            onChange={(answer) => onAnswer(task.id, "write", answer)}
            result={results?.get(task.id) ?? null}
            disabled={disabled}
          />
        ))}

        {section.scatterTasks.map((task) => (
          <ScatterTaskSolver
            key={`scatter-${task.id}`}
            task={task}
            value={answers[task.id]?.answer ?? ""}
            onChange={(answer) => onAnswer(task.id, "scatter", answer)}
            result={results?.get(task.id) ?? null}
            disabled={disabled}
          />
        ))}

        {section.speakTasks.map((task) => (
          <SpeakTaskSolver
            key={`speak-${task.id}`}
            lessonId={lessonId}
            task={task}
            transcriptionResult={null}
            attempts={0}
            onChange={(answer) => onAnswer(task.id, "speak", answer)}
            onTranscriptionResult={() => undefined}
            result={results?.get(task.id) ?? null}
            disabled={disabled}
          />
        ))}
      </Stack>
    </Box>
  );
}
