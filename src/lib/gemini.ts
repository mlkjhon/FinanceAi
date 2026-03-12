import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
    console.error('❌ VITE_GEMINI_API_KEY não configurada');
}

export const genAI = new GoogleGenerativeAI(apiKey);

export const getModel = (modelName = 'gemini-1.5-flash') =>
    genAI.getGenerativeModel({ model: modelName });

// Streaming text generation
export async function* streamGemini(
    prompt: string,
    systemInstruction?: string
): AsyncGenerator<string> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction || 'Você é o FinanceAI, um assistente financeiro especializado em finanças pessoais brasileiras. Responda em português, de forma clara, objetiva e profissional.',
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
    }
}

// One-shot text generation
export async function generateText(
    prompt: string,
    systemInstruction?: string
): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction || 'Você é o FinanceAI, um assistente financeiro especializado em finanças pessoais brasileiras.',
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
}
