import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="auth-loading-screen">
                <div className="auth-loader" />
                <p>Завантаження CRM Pro...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace state={{ from: location }} />;
    }

    return <>{children}</>;
};
