import { ApiError } from "@/api/apiClient";
import { taskService, type LessonTasksResponse } from "@/api/taskService";
import type { Group } from "@/api/lessonService";
import type { LessonTaskDraft } from "@/components/teacher/TaskCard";
import { getApiErrorMessage } from "@/utils/dashboardUtils";
import { INPUT_LIMITS } from "@/utils/inputLimits";

export interface DialogFeedbackState {
  severity: "success" | "error" | "warning";
  message: string;
}

export interface LessonDraft {
  title: string;
  theme: string;
  groups: Group[];
  tasks: LessonTaskDraft[];
}

export const emptyLessonDraft: LessonDraft = {
  title: "",
  theme: "",
  groups: [],
  tasks: [],
};

export const LESSON_TITLE_MAX_LENGTH = INPUT_LIMITS.lessonTitle;

export function getLessonEditorErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error, fallback, {
      title: "Tytuł lekcji",
      theme: "Temat lekcji",
    });
  }

  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak połączenia z serwerem.";
  }

  return fallback;
}

export function getTaskValidationError(
  task: LessonTaskDraft,
  index: number,
): string | null {
  const position = `Zadanie ${index + 1}`;

  if (task.type !== "speak" && !task.task.trim()) {
    return `${position}: treść zadania jest wymagana.`;
  }

  if (
    task.type !== "speak" &&
    task.task.trim().length > INPUT_LIMITS.taskText
  ) {
    return `${position}: treść zadania może mieć maksymalnie ${INPUT_LIMITS.taskText} znaków.`;
  }

  if (task.type === "choose") {
    if (!task.possibleAnswers.trim()) {
      return `${position}: podaj odpowiedzi oddzielone znakiem |.`;
    }

    const answers = task.possibleAnswers
      .split("|")
      .map((answer) => answer.trim())
      .filter(Boolean);

    if (answers.length > INPUT_LIMITS.taskChoiceMaxAnswers) {
      return `${position}: możesz dodać maksymalnie ${INPUT_LIMITS.taskChoiceMaxAnswers} odpowiedzi.`;
    }

    if (
      answers.some((answer) => answer.length > INPUT_LIMITS.taskChoiceAnswer)
    ) {
      return `${position}: pojedyncza odpowiedź może mieć maksymalnie ${INPUT_LIMITS.taskChoiceAnswer} znaków.`;
    }

    const trimmedCorrect = task.correctAnswer.trim();
    if (trimmedCorrect === "") {
      return `${position}: podaj indeks poprawnej odpowiedzi (np. 0).`;
    }

    const correctIndex = Number(trimmedCorrect);
    if (!Number.isInteger(correctIndex)) {
      return `${position}: indeks poprawnej odpowiedzi musi być liczbą całkowitą.`;
    }

    if (correctIndex < 0 || correctIndex >= answers.length) {
      return `${position}: indeks poprawnej odpowiedzi musi wskazywać jedną z dostępnych odpowiedzi (od 0 do ${Math.max(answers.length - 1, 0)}).`;
    }
  }

  if (task.type === "write") {
    if (!task.correctAnswer.trim()) {
      return `${position}: poprawna odpowiedź jest wymagana.`;
    }

    if (task.correctAnswer.trim().length > INPUT_LIMITS.taskAnswerText) {
      return `${position}: poprawna odpowiedź może mieć maksymalnie ${INPUT_LIMITS.taskAnswerText} znaków.`;
    }
  }

  if (task.type === "scatter") {
    if (!task.words.trim()) {
      return `${position}: podaj słowa oddzielone znakiem |.`;
    }

    const words = task.words
      .split("|")
      .map((word) => word.trim())
      .filter(Boolean);

    if (words.length > INPUT_LIMITS.taskScatterMaxWords) {
      return `${position}: możesz dodać maksymalnie ${INPUT_LIMITS.taskScatterMaxWords} słów.`;
    }

    if (words.some((word) => word.length > INPUT_LIMITS.taskScatterWord)) {
      return `${position}: pojedyncze słowo może mieć maksymalnie ${INPUT_LIMITS.taskScatterWord} znaków.`;
    }

    if (!task.correctAnswer.trim()) {
      return `${position}: poprawna odpowiedź jest wymagana.`;
    }

    if (task.correctAnswer.trim().length > INPUT_LIMITS.taskAnswerText) {
      return `${position}: poprawna odpowiedź może mieć maksymalnie ${INPUT_LIMITS.taskAnswerText} znaków.`;
    }
  }

  if (task.type === "speak") {
    if (!task.correctAnswer.trim()) {
      return `${position}: tekst do rozpoznania jest wymagany.`;
    }

    if (task.correctAnswer.trim().length > INPUT_LIMITS.taskAnswerText) {
      return `${position}: tekst do rozpoznania może mieć maksymalnie ${INPUT_LIMITS.taskAnswerText} znaków.`;
    }
  }

  if (task.hint.trim().length > INPUT_LIMITS.taskHint) {
    return `${position}: podpowiedź może mieć maksymalnie ${INPUT_LIMITS.taskHint} znaków.`;
  }

  if (task.section.trim().length > INPUT_LIMITS.taskSection) {
    return `${position}: sekcja może mieć maksymalnie ${INPUT_LIMITS.taskSection} znaków.`;
  }

  return null;
}

