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
  lessonPublicId: string;
  section: TaskSectionDto;
  answers: Record<string, SubmitAnswerItem>;
  onAnswer: (
    taskPublicId: string,
    taskType: SubmitAnswerItem["taskType"],
    answer: string,
  ) => void;
  results: Map<string, SubmitAnswerDetail> | null;
  disabled: boolean;
}

export function TaskSectionGroup({
  lessonPublicId,
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
            key={`choose-${task.publicId}`}
            task={task}
            value={answers[task.publicId]?.answer ?? ""}
            onChange={(answer) => onAnswer(task.publicId, "choose", answer)}
            result={results?.get(task.publicId) ?? null}
            disabled={disabled}
          />
        ))}

        {section.writeTasks.map((task) => (
          <WriteTaskSolver
            key={`write-${task.publicId}`}
            task={task}
            value={answers[task.publicId]?.answer ?? ""}
            onChange={(answer) => onAnswer(task.publicId, "write", answer)}
            result={results?.get(task.publicId) ?? null}
            disabled={disabled}
          />
        ))}

        {section.scatterTasks.map((task) => (
          <ScatterTaskSolver
            key={`scatter-${task.publicId}`}
            task={task}
            value={answers[task.publicId]?.answer ?? ""}
            onChange={(answer) => onAnswer(task.publicId, "scatter", answer)}
            result={results?.get(task.publicId) ?? null}
            disabled={disabled}
          />
        ))}

        {section.speakTasks.map((task) => (
          <SpeakTaskSolver
            key={`speak-${task.publicId}`}
            lessonPublicId={lessonPublicId}
            task={task}
            transcriptionResult={null}
            attempts={0}
            onChange={(answer) => onAnswer(task.publicId, "speak", answer)}
            onTranscriptionResult={() => undefined}
            result={results?.get(task.publicId) ?? null}
            disabled={disabled}
          />
        ))}
      </Stack>
    </Box>
  );
}
