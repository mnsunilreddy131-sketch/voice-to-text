import React from 'react';
import type { AnalyzedData } from '../types';
import { Loader } from './Loader';
import { Icon } from './Icon';

// Recharts is loaded from a CDN, so we declare it on the window object for TypeScript.
declare global {
    interface Window {
        Recharts: any;
    }
}

interface AnalysisPanelProps {
    data: AnalyzedData | null;
    isLoading: boolean;
}

const CHART_COLORS = ['#38bdf8', '#818cf8', '#a78bfa', '#e879f9', '#f472b6', '#fb7185'];

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-700/80 p-2 border border-slate-600 rounded-md shadow-lg backdrop-blur-sm">
        <p className="font-bold text-slate-200">{`${label}`}</p>
        <p className="text-cyan-300">{`Value : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};


export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ data, isLoading }) => {
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex flex-col items-center justify-center h-full"><Loader /><p className="mt-4 text-slate-400">AI is analyzing...</p></div>;
        }

        if (!data) {
            return (
                <div className="text-center text-slate-500 h-full flex flex-col items-center justify-center">
                    <Icon name="chart" className="w-16 h-16 mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-slate-400">Analysis will appear here</h3>
                    <p className="max-w-sm mx-auto">Once you stop recording, the AI-powered analysis and data visualization will be generated.</p>
                </div>
            );
        }

        // FIX: Add a defensive check to ensure the Recharts library has loaded from the CDN before trying to use it.
        // This prevents the "Recharts is not defined" race condition.
        if (typeof window.Recharts === 'undefined') {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Loader />
                    <p className="mt-4 text-slate-400">Loading chart library...</p>
                </div>
            );
        }

        // Destructure Recharts from the window object.
        const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label } = window.Recharts;

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">{data.title}</h3>
                    <p className="mt-2 text-slate-400">{data.summary}</p>
                </div>
                {data.chartData && data.chartData.length > 0 ? (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.chartData} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} tickLine={{ stroke: '#94a3b8' }} interval={0} angle={-30} textAnchor="end" />
                                <YAxis tick={{ fill: '#94a3b8' }} tickLine={{ stroke: '#94a3b8' }}>
                                    <Label angle={-90} value="Value" position="insideLeft" style={{ textAnchor: 'middle', fill: '#94a3b8' }} />
                                </YAxis>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }}/>
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {data.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                     <div className="text-center text-slate-500 py-10">
                        <p>No numerical data found to generate a chart.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-slate-900/70 p-4 rounded-lg min-h-[400px] flex flex-col border border-slate-700">
             <h2 className="text-lg font-semibold text-slate-300 flex items-center gap-2 mb-4">
                <Icon name="sparkles" className="w-5 h-5 text-violet-400" />
                AI-Powered Infographic
            </h2>
            <div className="flex-grow">
                {renderContent()}
            </div>
        </div>
    );
};