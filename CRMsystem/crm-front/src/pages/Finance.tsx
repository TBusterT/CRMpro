import React, { useState } from 'react';
import type { FormEvent } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';
import { financeApi } from '../api/finance.api';
import { useApi } from '../hooks/useApi';
import '../styles/finance.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

type TransactionType = 'income' | 'expense';

type TransactionFormState = {
    amount: string;
    type: TransactionType;
    description: string;
    category: string;
};

const initialTransactionForm: TransactionFormState = {
    amount: '',
    type: 'income',
    description: '',
    category: '',
};

const Finance: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<TransactionFormState>(initialTransactionForm);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        data: transactions,
        loading,
        error,
        refetch: refetchTransactions,
    } = useApi(
        () => financeApi.getAll(),
        [],
        [],
    );

    const { data: summary, refetch: refetchSummary } = useApi(
        () => financeApi.getSummary(),
        [],
    );

    const filteredTransactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const updateField = (field: keyof TransactionFormState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setForm(initialTransactionForm);
        setSubmitError(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitError(null);
        setSuccessMessage(null);

        const amount = Number(form.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            setSubmitError('Сума має бути числом більше 0.');
            return;
        }

        if (!form.description.trim()) {
            setSubmitError('Додай короткий опис операції.');
            return;
        }

        setIsSubmitting(true);

        try {
            await financeApi.create({
                amount,
                type: form.type,
                description: form.description.trim(),
                category: form.category.trim() || 'Без категорії',
            });

            resetForm();
            setIsFormOpen(false);
            setSuccessMessage('Транзакцію успішно записано.');
            refetchTransactions();
            refetchSummary();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Не вдалося записати транзакцію.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatAmount = (amount: number | string, type: string) => {
        const sign = type === 'income' ? '+' : '-';
        const value = Math.abs(Number(amount));
        return `${sign} ₴${value.toLocaleString('uk-UA')}`;
    };

    const formatDate = (iso: string) => iso.split('T')[0];

    const typeLabel = (type: string) => type === 'income' ? 'Дохід' : 'Витрата';

    const chartData = {
        labels: ['Поточний період'],
        datasets: [
            {
                label: 'Доходи',
                data: [summary?.totalIncome ?? 0],
                backgroundColor: '#0f766e',
                borderRadius: 4,
                barPercentage: 0.5,
                categoryPercentage: 0.8,
            },
            {
                label: 'Витрати',
                data: [summary?.totalExpense ?? 0],
                backgroundColor: '#f97316',
                borderRadius: 4,
                barPercentage: 0.5,
                categoryPercentage: 0.8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 12,
                callbacks: {
                    label: (context: TooltipItem<'bar'>) => {
                        const raw = typeof context.raw === 'number' ? context.raw : Number(context.raw ?? 0);
                        return ` ₴ ${raw.toLocaleString('uk-UA')}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: {
                    color: '#64748b',
                    callback: (v: string | number) => Number(v).toLocaleString('uk-UA'),
                },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#64748b' },
            },
        },
    };

    return (
        <div className="finance-page">
            <div className="page-header">
                <div className="header-titles">
                    <h2>Фінанси</h2>
                    <span className="divider">|</span>
                    <span className="subtitle">Управління доходами та витратами</span>
                </div>
                <button
                    className="add-btn"
                    type="button"
                    onClick={() => {
                        setIsFormOpen(prev => !prev);
                        setSuccessMessage(null);
                        setSubmitError(null);
                    }}
                >
                    <i className={`fa-solid ${isFormOpen ? 'fa-xmark' : 'fa-plus'}`}></i>
                    {isFormOpen ? 'Закрити форму' : 'Нова транзакція'}
                </button>
            </div>

            {successMessage && (
                <div className="finance-alert success-alert">
                    <i className="fa-solid fa-circle-check"></i>
                    {successMessage}
                </div>
            )}

            {isFormOpen && (
                <section className="transaction-form-card fade-in-card">
                    <div className="form-card-heading">
                        <div>
                            <h3>Записати транзакцію</h3>
                            <p>Додай дохід або витрату, і фінансовий підсумок оновиться автоматично.</p>
                        </div>
                        <div className="form-card-icon">
                            <i className="fa-solid fa-wallet"></i>
                        </div>
                    </div>

                    <form className="transaction-form" onSubmit={handleSubmit}>
                        <label>
                            <span>Тип операції</span>
                            <select
                                value={form.type}
                                onChange={event => updateField('type', event.target.value as TransactionType)}
                            >
                                <option value="income">Дохід</option>
                                <option value="expense">Витрата</option>
                            </select>
                        </label>

                        <label>
                            <span>Сума, ₴</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="15000"
                                value={form.amount}
                                onChange={event => updateField('amount', event.target.value)}
                            />
                        </label>

                        <label>
                            <span>Категорія</span>
                            <input
                                type="text"
                                placeholder="Продажі / Оренда / Маркетинг"
                                value={form.category}
                                onChange={event => updateField('category', event.target.value)}
                            />
                        </label>

                        <label className="description-field">
                            <span>Опис операції</span>
                            <input
                                type="text"
                                placeholder="Оплата від клієнта / закупівля товару"
                                value={form.description}
                                onChange={event => updateField('description', event.target.value)}
                            />
                        </label>

                        <div className="form-actions">
                            <button className="secondary-btn" type="button" onClick={resetForm} disabled={isSubmitting}>
                                Очистити
                            </button>
                            <button className="primary-submit-btn" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><i className="fa-solid fa-spinner fa-spin"></i> Збереження...</>
                                ) : (
                                    <><i className="fa-solid fa-check"></i> Записати транзакцію</>
                                )}
                            </button>
                        </div>
                    </form>

                    {submitError && (
                        <div className="finance-alert error-alert">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            {submitError}
                        </div>
                    )}
                </section>
            )}

            <section className="finance-summary-grid">
                <div className="summary-card income-card">
                    <span>Доходи</span>
                    <strong>₴{(summary?.totalIncome ?? 0).toLocaleString('uk-UA')}</strong>
                    <small>усі вхідні платежі</small>
                </div>
                <div className="summary-card expense-card">
                    <span>Витрати</span>
                    <strong>₴{(summary?.totalExpense ?? 0).toLocaleString('uk-UA')}</strong>
                    <small>усі списання</small>
                </div>
                <div className="summary-card balance-card">
                    <span>Баланс</span>
                    <strong>₴{(summary?.balance ?? 0).toLocaleString('uk-UA')}</strong>
                    <small>доходи мінус витрати</small>
                </div>
            </section>

            <section className="finance-chart-section fade-in-card">
                <div style={{ height: '100%', width: '100%' }}>
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </section>

            <section className="transactions-section fade-in-card" style={{ animationDelay: '0.1s' }}>
                <div className="section-header">
                    <h3>Останні транзакції</h3>
                    <div className="search-box small-search">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input
                            type="text"
                            placeholder="Пошук за описом або категорією..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    {loading && (
                        <div style={{ padding: '20px', color: '#64748b' }}>
                            <i className="fa-solid fa-spinner fa-spin"></i> Завантаження...
                        </div>
                    )}
                    {error && (
                        <div style={{ padding: '20px', color: '#ef4444' }}>
                            <i className="fa-solid fa-triangle-exclamation"></i> {error}
                        </div>
                    )}
                    {!loading && !error && (
                        <table className="finance-table">
                            <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Опис операції</th>
                                <th>Категорія</th>
                                <th>Сума</th>
                                <th>Тип</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td className="date-cell">{formatDate(tx.createdAt)}</td>
                                        <td><strong>{tx.description}</strong></td>
                                        <td className="category-cell">{tx.category}</td>
                                        <td><strong>{formatAmount(tx.amount, tx.type)}</strong></td>
                                        <td>
                                            <span className={`status-badge ${tx.type === 'income' ? 'good' : 'danger'}`}>
                                                {typeLabel(tx.type)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                        Транзакцій не знайдено
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Finance;
