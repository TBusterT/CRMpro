export interface KpiData {
    id: string;
    title: string;
    icon: string;
    value: number;
    trend: string;
    prefix?: string;
    bgClass: string;
}

export interface ChartDataset {
    labels: string[];
    data: number[];
    color: string;
}

export interface ChartData {
    week: ChartDataset;
    month: ChartDataset;
}