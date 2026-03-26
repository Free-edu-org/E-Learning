import { fetchApi } from "./apiClient";

export interface UserGroup {
  id: number;
  name: string;
  description: string;
  studentCount: number;
  teacherId?: number | null;
  createdAt: string;
}

export interface UserGroupRequest {
  name: string;
  description: string;
}

export const userGroupService = {
  getGroups: () => fetchApi<UserGroup[]>("/api/v1/user-groups"),
  createGroup: (payload: UserGroupRequest) =>
    fetchApi<UserGroup>("/api/v1/user-groups", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateGroup: (id: number, payload: UserGroupRequest) =>
    fetchApi<UserGroup>(`/api/v1/user-groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteGroup: (id: number) =>
    fetchApi<void>(`/api/v1/user-groups/${id}`, {
      method: "DELETE",
    }),
  addStudentToGroup: (groupId: number, userId: number) =>
    fetchApi<void>(`/api/v1/user-groups/${groupId}/members/${userId}`, {
      method: "POST",
    }),
  removeStudentFromGroup: (groupId: number, userId: number) =>
    fetchApi<void>(`/api/v1/user-groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    }),
};
