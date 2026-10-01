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
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || "";
                if (delta) onChunk(delta);
                if (parsed.choices?.[0]?.finish_reason) {
                    finishReason = parsed.choices[0].finish_reason;
                }
                if (parsed.usage) {
                    usage = parsed.usage;
                }
            } catch (e) {}
        }
    }
    
    if (buffer.trim()) {
        const raw = buffer.trim();
        const jsonStr = raw.startsWith("data: ") ? raw.slice(6).trim() : raw;
        if (jsonStr && jsonStr !== "[DONE]") {
            try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content
                    || parsed.choices?.[0]?.message?.content || "";
                if (delta) onChunk(delta);
                if (parsed.choices?.[0]?.finish_reason) finishReason = parsed.choices[0].finish_reason;
                if (parsed.usage) usage = parsed.usage;
            } catch (e) {}
        }
    }
    
    return { usage, finishReason };
}
