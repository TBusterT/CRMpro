import React, { useState } from 'react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import chartDataJson from '../../data/dashboardData.json';
import type { ChartData } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const chartData = chartDataJson.chartData as ChartData;

export const SalesChart: React.FC = () => {
    const [period, setPeriod] = useState<'week' | 'month'>('month');
    const currentData = chartData[period];

    const data = {
        labels: currentData.labels,
        datasets: [{
            data: currentData.data,
            backgroundColor: currentData.color,
            borderRadius: 8,
            barThickness: 30
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => ` ₴ ${context.parsed.y.toLocaleString('uk-UA')}`
                }
            }
        }
    };

    return (
        <section className="chart-section fade-in-card">
            <div className="chart-header">
                <h3>Аналітика продажів</h3>
                <div className="chart-tabs">
                    <button
                        className={`tab-btn ${period === 'week' ? 'active' : ''}`}
                        onClick={() => setPeriod('week')}
                    >Тиждень</button>
                    <button
                        className={`tab-btn ${period === 'month' ? 'active' : ''}`}
                        onClick={() => setPeriod('month')}
                    >Місяць</button>
                </div>
            </div>
            <div className="chart-container">
                <Bar data={data} options={options} />
            </div>
        </section>
    );
};