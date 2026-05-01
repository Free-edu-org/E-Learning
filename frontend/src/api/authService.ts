import { fetchApi } from "./apiClient";

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const authService = {
  login: (data: LoginRequest) => {
    return fetchApi<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  forgotPassword: (data: ForgotPasswordRequest) =>
    fetchApi<MessageResponse>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resetPassword: (data: ResetPasswordRequest) =>
    fetchApi<void>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
