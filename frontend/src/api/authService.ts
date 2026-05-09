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

export type EmailVerificationTokenState =
  | "VALID"
  | "EXPIRED"
  | "USED"
  | "ALREADY_VERIFIED";

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface InviteTokenInfoResponse {
  email: string;
}

export interface ActivateAccountRequest {
  token: string;
  username: string;
  password: string;
}

export interface EmailVerificationTokenInfoResponse {
  email: string;
  status: EmailVerificationTokenState;
}

export interface ConfirmEmailVerificationRequest {
  token: string;
}

export interface ResendEmailVerificationRequest {
  email: string;
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
  validateInviteToken: (token: string) =>
    fetchApi<InviteTokenInfoResponse>(
      `/api/v1/auth/invite/${encodeURIComponent(token)}`,
    ),
  activateAccount: (data: ActivateAccountRequest) =>
    fetchApi<void>("/api/v1/auth/activate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getEmailVerificationTokenInfo: (token: string) =>
    fetchApi<EmailVerificationTokenInfoResponse>(
      `/api/v1/auth/email-verification/${encodeURIComponent(token)}`,
    ),
  confirmEmailVerification: (data: ConfirmEmailVerificationRequest) =>
    fetchApi<void>("/api/v1/auth/email-verification/confirm", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resendEmailVerification: (data: ResendEmailVerificationRequest) =>
    fetchApi<MessageResponse>("/api/v1/auth/email-verification/resend", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
