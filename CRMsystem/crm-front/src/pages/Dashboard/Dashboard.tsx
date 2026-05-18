import React from 'react';
import { KpiCard } from '../../components/cards/KpiCard';
import { SalesChart } from '../../components/charts/SalesChart';

export const Dashboard: React.FC = () => {
    // Приклад даних для карток
    const kpiStats = [
        { id: "profit", title: "Прибуток", value: 125400, icon: "fa-money-bill-trend-up", bgClass: "bg-green", prefix: "₴", trend: "+12% за місяць" },
        { id: "clients", title: "Нові клієнти", value: 48, icon: "fa-user-plus", bgClass: "bg-teal", trend: "+5 сьогодні" },
        { id: "orders", title: "Замовлення", value: 156, icon: "fa-cart-shopping", bgClass: "bg-purple", trend: "В обробці: 12" }
    ];

    return (
        <div className="dashboard-content">
            <div className="kpi-section">
                {kpiStats.map((stat) => (
                    <KpiCard key={stat.id} data={stat} />
                ))}
            </div>
            <div style={{ marginTop: '30px' }}>
                <SalesChart />
            </div>
        </div>
    );
};