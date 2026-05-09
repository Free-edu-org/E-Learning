import { fetchApi } from "./apiClient";
import type { UserProfile } from "./userService";

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalGroups: number;
}

export type AchievementType = "LESSONS_COMPLETED" | "POINTS" | "AVATAR_CHANGED";

export interface AdminAchievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: AchievementType;
  threshold: number | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAchievementRequest {
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: AchievementType;
  threshold: number | null;
  active: boolean;
  sortOrder: number;
}

export interface UpdateAchievementRequest {
  title: string;
  description: string;
  icon: string;
  color: string;
  threshold: number | null;
  active: boolean;
  sortOrder: number;
}

export interface SetAchievementActiveRequest {
  active: boolean;
}

export interface AdminCreateStudentRequest {
  email: string;
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
  status?: "ACTIVE" | "INVITED" | "EMAIL_VERIFICATION_PENDING";
}

export const adminService = {
  getStats: () => fetchApi<AdminStats>("/api/v1/admin/stats"),
  getAdminAchievements: () =>
    fetchApi<AdminAchievement[]>("/api/v1/admin/achievements"),
  getAdminAchievement: (code: string) =>
    fetchApi<AdminAchievement>(`/api/v1/admin/achievements/${code}`),
  createAchievement: (payload: CreateAchievementRequest) =>
    fetchApi<AdminAchievement>("/api/v1/admin/achievements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAchievement: (code: string, payload: UpdateAchievementRequest) =>
    fetchApi<AdminAchievement>(`/api/v1/admin/achievements/${code}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  setAchievementActive: (code: string, active: boolean) =>
    fetchApi<AdminAchievement>(`/api/v1/admin/achievements/${code}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active } satisfies SetAchievementActiveRequest),
    }),
  getTeachers: () => fetchApi<UserProfile[]>("/api/v1/admin/teachers"),
  inviteTeacher: (payload: { email: string }) =>
    fetchApi<UserProfile>("/api/v1/admin/teachers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
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
  resendStudentInvite: (studentPublicId: string) =>
    fetchApi<void>(`/api/v1/admin/students/${studentPublicId}/resend-invite`, {
      method: "POST",
    }),
};
