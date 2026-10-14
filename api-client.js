import { PROVIDERS, SYSTEM_MESSAGE, CONFIG_API_KEYS } from "./config.js";
import { getOrderedKeys } from "./api-keys.js";
import { state } from "./app-state.js";
import { parseStream } from "./api-stream.js";
import { stripThinkTags, getMaxTokens, getQueryType } from "./text-utils.js";
import { trimMessages, getScheduleContext, getLastUserText } from "./history.js";
import { ensureJadwal } from "./template-loader.js";
import { getFeatureContext } from "./feature-context.js";
import { createTwoTierTimeoutSignal, selectModels } from "./api-dispatch.js";

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
let currentModelIndex = 0;

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
    let contextSuffix = `\n\n[System Note: Waktu saat ini adalah ${timeStr}]`;
    let hasSchedule = false;
    if (!state.jadwalData) await ensureJadwal();
    const scheduleText = getScheduleContext(lastText, state.jadwalData);
    if (scheduleText) {
        contextSuffix += `\n[System Note: Berikut adalah data jadwal kuliah saat ini:\n${scheduleText}]`;
        hasSchedule = true;
    }
    const featureText = getFeatureContext(lastText, messages);
    if (featureText) {
        contextSuffix += `\n[System Note: Panduan fitur web Meteor:\n${featureText}]`;
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
    const MAX_RETRIES = keys.length;
    let attempts = 0;
    let lastError = null;
    const queryType = getQueryType(lastText);

    for (const entry of keys) {
        if (attempts >= MAX_RETRIES) break;
        const health = keyHealth.get(entry.key);
        if (health) {
            const waitTime = health.failedAt + health.cooldown - Date.now();
            if (waitTime > 0) continue;
        }
        const maxTokens = getMaxTokens(lastText);
        const { models: selectedModels, nextIndex } = selectModels(modelList, queryType, currentModelIndex, 3);
        currentModelIndex = nextIndex;

        const payload = {
            models: selectedModels,
            messages: [sysMsg, ...apiMessages],
            stream: true,
            max_tokens: maxTokens,
            temperature: 0.6,
            top_p: 0.9,
            stream_options: { include_usage: true }
        };
        let receivedChunks = false;
        let fullText = "";
        const { signal, resetTimeout, clear } = createTwoTierTimeoutSignal(8000, 15000, state.abortController.signal);
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
                const cleanText = stripThinkTags(fullText);
                return { text: cleanText, usage: null, finishReason: "interrupted" };
            }
            lastError = e;
        }
    }
    if (lastError) throw lastError;
    throw new Error("Gagal menghubungi AI. Coba lagi.");
}