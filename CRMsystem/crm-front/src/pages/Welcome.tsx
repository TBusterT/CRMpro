import React from 'react';
import { Link } from 'react-router-dom';

const Welcome: React.FC = () => {
    return (
        <div className="auth-page welcome-page">
            <div className="welcome-glow welcome-glow-one" />
            <div className="welcome-glow welcome-glow-two" />

            <header className="welcome-header">
                <div className="auth-brand">
                    <div className="auth-brand-icon"><i className="fa-solid fa-chart-line"></i></div>
                    <div>
                        <strong>CRM Pro</strong>
                        <span>Business Management System</span>
                    </div>
                </div>
                <nav className="welcome-nav">
                    <Link to="/login">Увійти</Link>
                    <Link className="welcome-nav-primary" to="/register">Створити акаунт</Link>
                </nav>
            </header>

            <main className="welcome-hero">
                <section className="welcome-content">
                    <span className="welcome-badge">CRM для продажів, клієнтів і фінансів</span>
                    <h1>Керуйте бізнесом в одному сучасному кабінеті</h1>
                    <p>
                        CRM Pro допомагає вести клієнтів, контролювати товари, фінансові операції
                        та повідомлення з Telegram/Viber в єдиній системі.
                    </p>
                    <div className="welcome-actions">
                        <Link className="auth-primary-btn" to="/register">Почати роботу</Link>
                        <Link className="auth-secondary-btn" to="/login">У мене вже є акаунт</Link>
                    </div>
                    <div className="welcome-stats">
                        <div><strong>4+</strong><span>модулі CRM</span></div>
                        <div><strong>24/7</strong><span>доступ до даних</span></div>
                        <div><strong>2</strong><span>месенджери</span></div>
                    </div>
                </section>

                <section className="welcome-preview" aria-label="CRM dashboard preview">
                    <div className="preview-window">
                        <div className="preview-topbar"><span></span><span></span><span></span></div>
                        <div className="preview-grid">
                            <div className="preview-card large">
                                <div className="preview-card-title">Продажі</div>
                                <div className="preview-chart"><span></span><span></span><span></span><span></span></div>
                            </div>
                            <div className="preview-card"><div>Клієнти</div><strong>1 248</strong></div>
                            <div className="preview-card"><div>Прибуток</div><strong>₴125k</strong></div>
                            <div className="preview-card wide"><div>Нові повідомлення</div><strong>18</strong></div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Welcome;
