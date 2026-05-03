import { fetchApi } from "./apiClient";

export interface UserProfile {
  publicId: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  avatarUrl?: string | null;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export const userService = {
  getCurrentUser: () => fetchApi<UserProfile>("/api/v1/users/me"),
  getUserById: (publicId: string) => fetchApi<UserProfile>(`/api/v1/users/${publicId}`),
  createTeacher: (payload: CreateUserRequest) =>
    fetchApi<void>("/api/v1/users/teacher", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createStudent: (payload: CreateUserRequest) =>
    fetchApi<void>("/api/v1/users/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateUser: (publicId: string, payload: UpdateUserRequest) =>
    fetchApi<UserProfile>(`/api/v1/users/${publicId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  changePassword: (publicId: string, payload: ChangePasswordRequest) =>
    fetchApi<void>(`/api/v1/users/${publicId}/password`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteUser: (publicId: string) =>
    fetchApi<void>(`/api/v1/users/${publicId}`, {
      method: "DELETE",
    }),
  uploadAvatar: (publicId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<UserProfile>(`/api/v1/users/${publicId}/avatar`, {
      method: "POST",
      body: formData,
    });
  },
  setPresetAvatar: (publicId: string, presetName: string) =>
    fetchApi<UserProfile>(`/api/v1/users/${publicId}/avatar/preset`, {
      method: "PUT",
      body: JSON.stringify({ presetName }),
    }),
};
