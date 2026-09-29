export async function parseStream(body, onChunk) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    
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
            } catch (e) {}
        }
    }
    
    if (buffer.trim()) {
        try {
            const parsed = JSON.parse(buffer.trim());
            const text = parsed.choices?.[0]?.message?.content || "";
            if (text) onChunk(text);
        } catch (e) {}
    }
}
