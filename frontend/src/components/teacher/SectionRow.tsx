import {
  Box,
  Chip,
  Collapse,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  DragIndicator as DragIcon,
  EditOutlined as EditIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  LayersOutlined as LayersIcon,
} from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { uiTokens } from "@/theme/uiTokens";
import { INPUT_LIMITS } from "@/utils/inputLimits";
import { TaskCard } from "./TaskCard";
import type { LessonTaskDraft } from "./TaskCard";

interface SectionRowProps {
  sectionId: string;
  displayName: string;
  sectionName: string;
  tasks: LessonTaskDraft[];
  startIndex: number;
  expanded: boolean;
  /** True when a task is being dragged and hovers over this (collapsed) section */
  isOver: boolean;
  onToggle: () => void;
  onRename: (sectionId: string, newName: string) => void;
  onChangeById: (id: string, updated: LessonTaskDraft) => void;
  onDeleteById: (id: string) => void;
  existingSections: string[];
  defaultExpanded?: boolean;
  lessonPublicId?: string;
}

export function SectionRow({
  sectionId,
  displayName,
  sectionName,
  tasks,
  startIndex,
  expanded,
  isOver,
  onToggle,
  onRename,
  onChangeById,
  onDeleteById,
  existingSections,
  defaultExpanded = false,
  lessonPublicId,
}: SectionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sectionId,
    data: { type: "section", sectionName },
  });

  // Sections only participate in section reordering — no freeze logic needed.
  // Each section's tasks live in their own SortableContext, so displacement math
  // is isolated per-section and never bleeds across containers.
  const style = {
    transform: CSS.Transform.toString(
      transform ? { ...transform, scaleX: 1, scaleY: 1 } : null,
    ),
    transition,
    willChange: (transform ? "transform" : "auto") as "transform" | "auto",
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(sectionName);
    setIsEditing(true);
  };

  const commitEdit = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed !== sectionName) {
      onRename(sectionId, trimmed);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isDragging) {
    return (
      <Box
        ref={setNodeRef}
        style={style}
        sx={{
          borderRadius: uiTokens.radius.section,
          border: "2px dashed",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.35),
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.06 : 0.04,
            ),
          height: 40,
        }}
      />
    );
  }

  return (
    <Box ref={setNodeRef} style={style}>
      {/*
        ── Section header row ────────────────────────────────────────────────
        Whole row = drag activator when NOT editing.
        In edit mode: listeners are suppressed so the TextField doesn't trigger drag.
      */}
      <Box
        ref={setActivatorNodeRef}
        {...attributes}
        {...(isEditing ? {} : listeners)}
        onClick={isEditing ? undefined : onToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 0.5,
          py: 0.5,
          borderRadius: uiTokens.radius.section,
          border: "1px solid",
          borderColor: (theme) =>
            isOver
              ? alpha(theme.palette.primary.main, 0.55)
              : alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === "dark" ? 0.22 : 0.15,
                ),
          bgcolor: (theme) =>
            isOver
              ? alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === "dark" ? 0.14 : 0.08,
                )
              : alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === "dark" ? 0.06 : 0.04,
                ),
          cursor: isEditing ? "default" : "grab",
          touchAction: "none",
          userSelect: "none",
          transition: "border-color 0.15s ease, background-color 0.15s ease",
          "&:active": { cursor: isEditing ? "default" : "grabbing" },
          "&:hover": {
            borderColor: (theme) =>
              isOver
                ? alpha(theme.palette.primary.main, 0.55)
                : alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.35 : 0.28,
                  ),
            bgcolor: (theme) =>
              isOver
                ? alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.14 : 0.08,
                  )
                : alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.09 : 0.06,
                  ),
          },
        }}
      >
        {/* Visual drag indicator — decorative only, listeners are on the whole row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            px: 0.75,
            py: 0.75,
            color: "text.disabled",
          }}
        >
          <DragIcon sx={{ fontSize: 16 }} />
        </Box>

        <LayersIcon
          sx={{ fontSize: 14, color: "primary.main", flexShrink: 0 }}
        />

        {isEditing ? (
          <TextField
            autoFocus
            variant="standard"
            size="small"
            value={editValue}
            onChange={(e) =>
              setEditValue(e.target.value.slice(0, INPUT_LIMITS.taskSection))
            }
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            sx={{ flex: 1, mx: 0.75 }}
            inputProps={{
              style: { fontSize: "0.75rem", fontWeight: 700 },
            }}
          />
        ) : (
          <Typography
            variant="caption"
            fontWeight={700}
            color="primary.main"
            sx={{ letterSpacing: 0.3, lineHeight: 1, flex: 1, mx: 0.75 }}
          >
            {displayName}
          </Typography>
        )}

        {!isEditing && (
          <Tooltip title="Zmień nazwę sekcji" arrow>
            <IconButton
              size="small"
              onClick={startEdit}
              sx={{
                color: "primary.main",
                p: 0.25,
                opacity: 0.5,
                transition: "opacity 0.15s ease",
                "&:hover": { opacity: 1 },
              }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}

        <Chip
          label={tasks.length}
          size="small"
          color="primary"
          variant="outlined"
          sx={{
            height: 18,
            fontWeight: 700,
            "& .MuiChip-label": { px: 0.75, fontSize: "0.7rem" },
          }}
        />

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          sx={{ color: "primary.main", p: 0.25, ml: 0.25 }}
        >
          {expanded ? (
            <CollapseIcon sx={{ fontSize: 16 }} />
          ) : (
            <ExpandIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Box>

      {/* Drop preview — shown when a task hovers over a collapsed section.
          Slides open below the header to signal "task will land here". */}
      <Collapse
        in={isOver && !expanded}
        timeout={{ enter: 150, exit: 0 }}
        unmountOnExit
      >
        <Box
          sx={{
            mt: 0.5,
            mx: 0.25,
            height: 102,
            borderRadius: uiTokens.radius.card,
            border: "2px dashed",
            borderColor: "primary.main",
            bgcolor: (theme) =>
              alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.1 : 0.06,
              ),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
          }}
        >
          <Typography
            variant="caption"
            color="primary.main"
            fontWeight={700}
            sx={{ letterSpacing: 0.5 }}
          >
            Upuść tutaj
          </Typography>
        </Box>
      </Collapse>

      {/* Tasks in their own SortableContext — displacement math is isolated here,
          so dragging within this section never affects other sections' task positions.
          unmountOnExit keeps collapsed tasks out of the DOM and out of collision detection. */}
      <Collapse in={expanded} timeout={200} unmountOnExit>
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <Box
            sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            {tasks.map((task, localIdx) => (
              <TaskCard
                key={task.id}
                task={task}
                index={startIndex + localIdx}
                onChangeById={onChangeById}
                onDeleteById={onDeleteById}
                existingSections={existingSections}
                defaultExpanded={defaultExpanded}
                lessonPublicId={lessonPublicId}
              />
            ))}
          </Box>
        </SortableContext>
      </Collapse>
    </Box>
  );
}

