import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ email, password });
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не вдалося увійти в систему');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page auth-form-page">
            <Link className="auth-back-link" to="/welcome"><i className="fa-solid fa-arrow-left"></i> На головну</Link>
            <section className="auth-card">
                <div className="auth-brand centered">
                    <div className="auth-brand-icon"><i className="fa-solid fa-chart-line"></i></div>
                    <div>
                        <strong>CRM Pro</strong>
                        <span>Вхід до кабінету</span>
                    </div>
                </div>

                <div className="auth-card-heading">
                    <h1>Вхід</h1>
                    <p>Увійдіть, щоб продовжити роботу з CRM-системою.</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="admin@example.com"
                            required
                        />
                    </label>

                    <label>
                        Пароль
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Введіть пароль"
                            minLength={6}
                            required
                        />
                    </label>

                    <button className="auth-primary-btn full" type="submit" disabled={loading}>
                        {loading ? 'Входимо...' : 'Увійти'}
                    </button>
                </form>

                <p className="auth-switch-text">
                    Ще немає акаунта? <Link to="/register">Зареєструватися</Link>
                </p>
            </section>
        </div>
    );
};

export default Login;
