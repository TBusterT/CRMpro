import { api } from './apiClient';

export interface Transaction {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    category: string;
    createdAt: string;
    updatedAt: string;
}

export interface FinanceSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
}

export interface CreateTransactionDto {
    amount: number;
    type: 'income' | 'expense';
    description?: string;
    category?: string;
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>;

export const financeApi = {
    getAll: (type?: 'income' | 'expense') =>
        api.get<Transaction[]>('/finance', type ? { type } : undefined),

    getSummary: () => api.get<FinanceSummary>('/finance/summary'),

    getOne: (id: number) => api.get<Transaction>(`/finance/${id}`),

    create: (dto: CreateTransactionDto) => api.post<Transaction>('/finance', dto),

    update: (id: number, dto: UpdateTransactionDto) =>
        api.patch<Transaction>(`/finance/${id}`, dto),

    remove: (id: number) => api.delete<{ message: string }>(`/finance/${id}`),
};
