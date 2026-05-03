import { fetchApi } from "./apiClient";

export interface UserGroup {
  publicId: string;
  name: string;
  description: string;
  studentCount: number;
  teacherId?: number | null;
  createdAt: string;
}

export interface UserGroupRequest {
  name: string;
  description: string;
  teacherId?: number | null;
}

export const userGroupService = {
  getGroups: () => fetchApi<UserGroup[]>("/api/v1/user-groups"),
  createGroup: (payload: UserGroupRequest) =>
    fetchApi<UserGroup>("/api/v1/user-groups", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateGroup: (publicId: string, payload: UserGroupRequest) =>
    fetchApi<UserGroup>(`/api/v1/user-groups/${publicId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteGroup: (publicId: string) =>
    fetchApi<void>(`/api/v1/user-groups/${publicId}`, {
      method: "DELETE",
    }),
  addStudentToGroup: (groupPublicId: string, userId: number) =>
    fetchApi<void>(`/api/v1/user-groups/${groupPublicId}/members/${userId}`, {
      method: "POST",
    }),
  removeStudentFromGroup: (groupPublicId: string, userId: number) =>
    fetchApi<void>(`/api/v1/user-groups/${groupPublicId}/members/${userId}`, {
      method: "DELETE",
    }),
};
