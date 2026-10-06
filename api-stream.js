export async function parseStream(body, onChunk) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let usage = null;
    let finishReason = null;
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            if (trimmed.startsWith("{") && trimmed.includes('"error"')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed.error) throw new Error(parsed.error.message || "Stream error");
                } catch (e) {
                    if (e.message && e.message !== "Unexpected end of JSON input" && !e.message.includes("is not valid JSON")) {
                        throw e;
                    }
                }
            }
            
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                    throw new Error(parsed.error.message || "Provider error in stream");
                }
                const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || "";
                if (delta) onChunk(delta);
                if (parsed.choices?.[0]?.finish_reason) {
                    finishReason = parsed.choices[0].finish_reason;
                }
                if (parsed.usage) {
                    usage = parsed.usage;
                }
            } catch (e) {
                if (e.message && e.message !== "Unexpected end of JSON input" && !e.message.includes("is not valid JSON")) {
                    throw e;
                }
            }
        }
    }
    
    if (buffer.trim()) {
        const raw = buffer.trim();
        if (raw.startsWith("{") && raw.includes('"error"')) {
            try {
                const parsedError = JSON.parse(raw);
                if (parsedError.error) throw new Error(parsedError.error.message || "Unknown stream error");
            } catch (e) {
                if (e.message && e.message !== "Unexpected end of JSON input" && !e.message.includes("is not valid JSON")) {
                    throw e;
                }
            }
        }
        const jsonStr = raw.startsWith("data: ") ? raw.slice(6).trim() : raw;
        if (jsonStr && jsonStr !== "[DONE]") {
            try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.error) {
                    throw new Error(parsed.error.message || "Provider error in stream");
                }
                const delta = parsed.choices?.[0]?.delta?.content
                    || parsed.choices?.[0]?.message?.content || "";
                if (delta) onChunk(delta);
                if (parsed.choices?.[0]?.finish_reason) finishReason = parsed.choices[0].finish_reason;
                if (parsed.usage) usage = parsed.usage;
            } catch (e) {
                if (e.message && e.message !== "Unexpected end of JSON input" && !e.message.includes("is not valid JSON")) {
                    throw e;
                }
            }
        }
    }
    
    return { usage, finishReason };
}