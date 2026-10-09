export async function parseStream(body, onChunk, onActivity) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let usage = null;
    let finishReason = null;
    function handleLine(line) {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed.startsWith("{") && trimmed.includes('"error"')) {
            let parsed = null;
            try {
                parsed = JSON.parse(trimmed);
            } catch (e) {
                return;
            }
            if (parsed && parsed.error) throw new Error(parsed.error.message || "Stream error");
        }
        let data = trimmed;
        if (trimmed.startsWith("data: ")) {
            data = trimmed.slice(6).trim();
        }
        if (!data || data === "[DONE]") return;
        let parsed = null;
        try {
            parsed = JSON.parse(data);
        } catch (e) {
            return;
        }
        if (parsed.error) {
            throw new Error(parsed.error.message || "Provider error in stream");
        }
        const delta = parsed.choices?.[0]?.delta?.content
                   || parsed.choices?.[0]?.message?.content
                   || parsed.choices?.[0]?.text
                   || "";
        if (delta) onChunk(delta);
        if (parsed.choices?.[0]?.finish_reason) {
            finishReason = parsed.choices[0].finish_reason;
        }
        if (parsed.usage) {
            usage = parsed.usage;
        }
    }
    while (true) {
        const { done, value } = await reader.read();
        if (onActivity) onActivity();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
            handleLine(line);
        }
    }
    if (buffer.trim()) {
        handleLine(buffer);
    }
    return { usage, finishReason };
}