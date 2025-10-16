
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
