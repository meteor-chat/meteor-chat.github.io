export async function streamChat(messages, onChunk) {
    const clientTime = new Date().toLocaleString("id-ID", { 
        weekday: "long", year: "numeric", month: "long", day: "numeric", 
        hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" 
    });
    
    const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, client_time: clientTime })
    });
    
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Terjadi kesalahan.");
    }
    
    const reader = res.body.getReader();
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
            const data = trimmed.slice(6);
            if (data === "[DONE]") return;
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.chunk) onChunk(parsed.chunk);
        }
    }
}
