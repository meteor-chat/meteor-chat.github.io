import { PROVIDERS, SYSTEM_MESSAGE, IMAGE_INSTRUCTION, JADWAL_KEYWORDS } from "./config.js";
import { getAllKeys } from "./api-keys.js";
import { state } from "./app-state.js";
import { parseStream } from "./api-stream.js";

const MAX_HISTORY_PAIRS = 10;
const KEY_COOLDOWN_MS = 60000;
const keyHealth = new Map();

function trimMessages(messages) {
    const maxMessages = MAX_HISTORY_PAIRS * 2;
    let trimmed = messages.length > maxMessages
        ? messages.slice(-maxMessages)
        : [...messages];

    return trimmed.map((msg, i) => {
        if (i >= trimmed.length - 2) return msg;

        if (Array.isArray(msg.content)) {
            const textParts = msg.content.filter(p => p.type === "text");
            const text = textParts.map(p => p.text).join(" ").trim();
            return { ...msg, content: text || " " };
        }
        return msg;
    });
}

function getLastUserText(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
            const c = messages[i].content;
            return Array.isArray(c)
                ? (c.find(p => p.type === "text")?.text || "")
                : (c || "");
        }
    }
    return "";
}

function lastMessageHasImage(messages) {
    if (!messages.length) return false;
    const last = messages[messages.length - 1];
    return Array.isArray(last.content) &&
        last.content.some(p => p.type === "image_url");
}

export async function callChatAPI(messages, onChunk) {
    const keys = getAllKeys();
    if (!keys.length) throw new Error("Belum ada API key aktif.");

    let sysContent = SYSTEM_MESSAGE + "\n\nWaktu: " + new Date().toLocaleString("id-ID");

    if (state.jadwalKuliah) {
        const lastText = getLastUserText(messages).toLowerCase();
        if (JADWAL_KEYWORDS.some(kw => lastText.includes(kw))) {
            sysContent += "\n\nJadwal Kuliah:\n" + state.jadwalKuliah;
        }
    }

    if (lastMessageHasImage(messages)) {
        sysContent += "\n\n" + IMAGE_INSTRUCTION;
    }

    const sysMsg = { role: "system", content: sysContent };

    const trimmed = trimMessages(messages);

    state.abortController = new AbortController();

    for (const entry of keys) {
        const health = keyHealth.get(entry.key);
        if (health && Date.now() - health.failedAt < KEY_COOLDOWN_MS) continue;

        const provider = PROVIDERS[entry.provider];
        const payload = { model: provider.model, messages: [sysMsg, ...trimmed], stream: true };
        if (entry.provider === "openrouter") {
            payload.max_tokens = 3072;
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
            if (!res.ok) {
                if (res.status === 429) {
                    keyHealth.set(entry.key, { failedAt: Date.now() });
                }
                continue;
            }
            keyHealth.delete(entry.key);

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

