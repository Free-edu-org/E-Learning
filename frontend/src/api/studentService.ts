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
  createdAt: string;
  groups: StudentLessonGroup[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score: number | null;
  maxScore: number | null;
  resultPercent: number | null;
}

export const studentService = {
  getStats: () => fetchApi<StudentStats>("/api/v1/student/stats"),
  getLessons: () => fetchApi<StudentLesson[]>("/api/v1/student/lessons"),
  getProgress: () => fetchApi<StudentProgress>("/api/v1/student/progress"),
};
