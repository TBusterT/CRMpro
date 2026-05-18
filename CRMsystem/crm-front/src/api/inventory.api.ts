import { api } from './apiClient';

export interface Product {
    id: number;
    sku: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: 'В наявності' | 'Закінчується' | 'Немає в наявності';
    createdAt: string;
    updatedAt: string;
}

export interface InventoryStats {
    totalItems: number;
    totalValue: number;
    totalCategories: number;
    outOfStock: number;
    lowStock: number;
}

export interface CreateProductDto {
    sku: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    status?: Product['status'];
}

export type UpdateProductDto = Partial<CreateProductDto>;

export const inventoryApi = {
    getAll: (category?: string, status?: string) =>
        api.get<Product[]>('/inventory', {
            ...(category ? { category } : {}),
            ...(status ? { status } : {}),
        }),

    getStats: () => api.get<InventoryStats>('/inventory/stats'),

    getOne: (id: number) => api.get<Product>(`/inventory/${id}`),

    create: (dto: CreateProductDto) => api.post<Product>('/inventory', dto),

    update: (id: number, dto: UpdateProductDto) =>
        api.patch<Product>(`/inventory/${id}`, dto),

    remove: (id: number) => api.delete<{ message: string }>(`/inventory/${id}`),
};
