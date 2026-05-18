export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const BASE_URL = API_BASE_URL;

export const TOKEN_STORAGE_KEY = 'crm_auth_token';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiErrorBody = {
    message?: string | string[];
    error?: string;
    statusCode?: number;
};

export const authToken = {
    get: () => localStorage.getItem(TOKEN_STORAGE_KEY),
    set: (token: string) => localStorage.setItem(TOKEN_STORAGE_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_STORAGE_KEY),
};

async function request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
): Promise<T> {
    let url = `${BASE_URL}${path}`;

    if (params) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][],
        );
        if (query.toString()) url += `?${query}`;
    }

    const token = authToken.get();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const error = (await res.json().catch(() => ({ message: res.statusText }))) as ApiErrorBody;
        const message = Array.isArray(error.message) ? error.message.join(', ') : error.message;
        throw new Error(message ?? error.error ?? `HTTP ${res.status}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
}

export const api = {
    get: <T>(path: string, params?: Record<string, string>) =>
        request<T>('GET', path, undefined, params),
    post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
};
