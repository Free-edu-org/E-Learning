import { fetchApi } from "./apiClient";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
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

export const userService = {
  getCurrentUser: () => fetchApi<UserProfile>("/api/v1/users/me"),
  getUserById: (id: number) => fetchApi<UserProfile>(`/api/v1/users/${id}`),
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
  updateUser: (id: number, payload: UpdateUserRequest) =>
    fetchApi<UserProfile>(`/api/v1/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: number) =>
    fetchApi<void>(`/api/v1/users/${id}`, {
      method: "DELETE",
    }),
};
