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
  createdAt: string;
  groups: Group[];
}

export interface TeacherStats {
  totalLessons: number;
  activeLessons: number;
  activeStudents: number;
  avgScore: number; // percentage 0-100
}

export const lessonService = {
  getLessons: () => fetchApi<Lesson[]>("/api/v1/lessons"),
  getStats: () => fetchApi<TeacherStats>("/api/v1/teacher/stats"),
  getGroups: () => fetchApi<Group[]>("/api/v1/user-groups"),
};
