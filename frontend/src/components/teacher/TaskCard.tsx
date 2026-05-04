import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  AddPhotoAlternateOutlined as AddImageIcon,
  CheckCircleOutline as ChooseIcon,
  DeleteOutline as DeleteIcon,
  DragIndicator as DragIcon,
  EditNoteOutlined as WriteIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  ImageNotSupportedOutlined as NoImageIcon,
  MicNoneOutlined as SpeakIcon,
  ShuffleOutlined as ScatterIcon,
} from "@mui/icons-material";
import { keyframes } from "@emotion/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { TaskType } from "@/api/taskService";
import { taskService } from "@/api/taskService";
import { fetchApiBlob } from "@/api/apiClient";
import { uiTokens } from "@/theme/uiTokens";
import { INPUT_LIMITS } from "@/utils/inputLimits";
import { ChooseAnswerBuilder } from "./ChooseAnswerBuilder";
import { ScatterWordBuilder } from "./ScatterWordBuilder";

export interface LessonTaskDraft {
  id: string;
  type: TaskType;
  task: string;
  possibleAnswers: string;
  correctAnswer: string;
  words: string;
  hint: string;
  section: string;
  hintImageUrl: string | null;
}

// Defined at module level — not recreated on re-render
const taskSlideIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

const taskTypeMeta: Record<
  TaskType,
  { label: string; icon: ReactNode; color: string }
> = {
  choose: {
    label: "Wybór",
    icon: <ChooseIcon fontSize="small" />,
    color: "#10b981",
  },
  write: {
    label: "Pisanie",
    icon: <WriteIcon fontSize="small" />,
    color: "#6366f1",
  },
  scatter: {
    label: "Rozsypanka",
    icon: <ScatterIcon fontSize="small" />,
    color: "#f59e0b",
  },
  speak: {
    label: "Mówienie",
    icon: <SpeakIcon fontSize="small" />,
    color: "#ec4899",
  },
};

