import { fetchApi, fetchApiBlob } from "./apiClient";
import type { LessonResultDetailsResponse } from "./studentService";

export interface Group {
  publicId: string;
  name: string;
  description?: string;
  studentCount?: number;
  teacherPublicId?: string | null;
  createdAt?: string;
}

export interface LessonAttachment {
  publicId: string;
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
  teacherPublicId?: string;
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
  publicId: string;
  username: string | null;
  email: string;
  role: string;
  status: "ACTIVE" | "INVITED" | "EMAIL_VERIFICATION_PENDING";
  createdAt: string;
  groupPublicId: string;
  avatarUrl?: string | null;
}

export interface LessonStatsStudentResult {
  userPublicId: string;
  username: string;
  avatarUrl?: string | null;
  completedAt: string | null;
  score: number;
  maxScore: number;
  resultPercent: number;
  totalTabSwitchCount: number;
}

export interface LessonStatsResponse {
  avgScore: number;
  studentsCompleted: number;
  bestScore: number;
  studentResults: LessonStatsStudentResult[];
}

export type { LessonResultDetailsResponse };

export interface CreateTeacherStudentRequest {
  email: string;
  groupPublicId: string;
}

export interface UpdateTeacherStudentRequest {
  username: string;
  email: string;
  groupPublicId: string;
}

export interface CreateLessonRequest {
  title: string;
  theme: string;
  groupPublicIds?: string[];
}

export interface StudentLessonResult {
  lessonPublicId: string;
  lessonTitle: string;
  score: number;
  maxScore: number;
  resultPercent: number;
  completedAt: string | null;
}

export interface ProgressPoint {
  date: string;
  progress: number;
}

export interface SkillStat {
  category: string;
  correct: number;
  wrong: number;
}

export interface TeacherStudentStatsResponse {
  student: TeacherStudentResponse;
  totalLessons: number;
  completedLessons: number;
  avgScore: number;
  lessonResults: StudentLessonResult[];
  progressHistory: ProgressPoint[];
  skillStats: SkillStat[];
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
  updateTeacherStudent: (
    publicId: string,
    payload: UpdateTeacherStudentRequest,
  ) =>
    fetchApi<TeacherStudentResponse>(`/api/v1/teacher/students/${publicId}`, {
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
  getLessonResultDetails: (lessonPublicId: string, studentPublicId: string) =>
    fetchApi<LessonResultDetailsResponse>(
      `/api/v1/teacher/lessons/${lessonPublicId}/students/${studentPublicId}/result`,
    ),
  getStudentStats: (studentPublicId: string) =>
    fetchApi<TeacherStudentStatsResponse>(
      `/api/v1/teacher/students/${studentPublicId}/stats`,
    ),
  resendTeacherStudentInvite: (studentPublicId: string) =>
    fetchApi<void>(
      `/api/v1/teacher/students/${studentPublicId}/resend-invite`,
      {
        method: "POST",
      },
    ),
  cancelTeacherStudentInvitation: (studentPublicId: string) =>
    fetchApi<void>(`/api/v1/teacher/students/${studentPublicId}`, {
      method: "DELETE",
    }),
  resetStudentLessonProgress: (lessonPublicId: string, userPublicId: string) =>
    fetchApi<void>(
      `/api/v1/lessons/${lessonPublicId}/users/${userPublicId}/reset`,
      {
        method: "POST",
      },
    ),
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
  downloadAttachment: (lessonPublicId: string, attachmentPublicId: string) =>
    fetchApiBlob(
      `/api/v1/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`,
    ),
  deleteAttachment: (lessonPublicId: string, attachmentPublicId: string) =>
    fetchApi<void>(
      `/api/v1/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`,
      {
        method: "DELETE",
      },
    ),
};
