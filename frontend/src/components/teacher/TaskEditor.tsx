import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AddCircleOutlined as AddIcon } from "@mui/icons-material";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, snapCenterToCursor } from "@dnd-kit/modifiers";
import type { TaskType } from "@/api/taskService";
import { uiTokens } from "@/theme/uiTokens";
import { TaskCard, TaskCardOverlay } from "./TaskCard";
import type { LessonTaskDraft } from "./TaskCard";
import { SectionRow, SectionOverlay } from "./SectionRow";
import { TaskTypeSelector } from "./TaskTypeSelector";
import { useCallback, useMemo, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionGroup {
  sectionId: string;
  sectionName: string;
  displayName: string;
  tasks: LessonTaskDraft[];
}

type ActiveType = "section" | "task" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Groups tasks by their `section` field, preserving the order sections first
 * appear in the flat task list.
 */
function groupTasks(tasks: LessonTaskDraft[]): SectionGroup[] {
  const map = new Map<string, SectionGroup>();
  const order: string[] = [];

  for (const task of tasks) {
    const sectionName = task.section?.trim() ?? "";
    const sectionId = `section:${sectionName || "__general__"}`;

    if (!map.has(sectionId)) {
      map.set(sectionId, {
        sectionId,
        sectionName,
        displayName: sectionName || "Zadania ogólne",
        tasks: [],
      });
      order.push(sectionId);
    }
    map.get(sectionId)!.tasks.push(task);
  }

  return order.map((id) => map.get(id)!);
}

/** Rebuilds flat task array from groups, respecting group order. */
function flattenGroups(groups: SectionGroup[]): LessonTaskDraft[] {
  return groups.flatMap((g) => g.tasks);
}

// ─── TaskEditor ───────────────────────────────────────────────────────────────

interface TaskEditorProps {
  tasks: LessonTaskDraft[];
  onChange: (tasks: LessonTaskDraft[]) => void;
  defaultExpanded?: boolean;
}

export function TaskEditor({
  tasks,
  onChange,
  defaultExpanded = false,
}: TaskEditorProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<ActiveType>(null);
  /** sectionId of the collapsed section a task is currently hovering over */
  const [overSectionId, setOverSectionId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  // Ref keeps handlers free of stale closures — always reads latest tasks
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Snapshot at drag-start so onDragCancel can restore the original state
  const clonedTasksRef = useRef<LessonTaskDraft[] | null>(null);

  // ── Derived data ────────────────────────────────────────────────────────────

  const hasSections = useMemo(
    () => tasks.some((t) => t.section?.trim()),
    [tasks],
  );

  const groups = useMemo(
    () => (hasSections ? groupTasks(tasks) : []),
    [hasSections, tasks],
  );

  const existingSections = useMemo(
    () => [
      ...new Set(
        tasks.map((t) => t.section?.trim()).filter(Boolean) as string[],
      ),
    ],
    [tasks],
  );

  /**
   * Outer SortableContext items:
   * - No sections → flat task IDs (original simple behaviour)
   * - Sections → section IDs only; each section hosts its own inner SortableContext
   *
   * Keeping these homogeneous (all sections OR all tasks) is the key fix:
   * verticalListSortingStrategy index math is now always accurate.
   */
  const sortableItems = useMemo(() => {
    if (!hasSections) return tasks.map((t) => t.id);
    return groups.map((g) => g.sectionId);
  }, [hasSections, tasks, groups]);

  // ── Collision detection ──────────────────────────────────────────────────────
  // When dragging a section, restrict candidates to section IDs only.
  // Without this, closestCenter hits task items inside expanded sections and
  // the section→section drop never fires.
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      if (activeType === "section") {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((c) =>
            String(c.id).startsWith("section:"),
          ),
        });
      }
      return closestCenter(args);
    },
    [activeType],
  );

  // ── Sensors ─────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ── Section expand/collapse ──────────────────────────────────────────────────

  const toggleSection = useCallback(
    (sectionId: string) => {
      if (activeId) return; // no toggle during drag
      setExpandedSections((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) next.delete(sectionId);
        else next.add(sectionId);
        return next;
      });
    },
    [activeId],
  );

  // ── DnD handlers ────────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    clonedTasksRef.current = tasksRef.current;
    const id = String(event.active.id);
    const type = (event.active.data.current as { type?: string })?.type;
    setActiveId(id);
    setActiveType(type === "section" || type === "task" ? type : null);
  };

  /**
   * Cross-section task moves are handled here with an optimistic state update so
   * the inner SortableContext of the target section "sees" the task immediately
   * and shows an accurate drop-position preview.
   *
   * Same-section reordering is NOT updated here — the inner SortableContext
   * handles the visual via CSS transforms, and the final arrayMove is applied
   * in onDragEnd.
   */
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverSectionId(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      setOverSectionId(null);
      return;
    }

    const draggedType = (active.data.current as { type?: string })?.type;
    if (draggedType !== "task") {
      setOverSectionId(null);
      return;
    }

    const current = tasksRef.current;
    const activeTask = current.find((t) => t.id === activeId);
    if (!activeTask) return;

    const activeSectionName = activeTask.section?.trim() ?? "";
    const overType = (over.data.current as { type?: string })?.type;

    let targetSectionName: string;
    let targetSectionId: string;

    if (overType === "task") {
      const overTask = current.find((t) => t.id === overId);
      if (!overTask) return;
      targetSectionName = overTask.section?.trim() ?? "";
      targetSectionId = `section:${targetSectionName || "__general__"}`;
      setOverSectionId(null);
    } else if (overType === "section") {
      targetSectionId = overId;
      targetSectionName =
        (over.data.current as { sectionName?: string })?.sectionName?.trim() ?? "";
      // Show "Upuść tutaj" preview only for collapsed sections
      setOverSectionId(expandedSections.has(overId) ? null : overId);
    } else {
      setOverSectionId(null);
      return;
    }

    // Same section — inner SortableContext shows the visual reorder via CSS transforms.
    // No state update needed; arrayMove is applied in onDragEnd.
    if (activeSectionName === targetSectionName) return;

    // Cross-section: optimistically move task into the target section
    const currentGroups = groupTasks(current);
    const srcGroup = currentGroups.find((g) => g.sectionName === activeSectionName);
    const tgtGroup = currentGroups.find((g) => g.sectionId === targetSectionId);
    if (!srcGroup || !tgtGroup) return;

    const updatedTask = { ...activeTask, section: targetSectionName };
    const srcTasks = srcGroup.tasks.filter((t) => t.id !== activeId);

    let tgtTasks: LessonTaskDraft[];
    if (overType === "task") {
      // Insert at the position of the hovered task
      const overIdx = tgtGroup.tasks.findIndex((t) => t.id === overId);
      tgtTasks = [...tgtGroup.tasks];
      tgtTasks.splice(overIdx, 0, updatedTask);
    } else {
      // Section header — append to end of section
      tgtTasks = [...tgtGroup.tasks, updatedTask];
    }

    const newGroups = currentGroups.map((g) => {
      if (g.sectionId === srcGroup.sectionId) return { ...g, tasks: srcTasks };
      if (g.sectionId === tgtGroup.sectionId) return { ...g, tasks: tgtTasks };
      return g;
    });

    onChange(flattenGroups(newGroups));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const snapshot = clonedTasksRef.current;
    clonedTasksRef.current = null;
    setActiveId(null);
    setActiveType(null);
    setOverSectionId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const current = tasksRef.current;
    const activeDataType = (active.data.current as { type?: string })?.type;
    const overDataType = (over.data.current as { type?: string })?.type;

    // ── No sections: simple flat reorder ──────────────────────────────────────
    if (!current.some((t) => t.section?.trim())) {
      const oldIndex = current.findIndex((t) => t.id === String(active.id));
      const newIndex = current.findIndex((t) => t.id === String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(current, oldIndex, newIndex));
      }
      return;
    }

    // ── Section reorder ───────────────────────────────────────────────────────
    if (activeDataType === "section" && overDataType === "section") {
      const currentGroups = groupTasks(current);
      const activeIdx = currentGroups.findIndex(
        (g) => g.sectionId === String(active.id),
      );
      const overIdx = currentGroups.findIndex(
        (g) => g.sectionId === String(over.id),
      );
      if (activeIdx === -1 || overIdx === -1) return;
      onChange(flattenGroups(arrayMove(currentGroups, activeIdx, overIdx)));
      return;
    }

    // ── Task drag ─────────────────────────────────────────────────────────────
    if (activeDataType === "task") {
      const activeTaskId = String(active.id);

      // Cross-section moves were already committed in onDragOver — skip
      const originalSection =
        snapshot?.find((t) => t.id === activeTaskId)?.section?.trim() ?? "";
      const currentSection =
        current.find((t) => t.id === activeTaskId)?.section?.trim() ?? "";
      if (originalSection !== currentSection) return;

      // Same-section reorder: apply the final arrayMove
      if (overDataType !== "task") return;
      const overTaskId = String(over.id);

      const currentGroups = groupTasks(current);
      const group = currentGroups.find((g) =>
        g.tasks.some((t) => t.id === activeTaskId),
      );
      if (!group) return;

      const oldIdx = group.tasks.findIndex((t) => t.id === activeTaskId);
      const newIdx = group.tasks.findIndex((t) => t.id === overTaskId);
      if (oldIdx === -1 || newIdx === -1) return;

      const newGroups = currentGroups.map((g) =>
        g.sectionId === group.sectionId
          ? { ...g, tasks: arrayMove(g.tasks, oldIdx, newIdx) }
          : g,
      );
      onChange(flattenGroups(newGroups));
    }
  };

  /** Escape/cancel: restore the snapshot taken at drag-start */
  const handleDragCancel = () => {
    if (clonedTasksRef.current) {
      onChange(clonedTasksRef.current);
    }
    clonedTasksRef.current = null;
    setActiveId(null);
    setActiveType(null);
    setOverSectionId(null);
  };

  // ── Stable task callbacks ────────────────────────────────────────────────────

  const handleUpdateTaskById = useCallback(
    (id: string, updated: LessonTaskDraft) => {
      const original = tasksRef.current.find((t) => t.id === id);
      onChange(tasksRef.current.map((t) => (t.id === id ? updated : t)));
      // Auto-expand the target section when the user reassigns a task via the field
      if (original && original.section.trim() !== updated.section.trim()) {
        const targetSectionId = `section:${updated.section.trim() || "__general__"}`;
        setExpandedSections((prev) => new Set([...prev, targetSectionId]));
      }
    },
    [onChange],
  );

  const handleDeleteTaskById = useCallback(
    (id: string) => {
      onChange(tasksRef.current.filter((t) => t.id !== id));
    },
    [onChange],
  );

  const handleAddTask = (type: TaskType) => {
    onChange([...tasks, createEmptyTaskDraft(type)]);
    setShowTypeSelector(false);
    // New tasks land in the "general" group — expand it so the user can see it
    if (hasSections) {
      setExpandedSections((prev) => new Set([...prev, "section:__general__"]));
    }
  };

  // ── Global task index helper ─────────────────────────────────────────────────
  const groupStartIndexes = useMemo(() => {
    const result: Record<string, number> = {};
    let acc = 0;
    for (const g of groups) {
      result[g.sectionId] = acc;
      acc += g.tasks.length;
    }
    return result;
  }, [groups]);

  // ── Render ───────────────────────────────────────────────────────────────────

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
            "&:hover": { borderStyle: "solid", transform: "translateY(-1px)" },
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

      {/* Task list */}
      {tasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sortableItems}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1.5}>
              {hasSections
                ? groups.map((group) => {
                    const startIdx = groupStartIndexes[group.sectionId] ?? 0;
                    return (
                      <SectionRow
                        key={group.sectionId}
                        sectionId={group.sectionId}
                        displayName={group.displayName}
                        sectionName={group.sectionName}
                        tasks={group.tasks}
                        startIndex={startIdx}
                        expanded={expandedSections.has(group.sectionId)}
                        isOver={overSectionId === group.sectionId}
                        onToggle={() => toggleSection(group.sectionId)}
                        onChangeById={handleUpdateTaskById}
                        onDeleteById={handleDeleteTaskById}
                        existingSections={existingSections}
                        defaultExpanded={defaultExpanded}
                      />
                    );
                  })
                : tasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onChangeById={handleUpdateTaskById}
                      onDeleteById={handleDeleteTaskById}
                      existingSections={existingSections}
                      defaultExpanded={defaultExpanded}
                    />
                  ))}
            </Stack>
          </SortableContext>

          <DragOverlay
            dropAnimation={null}
            modifiers={[snapCenterToCursor, restrictToVerticalAxis]}
          >
            {activeId && activeType === "section" &&
              (() => {
                const group = groups.find((g) => g.sectionId === activeId);
                return group ? (
                  <SectionOverlay
                    displayName={group.displayName}
                    taskCount={group.tasks.length}
                  />
                ) : null;
              })()}
            {activeId && activeType === "task" &&
              (() => {
                const idx = tasks.findIndex((t) => t.id === activeId);
                const task = tasks[idx];
                return task ? (
                  <TaskCardOverlay task={task} index={idx} />
                ) : null;
              })()}
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
