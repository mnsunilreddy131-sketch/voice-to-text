import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { TranscriptionPanel } from './components/TranscriptionPanel';
import { AnalysisPanel } from './components/AnalysisPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { analyzeText, transcribeAudioFile, detectLanguage } from './services/geminiService';
import type { AnalyzedData, HistoryItem } from './types';
import { saveAsDocx } from './utils/fileSaver';
import { LANGUAGES } from './constants';
import { Icon } from './components/Icon';

const HISTORY_KEY = 'infographic-analyzer-history';

const App: React.FC = () => {
    const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGES[0].value);
    const [showCopied, setShowCopied] = useState(false);
    const [displayedTranscription, setDisplayedTranscription] = useState('');
    const [detectionNotification, setDetectionNotification] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    const isAutoSwitchingLanguage = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(HISTORY_KEY);
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Failed to load history from localStorage:", e);
            localStorage.removeItem(HISTORY_KEY);
        }
    }, []);

    const updateHistory = (newHistory: HistoryItem[]) => {
        setHistory(newHistory);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    };

    const processTranscription = useCallback(async (text: string) => {
        if (!text.trim()) {
            setError("The transcription is empty. Please say something during recording or upload a valid audio file.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalyzedData(null);
        setDisplayedTranscription(text);

        try {
            const detectedLangName = await detectLanguage(text);
            const matchedLanguage = LANGUAGES.find(
                lang => lang.value.toLowerCase() === detectedLangName.toLowerCase()
            );

            let finalLanguage = selectedLanguage;
            if (matchedLanguage && matchedLanguage.value !== selectedLanguage) {
                isAutoSwitchingLanguage.current = true;
                finalLanguage = matchedLanguage.value;
                setSelectedLanguage(finalLanguage);
                setDetectionNotification(`Language auto-detected: ${matchedLanguage.label}`);
                setTimeout(() => setDetectionNotification(null), 4000);
            }
            
            const result = await analyzeText(text, finalLanguage);
            setAnalyzedData(result);
            setDisplayedTranscription(result.cleanedText);

            const newHistoryItem: HistoryItem = {
                ...result,
                id: `hist_${Date.now()}`,
                timestamp: Date.now()
            };
            const newHistory = [newHistoryItem, ...history];
            updateHistory(newHistory);
            setActiveHistoryId(newHistoryItem.id);

        } catch (err) {
            console.error("Analysis Error:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to analyze the transcription. ${errorMessage} Please try again.`);
        } finally {
            setIsLoading(false);
        }
    }, [selectedLanguage, history]);

    const {
        isRecording,
        transcription: liveTranscription,
        startRecording: startLiveRecording,
        stopRecording,
        cancelRecording
    } = useAudioProcessor(processTranscription);

    useEffect(() => {
        if (isRecording) {
            setDisplayedTranscription(liveTranscription);
            setActiveHistoryId(null);
        }
    }, [isRecording, liveTranscription]);

    const startRecording = () => {
        setDisplayedTranscription('');
        setAnalyzedData(null);
        setError(null);
        setActiveHistoryId(null);
        startLiveRecording();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setAnalyzedData(null);
        setActiveHistoryId(null);
        setDisplayedTranscription(`Transcribing "${file.name}"...`);

        try {
            const base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    if (result && result.includes(',')) {
                        resolve(result.split(',')[1]);
                    } else {
                        reject(new Error("Could not read the file. It might be in an unsupported format."));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const transcribedText = await transcribeAudioFile({ mimeType: file.type, data: base64String });
            await processTranscription(transcribedText);
        } catch (err) {
            console.error("File Processing Error:", err);
            const errorMessage = err instanceof Error ? err.message : "Please ensure it's a valid audio format and try again.";
            setError(`Could not process the audio file. ${errorMessage}`);
            setDisplayedTranscription('');
        } finally {
            setIsLoading(false);
        }
    };
    
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleDownload = () => {
        if (analyzedData) {
            saveAsDocx(analyzedData);
        }
    };
    
    const handleSaveText = () => {
        if (analyzedData?.cleanedText) {
            navigator.clipboard.writeText(analyzedData.cleanedText);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        }
    };

    useEffect(() => {
        if (isAutoSwitchingLanguage.current) {
            isAutoSwitchingLanguage.current = false;
            return;
        }
        setAnalyzedData(null);
        setError(null);
        setDisplayedTranscription('');
        setActiveHistoryId(null);
    }, [selectedLanguage]);

    const handleSelectHistoryItem = (id: string) => {
        const item = history.find(h => h.id === id);
        if (item) {
            if (isRecording) {
                cancelRecording();
            }
            setIsLoading(false);
            setError(null);
            setAnalyzedData(item);
            setDisplayedTranscription(item.cleanedText);
            setActiveHistoryId(id);
        }
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear your entire analysis history? This cannot be undone.")) {
            updateHistory([]);
            setAnalyzedData(null);
            setDisplayedTranscription('');
            setActiveHistoryId(null);
        }
    };

    const {
        isListeningForCommands,
        toggleListening,
        commandNotification
    } = useVoiceCommands({
        onStartRecording: startRecording,
        onStopRecording: stopRecording,
        onUploadFile: triggerFileUpload,
        onClearHistory: handleClearHistory,
        onShowHistory: () => setIsHistoryOpen(true),
        onHideHistory: () => setIsHistoryOpen(false),
    });

    return (
        <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
            <Header />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                <div className="bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 backdrop-blur-sm border border-slate-700">
                     {commandNotification && (
                        <div className="mb-4 bg-violet-500/10 border border-violet-500/30 text-violet-300 px-4 py-3 rounded-lg flex items-center justify-center gap-3 transition-opacity duration-300" role="status">
                            <Icon name="robot" className="w-5 h-5 text-violet-400" />
                            <p className="text-sm font-medium">{commandNotification}</p>
                        </div>
                    )}
                    {detectionNotification && (
                        <div 
                            className="mb-4 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-4 py-3 rounded-lg flex items-center justify-center gap-3 transition-opacity duration-300" 
                            role="status"
                        >
                            <Icon name="sparkles" className="w-5 h-5 text-cyan-400" />
                            <p className="text-sm font-medium">{detectionNotification}</p>
                        </div>
                    )}
                    <Controls
                        isRecording={isRecording}
                        isLoading={isLoading}
                        onRecord={startRecording}
                        onStop={stopRecording}
                        onTriggerUpload={triggerFileUpload}
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={setSelectedLanguage}
                        onDownload={handleDownload}
                        onSaveText={handleSaveText}
                        disableActions={!analyzedData}
                        showCopied={showCopied}
                        isListeningForCommands={isListeningForCommands}
                        onToggleListening={toggleListening}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="audio/*"
                        className="hidden"
                    />

                    <HistoryPanel
                        history={history}
                        onSelectItem={handleSelectHistoryItem}
                        onClearHistory={handleClearHistory}
                        activeItemId={activeHistoryId}
                        isOpen={isHistoryOpen}
                        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
                    />
                    
                    {error && (
                        <div className="mt-6 bg-red-900/50 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3" role="alert">
                            <div className="flex-shrink-0 pt-1">
                                <Icon name="error" className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">An Error Occurred</h3>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TranscriptionPanel transcription={displayedTranscription} isRecording={isRecording} />
                        <AnalysisPanel data={analyzedData} isLoading={isLoading} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
