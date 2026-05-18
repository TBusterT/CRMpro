import React, { useEffect, useState, useRef } from 'react';
import type { KpiData } from '../../types';

export const KpiCard: React.FC<{ data: KpiData }> = ({ data }) => {
    const [count, setCount] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        let current = 0;
        const step = data.value / 50;

        const update = () => {
            current += step;
            if (current < data.value) {
                setCount(Math.ceil(current));
                timerRef.current = setTimeout(update, 20);
            } else {
                setCount(data.value);
            }
        };

        update();

        // Очищення таймера при видаленні компонента
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [data.value]);

    return (
        <div className={`kpi-card ${data.bgClass} fade-in-card`}>
            <div className="kpi-header">
                <h3>{data.title}</h3>
                <i className={`fa-solid ${data.icon}`}></i>
            </div>
            <div className="kpi-value">
                {data.prefix && <span>{data.prefix}</span>}
                <span className="count-up">{count.toLocaleString('uk-UA')}</span>
            </div>
            <div className="kpi-trend">{data.trend}</div>
        </div>
    );
};