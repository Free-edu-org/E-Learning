import { fetchApi } from "./apiClient";

export type TaskType = "choose" | "write" | "scatter" | "speak";

export interface CreateChooseTaskRequest {
  task: string;
  possibleAnswers: string;
  correctAnswer: number;
  correctAnswers?: number[];
  hint?: string;
  section?: string;
  points: number;
}

export interface CreateWriteTaskRequest {
  task: string;
  correctAnswer: string;
  correctAnswers?: string[];
  hint?: string;
  section?: string;
  points: number;
}

export interface CreateScatterTaskRequest {
  task: string;
  words: string;
  correctAnswer: string;
  correctAnswers?: string[];
  hint?: string;
  section?: string;
  points: number;
}

export interface CreateSpeakTaskRequest {
  expectedText: string;
  hint?: string;
  section?: string;
  points: number;
}

export interface TaskResponse {
  publicId: string;
  lessonPublicId: string | null;
  task: string;
  hint?: string;
  hintImageUrl?: string | null;
  section?: string;
  points: number;
}

export interface ChooseTaskResponse extends TaskResponse {
  possibleAnswers: string;
  correctAnswer: number | null;
  correctAnswers: number[] | null;
  createdAt: string;
}

export interface WriteTaskResponse extends TaskResponse {
  correctAnswer: string | null;
  correctAnswers: string[] | null;
  createdAt: string;
}

export interface ScatterTaskResponse extends TaskResponse {
  words: string;
  correctAnswer: string | null;
  correctAnswers: string[] | null;
  createdAt: string;
}

export interface SpeakTaskResponse extends Omit<TaskResponse, "task"> {
  expectedText: string | null;
  createdAt: string;
}

export interface SpeakTranscriptionResponse {
  attemptId: string;
  text: string;
  rawText: string;
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
  lessonPublicId: string | null;
  status: string | null;
  sections: TaskSectionDto[];
}

export interface AssignTaskToLessonRequest {
  lessonPublicIds: string[];
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

  uploadHintImage: (
    lessonPublicId: string,
    taskType: string,
    taskPublicId: string,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<void>(
      `/api/v1/lessons/${lessonPublicId}/tasks/${taskType}/${taskPublicId}/hint-image`,
      { method: "POST", body: formData },
    );
  },

  deleteHintImage: (
    lessonPublicId: string,
    taskType: string,
    taskPublicId: string,
  ) =>
    fetchApi<void>(
      `/api/v1/lessons/${lessonPublicId}/tasks/${taskType}/${taskPublicId}/hint-image`,
      { method: "DELETE" },
    ),

  getTeacherTaskBank: () =>
    fetchApi<LessonTasksResponse>("/api/v1/teacher/task-bank/tasks"),

  createTeacherBankChooseTask: (payload: CreateChooseTaskRequest) =>
    fetchApi<TaskResponse>("/api/v1/teacher/task-bank/tasks/choose", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createTeacherBankWriteTask: (payload: CreateWriteTaskRequest) =>
    fetchApi<TaskResponse>("/api/v1/teacher/task-bank/tasks/write", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createTeacherBankScatterTask: (payload: CreateScatterTaskRequest) =>
    fetchApi<TaskResponse>("/api/v1/teacher/task-bank/tasks/scatter", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createTeacherBankSpeakTask: (payload: CreateSpeakTaskRequest) =>
    fetchApi<TaskResponse>("/api/v1/teacher/task-bank/tasks/speak", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTeacherBankChooseTask: (
    taskPublicId: string,
    payload: CreateChooseTaskRequest,
  ) =>
    fetchApi<ChooseTaskResponse>(
      `/api/v1/teacher/task-bank/tasks/choose/${taskPublicId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),
  updateTeacherBankWriteTask: (
    taskPublicId: string,
    payload: CreateWriteTaskRequest,
  ) =>
    fetchApi<WriteTaskResponse>(
      `/api/v1/teacher/task-bank/tasks/write/${taskPublicId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),
  updateTeacherBankScatterTask: (
    taskPublicId: string,
    payload: CreateScatterTaskRequest,
  ) =>
    fetchApi<ScatterTaskResponse>(
      `/api/v1/teacher/task-bank/tasks/scatter/${taskPublicId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),
  updateTeacherBankSpeakTask: (
    taskPublicId: string,
    payload: CreateSpeakTaskRequest,
  ) =>
    fetchApi<SpeakTaskResponse>(
      `/api/v1/teacher/task-bank/tasks/speak/${taskPublicId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),

  deleteTeacherBankTask: (type: TaskType, taskPublicId: string) =>
    fetchApi<void>(`/api/v1/teacher/task-bank/tasks/${type}/${taskPublicId}`, {
      method: "DELETE",
    }),

  assignTeacherBankTaskToLesson: (
    type: TaskType,
    taskPublicId: string,
    payload: AssignTaskToLessonRequest,
  ) =>
    fetchApi<void>(
      `/api/v1/teacher/task-bank/tasks/${type}/${taskPublicId}/assign`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
};
