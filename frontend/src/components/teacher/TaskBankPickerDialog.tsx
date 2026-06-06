import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LibraryAddOutlined as LibraryAddIcon } from "@mui/icons-material";
import {
  AppDialog,
  AppDialogBody,
  AppDialogHeader,
} from "@/components/ui/dialog/AppDialog";
import { lessonService } from "@/api/lessonService";
import { taskService, type TaskType } from "@/api/taskService";
import type { LessonTaskDraft } from "./TaskCard";
import {
  createLessonDraftFromBankTask,
  tasksResponseToDrafts,
} from "@/features/teacher/lessonEditor";
import {
  outlinedMetaChipSx,
  panelListRowSx,
  panelToolbarButtonSx,
  panelToolbarSx,
} from "@/components/ui/panel/panelStyles";

function getTaskTypeLabel(type: TaskType): string {
  switch (type) {
    case "choose":
      return "Wybór";
    case "write":
      return "Pisanie";
    case "scatter":
      return "Rozsypanka";
    case "speak":
      return "Mówienie";
  }
}

interface TaskBankPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (task: LessonTaskDraft) => void;
}

type TaskTypeFilterOption = { label: string; value: "all" | TaskType };

export function TaskBankPickerDialog({
  open,
  onClose,
  onImport,
}: TaskBankPickerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<LessonTaskDraft[]>([]);
  const [lessonTitlesById, setLessonTitlesById] = useState<
    Record<string, string>
  >({});
  const [search, setSearch] = useState("");
  const typeFilterOptions = useMemo<TaskTypeFilterOption[]>(
    () => [
      { label: "Wszystkie typy", value: "all" },
      { label: getTaskTypeLabel("choose"), value: "choose" },
      { label: getTaskTypeLabel("write"), value: "write" },
      { label: getTaskTypeLabel("scatter"), value: "scatter" },
      { label: getTaskTypeLabel("speak"), value: "speak" },
    ],
    [],
  );
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilterOption>(
    typeFilterOptions[0],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [taskBankResponse, lessons] = await Promise.all([
          taskService.getTeacherTaskBank(),
          lessonService.getTeacherLessons(),
        ]);

        if (cancelled) {
          return;
        }

        setTasks(tasksResponseToDrafts(taskBankResponse));
        setLessonTitlesById(
          Object.fromEntries(
            lessons.map((lesson) => [lesson.publicId, lesson.title]),
          ),
        );
      } catch {
        if (!cancelled) {
          setError("Nie udało się załadować bazy zadań.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return tasks.filter((task) => {
      const matchesType =
        typeFilter.value === "all" || task.type === typeFilter.value;
      const content =
        task.type === "speak"
          ? task.correctAnswer
          : `${task.task ?? ""} ${task.section}`.trim();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        content.toLocaleLowerCase().includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [search, tasks, typeFilter]);

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="md">
      <AppDialogHeader
        icon={<LibraryAddIcon />}
        title="Dodaj z bazy zadań"
        subtitle="Zadania bez lekcji mogą zostać przypisane do tej lekcji, a zadania już użyte zostaną dodane jako kopie."
      />
      <AppDialogBody>
        <Stack spacing={2}>
          <Box sx={panelToolbarSx}>
            <TextField
              size="small"
              placeholder="Szukaj zadań"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{
                flex: 1,
                minWidth: { xs: "100%", sm: 260 },
                "& .MuiInputBase-input": {
                  py: 1.1,
                  fontSize: "0.95rem",
                },
              }}
            />
            <Autocomplete
              size="small"
              options={typeFilterOptions}
              value={typeFilter}
              onChange={(_, value) =>
                setTypeFilter(value ?? typeFilterOptions[0])
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
              sx={{
                minWidth: { xs: "100%", sm: 220 },
                "& .MuiInputBase-input": {
                  py: 1.1,
                  fontSize: "0.95rem",
                },
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Typ zadania" />
              )}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSearch("");
                setTypeFilter(typeFilterOptions[0]);
              }}
              sx={panelToolbarButtonSx}
            >
              Wyczyść filtry
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : filteredTasks.length === 0 ? (
            <Alert severity="info">
              Nie znaleziono zadań pasujących do wybranych filtrów.
            </Alert>
          ) : (
            <Stack spacing={1.25}>
              {filteredTasks.map((task) => {
                const lessonTitle = task.sourceLessonPublicId
                  ? (lessonTitlesById[task.sourceLessonPublicId] ??
                    "Przypisane do lekcji")
                  : null;

                return (
                  <Box key={task.id} sx={panelListRowSx}>
                    <Stack spacing={1}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Chip
                            size="small"
                            label={getTaskTypeLabel(task.type)}
                            color="primary"
                            variant="outlined"
                            sx={outlinedMetaChipSx}
                          />
                          <Chip
                            size="small"
                            label={lessonTitle ? lessonTitle : "Bez lekcji"}
                            color={lessonTitle ? "default" : "success"}
                            variant="outlined"
                            sx={outlinedMetaChipSx}
                          />
                          <Chip
                            size="small"
                            label={`${task.points} pkt`}
                            variant="outlined"
                            sx={outlinedMetaChipSx}
                          />
                        </Stack>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            onImport(createLessonDraftFromBankTask(task))
                          }
                          sx={panelToolbarButtonSx}
                        >
                          Dodaj do lekcji
                        </Button>
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {task.type === "speak"
                          ? task.correctAnswer
                          : task.task || "Zadanie bez treści"}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {task.section.trim() && (
                          <Typography variant="caption" color="text.secondary">
                            Sekcja: {task.section}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </AppDialogBody>
    </AppDialog>
  );
}
