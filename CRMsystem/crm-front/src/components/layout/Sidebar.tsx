import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
    return (
        <aside className="sidebar">
            <div className="logo-area">
                <div className="logo-icon">
                    <i className="fa-solid fa-table-columns"></i>
                </div>

                <div className="logo-text">
                    <h1>CRM Pro</h1>
                    <span>v2.1.0</span>
                </div>
            </div>

            <nav className="menu">
                <p className="menu-label">Меню</p>

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        isActive ? 'menu-item active' : 'menu-item'
                    }
                >
                    <div className="item-icon blue-icon">
                        <i className="fa-solid fa-house"></i>
                    </div>
                    <span>Головна</span>
                </NavLink>

                <NavLink
                    to="/clients"
                    className={({ isActive }) =>
                        isActive ? 'menu-item active' : 'menu-item'
                    }
                >
                    <div className="item-icon green-icon">
                        <i className="fa-solid fa-users"></i>
                    </div>
                    <span>Клієнти</span>
                </NavLink>

                <NavLink
                    to="/inbox"
                    className={({ isActive }) =>
                        isActive ? 'menu-item active' : 'menu-item'
                    }
                >
                    <div className="item-icon" style={{ backgroundColor: '#0ea5e9' }}>
                        <i className="fa-solid fa-message"></i>
                    </div>
                    <span>Повідомлення</span>
                </NavLink>

                <NavLink
                    to="/inventory"
                    className={({ isActive }) =>
                        isActive ? 'menu-item active' : 'menu-item'
                    }
                >
                    <div className="item-icon purple-icon">
                        <i className="fa-solid fa-box"></i>
                    </div>
                    <span>Товари</span>
                </NavLink>

                <NavLink
                    to="/finance"
                    className={({ isActive }) =>
                        isActive ? 'menu-item active' : 'menu-item'
                    }
                >
                    <div className="item-icon" style={{ backgroundColor: '#f59e0b' }}>
                        <i className="fa-solid fa-wallet"></i>
                    </div>
                    <span>Фінанси</span>
                </NavLink>
            </nav>
        </aside>
    );
};