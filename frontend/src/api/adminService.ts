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
  groupPublicId: string | null;
}

export interface AdminUpdateStudentRequest {
  username: string;
  email: string;
  groupPublicId: string | null;
}

export interface AdminStudentProfile extends UserProfile {
  groupPublicId?: string | null;
  groupName?: string | null;
}

export const adminService = {
  getStats: () => fetchApi<AdminStats>("/api/v1/admin/stats"),
  getTeachers: () => fetchApi<UserProfile[]>("/api/v1/admin/teachers"),
  getStudents: () => fetchApi<AdminStudentProfile[]>("/api/v1/admin/students"),
  createStudent: (payload: AdminCreateStudentRequest) =>
    fetchApi<AdminStudentProfile>("/api/v1/admin/students", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStudent: (publicId: string, payload: AdminUpdateStudentRequest) =>
    fetchApi<AdminStudentProfile>(`/api/v1/admin/students/${publicId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
