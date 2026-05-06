import { fetchApi } from "./apiClient";

export interface InvitationResponse {
  token: string;
  groupPublicId: string;
  groupName: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface InvitationInfoResponse {
  token: string;
  groupName: string;
  maxUses: number;
  usedCount: number;
}

export interface CreateInvitationRequest {
  maxUses: number;
  expiresAt: string;
}

export interface RegisterWithInvitationRequest {
  token: string;
  email: string;
  username: string;
  password: string;
}

export interface RegisterWithInvitationResponse {
  token: string;
  role: string;
}

export const invitationService = {
  createInvitation: (groupPublicId: string, data: CreateInvitationRequest) =>
    fetchApi<InvitationResponse>(
      `/api/v1/teacher/groups/${groupPublicId}/invitations`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  getInvitations: (groupPublicId: string) =>
    fetchApi<InvitationResponse[]>(
      `/api/v1/teacher/groups/${groupPublicId}/invitations`,
    ),

  deactivateInvitation: (groupPublicId: string, token: string) =>
    fetchApi<void>(
      `/api/v1/teacher/groups/${groupPublicId}/invitations/${token}`,
      { method: "DELETE" },
    ),

  getInvitationInfo: (token: string) =>
    fetchApi<InvitationInfoResponse>(`/api/v1/invitations/${token}`),

  registerWithInvitation: (data: RegisterWithInvitationRequest) =>
    fetchApi<RegisterWithInvitationResponse>(`/api/v1/invitations/register`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