// ─── Header ───────────────────────────────────────────────────────────────────
// The entire header row is both the drag activator and the toggle trigger.
// PointerSensor distance:3 constraint distinguishes a click (toggle) from a drag.
// Action buttons (delete, chevron) stop propagation so they don't toggle.
function TaskCardHeader({
  task,
  index,
  isDragOverlay,
  expanded,
  onToggle,
  onDelete,
  dragHandleProps,
}: {
  task: LessonTaskDraft;
  index: number;
  isDragOverlay?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
  dragHandleProps?: {
    ref: React.Ref<HTMLElement>;
    listeners: Record<string, unknown>;
    attributes: DraggableAttributes;
  };
}) {
  const meta = taskTypeMeta[task.type];

  return (
    <Box
      ref={dragHandleProps?.ref}
      {...dragHandleProps?.attributes}
      {...dragHandleProps?.listeners}
      onClick={() => {
        if (!isDragOverlay) onToggle?.();
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        borderBottom: expanded ? "1px solid" : "none",
        borderColor: (theme) =>
          alpha(
            theme.palette.divider,
            theme.palette.mode === "dark" ? 0.15 : 0.2,
          ),
        bgcolor: (theme) =>
          alpha(meta.color, theme.palette.mode === "dark" ? 0.06 : 0.04),
        cursor: isDragOverlay ? "grabbing" : "pointer",
        touchAction: "none",
        userSelect: "none",
        transition: "background-color 0.2s ease",
        ...(!isDragOverlay && {
          "&:hover": {
            bgcolor: (theme: import("@mui/material/styles").Theme) =>
              alpha(meta.color, theme.palette.mode === "dark" ? 0.1 : 0.07),
          },
        }),
      }}
    >
      {/* Visual drag indicator only — no listeners here */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          px: 1.5,
          py: 1.25,
          color: "text.disabled",
          transition: "color 0.15s ease",
          "&:hover": { color: "text.secondary" },
        }}
      >
        <DragIcon fontSize="small" />
      </Box>

      <Chip
        icon={meta.icon as React.ReactElement}
        label={meta.label}
        size="small"
        sx={{
          fontWeight: 700,
          bgcolor: alpha(meta.color, 0.12),
          color: meta.color,
          borderRadius: uiTokens.radius.control,
          flexShrink: 0,
          "& .MuiChip-icon": { color: meta.color },
        }}
      />
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ flex: 1, minWidth: 0, mx: 1, overflowWrap: "anywhere" }}
      >
        {task.task || `Zadanie ${index + 1}`}
      </Typography>

      {!isDragOverlay && (
        <Box sx={{ display: "flex", alignItems: "center", pr: 0.5 }}>
          <Tooltip title="Usuń zadanie" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              sx={{
                color: "text.secondary",
                transition: "all 0.15s ease",
                "&:hover": { color: "error.main", transform: "scale(1.1)" },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            sx={{ color: "text.secondary" }}
          >
            {expanded ? (
              <CollapseIcon fontSize="small" />
            ) : (
              <ExpandIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

// ─── Overlay (shown while dragging) ──────────────────────────────────────────
export function TaskCardOverlay({
  task,
  index,
}: {
  task: LessonTaskDraft;
  index: number;
}) {
  const meta = taskTypeMeta[task.type];

  return (
    <Box
      sx={{
        borderRadius: uiTokens.radius.card,
        border: "1px solid",
        borderColor: () => alpha(meta.color, 0.4),
        bgcolor: "background.paper",
        overflow: "hidden",
        boxShadow: `0 12px 32px ${alpha(meta.color, 0.18)}, 0 4px 12px rgba(0,0,0,0.1)`,
        cursor: "grabbing",
      }}
    >
      <TaskCardHeader
        task={task}
        index={index}
        isDragOverlay
        expanded={false}
      />
    </Box>
  );
}

// ─── Memoized fields ──────────────────────────────────────────────────────────
// Only re-renders when task data changes (user typing) — not on dnd transforms.
const TaskCardFields = memo(function TaskCardFields({
  task,
  onChangeById,
  existingSections,
  lessonPublicId,
}: {
  task: LessonTaskDraft;
  onChangeById: (id: string, updated: LessonTaskDraft) => void;
  existingSections: string[];
  lessonPublicId?: string;
}) {
  const updateField = useCallback(
    <K extends keyof LessonTaskDraft>(field: K, value: LessonTaskDraft[K]) => {
      onChangeById(task.id, { ...task, [field]: value });
    },
    [task, onChangeById],
  );

  // Local state for the section input — committed to parent only on blur or dropdown
  // select, so typing doesn't create a new section on every keystroke.
  // Initialised from task.section on focus (not via effect/ref), which also handles
  // external changes (e.g. drag-based reassignment) naturally.
  const [sectionInput, setSectionInput] = useState(task.section);
  const [sectionFocused, setSectionFocused] = useState(false);

  // ── Hint image state ────────────────────────────────────────────────────────

  const [hintImageBlobUrl, setHintImageBlobUrl] = useState<string | null>(null);
  const [isHintImageLoading, setIsHintImageLoading] = useState(false);
  const [hintImageError, setHintImageError] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load authenticated blob URL whenever hintImageUrl changes
  useEffect(() => {
    if (!task.hintImageUrl) {
      setHintImageBlobUrl(null);
      setHintImageError(false);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    setIsHintImageLoading(true);
    setHintImageError(false);
    fetchApiBlob(task.hintImageUrl)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setHintImageBlobUrl(objectUrl);
        setIsHintImageLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setHintImageBlobUrl(null);
        setHintImageError(true);
        setIsHintImageLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [task.hintImageUrl]);

  const parsedId = (() => {
    const m = /^backendTask:(\w+):(.+)$/.exec(task.id);
    return m ? { type: m[1], taskPublicId: m[2] } : null;
  })();
  const isBackendTask = parsedId !== null;

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!lessonPublicId || !parsedId) return;
      setIsUploadingImage(true);
      try {
        await taskService.uploadHintImage(
          lessonPublicId,
          parsedId.type,
          parsedId.taskPublicId,
          file,
        );
        const newUrl = `/api/v1/lessons/${lessonPublicId}/tasks/${parsedId.type}/${parsedId.taskPublicId}/hint-image`;
        onChangeById(task.id, { ...task, hintImageUrl: newUrl });
      } catch {
        // silent — user sees no change
      } finally {
        setIsUploadingImage(false);
      }
    },
    [lessonPublicId, parsedId, task, onChangeById],
  );

  const handleImageFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset input so the same file can be re-selected after a delete
      e.target.value = "";
      void handleImageUpload(file);
    },
    [handleImageUpload],
  );

  const handleHintPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!isBackendTask || !lessonPublicId || !parsedId) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            void handleImageUpload(file);
            return;
          }
        }
      }
    },
    [isBackendTask, lessonPublicId, parsedId, handleImageUpload],
  );

  const handleImageRemove = useCallback(async () => {
    if (!lessonPublicId || !parsedId) return;
    setIsRemovingImage(true);
    try {
      await taskService.deleteHintImage(
        lessonPublicId,
        parsedId.type,
        parsedId.taskPublicId,
      );
      onChangeById(task.id, { ...task, hintImageUrl: null });
    } catch {
      // silent
    } finally {
      setIsRemovingImage(false);
    }
  }, [lessonPublicId, parsedId, task, onChangeById]);

  const handleChooseChange = useCallback(
    (pa: string, ca: string) =>
      onChangeById(task.id, {
        ...task,
        possibleAnswers: pa,
        correctAnswer: ca,
      }),
    [task, onChangeById],
  );

  const handleWordsChange = useCallback(
    (w: string) => updateField("words", w),
    [updateField],
  );

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <TextField
          label="Treść zadania"
          value={task.task}
          onChange={(e) =>
            updateField("task", e.target.value.slice(0, INPUT_LIMITS.taskText))
          }
          inputProps={{ maxLength: INPUT_LIMITS.taskText }}
          helperText={`${task.task.length}/${INPUT_LIMITS.taskText}`}
          multiline
          minRows={2}
          fullWidth
          placeholder="Wpisz treść pytania lub polecenia..."
        />

        {task.type === "choose" && (
          <ChooseAnswerBuilder
            possibleAnswers={task.possibleAnswers}
            correctAnswer={task.correctAnswer}
            onChange={handleChooseChange}
          />
        )}

        {task.type === "scatter" && (
          <>
            <ScatterWordBuilder
              words={task.words}
              onChange={handleWordsChange}
            />
            <TextField
              label="Poprawna kolejność (pełne zdanie)"
              value={task.correctAnswer}
              onChange={(e) =>
                updateField(
                  "correctAnswer",
                  e.target.value.slice(0, INPUT_LIMITS.taskAnswerText),
                )
              }
              inputProps={{ maxLength: INPUT_LIMITS.taskAnswerText }}
              helperText={`${task.correctAnswer.length}/${INPUT_LIMITS.taskAnswerText}`}
              fullWidth
              placeholder="np. The cat is big"
            />
          </>
        )}

        {task.type === "write" && (
          <TextField
            label="Poprawna odpowiedź"
            value={task.correctAnswer}
            onChange={(e) =>
              updateField(
                "correctAnswer",
                e.target.value.slice(0, INPUT_LIMITS.taskAnswerText),
              )
            }
            inputProps={{ maxLength: INPUT_LIMITS.taskAnswerText }}
            helperText={`${task.correctAnswer.length}/${INPUT_LIMITS.taskAnswerText}`}
            fullWidth
            placeholder="Wpisz oczekiwaną odpowiedź..."
          />
        )}

        {task.type === "speak" && (
          <TextField
            label="Tekst do rozpoznania"
            value={task.correctAnswer}
            onChange={(e) =>
              updateField(
                "correctAnswer",
                e.target.value.slice(0, INPUT_LIMITS.taskAnswerText),
              )
            }
            inputProps={{ maxLength: INPUT_LIMITS.taskAnswerText }}
            fullWidth
            placeholder="np. The cat is black and the dog is brown"
            helperText={`${task.correctAnswer.length}/${INPUT_LIMITS.taskAnswerText} • Uczeń nagra ten tekst, a STT porówna transkrypcję z tą wartością.`}
          />
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <TextField
            label="Podpowiedź (opcjonalnie)"
            value={task.hint}
            onChange={(e) =>
              updateField(
                "hint",
                e.target.value.slice(0, INPUT_LIMITS.taskHint),
              )
            }
            onPaste={handleHintPaste}
            inputProps={{ maxLength: INPUT_LIMITS.taskHint }}
            helperText={`${task.hint.length}/${INPUT_LIMITS.taskHint}`}
            fullWidth
            size="small"
            placeholder="Wskazówka dla ucznia..."
          />
          {/* Sekcja — freeSolo Autocomplete: wybór z listy lub wpisanie nowej.
              Commit do parenta następuje dopiero na blur lub wyborze z listy,
              żeby nie tworzyć sekcji po każdej wpisanej literze. */}
          <Autocomplete
            freeSolo
            options={existingSections}
            value={task.section}
            inputValue={sectionFocused ? sectionInput : task.section}
            onFocus={() => {
              setSectionInput(task.section);
              setSectionFocused(true);
            }}
            onInputChange={(_, value, reason) => {
              const clamped = value.slice(0, INPUT_LIMITS.taskSection);
              setSectionInput(clamped);
              if (reason !== "input") {
                updateField("section", clamped);
              }
            }}
            onBlur={() => {
              setSectionFocused(false);
              updateField("section", sectionInput);
            }}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sekcja (opcjonalnie)"
                helperText={
                  existingSections.length > 0
                    ? `${sectionInput.length}/${INPUT_LIMITS.taskSection} • wybierz lub wpisz nową`
                    : `${sectionInput.length}/${INPUT_LIMITS.taskSection}`
                }
                placeholder="Nazwa sekcji grupującej..."
              />
            )}
          />
        </Box>

        {/* ── Hint image ─────────────────────────────────────────────────────── */}
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Zdjęcie jako podpowiedź (opcjonalnie)
          </Typography>

          {!isBackendTask ? (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: "block", mt: 0.5 }}
            >
              Najpierw zapisz zadanie, aby móc dodać zdjęcie.
            </Typography>
          ) : (
            <Box sx={{ mt: 0.75 }}>
              {task.hintImageUrl ? (
                /* Preview + remove */
                <Box
                  sx={{
                    display: "inline-flex",
                    flexDirection: "column",
                    gap: 0.75,
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      borderRadius: uiTokens.radius.control,
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: (theme) => alpha(theme.palette.divider, 0.3),
                      maxWidth: 200,
                    }}
                  >
                    {isHintImageLoading && (
                      <Box
                        sx={{
                          width: 120,
                          height: 80,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CircularProgress size={20} />
                      </Box>
                    )}
                    {!isHintImageLoading && hintImageError && (
                      <Box
                        sx={{
                          width: 120,
                          height: 80,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "action.hover",
                          gap: 0.5,
                        }}
                      >
                        <NoImageIcon
                          sx={{ fontSize: 18, color: "text.disabled" }}
                        />
                        <Typography variant="caption" color="text.disabled">
                          Błąd
                        </Typography>
                      </Box>
                    )}
                    {!isHintImageLoading &&
                      !hintImageError &&
                      hintImageBlobUrl && (
                        <img
                          src={hintImageBlobUrl}
                          alt="Podpowiedź"
                          style={{
                            display: "block",
                            maxWidth: 200,
                            maxHeight: 160,
                            objectFit: "contain",
                          }}
                        />
                      )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Zamień zdjęcie" arrow>
                      <span>
                        <IconButton
                          size="small"
                          disabled={isUploadingImage || isRemovingImage}
                          onClick={() => fileInputRef.current?.click()}
                          sx={{ color: "primary.main" }}
                        >
                          {isUploadingImage ? (
                            <CircularProgress size={16} />
                          ) : (
                            <AddImageIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Usuń zdjęcie" arrow>
                      <span>
                        <IconButton
                          size="small"
                          disabled={isUploadingImage || isRemovingImage}
                          onClick={handleImageRemove}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "error.main" },
                          }}
                        >
                          {isRemovingImage ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              ) : (
                /* Upload button */
                <Tooltip
                  title="JPEG, PNG, WebP lub GIF • maks. 5 MB"
                  placement="right"
                  arrow
                >
                  <span>
                    <IconButton
                      size="small"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        mt: 0.25,
                        color: "text.secondary",
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: uiTokens.radius.control,
                        px: 1.5,
                        py: 0.5,
                        gap: 0.5,
                        "&:hover": {
                          color: "primary.main",
                          borderColor: "primary.main",
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      {isUploadingImage ? (
                        <CircularProgress size={16} />
                      ) : (
                        <AddImageIcon fontSize="small" />
                      )}
                      <Typography variant="caption" fontWeight={600}>
                        Dodaj zdjęcie
                      </Typography>
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleImageFileChange}
              />
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
});

// ─── TaskCard ─────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: LessonTaskDraft;
  index: number;
  onChangeById: (id: string, updated: LessonTaskDraft) => void;
  onDeleteById: (id: string) => void;
  existingSections: string[];
  defaultExpanded?: boolean;
  lessonPublicId?: string;
}

export function TaskCard({
  task,
  index,
  onChangeById,
  onDeleteById,
  existingSections,
  defaultExpanded = false,
  lessonPublicId,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const meta = taskTypeMeta[task.type];

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", sectionName: task.section },
  });

  const style = {
    transform: CSS.Transform.toString(
      transform ? { ...transform, scaleX: 1, scaleY: 1 } : null,
    ),
    transition,
    willChange: (transform ? "transform" : "auto") as "transform" | "auto",
  };

  const handleDelete = useCallback(
    () => onDeleteById(task.id),
    [onDeleteById, task.id],
  );

  const handleToggle = useCallback(() => setExpanded((prev) => !prev), []);

  if (isDragging) {
    return (
      <Box
        ref={setNodeRef}
        style={style}
        sx={{
          borderRadius: uiTokens.radius.card,
          border: "2px dashed",
          borderColor: () => alpha(meta.color, 0.35),
          bgcolor: (theme) =>
            alpha(meta.color, theme.palette.mode === "dark" ? 0.06 : 0.04),
          height: 48,
        }}
      />
    );
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        borderRadius: uiTokens.radius.card,
        border: "1px solid",
        borderColor: (theme) =>
          alpha(
            theme.palette.divider,
            theme.palette.mode === "dark" ? 0.22 : 0.32,
          ),
        bgcolor: (theme) =>
          alpha(
            theme.palette.common.white,
            theme.palette.mode === "dark" ? 0.02 : 0.7,
          ),
        overflow: "hidden",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        animation: `${taskSlideIn} 0.25s ease-out`,
        "&:hover": {
          borderColor: () => alpha(meta.color, 0.4),
          boxShadow: `0 4px 16px ${alpha(meta.color, 0.1)}`,
        },
      }}
    >
      <TaskCardHeader
        task={task}
        index={index}
        expanded={expanded}
        onToggle={handleToggle}
        onDelete={handleDelete}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          listeners: listeners as Record<string, unknown>,
          attributes: attributes,
        }}
      />

      <Collapse in={expanded} timeout={200} unmountOnExit>
        <TaskCardFields
          task={task}
          onChangeById={onChangeById}
          existingSections={existingSections}
          lessonPublicId={lessonPublicId}
        />
      </Collapse>
    </Box>
  );
}
