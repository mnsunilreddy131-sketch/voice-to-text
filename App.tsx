import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { TranscriptionPanel } from './components/TranscriptionPanel';
import { AnalysisPanel } from './components/AnalysisPanel';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { analyzeText, transcribeAudioFile, detectLanguage } from './services/geminiService';
import type { AnalyzedData } from './types';
import { saveAsDocx } from './utils/fileSaver';
import { LANGUAGES } from './constants';
import { Icon } from './components/Icon';

const App: React.FC = () => {
    const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGES[0].value);
    const [showCopied, setShowCopied] = useState(false);
    const [displayedTranscription, setDisplayedTranscription] = useState('');
    const [detectionNotification, setDetectionNotification] = useState<string | null>(null);
    const isAutoSwitchingLanguage = useRef(false);

    const processTranscription = useCallback(async (text: string) => {
        if (!text.trim()) {
            setError("Cannot analyze empty text.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalyzedData(null);
        setDisplayedTranscription(text); // Show raw transcription first

        try {
            // 1. Detect language from the transcription
            const detectedLangName = await detectLanguage(text);

            // 2. Find if the detected language is in our supported list
            const matchedLanguage = LANGUAGES.find(
                lang => lang.value.toLowerCase() === detectedLangName.toLowerCase()
            );

            let finalLanguage = selectedLanguage;
            // 3. If it's a new, supported language, update the state and show a notification
            if (matchedLanguage && matchedLanguage.value !== selectedLanguage) {
                isAutoSwitchingLanguage.current = true; // Flag to prevent useEffect from clearing text
                finalLanguage = matchedLanguage.value;
                setSelectedLanguage(finalLanguage);

                setDetectionNotification(`Language auto-detected: ${matchedLanguage.label}`);
                setTimeout(() => setDetectionNotification(null), 4000); // Hide notification after 4 seconds
            }
            
            // 4. Analyze text with the determined language
            const result = await analyzeText(text, finalLanguage);
            setAnalyzedData(result);
            setDisplayedTranscription(result.cleanedText); // Update with cleaned text from analysis

        } catch (err) {
            console.error("Analysis Error:", err);
            setError("Failed to analyze the text. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedLanguage]);

    const {
        isRecording,
        transcription: liveTranscription,
        startRecording: startLiveRecording,
        stopRecording,
    } = useAudioProcessor(processTranscription);

    useEffect(() => {
        if (isRecording) {
            setDisplayedTranscription(liveTranscription);
        }
    }, [isRecording, liveTranscription]);

    const startRecording = () => {
        setDisplayedTranscription('');
        setAnalyzedData(null);
        setError(null);
        startLiveRecording();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = ''; // Reset immediately to allow re-uploading the same file
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setAnalyzedData(null);
        setDisplayedTranscription(`Transcribing "${file.name}"...`);

        try {
            const base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    if (result && result.includes(',')) {
                        resolve(result.split(',')[1]);
                    } else {
                        reject(new Error("Invalid file format. Could not read base64 data."));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // First, just transcribe the audio file
            const transcribedText = await transcribeAudioFile(
                { mimeType: file.type, data: base64String }
            );

            // Then, process the transcription (which includes language detection and analysis)
            await processTranscription(transcribedText);

        } catch (err) {
            console.error("File Processing Error:", err);
            setError("Failed to process the audio file. Please ensure it's a valid audio format and try again.");
            setDisplayedTranscription('');
            setIsLoading(false); // Ensure loading is turned off on error
        }
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
        // This effect clears data on manual language change, but ignores the auto-detection switch.
        if (isAutoSwitchingLanguage.current) {
            isAutoSwitchingLanguage.current = false;
            return;
        }
        setAnalyzedData(null);
        setError(null);
        setDisplayedTranscription('');
    }, [selectedLanguage]);

    return (
        <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
            <Header />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                <div className="bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 backdrop-blur-sm border border-slate-700">
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
                        onFileUpload={handleFileUpload}
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={setSelectedLanguage}
                        onDownload={handleDownload}
                        onSaveText={handleSaveText}
                        disableActions={!analyzedData}
                        showCopied={showCopied}
                    />
                    
                    {error && (
                        <div className="mt-4 bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg" role="alert">
                            <p>{error}</p>
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