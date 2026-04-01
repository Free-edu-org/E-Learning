import { fetchApi } from "./apiClient";

export type TaskType = "choose" | "write" | "scatter" | "speak";

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

export interface CreateScatterTaskRequest {
  task: string;
  words: string;
  correctAnswer: string;
  hint?: string;
  section?: string;
}

export interface CreateSpeakTaskRequest {
  task: string;
  hint?: string;
  section?: string;
}

export interface TaskResponse {
  id: number;
  lessonId: number;
  task: string;
  hint?: string;
  section?: string;
}

export const taskService = {
  createChooseTask: (lessonId: number, payload: CreateChooseTaskRequest) =>
    fetchApi<TaskResponse>(`/api/v1/lessons/${lessonId}/tasks/choose`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createWriteTask: (lessonId: number, payload: CreateWriteTaskRequest) =>
    fetchApi<TaskResponse>(`/api/v1/lessons/${lessonId}/tasks/write`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createScatterTask: (lessonId: number, payload: CreateScatterTaskRequest) =>
    fetchApi<TaskResponse>(`/api/v1/lessons/${lessonId}/tasks/scatter`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createSpeakTask: (lessonId: number, payload: CreateSpeakTaskRequest) =>
    fetchApi<TaskResponse>(`/api/v1/lessons/${lessonId}/tasks/speak`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};