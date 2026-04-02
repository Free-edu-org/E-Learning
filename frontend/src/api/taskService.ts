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

export interface ChooseTaskResponse extends TaskResponse {
  possibleAnswers: string;
  correctAnswer: number | null;
  createdAt: string;
}

export interface WriteTaskResponse extends TaskResponse {
  correctAnswer: string | null;
  createdAt: string;
}

export interface ScatterTaskResponse extends TaskResponse {
  words: string;
  correctAnswer: string | null;
  createdAt: string;
}

export interface SpeakTaskResponse extends TaskResponse {
  createdAt: string;
}

export interface TaskSectionDto {
  section: string | null;
  chooseTasks: ChooseTaskResponse[];
  writeTasks: WriteTaskResponse[];
  scatterTasks: ScatterTaskResponse[];
  speakTasks: SpeakTaskResponse[];
}

export interface LessonTasksResponse {
  lessonId: number;
  status: string | null;
  sections: TaskSectionDto[];
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

  getLessonTasks: (lessonId: number) =>
    fetchApi<LessonTasksResponse>(`/api/v1/lessons/${lessonId}/tasks`),

  updateChooseTask: (
    lessonId: number,
    taskId: number,
    payload: CreateChooseTaskRequest,
  ) =>
    fetchApi<ChooseTaskResponse>(
      `/api/v1/lessons/${lessonId}/tasks/choose/${taskId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),
  updateWriteTask: (
    lessonId: number,
    taskId: number,
    payload: CreateWriteTaskRequest,
  ) =>
    fetchApi<WriteTaskResponse>(
      `/api/v1/lessons/${lessonId}/tasks/write/${taskId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),
  updateScatterTask: (
    lessonId: number,
    taskId: number,
    payload: CreateScatterTaskRequest,
  ) =>
    fetchApi<ScatterTaskResponse>(
      `/api/v1/lessons/${lessonId}/tasks/scatter/${taskId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),
  updateSpeakTask: (
    lessonId: number,
    taskId: number,
    payload: CreateSpeakTaskRequest,
  ) =>
    fetchApi<SpeakTaskResponse>(
      `/api/v1/lessons/${lessonId}/tasks/speak/${taskId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),

  deleteTask: (lessonId: number, type: TaskType, taskId: number) =>
    fetchApi<void>(`/api/v1/lessons/${lessonId}/tasks/${type}/${taskId}`, {
      method: "DELETE",
    }),
};
