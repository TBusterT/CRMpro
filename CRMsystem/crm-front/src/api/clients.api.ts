import { api } from './apiClient';

export interface Client {
    id: number;
    name: string;
    company: string;
    phone: string;
    email: string;
    status: 'Активний' | 'Новий лід' | 'В перемовинах';
    ltv: number;
    color: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClientDto {
    name: string;
    company: string;
    phone: string;
    email: string;
    status?: Client['status'];
    ltv?: number;
    color?: string;
}

export type UpdateClientDto = Partial<CreateClientDto>;

export const clientsApi = {
    getAll: (search?: string, status?: string) =>
        api.get<Client[]>('/clients', {
            ...(search ? { search } : {}),
            ...(status && status !== 'all' ? { status } : {}),
        }),

    getOne: (id: number) => api.get<Client>(`/clients/${id}`),

    create: (dto: CreateClientDto) => api.post<Client>('/clients', dto),

    update: (id: number, dto: UpdateClientDto) =>
        api.patch<Client>(`/clients/${id}`, dto),

    remove: (id: number) => api.delete<{ message: string }>(`/clients/${id}`),
};
