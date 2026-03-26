import { fetchApi } from "./apiClient";

export interface Group {
  id: number;
  name: string;
}

export interface Lesson {
  id: number;
  title: string;
  theme: string;
  isActive: boolean;
  teacherId?: number;
  teacherName?: string;
  createdAt: string;
  groups: Group[];
}

export interface TeacherStats {
  totalLessons: number;
  activeLessons: number;
  activeStudents: number;
  avgScore: number; // percentage 0-100
}

export interface StudentLesson {
  id: number;
  title: string;
  theme: string;
  status: string | null; // null = not started, "IN_PROGRESS", "COMPLETED"
}

export interface CreateLessonRequest {
  title: string;
  theme: string;
  groupIds?: number[];
}

export interface StudentUser {
  id: number;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface LessonStudent {
  id: number;
  username: string;
  email: string;
  accessType: "direct" | "group";
  groupName: string | null;
}

export const lessonService = {
  getLessons: () => fetchApi<Lesson[]>("/api/v1/lessons"),
  getStats: () => fetchApi<TeacherStats>("/api/v1/teacher/stats"),
  getGroups: () => fetchApi<Group[]>("/api/v1/user-groups"),
  getStudentLessons: () =>
    fetchApi<StudentLesson[]>("/api/v1/student/lessons"),
  createLesson: (data: CreateLessonRequest) =>
    fetchApi<Lesson>("/api/v1/lessons", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  toggleLessonStatus: (lessonId: number, isActive: boolean) =>
    fetchApi<void>(`/api/v1/lessons/${lessonId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  updateLesson: (lessonId: number, data: CreateLessonRequest) =>
    fetchApi<Lesson>(`/api/v1/lessons/${lessonId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getAllStudents: () => fetchApi<StudentUser[]>("/api/v1/users/students"),
  getAssignedStudents: (lessonId: number) =>
    fetchApi<LessonStudent[]>(`/api/v1/lessons/${lessonId}/students`),
  assignStudent: (lessonId: number, userId: number) =>
    fetchApi<void>(`/api/v1/lessons/${lessonId}/students/${userId}`, {
      method: "POST",
    }),
  removeStudent: (lessonId: number, userId: number) =>
    fetchApi<void>(`/api/v1/lessons/${lessonId}/students/${userId}`, {
      method: "DELETE",
    }),
};
