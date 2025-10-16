import { GoogleGenAI, Type } from "@google/genai";
import type { AnalyzedData } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A short, engaging title for the infographic based on the text."
        },
        summary: {
            type: Type.STRING,
            description: "A concise summary of the key insights from the text."
        },
        cleanedText: {
            type: Type.STRING,
            description: "The original text, but cleaned up for grammar, clarity, and spelling errors."
        },
        chartData: {
            type: Type.ARRAY,
            description: "An array of objects for a bar chart. Each object should have a 'name' (string) and a 'value' (number). Extract up to 7 key numerical data points.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                },
                required: ["name", "value"]
            }
        }
    },
    required: ["title", "summary", "cleanedText", "chartData"]
};

export async function detectLanguage(text: string): Promise<string> {
    if (!text.trim()) {
        return 'English'; // Default for empty text
    }
    try {
        const prompt = `Identify the primary language of the following text. Respond with only the name of the language (e.g., "English", "Spanish").
        
        TEXT: "${text}"`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const languageName = response.text.trim();
        // Capitalize for consistency with our constants (e.g., 'english' -> 'English')
        return languageName.charAt(0).toUpperCase() + languageName.slice(1);

    } catch (error) {
        console.error("Error detecting language with Gemini:", error);
        return 'English'; // Fallback to a default if detection fails
    }
}

export async function transcribeAudioFile(
    file: { mimeType: string; data: string }
): Promise<string> {
     try {
        const audioPart = {
            inlineData: {
                mimeType: file.mimeType,
                data: file.data,
            },
        };

        const textPart = {
            text: `Transcribe the provided audio. Respond with only the transcribed text.`,
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [audioPart, textPart] },
        });
        
        return response.text.trim();

    } catch (error) {
        console.error("Error transcribing audio file with Gemini:", error);
        throw new Error("Failed to transcribe the audio file.");
    }
}

export async function analyzeText(text: string, language: string): Promise<AnalyzedData> {
    try {
        const prompt = `
            Analyze the following text. Your task is to clean it up, extract key numerical data points for a chart, and provide a title and summary.
            The final output MUST be in ${language}.

            TEXT: "${text}"
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);

        // Ensure chartData is an array, even if the model messes up.
        if (!Array.isArray(parsedData.chartData)) {
            parsedData.chartData = [];
        }

        return parsedData as AnalyzedData;

    } catch (error) {
        console.error("Error analyzing text with Gemini:", error);
        throw new Error("Failed to get analysis from AI service.");
    }
}