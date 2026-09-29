import { PROVIDERS, SYSTEM_MESSAGE } from "./config.js";
import { getAllKeys } from "./api-keys.js";
import { state } from "./app-state.js";
import { parseStream } from "./api-stream.js";

export async function callChatAPI(messages, onChunk) {
    const keys = getAllKeys();
    if (!keys.length) throw new Error("Belum ada API key aktif.");
    
    let sysContent = SYSTEM_MESSAGE + "\n\nInformasi Waktu: " + new Date().toLocaleString("id-ID");
    if (state.jadwalKuliah) sysContent += "\n\nJadwal Kuliah:\n" + state.jadwalKuliah;
    const sysMsg = { role: "system", content: sysContent };
    
    state.abortController = new AbortController();

    for (const entry of keys) {
        const provider = PROVIDERS[entry.provider];
        const payload = { model: provider.model, messages: [sysMsg, ...messages], stream: true };
        if (entry.provider === "openrouter") {
            payload.max_tokens = 3072;
            payload.provider = { max_price: { prompt: 0, completion: 0, request: 0 } };
        } else {
            payload.max_tokens = 4096;
        }
        
        try {
            const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${entry.key}` };
            if (entry.provider === "openrouter") {
                headers["HTTP-Referer"] = "https://meteor-chat.github.io/";
                headers["X-Title"] = "Meteor";
            }
            const res = await fetch(provider.url, {
                method: "POST", headers, body: JSON.stringify(payload), signal: state.abortController.signal
            });
            if (!res.ok) continue;
            let fullText = "";
            await parseStream(res.body, (chunk) => {
                fullText += chunk;
                onChunk(fullText);
            });
            return fullText;
        } catch (e) {
            if (e.name === "AbortError") throw e;
            continue;
        }
    }
    throw new Error("Kapasitas server Meteor sedang mencapai batas maksimum. Silakan coba beberapa saat lagi.");
}
