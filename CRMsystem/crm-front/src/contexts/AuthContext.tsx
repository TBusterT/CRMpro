import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, type AuthUser, type LoginPayload, type RegisterPayload } from '../api/auth.api';
import { authToken } from '../api/apiClient';

type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            if (!authToken.get()) {
                setLoading(false);
                return;
            }

            try {
                const currentUser = await authApi.me();
                setUser(currentUser);
            } catch {
                authToken.clear();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (payload: LoginPayload) => {
        const response = await authApi.login(payload);
        authToken.set(response.accessToken);
        setUser(response.user);
    };

    const register = async (payload: RegisterPayload) => {
        const response = await authApi.register(payload);
        authToken.set(response.accessToken);
        setUser(response.user);
    };

    const logout = () => {
        authToken.clear();
        setUser(null);
    };

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: Boolean(user),
            login,
            register,
            logout,
        }),
        [user, loading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
};
