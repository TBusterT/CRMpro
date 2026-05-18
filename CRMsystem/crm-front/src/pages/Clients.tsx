import React, { useState, useMemo } from 'react';
import { clientsApi } from '../api/clients.api';
import { useApi } from '../hooks/useApi';
import '../styles/clients.css';

const Clients: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const { data: clients, loading, error, refetch } = useApi(
        () => clientsApi.getAll(),
        [],
        [],
    );

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Активний':       return 'status-active';
            case 'Новий лід':     return 'status-lead';
            case 'В перемовинах': return 'status-nego';
            default: return '';
        }
    };

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesSearch =
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [clients, searchTerm, filterStatus]);

    const kpiTotal  = clients.length;
    const kpiActive = clients.filter(c => c.status === 'Активний').length;
    const kpiLeads  = clients.filter(c => c.status === 'Новий лід').length;

    const handleDelete = async (id: number) => {
        if (!confirm('Видалити клієнта?')) return;
        try {
            await clientsApi.remove(id);
            refetch();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="clients-page">
            <div className="page-header">
                <div className="header-titles">
                    <h2>База клієнтів</h2>
                    <span className="divider">|</span>
                    <span className="subtitle">Управління контактами та лідами</span>
                </div>
                <button className="add-btn">
                    <i className="fa-solid fa-plus"></i> Новий клієнт
                </button>
            </div>

            <section className="kpi-section">
                <div className="kpi-card bg-blue fade-in-card">
                    <div className="kpi-header">
                        <h3>Всього контактів</h3>
                        <i className="fa-solid fa-address-book" style={{ opacity: 0.8 }}></i>
                    </div>
                    <div className="kpi-value">{kpiTotal}</div>
                </div>
                <div className="kpi-card bg-green fade-in-card" style={{ animationDelay: '0.1s' }}>
                    <div className="kpi-header">
                        <h3>Активні клієнти</h3>
                        <i className="fa-solid fa-user-check" style={{ opacity: 0.8 }}></i>
                    </div>
                    <div className="kpi-value">{kpiActive}</div>
                </div>
                <div className="kpi-card bg-purple fade-in-card" style={{ animationDelay: '0.2s' }}>
                    <div className="kpi-header">
                        <h3>Нові ліди (Місяць)</h3>
                        <i className="fa-solid fa-fire" style={{ opacity: 0.8 }}></i>
                    </div>
                    <div className="kpi-value">{kpiLeads}</div>
                </div>
            </section>

            <section className="toolbar-section fade-in-card" style={{ animationDelay: '0.3s' }}>
                <div className="search-box">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                        type="text"
                        placeholder="Пошук за іменем, компанією або email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">Всі статуси</option>
                        <option value="Активний">Активні</option>
                        <option value="Новий лід">Нові ліди</option>
                        <option value="В перемовинах">В перемовинах</option>
                    </select>
                </div>
            </section>

            <section className="clients-grid">
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
                {!loading && !error && filteredClients.length === 0 && (
                    <div style={{ padding: '20px', color: '#64748b' }}>
                        За вашим запитом клієнтів не знайдено.
                    </div>
                )}
                {!loading && !error && filteredClients.map((client, index) => (
                    <div
                        key={client.id}
                        className="client-card fade-in-card"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="card-header">
                            <div className="client-header-left">
                                <div className="client-avatar" style={{ backgroundColor: client.color }}>
                                    {getInitials(client.name)}
                                </div>
                                <div className="client-info">
                                    <h3>{client.name}</h3>
                                    <span className="company">{client.company}</span>
                                </div>
                            </div>
                            <span className={`status-badge ${getStatusClass(client.status)}`}>
                                {client.status}
                            </span>
                        </div>
                        <div className="contact-details">
                            <div className="contact-item">
                                <i className="fa-solid fa-phone"></i> {client.phone}
                            </div>
                            <div className="contact-item">
                                <i className="fa-solid fa-envelope"></i> {client.email}
                            </div>
                        </div>
                        <div className="card-footer">
                            <div className="ltv-info">
                                <span>LTV (Прибуток)</span>
                                <strong>₴{client.ltv.toLocaleString('uk-UA')}</strong>
                            </div>
                            <div className="card-actions">
                                <button title="Написати повідомлення">
                                    <i className="fa-regular fa-comment"></i>
                                </button>
                                <button title="Видалити" onClick={() => handleDelete(client.id)}>
                                    <i className="fa-regular fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default Clients;
