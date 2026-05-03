import { fetchApi, fetchApiBlob } from "./apiClient";
import type { LessonResultDetailsResponse } from "./studentService";

export interface Group {
  id: number;
  name: string;
  description?: string;
  studentCount?: number;
  teacherId?: number | null;
  createdAt?: string;
}

export interface LessonAttachment {
  id: number;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface Lesson {
  publicId: string;
  title: string;
  theme: string;
  isActive: boolean;
  teacherId?: number;
  teacherName?: string;
  teacherAvatarUrl?: string | null;
  createdAt: string;
  groups: Group[];
  attachments: LessonAttachment[];
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
  avatarUrl?: string | null;
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

export type { LessonResultDetailsResponse };

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
  updateLesson: (publicId: string, payload: CreateLessonRequest) =>
    fetchApi<Lesson>(`/api/v1/lessons/${publicId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateLessonStatus: (publicId: string, isActive: boolean) =>
    fetchApi<void>(`/api/v1/lessons/${publicId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  deleteLesson: (publicId: string) =>
    fetchApi<void>(`/api/v1/lessons/${publicId}`, {
      method: "DELETE",
    }),
  getLessonStats: (lessonPublicId: string) =>
    fetchApi<LessonStatsResponse>(
      `/api/v1/teacher/lessons/${lessonPublicId}/stats`,
    ),
  getLessonResultDetails: (lessonPublicId: string, userId: number) =>
    fetchApi<LessonResultDetailsResponse>(
      `/api/v1/teacher/lessons/${lessonPublicId}/students/${userId}/result`,
    ),
  resetStudentLessonProgress: (lessonPublicId: string, userId: number) =>
    fetchApi<void>(`/api/v1/lessons/${lessonPublicId}/users/${userId}/reset`, {
      method: "POST",
    }),
  uploadAttachment: (lessonPublicId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<LessonAttachment>(
      `/api/v1/lessons/${lessonPublicId}/attachments`,
      {
        method: "POST",
        body: formData,
      },
    );
  },
  downloadAttachment: (lessonPublicId: string, attachmentId: number) =>
    fetchApiBlob(
      `/api/v1/lessons/${lessonPublicId}/attachments/${attachmentId}`,
    ),
  deleteAttachment: (lessonPublicId: string, attachmentId: number) =>
    fetchApi<void>(
      `/api/v1/lessons/${lessonPublicId}/attachments/${attachmentId}`,
      {
      method: "DELETE",
      },
    ),
};
