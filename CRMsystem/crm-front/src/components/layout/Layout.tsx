import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <Header />
                {children}
            </main>
        </div>
    );
};