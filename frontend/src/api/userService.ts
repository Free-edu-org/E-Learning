import { fetchApi } from "./apiClient";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export const userService = {
  getCurrentUser: () => fetchApi<UserProfile>("/api/v1/users/me"),
};
