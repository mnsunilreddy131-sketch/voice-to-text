
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";

// Audio utility functions
const encode = (bytes: Uint8Array): string => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] < 0 ? data[i] * 32768 : data[i] * 32767;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
};


export const useAudioProcessor = (onTranscriptionComplete: (text: string) => void) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fullTranscriptionRef = useRef('');

    const aiRef = useRef(new GoogleGenAI({ apiKey: process.env.API_KEY }));

    const stopRecording = useCallback(() => {
        if (!isRecording) return;
        setIsRecording(false);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;

        if (fullTranscriptionRef.current.trim()) {
            onTranscriptionComplete(fullTranscriptionRef.current);
        }
    }, [isRecording, onTranscriptionComplete]);

    const startRecording = useCallback(async () => {
        if (isRecording) return;
        setIsRecording(true);
        setTranscription('');
        fullTranscriptionRef.current = '';

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            
            sessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => console.log('Gemini Live session opened.'),
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                             if(message.serverContent.inputTranscription.isFinal) {
                                fullTranscriptionRef.current += text + " ";
                                setTranscription(fullTranscriptionRef.current);
                            } else {
                                setTranscription(fullTranscriptionRef.current + text);
                            }
                        }
                        if (message.serverContent?.turnComplete) {
                            // Can add logic here if needed, e.g. when model stops speaking.
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Gemini Live error:', e);
                        stopRecording();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Gemini Live session closed.');
                    },
                },
                config: {
                    inputAudioTranscription: {},
                    responseModalities: [Modality.AUDIO], // Required but we won't process output audio
                },
            });

            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);

        } catch (error) {
            console.error('Failed to start recording:', error);
            setIsRecording(false);
        }
    }, [isRecording, stopRecording]);


    return { isRecording, transcription, startRecording, stopRecording };
};
