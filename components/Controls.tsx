import React, { useRef } from 'react';
import { Icon } from './Icon';
import { LANGUAGES } from '../constants';

interface ControlsProps {
    isRecording: boolean;
    isLoading: boolean;
    onRecord: () => void;
    onStop: () => void;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    selectedLanguage: string;
    onLanguageChange: (lang: string) => void;
    onDownload: () => void;
    onSaveText: () => void;
    disableActions: boolean;
    showCopied: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
    isRecording,
    isLoading,
    onRecord,
    onStop,
    onFileUpload,
    selectedLanguage,
    onLanguageChange,
    onDownload,
    onSaveText,
    disableActions,
    showCopied
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={isRecording ? onStop : onRecord}
                    disabled={isLoading}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-800
                        ${isRecording ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400' : 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-400'}
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                    {isRecording && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                    <Icon name={isRecording ? 'stop' : 'mic'} className="w-8 h-8 text-white" />
                </button>
                 <div className="border-l border-slate-700 pl-4">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isRecording || isLoading}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Upload audio file"
                        title="Upload audio file"
                    >
                        <Icon name="upload" className="w-8 h-8 text-white" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileUpload}
                        accept="audio/*"
                        className="hidden"
                    />
                </div>
                <div>
                     <label htmlFor="language-select" className="block text-sm font-medium text-slate-400 mb-1">
                        Analysis Language
                    </label>
                    <select
                        id="language-select"
                        value={selectedLanguage}
                        onChange={(e) => onLanguageChange(e.target.value)}
                        disabled={isRecording || isLoading}
                        className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50"
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex items-center gap-3">
                 <button
                    onClick={onSaveText}
                    disabled={disableActions || isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500 rounded-md transition-colors"
                >
                    <Icon name={showCopied ? "check" : "copy"} className="w-5 h-5" />
                    {showCopied ? 'Copied!' : 'Copy Text'}
                </button>
                <button
                    onClick={onDownload}
                    disabled={disableActions || isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500 text-white font-semibold rounded-md transition-colors"
                >
                    <Icon name="download" className="w-5 h-5" />
                    Download .docx
                </button>
            </div>
        </div>
    );
};