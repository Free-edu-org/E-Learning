import { fetchApi } from "./apiClient";

export interface StudentStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  averageScore: number;
}

export interface StudentProgress {
  summary: string;
  completedLessons: number;
  totalLessons: number;
  inProgressLessons: number;
  averageScore: number;
}

export interface StudentLessonGroup {
  id: number;
  name: string;
}

export interface StudentLesson {
  id: number;
  title: string;
  theme: string;
  isActive: boolean;
  teacherId: number;
  teacherName: string;
  teacherAvatarUrl?: string | null;
  createdAt: string;
  groups: StudentLessonGroup[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score: number | null;
  maxScore: number | null;
  resultPercent: number | null;
}

export interface SubmitAnswerItem {
  taskId: number;
  taskType: "choose" | "write" | "scatter" | "speak";
  answer: string;
}

export interface SubmitAnswersRequest {
  answers: SubmitAnswerItem[];
}

export interface SubmitAnswerDetail {
  taskId: number;
  taskType: string;
  isCorrect: boolean;
  correctAnswer: string;
}

export interface SubmitAnswersResponse {
  score: number;
  maxScore: number;
  details: SubmitAnswerDetail[];
}

export const studentService = {
  getStats: () => fetchApi<StudentStats>("/api/v1/student/stats"),
  getLessons: () => fetchApi<StudentLesson[]>("/api/v1/student/lessons"),
  getProgress: () => fetchApi<StudentProgress>("/api/v1/student/progress"),
  submitAnswers: (lessonId: number, payload: SubmitAnswersRequest) =>
    fetchApi<SubmitAnswersResponse>(`/api/v1/lessons/${lessonId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
