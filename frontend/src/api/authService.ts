import {fetchApi} from "./apiClient";

export interface LoginRequest {
    email: string;
    password?: string;
}

export interface LoginResponse {
    token: string;
    role: string;
}

export const authService = {
    login: (data: LoginRequest) => {
        return fetchApi<LoginResponse>('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};
