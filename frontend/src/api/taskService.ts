import { fetchApi } from "./apiClient";

// ── Types ──

export interface TaskResponse {
  id: number;
  taskType: string;
  task: string;
  hint: string | null;
  section: string | null;
  possibleAnswers: string | null;
  words: string | null;
  correctAnswerIndex: number | null;
  correctAnswerText: string | null;
}

export interface LessonTasksResponse {
  lessonId: number;
  lessonTitle: string;
  status: string | null;
  sections: Record<string, TaskResponse[]>;
}

export interface SubmitAnswerItem {
  taskId: number;
  taskType: string;
  answer: string;
}

export interface AnswerResultItem {
  taskId: number;
  taskType: string;
  isCorrect: boolean;
}

export interface SubmitResultResponse {
  lessonId: number;
  score: number;
  maxScore: number;
  status: string;
  results: AnswerResultItem[];
}

export interface CreateChooseTaskRequest {
  task: string;
  possibleAnswers: string;
  correctAnswer: number;
  hint?: string;
  section?: string;
}

export interface CreateWriteTaskRequest {
  task: string;
  correctAnswer: string;
  hint?: string;
  section?: string;
}

export interface CreateSpeakTaskRequest {
  task: string;
  hint?: string;
  section?: string;
}

export interface CreateScatterTaskRequest {
  task: string;
  words: string;
  correctAnswer: string;
  hint?: string;
  section?: string;
}

// ── Service ──

export const taskService = {
  // Student: get lesson tasks
  getLessonTasks: (lessonId: number) =>
    fetchApi<LessonTasksResponse>(`/api/v1/lessons/${lessonId}/tasks`),

  // Student: submit answers
  submitAnswers: (lessonId: number, answers: SubmitAnswerItem[]) =>
    fetchApi<SubmitResultResponse>(`/api/v1/lessons/${lessonId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  // Teacher: create task
  createTask: (
    lessonId: number,
    taskType: string,
    data:
      | CreateChooseTaskRequest
      | CreateWriteTaskRequest
      | CreateSpeakTaskRequest
      | CreateScatterTaskRequest,
  ) =>
    fetchApi<TaskResponse>(
      `/api/v1/lessons/${lessonId}/tasks/${taskType}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  // Teacher: update task
  updateTask: (
    lessonId: number,
    taskType: string,
    taskId: number,
    data:
      | CreateChooseTaskRequest
      | CreateWriteTaskRequest
      | CreateSpeakTaskRequest
      | CreateScatterTaskRequest,
  ) =>
    fetchApi<TaskResponse>(
      `/api/v1/lessons/${lessonId}/tasks/${taskType}/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  // Teacher: delete task
  deleteTask: (lessonId: number, taskType: string, taskId: number) =>
    fetchApi<void>(
      `/api/v1/lessons/${lessonId}/tasks/${taskType}/${taskId}`,
      { method: "DELETE" },
    ),

  // Teacher: reset student progress
  resetStudent: (lessonId: number, userId: number) =>
    fetchApi<void>(
      `/api/v1/lessons/${lessonId}/users/${userId}/reset`,
      { method: "POST" },
    ),
};