// ─── Overlay shown in DragOverlay when dragging a whole section ───────────────
export function SectionOverlay({
  displayName,
  taskCount,
}: {
  displayName: string;
  taskCount: number;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.5,
        py: 0.5,
        borderRadius: uiTokens.radius.section,
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.55),
        bgcolor: "background.paper",
        boxShadow: (theme) =>
          `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}, 0 4px 8px rgba(0,0,0,0.1)`,
        cursor: "grabbing",
        userSelect: "none",
        minWidth: 200,
      }}
    >
      <Box sx={{ px: 0.75, py: 0.75 }}>
        <DragIcon sx={{ fontSize: 16, color: "text.disabled" }} />
      </Box>
      <LayersIcon sx={{ fontSize: 14, color: "primary.main" }} />
      <Typography
        variant="caption"
        fontWeight={700}
        color="primary.main"
        sx={{ letterSpacing: 0.3, lineHeight: 1, flex: 1, mx: 0.75 }}
      >
        {displayName}
      </Typography>
      <Chip
        label={taskCount}
        size="small"
        color="primary"
        variant="outlined"
        sx={{
          height: 18,
          mr: 0.5,
          fontWeight: 700,
          "& .MuiChip-label": { px: 0.75, fontSize: "0.7rem" },
        }}
      />
    </Box>
  );
}
