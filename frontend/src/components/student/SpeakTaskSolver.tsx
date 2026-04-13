import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  MicNoneOutlined as MicIcon,
  StopCircleOutlined as StopIcon,
  UploadFileOutlined as TranscribeIcon,
} from "@mui/icons-material";
import {
  taskService,
  type SpeakTaskResponse,
  type SpeakTranscriptionResponse,
} from "@/api/taskService";
import type { SubmitAnswerDetail } from "@/api/studentService";
import {
  taskCardSx,
  taskHeaderSx,
  taskHintSx,
  taskFeedbackCorrectSx,
  taskTypeMeta,
} from "./taskSolverStyles";

interface SpeakTaskSolverProps {
  lessonId: number;
  task: SpeakTaskResponse;
  value: string;
  onChange: (answer: string) => void;
  result: SubmitAnswerDetail | null;
  disabled: boolean;
}

export function SpeakTaskSolver({
  lessonId,
  task,
  value,
  onChange,
  result,
  disabled,
}: SpeakTaskSolverProps) {
  const meta = taskTypeMeta.speak;
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [transcriptionResult, setTranscriptionResult] =
    useState<SpeakTranscriptionResponse | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const canRecord =
    !disabled &&
    !processing &&
    (attempts === 0 || (attempts < 2 && !transcriptionResult?.correct));

  const startRecording = async () => {
    setRecordingError(null);
    setLastScore(null);
    setTranscriptionResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audio = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        void transcribe(audio);
      };

      recorder.start();
      setRecording(true);
      onChange("");
    } catch {
      setRecordingError(
        "Nie udalo sie uruchomic mikrofonu. Sprawdz uprawnienia przegladarki.",
      );
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setRecording(false);
  };

  const transcribe = async (audio: Blob) => {
    if (audio.size === 0) {
      setRecordingError("Nagranie jest puste. Sprobuj ponownie.");
      return;
    }

    setProcessing(true);
    setRecordingError(null);
    try {
      const response = await taskService.transcribeSpeakTask(
        lessonId,
        task.id,
        audio,
      );
      onChange(response.text);
      setLastScore(response.score);
      setTranscriptionResult(response);
      setAttempts((prev) => prev + 1);
    } catch {
      setRecordingError(
        "Nie udalo sie rozpoznac nagrania. Sprobuj ponownie za chwile.",
      );
    } finally {
      setProcessing(false);
    }
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

      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          Przeczytaj na glos:
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {task.expectedText}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant={recording ? "contained" : "outlined"}
            color={recording ? "error" : "primary"}
            startIcon={recording ? <StopIcon /> : <MicIcon />}
            disabled={recording ? disabled : !canRecord}
            onClick={recording ? stopRecording : startRecording}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            {recording
              ? "Zakoncz nagrywanie"
              : attempts === 0
                ? "Nagraj odpowiedz"
                : "Powtorz probe"}
          </Button>
          {processing && (
            <Button
              variant="outlined"
              disabled
              startIcon={<CircularProgress size={16} />}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Rozpoznawanie mowy
            </Button>
          )}
        </Stack>

        {value && (
          <Alert
            severity="info"
            icon={<TranscribeIcon />}
            sx={{ borderRadius: 2 }}
          >
            Transkrypcja: {value}
            {lastScore != null && ` (${Math.round(lastScore * 100)}%)`}
          </Alert>
        )}

        {transcriptionResult && (
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {transcriptionResult.words.map((word, index) => (
              <Chip
                key={`${word.expected}-${index}`}
                label={word.expected}
                size="small"
                color={word.correct ? "success" : "error"}
                variant={word.correct ? "filled" : "outlined"}
                title={
                  word.correct
                    ? "Poprawnie"
                    : `Uslyszano: ${word.actual || "-"}`
                }
                sx={{ borderRadius: 2, fontWeight: 700 }}
              />
            ))}
          </Stack>
        )}

        {attempts >= 2 && !transcriptionResult?.correct && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Wykorzystano dwie proby. Dalej zostanie wyslana ostatnia
            transkrypcja.
          </Alert>
        )}

        {recordingError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {recordingError}
          </Alert>
        )}
      </Stack>

      {task.hint && (
        <Typography sx={taskHintSx}>Podpowiedz: {task.hint}</Typography>
      )}

      {result && (
        <Box sx={result.isCorrect ? taskFeedbackCorrectSx : { mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {result.isCorrect && (
              <CorrectIcon color="success" fontSize="small" />
            )}
            <Typography variant="body2" fontWeight={600}>
              {result.isCorrect
                ? "Wymowa zaakceptowana."
                : `Oczekiwany tekst: ${result.correctAnswer}`}
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
