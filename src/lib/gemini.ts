const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string;

if (!apiKey) {
    console.error('❌ VITE_OPENROUTER_API_KEY não configurada');
}

// Streaming text generation (OpenRouter SSE)
export async function* streamGemini(
    prompt: string,
    systemInstruction?: string
): AsyncGenerator<string> {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://finance-ai.local",
                "X-Title": "FinanceAI",
            },
            body: JSON.stringify({
                model: "google/gemma-2-9b-it:free",
                messages: [
                    { role: "system", content: systemInstruction || 'Você é o FinanceAI, um assistente financeiro especializado em finanças pessoais brasileiras.' },
                    { role: "user", content: prompt }
                ],
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Erro ao conectar com OpenRouter");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.slice(6);
                    if (data === "[DONE]") return;
                    try {
                        const json = JSON.parse(data);
                        const text = json.choices[0]?.delta?.content;
                        if (text) yield text;
                    } catch (e) {
                        // Ignorar erros de parse parciais
                    }
                }
            }
        }
    } catch (error) {
        console.error("OpenRouter Stream Error:", error);
        throw error;
    }
}

// One-shot text generation
export async function generateText(
    prompt: string,
    systemInstruction?: string
): Promise<string> {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemma-2-9b-it:free",
                messages: [
                    { role: "system", content: systemInstruction || 'Você é o FinanceAI, um assistente financeiro especializado em finanças pessoais brasileiras.' },
                    { role: "user", content: prompt }
                ],
            }),
        });

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("OpenRouter Error:", error);
        throw error;
    }
}
