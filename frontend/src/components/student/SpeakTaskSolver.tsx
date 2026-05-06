import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  MicNoneOutlined as MicIcon,
  PauseCircleOutlined as PauseIcon,
  PlayCircleOutlined as PlayIcon,
  ReplayOutlined as RetryIcon,
  StopCircleOutlined as StopIcon,
} from "@mui/icons-material";
import {
  taskService,
  type SpeakTaskResponse,
  type SpeakTranscriptionResponse,
} from "@/api/taskService";
import type { SubmitAnswerDetail } from "@/api/studentService";
import {
  taskCardSx,
  taskFeedbackCorrectSx,
  taskTypeMeta,
} from "./taskSolverStyles";
import { formatPercent } from "@/utils/dashboardUtils";

interface SpeakTaskSolverProps {
  lessonPublicId: string;
  task: SpeakTaskResponse;
  transcriptionResult: SpeakTranscriptionResponse | null;
  attempts: number;
  onChange: (answer: string) => void;
  onTranscriptionResult: (result: SpeakTranscriptionResponse) => void;
  result: SubmitAnswerDetail | null;
  disabled: boolean;
}

const BAR_COUNT = 7;

function MicVisualizer({
  recording,
  analyserRef,
}: {
  recording: boolean;
  analyserRef: React.RefObject<AnalyserNode | null>;
}) {
  const theme = useTheme();
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!recording || !analyserRef.current) {
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = "6px";
      });
      cancelAnimationFrame(animRef.current);
      return;
    }

    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const step = Math.floor(data.length / BAR_COUNT);

    const draw = () => {
      analyser.getByteFrequencyData(data);
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const value = data[i * step + Math.floor(step / 2)] ?? 0;
        bar.style.height = `${Math.max(6, (value / 255) * 48)}px`;
      });
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [recording, analyserRef]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        height: 56,
      }}
    >
      <style>{`
        @keyframes speakBarIdle {
          from { height: 4px; opacity: 0.25; }
          to   { height: 14px; opacity: 0.55; }
        }
      `}</style>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <Box
          key={i}
          ref={(el) => {
            barsRef.current[i] = el as HTMLDivElement | null;
          }}
          sx={{
            width: 4,
            height: 6,
            borderRadius: 8,
            bgcolor: recording
              ? theme.palette.primary.main
              : alpha(theme.palette.text.primary, 0.22),
            transition: recording ? "none" : "height 0.4s ease",
            ...(recording
              ? {}
              : {
                  animation: `speakBarIdle ${0.7 + i * 0.12}s ease-in-out infinite alternate`,
                }),
          }}
        />
      ))}
    </Box>
  );
}

