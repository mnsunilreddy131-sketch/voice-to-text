import { useState, useEffect, useRef, useCallback } from 'react';

// FIX: Add comprehensive type definitions for the Web Speech API to resolve multiple TypeScript errors.
// These types are not included in the default DOM library and are necessary for type safety.
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
}


// Polyfill for browsers that use the `webkit` prefix
const SpeechRecognition: SpeechRecognitionStatic | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface VoiceCommandActions {
    onStartRecording: () => void;
    onStopRecording: () => void;
    onUploadFile: () => void;
    onClearHistory: () => void;
    onShowHistory: () => void;
    onHideHistory: () => void;
}

export const useVoiceCommands = (actions: VoiceCommandActions) => {
    const [isListening, setIsListening] = useState(false);
    const [commandNotification, setCommandNotification] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (!SpeechRecognition) {
            console.warn('Speech Recognition API is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            
            console.log('Voice command received:', command);

            if (command.includes('start recording')) {
                setCommandNotification('Command: Start Recording');
                actions.onStartRecording();
            } else if (command.includes('stop recording')) {
                setCommandNotification('Command: Stop Recording');
                actions.onStopRecording();
            } else if (command.includes('upload file')) {
                setCommandNotification('Command: Uploading File');
                actions.onUploadFile();
            } else if (command.includes('clear history')) {
                setCommandNotification('Command: Clear History');
                actions.onClearHistory();
            } else if (command.includes('show history')) {
                setCommandNotification('Command: Show History');
                actions.onShowHistory();
            } else if (command.includes('hide history')) {
                setCommandNotification('Command: Hide History');
                actions.onHideHistory();
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            // 'no-speech' is a common error, we can ignore it to keep listening
            if (event.error !== 'no-speech') {
                setIsListening(false);
            }
        };

        recognition.onend = () => {
             // If listening was stopped intentionally, do nothing. Otherwise, restart.
            if (recognitionRef.current && isListening) {
               try {
                   recognition.start();
               } catch (e) {
                    console.error("Could not restart recognition:", e);
                    setIsListening(false);
               }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
    }, [actions, isListening]);
    
    useEffect(() => {
        if (commandNotification) {
            const timer = setTimeout(() => setCommandNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [commandNotification]);

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) return;
        
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                 console.error("Could not start voice recognition:", e);
            }
        }
    }, [isListening]);


    return {
        isListeningForCommands: isListening,
        toggleListening,
        commandNotification,
    };
};
