import { PROVIDERS, SYSTEM_MESSAGE, CONFIG_API_KEYS } from "./config.js";
import { getOrderedKeys } from "./api-keys.js";
import { state } from "./app-state.js";
import { parseStream } from "./api-stream.js";
import { stripThinkTags, getMaxTokens } from "./text-utils.js";
import { trimMessages, getScheduleContext, getLastUserText } from "./history.js";
export class ApiError extends Error {
    constructor(message, status, type, cooldown = 0) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.type = type; 
        this.cooldown = cooldown;
    }
}
export function classifyError(status, retryAfterHeader) {
    if (status === 401 || status === 402) {
        return new ApiError("Akses ditolak atau kredit habis (401/402).", status, "AUTH", KEY_COOLDOWN.auth_error);
    }
    if (status === 429) {
        let cd = KEY_COOLDOWN.rate_limit;
        if (retryAfterHeader) {
            const parsed = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsed) && parsed > 0) {
                cd = Math.min(parsed * 1000, 60000); 
            }
        }
        return new ApiError("Terlalu banyak request (429).", status, "RATE_LIMIT", cd);
    }
    if (status >= 500) {
        return new ApiError(`Gangguan server dari provider (${status}).`, status, "SERVER", KEY_COOLDOWN.server_error);
    }
    return new ApiError(`Permintaan ditolak oleh server (${status}).`, status, "FATAL", 0);
}
const KEY_COOLDOWN = {
    rate_limit: 10000,
    auth_error: 3600000,
    not_found: 3600000,
    server_error: 30000,
    default: 10000
};
const keyHealth = new Map();
function createTimeoutSignal(timeoutMs, parentSignal) {
    const controller = new AbortController();
    let timeoutId;
    const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            controller.abort(new Error("Timeout"));
        }, timeoutMs);
    };
    resetTimeout();
    const onParentAbort = () => {
        clearTimeout(timeoutId);
        controller.abort(parentSignal.reason);
    };
    if (parentSignal) {
        if (parentSignal.aborted) {
            onParentAbort();
        } else {
            parentSignal.addEventListener("abort", onParentAbort);
        }
    }
    return { 
        signal: controller.signal, 
        resetTimeout, 
        clear: () => {
            clearTimeout(timeoutId);
            if (parentSignal) parentSignal.removeEventListener("abort", onParentAbort);
        }
    };
}
export async function callChatAPI(messages, onChunk) {
    if (CONFIG_API_KEYS.length === 0) throw new Error("Belum ada API key yang dikonfigurasi.");
    let sysContent = SYSTEM_MESSAGE;
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
            return { ...msg, content: msg.content + contextSuffix };
        }
        return msg;
    });
    state.abortController = new AbortController();
    const provider = PROVIDERS.openrouter;
    const modelList = provider.models;
    const keys = getOrderedKeys();
    const MAX_RETRIES = 3;
    let attempts = 0;
    let lastError = null;
    for (const entry of keys) {
        if (attempts >= MAX_RETRIES) break;
        const health = keyHealth.get(entry.key);
        if (health) {
            const waitTime = health.failedAt + health.cooldown - Date.now();
            if (waitTime > 0) continue;
        }
        const maxTokens = getMaxTokens(lastText);
        const payload = {
            models: modelList.slice(0, 3),
            messages: [sysMsg, ...apiMessages],
            stream: true,
            max_tokens: maxTokens,
            temperature: 0.6,
            top_p: 0.9,
            stream_options: { include_usage: true }
        };
        let receivedChunks = false;
        let fullText = "";
        const { signal, resetTimeout, clear } = createTimeoutSignal(30000, state.abortController.signal);
        try {
            attempts++;
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
                signal: signal
            });
            if (!res.ok) {
                clear();
                const retryAfter = res.headers.get("Retry-After");
                const apiErr = classifyError(res.status, retryAfter);
                lastError = apiErr;
                if (apiErr.type === "FATAL") {
                    throw apiErr; 
                }
                if (apiErr.type === "AUTH" || apiErr.type === "RATE_LIMIT") {
                    keyHealth.set(entry.key, { failedAt: Date.now(), cooldown: apiErr.cooldown });
                    await new Promise(r => setTimeout(r, 1500));
                }
                if (apiErr.type === "SERVER") {
                    await new Promise(r => setTimeout(r, 1000));
                }
                continue; 
            }
            keyHealth.delete(entry.key);
            const { usage, finishReason } = await parseStream(res.body, (chunk) => {
                receivedChunks = true;
                fullText += chunk;
                const visibleText = stripThinkTags(fullText);
                onChunk(visibleText);
            }, () => {
                resetTimeout();
            });
            clear();
            const cleanText = stripThinkTags(fullText);
            if (usage) {
                const logEntry = {
                    timestamp: Date.now(),
                    prompt_tokens: usage.prompt_tokens,
                    completion_tokens: usage.completion_tokens,
                    total_tokens: usage.total_tokens,
                    hasSchedule,
                    provider: entry.provider
                };
                state.usageLog.push(logEntry);
            }
            return { text: cleanText, usage, finishReason };
        } catch (e) {
            clear();
            if (state.abortController.signal.aborted) {
                throw new Error("AbortError");
            }
            if (e.message === "Timeout" || e.name === "TimeoutError") {
                lastError = new ApiError("Koneksi timeout (tidak ada respon terlalu lama).", 408, "SERVER", KEY_COOLDOWN.server_error);
                continue; 
            }
            if (e instanceof ApiError) throw e;
            if (receivedChunks && fullText) {
                return { text: stripThinkTags(fullText), usage: null, finishReason: "error" };
            }
            lastError = e;
            await new Promise(r => setTimeout(r, 1000));
            continue;
        }
    }
    if (lastError instanceof ApiError) {
        throw new Error(lastError.message);
    }
    let minWait = Infinity;
    for (const entry of keys) {
        const health = keyHealth.get(entry.key);
        if (health) {
            const waitTime = health.failedAt + health.cooldown - Date.now();
            if (waitTime > 0 && waitTime < minWait) minWait = waitTime;
        }
    }
    if (minWait !== Infinity && minWait > 0) {
        throw new Error(`Semua kunci API sedang sibuk. Coba lagi dalam ${Math.ceil(minWait / 1000)} detik.`);
    }
    throw new Error(lastError ? lastError.message : "Gagal menghubungi server Meteor setelah beberapa percobaan.");
}