import React from 'react';
import type { HistoryItem } from '../types';
import { Icon } from './Icon';

interface HistoryPanelProps {
    history: HistoryItem[];
    onSelectItem: (id: string) => void;
    onClearHistory: () => void;
    activeItemId: string | null;
    isOpen: boolean;
    onToggle: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectItem, onClearHistory, activeItemId, isOpen, onToggle }) => {

    if (history.length === 0) {
        return null;
    }

    return (
        <div className="mt-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-3 text-left font-semibold text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                aria-expanded={isOpen}
                aria-controls="history-content"
            >
                <div className="flex items-center gap-2">
                    <Icon name="history" className="w-5 h-5 text-slate-400" />
                    <span>Analysis History</span>
                </div>
                <Icon name="chevron-down" className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div 
                id="history-content"
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="p-3 border-t border-slate-700">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                        {history.map(item => (
                            <button
                                key={item.id}
                                onClick={() => onSelectItem(item.id)}
                                className={`w-full text-left p-2 rounded-md transition-all duration-200 ease-in-out border-l-2 ${
                                    activeItemId === item.id 
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 pl-3' 
                                    : 'hover:bg-slate-700/50 text-slate-400 border-transparent hover:border-slate-500 hover:pl-3'
                                }`}
                            >
                                <p className="font-medium truncate text-slate-200">{item.title}</p>
                                <p className="text-xs text-slate-500">
                                    {new Date(item.timestamp).toLocaleString()}
                                </p>
                            </button>
                        ))}
                    </div>
                    {history.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50 text-right">
                            <button
                                onClick={onClearHistory}
                                className="text-sm text-red-400 hover:text-red-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                            >
                                Clear History
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
