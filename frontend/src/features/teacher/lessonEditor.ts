import { ApiError } from "@/api/apiClient";
import { taskService, type LessonTasksResponse } from "@/api/taskService";
import type { Group } from "@/api/lessonService";
import type { LessonTaskDraft } from "@/components/teacher/TaskCard";

export interface DialogFeedbackState {
  severity: "success" | "error" | "warning";
  message: string;
}

export interface LessonDraft {
  title: string;
  theme: string;
  groupIds: Group[];
  tasks: LessonTaskDraft[];
}

export const emptyLessonDraft: LessonDraft = {
  title: "",
  theme: "",
  groupIds: [],
  tasks: [],
};

const validationMessageTranslations: Record<string, string> = {
  "Title is required": "Tytuł jest wymagany.",
  "Theme is required": "Temat jest wymagany.",
  "must not be blank": "Pole jest wymagane.",
};

function translateBackendMessage(message: string) {
  let translated = message;
  for (const [source, target] of Object.entries(
    validationMessageTranslations,
  )) {
    translated = translated.replaceAll(source, target);
  }

  if (translated.startsWith("Validation failed:")) {
    const rawDetails = translated.replace("Validation failed:", "").trim();
    const fieldLabels: Record<string, string> = {
      title: "Tytuł",
      theme: "Temat",
    };
    const parts = rawDetails
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf(":");
        if (separatorIndex === -1) {
          return part;
        }

        const field = part.slice(0, separatorIndex).trim();
        const detail = part.slice(separatorIndex + 1).trim();
        const label = fieldLabels[field] ?? field;
        return `${label}: ${detail}`;
      });

    return `Błąd walidacji: ${parts.join(", ")}`.replaceAll(" .", ".").trim();
  }

  return translated;
}

export function getLessonEditorErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const message = error.problem.detail || error.problem.title;
    return message ? translateBackendMessage(message) : fallback;
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

  if (!task.task.trim()) {
    return `${position}: treść zadania jest wymagana.`;
  }

  if (task.type === "choose") {
    if (!task.possibleAnswers.trim()) {
      return `${position}: podaj odpowiedzi oddzielone znakiem |.`;
    }

    const trimmedCorrect = task.correctAnswer.trim();
    if (trimmedCorrect === "") {
      return `${position}: podaj indeks poprawnej odpowiedzi (np. 0).`;
    }

    const correctIndex = Number(trimmedCorrect);
    if (!Number.isInteger(correctIndex)) {
      return `${position}: indeks poprawnej odpowiedzi musi być liczbą całkowitą.`;
    }

    const answers = task.possibleAnswers
      .split("|")
      .map((answer) => answer.trim())
      .filter(Boolean);

    if (correctIndex < 0 || correctIndex >= answers.length) {
      return `${position}: indeks poprawnej odpowiedzi musi wskazywać jedną z dostępnych odpowiedzi (od 0 do ${Math.max(answers.length - 1, 0)}).`;
    }
  }

  if (task.type === "write" && !task.correctAnswer.trim()) {
    return `${position}: poprawna odpowiedź jest wymagana.`;
  }

  if (task.type === "scatter") {
    if (!task.words.trim()) {
      return `${position}: podaj słowa oddzielone znakiem |.`;
    }

    if (!task.correctAnswer.trim()) {
      return `${position}: poprawna odpowiedź jest wymagana.`;
    }
  }

  if (task.type === "speak" && !task.correctAnswer.trim()) {
    return `${position}: tekst do rozpoznania jest wymagany.`;
  }

  return null;
}

export async function createLessonTask(lessonId: number, task: LessonTaskDraft) {
  const hint = task.hint.trim() || undefined;
  const section = task.section.trim() || undefined;

  if (task.type === "choose") {
    return taskService.createChooseTask(lessonId, {
      task: task.task.trim(),
      possibleAnswers: task.possibleAnswers.trim(),
      correctAnswer: Number(task.correctAnswer.trim()),
      hint,
      section,
    });
  }

  if (task.type === "write") {
    return taskService.createWriteTask(lessonId, {
      task: task.task.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  if (task.type === "scatter") {
    return taskService.createScatterTask(lessonId, {
      task: task.task.trim(),
      words: task.words.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  return taskService.createSpeakTask(lessonId, {
    task: task.task.trim(),
    expectedText: task.correctAnswer.trim(),
    hint,
    section,
  });
}

export async function updateLessonTask(
  lessonId: number,
  backendId: number,
  task: LessonTaskDraft,
) {
  const hint = task.hint.trim() || undefined;
  const section = task.section.trim() || undefined;

  if (task.type === "choose") {
    return taskService.updateChooseTask(lessonId, backendId, {
      task: task.task.trim(),
      possibleAnswers: task.possibleAnswers.trim(),
      correctAnswer: Number(task.correctAnswer.trim()),
      hint,
      section,
    });
  }

  if (task.type === "write") {
    return taskService.updateWriteTask(lessonId, backendId, {
      task: task.task.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  if (task.type === "scatter") {
    return taskService.updateScatterTask(lessonId, backendId, {
      task: task.task.trim(),
      words: task.words.trim(),
      correctAnswer: task.correctAnswer.trim(),
      hint,
      section,
    });
  }

  return taskService.updateSpeakTask(lessonId, backendId, {
    task: task.task.trim(),
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
        id: `backendId:choose:${task.id}`,
        type: "choose",
        task: task.task,
        possibleAnswers: task.possibleAnswers,
        correctAnswer:
          task.correctAnswer != null ? String(task.correctAnswer) : "",
        words: "",
        hint: task.hint ?? "",
        section: sectionName,
      });
    }

    for (const task of section.writeTasks) {
      drafts.push({
        id: `backendId:write:${task.id}`,
        type: "write",
        task: task.task,
        possibleAnswers: "",
        correctAnswer: task.correctAnswer ?? "",
        words: "",
        hint: task.hint ?? "",
        section: sectionName,
      });
    }

    for (const task of section.scatterTasks) {
      drafts.push({
        id: `backendId:scatter:${task.id}`,
        type: "scatter",
        task: task.task,
        possibleAnswers: "",
        correctAnswer: task.correctAnswer ?? "",
        words: task.words,
        hint: task.hint ?? "",
        section: sectionName,
      });
    }

    for (const task of section.speakTasks) {
      drafts.push({
        id: `backendId:speak:${task.id}`,
        type: "speak",
        task: task.task,
        possibleAnswers: "",
        correctAnswer: task.expectedText,
        words: "",
        hint: task.hint ?? "",
        section: sectionName,
      });
    }
  }

  return drafts;
}

export function parseBackendDraftId(
  draftId: string,
): { type: string; backendId: number } | null {
  const match = /^backendId:(\w+):(\d+)$/.exec(draftId);
  if (!match) {
    return null;
  }

  return { type: match[1], backendId: Number(match[2]) };
}
