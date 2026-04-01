import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AddCircleOutlined as AddIcon } from "@mui/icons-material";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, snapCenterToCursor } from "@dnd-kit/modifiers";
import type { TaskType } from "@/api/taskService";
import { uiTokens } from "@/theme/uiTokens";
import { TaskCard, TaskCardOverlay } from "./TaskCard";
import type { LessonTaskDraft } from "./TaskCard";
import { TaskTypeSelector } from "./TaskTypeSelector";
import { useState } from "react";

function createEmptyTaskDraft(type: TaskType = "write"): LessonTaskDraft {
  return {
    id: window.crypto.randomUUID(),
    type,
    task: "",
    possibleAnswers: "",
    correctAnswer: "",
    words: "",
    hint: "",
    section: "",
  };
}

interface TaskEditorProps {
  tasks: LessonTaskDraft[];
  onChange: (tasks: LessonTaskDraft[]) => void;
}

export function TaskEditor({ tasks, onChange }: TaskEditorProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onChange(reordered);
  };

  const handleAddTask = (type: TaskType) => {
    onChange([...tasks, createEmptyTaskDraft(type)]);
    setShowTypeSelector(false);
  };

  const handleUpdateTask = (index: number, updated: LessonTaskDraft) => {
    const next = [...tasks];
    next[index] = updated;
    onChange(next);
  };

  const handleDeleteTask = (index: number) => {
    onChange(tasks.filter((_, i) => i !== index));
  };

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {tasks.length === 0
              ? "Brak dodanych zadań."
              : `Dodano zadań: ${tasks.length}`}
          </Typography>
          {tasks.length > 0 && (
            <Chip
              label={tasks.length}
              size="small"
              color="primary"
              sx={{ fontWeight: 700, minWidth: 28, height: 22 }}
            />
          )}
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowTypeSelector((prev) => !prev)}
          sx={{
            borderRadius: uiTokens.radius.control,
            textTransform: "none",
            fontWeight: 600,
            borderStyle: "dashed",
            transition: "all 0.2s ease",
            "&:hover": {
              borderStyle: "solid",
              transform: "translateY(-1px)",
            },
          }}
        >
          Dodaj zadanie
        </Button>
      </Box>

      {/* Type selector */}
      {showTypeSelector && (
        <Box
          sx={{
            p: 2,
            borderRadius: uiTokens.radius.card,
            border: "1px solid",
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
            bgcolor: (theme) =>
              alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.03 : 0.015,
              ),
            "@keyframes selectorSlide": {
              from: { opacity: 0, transform: "translateY(-8px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
            animation: "selectorSlide 0.25s ease-out",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Wybierz typ zadania
          </Typography>
          <TaskTypeSelector onSelect={handleAddTask} />
        </Box>
      )}

      {/* Task list with drag & drop */}
      {tasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1.5}>
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onChange={(updated) => handleUpdateTask(index, updated)}
                  onDelete={() => handleDeleteTask(index)}
                />
              ))}
            </Stack>
          </SortableContext>
          <DragOverlay
            dropAnimation={null}
            modifiers={[snapCenterToCursor, restrictToVerticalAxis]}
          >
            {activeId
              ? (() => {
                  const idx = tasks.findIndex((t) => t.id === activeId);
                  const task = tasks[idx];
                  return task ? (
                    <TaskCardOverlay task={task} index={idx} />
                  ) : null;
                })()
              : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Empty state */}
      {tasks.length === 0 && !showTypeSelector && (
        <Box
          onClick={() => setShowTypeSelector(true)}
          sx={{
            p: 4,
            borderRadius: uiTokens.radius.card,
            border: "2px dashed",
            borderColor: (theme) => alpha(theme.palette.divider, 0.3),
            bgcolor: (theme) =>
              alpha(
                theme.palette.common.white,
                theme.palette.mode === "dark" ? 0.01 : 0.3,
              ),
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
            },
          }}
        >
          <AddIcon sx={{ fontSize: 36, color: "text.disabled", mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            Kliknij aby dodać pierwsze zadanie
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
