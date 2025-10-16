import React, { useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface TranscriptionPanelProps {
    transcription: string;
    isRecording: boolean;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ transcription, isRecording }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to the bottom whenever the transcription updates
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcription]);

    return (
        <div className="bg-slate-900/70 p-4 rounded-lg min-h-[200px] flex flex-col border border-slate-700">
            <h2 className="text-lg font-semibold text-slate-300 flex items-center gap-2 mb-2">
                <Icon name="text" className="w-5 h-5 text-cyan-400" />
                Transcription
            </h2>
            <div ref={scrollRef} className="flex-grow rounded-md p-3 bg-slate-800 text-slate-300 overflow-y-auto custom-scrollbar">
                {transcription ? (
                    <p>{transcription}{isRecording && <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse" aria-hidden="true"></span>}</p>
                ) : (
                    <p className="text-slate-500">
                        {isRecording ? 'Listening...' : 'Click the microphone to record or upload an audio file to start. The transcribed text will appear here.'}
                    </p>
                )}
            </div>
        </div>
    );
};