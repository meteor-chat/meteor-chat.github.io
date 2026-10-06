import { PROVIDERS, SYSTEM_MESSAGE, IMAGE_INSTRUCTION, JADWAL_KEYWORDS } from "./config.js";
import { getOrderedKeys } from "./api-keys.js";
import { state } from "./app-state.js";
import { parseStream } from "./api-stream.js";

const HISTORY_TOKEN_BUDGET = 4000;
const RECENT_TURNS = 2;
const COMPRESS_MAX_CHARS = 300;

const KEY_COOLDOWN = {
    rate_limit: 10000,
    auth_error: 3600000,
    not_found: 3600000,
    server_error: 30000,
    default: 10000
};
const keyHealth = new Map();

function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 3);
}

function getTextContent(msg) {
    if (Array.isArray(msg.content)) {
        return msg.content.filter(p => p.type === "text").map(p => p.text).join(" ").trim();
    }
    return msg.content || "";
}

function compressAssistantMessage(text) {
    if (!text) return "";
    let compressed = text.replace(/```[\s\S]*?```/g, "[kode]");
    compressed = compressed.replace(/\$\$[\s\S]*?\$\$/g, "[rumus]");
    if (compressed.length > COMPRESS_MAX_CHARS) {
        compressed = compressed.substring(0, COMPRESS_MAX_CHARS) + "\u2026";
    }
    return compressed;
}

function trimMessages(messages) {
    if (messages.length === 0) return [];

    let msgs = [...messages];

    while (msgs.length > 0 && msgs[0].role !== "user") {
        msgs.shift();
    }

    const recentCount = RECENT_TURNS * 2;
    const recentStart = Math.max(0, msgs.length - recentCount);

    const olderMessages = msgs.slice(0, recentStart);
    const recentMessages = msgs.slice(recentStart);

    const processed = olderMessages.map(msg => {
        if (msg.role === "assistant") {
            return { ...msg, content: compressAssistantMessage(msg.content || "") };
        }
        if (Array.isArray(msg.content)) {
            const text = msg.content.filter(p => p.type === "text").map(p => p.text).join(" ").trim();
            return { ...msg, content: text || "[gambar]" };
        }
        return msg;
    });

    const processedRecent = recentMessages.map((msg, i) => {
        if (i >= recentMessages.length - 2) return msg;
        if (Array.isArray(msg.content)) {
            const text = msg.content.filter(p => p.type === "text").map(p => p.text).join(" ").trim();
            return { ...msg, content: text || "[gambar]" };
        }
        return msg;
    });

    let all = [...processed, ...processedRecent];

    let totalTokens = all.reduce((sum, msg) => sum + estimateTokens(getTextContent(msg)), 0);

    while (totalTokens > HISTORY_TOKEN_BUDGET && all.length > recentCount) {
        const removed = all.shift();
        totalTokens -= estimateTokens(getTextContent(removed));
        if (removed.role === "user" && all.length > recentCount && all[0]?.role === "assistant") {
            const removedAssist = all.shift();
            totalTokens -= estimateTokens(getTextContent(removedAssist));
        }
    }

    while (all.length > 0 && all[0].role !== "user") {
        all.shift();
    }

    return all;
}

const HARI = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];

function formatScheduleCompact(jadwalData, days) {
    const lines = [];
    const daysToInclude = days || Object.keys(jadwalData);

    for (const day of daysToInclude) {
        const entries = jadwalData[day];
        if (!entries || entries.length === 0) continue;
        for (const entry of entries) {
            const jam = entry.jam.replace(/:00/g, "").replace(" - ", "-");
            lines.push(
                `${day.charAt(0).toUpperCase() + day.slice(1)} ${jam} ${entry.nama_mata_kuliah} ${entry.lokasi}`
            );
        }
    }
    return lines.length > 0 ? lines.join("\n") : null;
}

function getScheduleContext(text, jadwalData) {
    if (!jadwalData) return null;

    const lower = text.toLowerCase();

    const hasStrong = JADWAL_KEYWORDS.some(kw => {
        const regex = new RegExp(`\\b${kw.replace(/ /g, "\\s+")}\\b`, "i");
        return regex.test(lower);
    });

    if (!hasStrong) return null;

    const today = new Date();
    const todayName = HARI[today.getDay()];
    const tomorrowName = HARI[(today.getDay() + 1) % 7];

    const targetDays = new Set();
    if (/\bhari\s+ini\b/.test(lower)) targetDays.add(todayName);
    if (/\bbesok\b/.test(lower)) targetDays.add(tomorrowName);
    for (const h of HARI) {
        if (h === "minggu") continue;
        const regex = new RegExp(`\\b${h}\\b`, "i");
        if (regex.test(lower)) targetDays.add(h);
    }

    const days = targetDays.size > 0 ? [...targetDays] : null;
    return formatScheduleCompact(jadwalData, days);
}

