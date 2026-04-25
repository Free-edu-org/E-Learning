import { fetchApi } from "./apiClient";

export interface Group {
  id: number;
  name: string;
  description?: string;
  studentCount?: number;
  teacherId?: number | null;
  createdAt?: string;
}

export interface Lesson {
  id: number;
  title: string;
  theme: string;
  isActive: boolean;
  teacherId?: number;
  teacherName?: string;
  teacherAvatarUrl?: string | null;
  createdAt: string;
  groups: Group[];
}

export interface TeacherStats {
  totalLessons: number;
  activeLessons: number;
  activeStudents: number;
  avgScore: number; // percentage 0-100
}

export interface TeacherStudentResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  groupId: number;
  avatarUrl?: string | null;
}

export interface LessonStatsStudentResult {
  userId: number;
  username: string;
  completedAt: string | null;
  score: number;
  maxScore: number;
  resultPercent: number;
}

export interface LessonStatsResponse {
  avgScore: number;
  studentsCompleted: number;
  bestScore: number;
  studentResults: LessonStatsStudentResult[];
}

export interface CreateTeacherStudentRequest {
  username: string;
  email: string;
  password: string;
  groupId: number;
}

export interface UpdateTeacherStudentRequest {
  username: string;
  email: string;
  groupId: number;
}

export interface CreateLessonRequest {
  title: string;
  theme: string;
  groupIds?: number[];
}

export const lessonService = {
  getLessons: () => fetchApi<Lesson[]>("/api/v1/lessons"),
  getTeacherLessons: () => fetchApi<Lesson[]>("/api/v1/teacher/lessons"),
  getTeacherStats: () => fetchApi<TeacherStats>("/api/v1/teacher/stats"),
  getTeacherGroups: () => fetchApi<Group[]>("/api/v1/teacher/my-groups"),
  getTeacherStudents: () =>
    fetchApi<TeacherStudentResponse[]>("/api/v1/teacher/students"),
  createTeacherStudent: (payload: CreateTeacherStudentRequest) =>
    fetchApi<TeacherStudentResponse>("/api/v1/teacher/students", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTeacherStudent: (id: number, payload: UpdateTeacherStudentRequest) =>
    fetchApi<TeacherStudentResponse>(`/api/v1/teacher/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  createLesson: (payload: CreateLessonRequest) =>
    fetchApi<Lesson>("/api/v1/lessons", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateLesson: (id: number, payload: CreateLessonRequest) =>
    fetchApi<Lesson>(`/api/v1/lessons/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateLessonStatus: (id: number, isActive: boolean) =>
    fetchApi<void>(`/api/v1/lessons/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  deleteLesson: (id: number) =>
    fetchApi<void>(`/api/v1/lessons/${id}`, {
      method: "DELETE",
    }),
  getLessonStats: (lessonId: number) =>
    fetchApi<LessonStatsResponse>(`/api/v1/teacher/lessons/${lessonId}/stats`),
};
