import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutline as ChooseIcon,
  DeleteOutline as DeleteIcon,
  DragIndicator as DragIcon,
  EditNoteOutlined as WriteIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  MicNoneOutlined as SpeakIcon,
  ShuffleOutlined as ScatterIcon,
} from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type ReactNode } from "react";
import type { TaskType } from "@/api/taskService";
import { uiTokens } from "@/theme/uiTokens";
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
}

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

/* ── Compact header used both in-place and inside DragOverlay ── */

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
  };
}) {
  const meta = taskTypeMeta[task.type];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1.25,
        borderBottom: expanded ? "1px solid" : "none",
        borderColor: (theme) =>
          alpha(
            theme.palette.divider,
            theme.palette.mode === "dark" ? 0.15 : 0.2,
          ),
        bgcolor: (theme) =>
          alpha(meta.color, theme.palette.mode === "dark" ? 0.06 : 0.04),
        cursor: isDragOverlay ? "grabbing" : "pointer",
        transition: "background-color 0.2s ease",
        ...(!isDragOverlay && {
          "&:hover": {
            bgcolor: (theme: import("@mui/material/styles").Theme) =>
              alpha(meta.color, theme.palette.mode === "dark" ? 0.1 : 0.07),
          },
        }),
      }}
      onClick={onToggle}
    >
      <Box
        ref={dragHandleProps?.ref}
        {...dragHandleProps?.listeners}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: isDragOverlay ? "grabbing" : "grab",
          flexShrink: 0,
          touchAction: "none",
          color: "text.disabled",
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
          "& .MuiChip-icon": { color: meta.color },
        }}
      />
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {task.task || `Zadanie ${index + 1}`}
      </Typography>
      {!isDragOverlay && (
        <>
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
          <IconButton size="small" sx={{ color: "text.secondary" }}>
            {expanded ? (
              <CollapseIcon fontSize="small" />
            ) : (
              <ExpandIcon fontSize="small" />
            )}
          </IconButton>
        </>
      )}
    </Box>
  );
}

/* ── Portal overlay shown while dragging ── */

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

/* ── Full sortable task card ── */

interface TaskCardProps {
  task: LessonTaskDraft;
  index: number;
  onChange: (updated: LessonTaskDraft) => void;
  onDelete: () => void;
}

export function TaskCard({ task, index, onChange, onDelete }: TaskCardProps) {
  const [expanded, setExpanded] = useState(true);
  const meta = taskTypeMeta[task.type];

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateField = <K extends keyof LessonTaskDraft>(
    field: K,
    value: LessonTaskDraft[K],
  ) => {
    onChange({ ...task, [field]: value });
  };

  /* While dragging, show a slim placeholder so the list doesn't jump */
  if (isDragging) {
    return (
      <Box
        ref={setNodeRef}
        style={style}
        {...attributes}
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
      {...attributes}
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
        "&:hover": {
          borderColor: () => alpha(meta.color, 0.4),
          boxShadow: `0 4px 16px ${alpha(meta.color, 0.1)}`,
        },
        "@keyframes taskSlideIn": {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        animation: "taskSlideIn 0.3s ease-out",
      }}
    >
      <TaskCardHeader
        task={task}
        index={index}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
        onDelete={onDelete}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          listeners: listeners as Record<string, unknown>,
        }}
      />

      {/* Body */}
      <Collapse in={expanded} timeout={250}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Treść zadania"
              value={task.task}
              onChange={(e) => updateField("task", e.target.value)}
              multiline
              minRows={2}
              fullWidth
              placeholder="Wpisz treść pytania lub polecenia..."
            />

            {/* Type-specific fields */}
            {task.type === "choose" && (
              <ChooseAnswerBuilder
                possibleAnswers={task.possibleAnswers}
                correctAnswer={task.correctAnswer}
                onChange={(pa, ca) =>
                  onChange({ ...task, possibleAnswers: pa, correctAnswer: ca })
                }
              />
            )}

            {task.type === "scatter" && (
              <>
                <ScatterWordBuilder
                  words={task.words}
                  onChange={(w) => updateField("words", w)}
                />
                <TextField
                  label="Poprawna kolejność (pełne zdanie)"
                  value={task.correctAnswer}
                  onChange={(e) => updateField("correctAnswer", e.target.value)}
                  fullWidth
                  placeholder="np. The cat is big"
                />
              </>
            )}

            {task.type === "write" && (
              <TextField
                label="Poprawna odpowiedź"
                value={task.correctAnswer}
                onChange={(e) => updateField("correctAnswer", e.target.value)}
                fullWidth
                placeholder="Wpisz oczekiwaną odpowiedź..."
              />
            )}

            {/* Common optional fields */}
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
                onChange={(e) => updateField("hint", e.target.value)}
                fullWidth
                size="small"
                placeholder="Wskazówka dla ucznia..."
              />
              <TextField
                label="Sekcja (opcjonalnie)"
                value={task.section}
                onChange={(e) => updateField("section", e.target.value)}
                fullWidth
                size="small"
                placeholder="Nazwa sekcji grupującej..."
              />
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