export async function createLessonTask(
  lessonPublicId: string,
  task: LessonTaskDraft,
) {
  const hint = task.hint.trim() || undefined;
  const section = task.section.trim() || undefined;

  if (task.type === "choose") {
    return taskService.createChooseTask(lessonPublicId, {
      task: task.task.trim(),
      possibleAnswers: task.possibleAnswers.trim(),
      correctAnswer: Number(task.correctAnswer.trim()),
      hint,
      section,
    });
  }

  if (task.type === "write") {
    return taskService.createWriteTask(lessonPublicId, {
      task: task.task.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  if (task.type === "scatter") {
    return taskService.createScatterTask(lessonPublicId, {
      task: task.task.trim(),
      words: task.words.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  return taskService.createSpeakTask(lessonPublicId, {
    expectedText: task.correctAnswer.trim(),
    hint,
    section,
  });
}

export async function updateLessonTask(
  lessonPublicId: string,
  taskPublicId: string,
  task: LessonTaskDraft,
) {
  const hint = task.hint.trim() || undefined;
  const section = task.section.trim() || undefined;

  if (task.type === "choose") {
    return taskService.updateChooseTask(lessonPublicId, taskPublicId, {
      task: task.task.trim(),
      possibleAnswers: task.possibleAnswers.trim(),
      correctAnswer: Number(task.correctAnswer.trim()),
      hint,
      section,
    });
  }

  if (task.type === "write") {
    return taskService.updateWriteTask(lessonPublicId, taskPublicId, {
      task: task.task.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  if (task.type === "scatter") {
    return taskService.updateScatterTask(lessonPublicId, taskPublicId, {
      task: task.task.trim(),
      words: task.words.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  return taskService.updateSpeakTask(lessonPublicId, taskPublicId, {
    expectedText: task.correctAnswer.trim(),
    hint,
    section,
  });
}

export function tasksResponseToDrafts(
  response: LessonTasksResponse,
): LessonTaskDraft[] {
  const drafts: LessonTaskDraft[] = [];

  for (const section of response.sections) {
    const sectionName = section.section ?? "";

    for (const task of section.chooseTasks) {
      drafts.push({
        id: `backendTask:choose:${task.publicId}`,
        type: "choose",
        task: task.task,
        possibleAnswers: task.possibleAnswers,
        correctAnswer:
          task.correctAnswer != null ? String(task.correctAnswer) : "",
        words: "",
        hint: task.hint ?? "",
        section: sectionName,
        hintImageUrl: task.hintImageUrl ?? null,
      });
    }

    for (const task of section.writeTasks) {
      drafts.push({
        id: `backendTask:write:${task.publicId}`,
        type: "write",
        task: task.task,
        possibleAnswers: "",
        correctAnswer: task.correctAnswer ?? "",
        words: "",
        hint: task.hint ?? "",
        section: sectionName,
        hintImageUrl: task.hintImageUrl ?? null,
      });
    }

    for (const task of section.scatterTasks) {
      drafts.push({
        id: `backendTask:scatter:${task.publicId}`,
        type: "scatter",
        task: task.task,
        possibleAnswers: "",
        correctAnswer: task.correctAnswer ?? "",
        words: task.words,
        hint: task.hint ?? "",
        section: sectionName,
        hintImageUrl: task.hintImageUrl ?? null,
      });
    }

    for (const task of section.speakTasks) {
      drafts.push({
        id: `backendTask:speak:${task.publicId}`,
        type: "speak",
        task: "",
        possibleAnswers: "",
        correctAnswer: task.expectedText,
        words: "",
        hint: task.hint ?? "",
        section: sectionName,
        hintImageUrl: task.hintImageUrl ?? null,
      });
    }
  }

  return drafts;
}

export function parseBackendDraftId(
  draftId: string,
): { type: string; taskPublicId: string } | null {
  const match = /^backendTask:(\w+):(.+)$/.exec(draftId);
  if (!match) {
    return null;
  }

  return { type: match[1], taskPublicId: match[2] };
}
