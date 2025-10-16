
import React from 'react';
import { Icon } from './Icon';

export const Header: React.FC = () => {
    return (
        <header className="text-center p-6 bg-slate-900/50 border-b border-slate-800">
            <div className="flex items-center justify-center gap-4">
                 <Icon name="chart" className="w-10 h-10 text-cyan-400" />
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">
                    Infographic Voice Analyzer
                </h1>
            </div>
            <p className="mt-2 text-lg text-slate-400">
                Transform your speech into insightful data visualizations, powered by AI.
            </p>
        </header>
    );
};