export function stripThinkTags(text) {
    if (!text) return text;
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
    const openIdx = cleaned.lastIndexOf("<think>");
    if (openIdx !== -1 && cleaned.indexOf("</think>", openIdx) === -1) {
        cleaned = cleaned.substring(0, openIdx);
    }
    return cleaned.trim();
}

function getMaxTokens(text) {
    const lower = (text || "").toLowerCase();
    const longKeywords = [
        "kode", "code", "program", "script", "jelaskan", "explain",
        "langkah", "steps", "tulis", "write", "buatkan", "implementasi"
    ];
    const isLong = longKeywords.some(kw => lower.includes(kw));
    return isLong ? 3072 : 1536;
}

function getErrorCooldown(status, retryAfter) {
    if (retryAfter) {
        const seconds = parseInt(retryAfter);
        if (!isNaN(seconds)) return seconds * 1000;
    }
    if (status === 429) return KEY_COOLDOWN.rate_limit;
    if (status >= 401 && status <= 403) return KEY_COOLDOWN.auth_error;
    if (status === 404) return KEY_COOLDOWN.not_found;
    if (status >= 500) return KEY_COOLDOWN.server_error;
    return KEY_COOLDOWN.default;
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
    if (!getOrderedKeys().length) throw new Error("Belum ada API key aktif.");

    let sysContent = SYSTEM_MESSAGE;

    const hasImage = lastMessageHasImage(messages);
    if (hasImage) {
        sysContent += "\n\n" + IMAGE_INSTRUCTION;
    }

    const sysMsg = { role: "system", content: sysContent };

    const trimmed = trimMessages(messages);

    const lastText = getLastUserText(messages);
    const now = new Date();
    const timeStr = now.toLocaleString("id-ID", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    });

    let contextSuffix = `\n\n[Waktu: ${timeStr}]`;

    let hasSchedule = false;
    const scheduleText = getScheduleContext(lastText, state.jadwalData);
    if (scheduleText) {
        contextSuffix += `\n[Jadwal Kuliah:\n${scheduleText}]`;
        hasSchedule = true;
    }

    const apiMessages = trimmed.map((msg, i) => {
        if (i === trimmed.length - 1 && msg.role === "user") {
            if (Array.isArray(msg.content)) {
                const newContent = msg.content.map(p => {
                    if (p.type === "text") return { ...p, text: p.text + contextSuffix };
                    return p;
                });
                return { ...msg, content: newContent };
            }
            return { ...msg, content: msg.content + contextSuffix };
        }
        return msg;
    });

    state.abortController = new AbortController();

    const provider = PROVIDERS.openrouter;
    const modelList = hasImage ? provider.vision_models : provider.models;
    const keys = getOrderedKeys();

    for (const entry of keys) {
        const health = keyHealth.get(entry.key);
        if (health && Date.now() - health.failedAt < health.cooldown) continue;

        const maxTokens = getMaxTokens(lastText);
        const payload = {
            models: modelList.slice(0, 3),
            messages: [sysMsg, ...apiMessages],
            stream: true,
            max_tokens: maxTokens,
            stream_options: { include_usage: true }
        };

            let receivedChunks = false;
            let fullText = "";

            try {
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${entry.key}`,
                    "HTTP-Referer": "https://meteor-chat.github.io/",
                    "X-Title": "Meteor"
                };

                const res = await fetch(provider.url, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                    signal: state.abortController.signal
                });

                if (!res.ok) {
                    const retryAfter = res.headers.get("Retry-After");
                    const cooldown = getErrorCooldown(res.status, retryAfter);
                    keyHealth.set(entry.key, { failedAt: Date.now(), cooldown });
                    continue;
                }
                keyHealth.delete(entry.key);

                const { usage, finishReason } = await parseStream(res.body, (chunk) => {
                    receivedChunks = true;
                    fullText += chunk;
                    const visibleText = stripThinkTags(fullText);
                    onChunk(visibleText);
                });

                const cleanText = stripThinkTags(fullText);

                if (usage) {
                    const logEntry = {
                        timestamp: Date.now(),
                        prompt_tokens: usage.prompt_tokens,
                        completion_tokens: usage.completion_tokens,
                        total_tokens: usage.total_tokens,
                        hasSchedule,
                        hasImage,
                        provider: entry.provider
                    };
                    state.usageLog.push(logEntry);
                    console.log("[Meteor Usage]", logEntry);
                }

                return { text: cleanText, usage, finishReason };
            } catch (e) {
                if (e.name === "AbortError") throw e;
                if (receivedChunks && fullText) {
                    return { text: stripThinkTags(fullText), usage: null, finishReason: "error" };
                }
                continue;
            }
        }
    throw new Error("Kapasitas server Meteor sedang mencapai batas maksimum. Silakan coba beberapa saat lagi.");
}