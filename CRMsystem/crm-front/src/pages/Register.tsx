import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Паролі не співпадають');
            return;
        }

        setLoading(true);
        try {
            await register({ fullName, email, password });
            navigate('/', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не вдалося створити акаунт');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page auth-form-page">
            <Link className="auth-back-link" to="/welcome"><i className="fa-solid fa-arrow-left"></i> На головну</Link>
            <section className="auth-card wide-card">
                <div className="auth-brand centered">
                    <div className="auth-brand-icon"><i className="fa-solid fa-chart-line"></i></div>
                    <div>
                        <strong>CRM Pro</strong>
                        <span>Створення акаунта</span>
                    </div>
                </div>

                <div className="auth-card-heading">
                    <h1>Реєстрація</h1>
                    <p>Створіть акаунт менеджера для доступу до CRM-панелі.</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        Повне ім’я
                        <input
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Тарас Цюпак"
                            minLength={2}
                            required
                        />
                    </label>

                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="taras@example.com"
                            required
                        />
                    </label>

                    <div className="auth-two-columns">
                        <label>
                            Пароль
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Мінімум 6 символів"
                                minLength={6}
                                required
                            />
                        </label>
                        <label>
                            Повторіть пароль
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Повторіть пароль"
                                minLength={6}
                                required
                            />
                        </label>
                    </div>

                    <button className="auth-primary-btn full" type="submit" disabled={loading}>
                        {loading ? 'Створюємо...' : 'Зареєструватися'}
                    </button>
                </form>

                <p className="auth-switch-text">
                    Вже маєте акаунт? <Link to="/login">Увійти</Link>
                </p>
            </section>
        </div>
    );
};

export default Register;