export function SpeakTaskSolver({
  lessonPublicId,
  task,
  transcriptionResult,
  attempts,
  onChange,
  onTranscriptionResult,
  result,
  disabled,
}: SpeakTaskSolverProps) {
  const theme = useTheme();
  const meta = taskTypeMeta.speak;
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (recordingBlobUrl) URL.revokeObjectURL(recordingBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When accepted (correct=true): allow 1 more retry; when not accepted: 3 total
  const maxAttempts = transcriptionResult?.correct
    ? Math.min(attempts + 1, 3)
    : 3;
  const canRecord =
    !disabled &&
    !processing &&
    !recording &&
    attempts < maxAttempts &&
    (transcriptionResult?.score ?? 0) < 1;
  const scorePercent =
    transcriptionResult == null
      ? null
      : Math.max(0, Math.min(1, transcriptionResult.score)) * 100;

  // Build unified word list for display
  const displayWords: {
    text: string;
    wordResult: SpeakTranscriptionResponse["words"][number] | null;
  }[] = transcriptionResult
    ? transcriptionResult.words.map((w) => ({
        text: w.expected,
        wordResult: w,
      }))
    : task.expectedText
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => ({ text: w, wordResult: null }));

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void audioCtx.close();
        analyserRef.current = null;
        const audio = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        // Store for playback
        setRecordingBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(audio);
        });
        setPlaying(false);
        void transcribe(audio);
      };

      recorder.start();
      setRecording(true);
    } catch {
      // Intentionally silent: the task stays in the normal retry state.
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setRecording(false);
  };

  const togglePlayback = () => {
    if (!recordingBlobUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(recordingBlobUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.src = recordingBlobUrl;
      void audioRef.current.play();
      setPlaying(true);
    }
  };

  const transcribe = async (audio: Blob) => {
    if (audio.size === 0) {
      return;
    }
    setProcessing(true);
    try {
      const response = await taskService.transcribeSpeakTask(
        lessonPublicId,
        task.publicId,
        audio,
      );
      onChange(response.text);
      onTranscriptionResult(response);
    } catch {
      // Intentionally silent: the task keeps the user in the retry flow without extra inline errors.
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={taskCardSx}>
      {/* Header: chip only + optional short instruction */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
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
          Wypowiedz poniższy tekst
        </Typography>
      </Box>

      {/* Sentence: words with per-word feedback */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px 16px",
          justifyContent: "center",
          mt: 1,
          mb: 2.5,
          px: 1,
        }}
      >
        {displayWords.map(({ text, wordResult }, i) => {
          const heard = wordResult !== null;
          const correct = wordResult?.correct ?? false;
          const actual = wordResult?.actual ?? "";
          const missed = heard && !correct && !actual;

          const wordColor = !heard
            ? "text.primary"
            : correct
              ? "success.main"
              : actual
                ? "warning.dark"
                : "text.disabled";

          const underlineColor = !heard
            ? "transparent"
            : correct
              ? theme.palette.success.main
              : actual
                ? theme.palette.warning.main
                : theme.palette.divider;

          return (
            <Box
              key={i}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <Typography
                component="span"
                variant="h6"
                fontWeight={700}
                sx={{
                  color: wordColor,
                  borderBottom: `2px solid ${underlineColor}`,
                  pb: "2px",
                  opacity: missed ? 0.38 : 1,
                  transition: "color 0.25s, opacity 0.25s",
                  lineHeight: 1.3,
                }}
              >
                {text}
              </Typography>
              {heard && !correct && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.disabled",
                    fontSize: "0.6rem",
                    lineHeight: 1.2,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {actual ? `(${actual})` : "(—)"}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Score chip */}
      {transcriptionResult && scorePercent !== null && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Chip
            label={`${transcriptionResult.correct ? "Wymowa zaakceptowana" : "Spróbuj poprawić wymowę"} · ${formatPercent(scorePercent)}`}
            color={transcriptionResult.correct ? "success" : "warning"}
            size="small"
            sx={{ borderRadius: 99, fontWeight: 700, fontSize: "0.72rem" }}
          />
        </Box>
      )}

      {/* Microphone visualizer + recording controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <MicVisualizer recording={recording} analyserRef={analyserRef} />
          {recordingBlobUrl && !recording && (
            <Tooltip
              title={playing ? "Zatrzymaj odsłuch" : "Odsłuchaj nagranie"}
            >
              <IconButton
                onClick={togglePlayback}
                color={playing ? "error" : "default"}
                disabled={processing}
                sx={{
                  ml: 0.5,
                  border: "1px solid",
                  borderColor: playing ? "error.main" : "divider",
                  bgcolor: playing
                    ? alpha(theme.palette.error.main, 0.08)
                    : "transparent",
                }}
              >
                {playing ? (
                  <PauseIcon fontSize="small" />
                ) : (
                  <PlayIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {processing ? (
            <Button
              variant="outlined"
              disabled
              startIcon={<CircularProgress size={16} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 99,
                px: 3,
              }}
            >
              Rozpoznawanie mowy…
            </Button>
          ) : (
            <Button
              variant={recording ? "contained" : "outlined"}
              color={recording ? "error" : "primary"}
              startIcon={
                recording ? (
                  <StopIcon />
                ) : attempts > 0 ? (
                  <RetryIcon />
                ) : (
                  <MicIcon />
                )
              }
              disabled={recording ? disabled : !canRecord}
              onClick={recording ? stopRecording : startRecording}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 99,
                px: 3,
                minWidth: 190,
              }}
            >
              {recording
                ? "Zatrzymaj nagrywanie"
                : attempts === 0
                  ? "Nagraj odpowiedź"
                  : "Spróbuj ponownie"}
            </Button>
          )}
        </Stack>

        {attempts > 0 &&
          !recording &&
          !processing &&
          (transcriptionResult?.score ?? 0) < 1 && (
            <Typography variant="caption" color="text.secondary">
              Próba {attempts} z {maxAttempts}
            </Typography>
          )}
      </Box>

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
