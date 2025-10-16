
export interface ChartDataPoint {
    name: string;
    value: number;
}

export interface AnalyzedData {
    title: string;
    summary: string;
    cleanedText: string;
    chartData: ChartDataPoint[];
}

export interface HistoryItem extends AnalyzedData {
    id: string;
    timestamp: number;
}