import { api } from './apiClient';

export type AuthUser = {
    id: number;
    fullName: string;
    email: string;
    role: string;
};

export type AuthResponse = {
    accessToken: string;
    user: AuthUser;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = LoginPayload & {
    fullName: string;
};

export const authApi = {
    login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
    register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload),
    me: () => api.get<AuthUser>('/auth/me'),
};
