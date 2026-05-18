import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="top-header">
            <div className="header-title">
                <h2>Панель управління</h2>
                <span className="divider">|</span>
                <span className="last-update">Останнє оновлення: <span>щойно</span></span>
            </div>

            <div className="header-actions">
                <button className="icon-btn" title="Сповіщення">
                    <i className="fa-regular fa-bell"></i>
                </button>

                <button className="profile-btn" title={user?.email ?? 'Профіль'}>
                    <i className="fa-solid fa-user"></i>
                    <span>{user?.fullName ?? 'Менеджер'}</span>
                </button>

                <button className="logout-btn" onClick={logout} title="Вийти">
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Вийти</span>
                </button>
            </div>
        </header>
    );
};
