import { fetchApi } from "./apiClient";
import type { UserProfile } from "./userService";

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalGroups: number;
}

export interface AdminCreateStudentRequest {
  username: string;
  email: string;
  password: string;
  teacherId: number;
  groupId?: number;
}

export const adminService = {
  getStats: () => fetchApi<AdminStats>("/api/v1/admin/stats"),
  getTeachers: () => fetchApi<UserProfile[]>("/api/v1/admin/teachers"),
  getStudents: () => fetchApi<UserProfile[]>("/api/v1/admin/students"),
  createStudent: (payload: AdminCreateStudentRequest) =>
    fetchApi<UserProfile>("/api/v1/admin/students", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
