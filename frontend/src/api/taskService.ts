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
  expectedText: string;
  hint?: string;
  section?: string;
}

export interface TaskResponse {
  publicId: string;
  lessonPublicId: string;
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
  expectedText: string;
  createdAt: string;
}

export interface SpeakTranscriptionResponse {
  text: string;
  expectedText: string;
  correct: boolean;
  score: number;
  words: {
    expected: string;
    actual: string;
    correct: boolean;
  }[];
}

export interface TaskSectionDto {
  section: string | null;
  chooseTasks: ChooseTaskResponse[];
  writeTasks: WriteTaskResponse[];
  scatterTasks: ScatterTaskResponse[];
  speakTasks: SpeakTaskResponse[];
}

export interface LessonTasksResponse {
  lessonPublicId: string;
  status: string | null;
  sections: TaskSectionDto[];
}

export const taskService = {
  createChooseTask: (
    lessonPublicId: string,
    payload: CreateChooseTaskRequest,
  ) =>
    fetchApi<TaskResponse>(`/api/v1/lessons/${lessonPublicId}/tasks/choose`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createWriteTask: (lessonPublicId: string, payload: CreateWriteTaskRequest) =>
    fetchApi<TaskResponse>(`/api/v1/lessons/${lessonPublicId}/tasks/write`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createScatterTask: (
    lessonPublicId: string,
    payload: CreateScatterTaskRequest,
  ) =>
    fetchApi<TaskResponse>(`/api/v1/lessons/${lessonPublicId}/tasks/scatter`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createSpeakTask: (lessonPublicId: string, payload: CreateSpeakTaskRequest) =>
    fetchApi<TaskResponse>(`/api/v1/lessons/${lessonPublicId}/tasks/speak`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getLessonTasks: (lessonPublicId: string) =>
    fetchApi<LessonTasksResponse>(`/api/v1/lessons/${lessonPublicId}/tasks`),

  updateChooseTask: (
    lessonPublicId: string,
    taskPublicId: string,
    payload: CreateChooseTaskRequest,
  ) =>
    fetchApi<ChooseTaskResponse>(
      `/api/v1/lessons/${lessonPublicId}/tasks/choose/${taskPublicId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),
  updateWriteTask: (
    lessonPublicId: string,
    taskPublicId: string,
    payload: CreateWriteTaskRequest,
  ) =>
    fetchApi<WriteTaskResponse>(
      `/api/v1/lessons/${lessonPublicId}/tasks/write/${taskPublicId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),
  updateScatterTask: (
    lessonPublicId: string,
    taskPublicId: string,
    payload: CreateScatterTaskRequest,
  ) =>
    fetchApi<ScatterTaskResponse>(
      `/api/v1/lessons/${lessonPublicId}/tasks/scatter/${taskPublicId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),
  updateSpeakTask: (
    lessonPublicId: string,
    taskPublicId: string,
    payload: CreateSpeakTaskRequest,
  ) =>
    fetchApi<SpeakTaskResponse>(
      `/api/v1/lessons/${lessonPublicId}/tasks/speak/${taskPublicId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),

  deleteTask: (lessonPublicId: string, type: TaskType, taskPublicId: string) =>
    fetchApi<void>(
      `/api/v1/lessons/${lessonPublicId}/tasks/${type}/${taskPublicId}`,
      {
      method: "DELETE",
      },
    ),
  transcribeSpeakTask: (
    lessonPublicId: string,
    taskPublicId: string,
    audio: Blob,
  ) => {
    const formData = new FormData();
    formData.append("file", audio, "answer.webm");
    return fetchApi<SpeakTranscriptionResponse>(
      `/api/v1/lessons/${lessonPublicId}/tasks/speak/${taskPublicId}/transcribe`,
      {
        method: "POST",
        body: formData,
      },
    );
  },
};
