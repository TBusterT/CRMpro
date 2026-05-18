import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
    data: T;
    loading: boolean;
    error: string | null;
}

/**
 * Хук для одноразового завантаження даних.
 * initialData — значення до першої відповіді (наприклад [] або null).
 * Автоматично перезавантажує при зміні deps.
 */
export function useApi<T>(
    fetcher: () => Promise<T>,
    deps: unknown[],
    initialData: T,
): UseApiState<T> & { refetch: () => void };

export function useApi<T>(
    fetcher: () => Promise<T>,
    deps?: unknown[],
): UseApiState<T | null> & { refetch: () => void };

export function useApi<T>(
    fetcher: () => Promise<T>,
    deps: unknown[] = [],
    initialData?: T,
): (UseApiState<T> | UseApiState<T | null>) & { refetch: () => void } {
    const [state, setState] = useState<UseApiState<T | null>>({
        data: initialData !== undefined ? initialData : null,
        loading: true,
        error: null,
    });

    const fetch = useCallback(() => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        fetcher()
            .then(data => setState({ data, loading: false, error: null }))
            .catch(err =>
                setState({ data: null, loading: false, error: err.message ?? 'Помилка завантаження' }),
            );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { ...state, refetch: fetch };
}
