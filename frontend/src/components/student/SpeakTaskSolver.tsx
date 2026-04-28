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
} from "@mui/icons-material";
import {
  taskService,
  type SpeakTaskResponse,
  type SpeakTranscriptionResponse,
} from "@/api/taskService";
import { ApiError } from "@/api/apiClient";
import type { SubmitAnswerDetail } from "@/api/studentService";
import {
  taskCardSx,
  taskHeaderSx,
  taskHintSx,
  taskFeedbackCorrectSx,
  taskTypeMeta,
} from "./taskSolverStyles";
import { formatPercent } from "@/utils/dashboardUtils";
import { getApiErrorMessage } from "@/utils/dashboardUtils";

interface SpeakTaskSolverProps {
  lessonId: number;
  task: SpeakTaskResponse;
  transcriptionResult: SpeakTranscriptionResponse | null;
  attempts: number;
  onChange: (answer: string) => void;
  onTranscriptionResult: (result: SpeakTranscriptionResponse) => void;
  result: SubmitAnswerDetail | null;
  disabled: boolean;
}

export function SpeakTaskSolver({
  lessonId,
  task,
  transcriptionResult,
  attempts,
  onChange,
  onTranscriptionResult,
  result,
  disabled,
}: SpeakTaskSolverProps) {
  const meta = taskTypeMeta.speak;
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const maxAttempts = transcriptionResult?.correct ? 2 : 3;
  const canRecord =
    !disabled && !processing && !recording && attempts < maxAttempts;
  const scorePercent =
    transcriptionResult == null
      ? null
      : Math.max(0, Math.min(1, transcriptionResult.score)) * 100;

  const startRecording = async () => {
    setRecordingError(null);
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
      onTranscriptionResult(response);
    } catch (error) {
      if (error instanceof ApiError) {
        setRecordingError(
          getApiErrorMessage(
            error,
            "Nie udalo sie rozpoznac nagrania. Sprobuj ponownie za chwile.",
          ),
        );
      } else {
        setRecordingError(
          "Nie udalo sie rozpoznac nagrania. Sprobuj ponownie za chwile.",
        );
      }
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
          {attempts > 0 && (
            <Chip
              label={`Proba ${attempts}/${maxAttempts}`}
              size="small"
              variant="outlined"
              sx={{
                alignSelf: { xs: "flex-start", sm: "center" },
                borderRadius: 2,
              }}
            />
          )}
        </Stack>

        {transcriptionResult && (
          <Box
            sx={{
              border: "1px solid",
              borderColor: transcriptionResult.correct
                ? "success.light"
                : "warning.light",
              bgcolor: (theme) =>
                alpha(
                  transcriptionResult.correct
                    ? theme.palette.success.main
                    : theme.palette.warning.main,
                  theme.palette.mode === "dark" ? 0.1 : 0.08,
                ),
              borderRadius: 2,
              p: 1.5,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1}
              sx={{ mb: 1.25 }}
            >
              <Typography variant="subtitle2" fontWeight={800}>
                {transcriptionResult.correct
                  ? "Wymowa zaakceptowana"
                  : "Sprobuj poprawic zaznaczone slowa"}
              </Typography>
              <Chip
                label={formatPercent(scorePercent)}
                color={transcriptionResult.correct ? "success" : "warning"}
                size="small"
                sx={{ borderRadius: 2, fontWeight: 800, minWidth: 58 }}
              />
            </Stack>

            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {transcriptionResult.words.map((word, index) => (
                <Box
                  key={`${word.expected}-${index}`}
                  sx={{
                    px: 1,
                    py: 0.75,
                    minHeight: 36,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: word.correct ? "success.main" : "error.main",
                    bgcolor: (theme) =>
                      alpha(
                        word.correct
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                        theme.palette.mode === "dark" ? 0.18 : 0.1,
                      ),
                  }}
                >
                  <Typography
                    component="span"
                    variant="body2"
                    fontWeight={800}
                    color={word.correct ? "success.dark" : "error.dark"}
                  >
                    {word.expected}
                  </Typography>
                  {!word.correct && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", lineHeight: 1.1 }}
                    >
                      {word.actual
                        ? `uslyszano: ${word.actual}`
                        : "nie uslyszano"}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {attempts >= 2 && !transcriptionResult?.correct && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {attempts >= 3
              ? "Wykorzystano trzy proby. Dalej zostanie wyslana ostatnia transkrypcja."
              : "Mozesz nagrac jeszcze jedna probe."}
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
