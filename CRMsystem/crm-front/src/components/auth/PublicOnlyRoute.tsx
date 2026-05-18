import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-loading-screen">
                <div className="auth-loader" />
                <p>Перевіряємо сесію...</p>
            </div>
        );
    }

    if (isAuthenticated) return <Navigate to="/dashboard" replace />;

    return <>{children}</>;
};
