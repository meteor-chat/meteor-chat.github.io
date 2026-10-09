import { JADWAL_KEYWORDS } from "./config.js";
const HISTORY_TOKEN_BUDGET = 4000;
const RECENT_TURNS = 2;
const COMPRESS_MAX_CHARS = 300;
const HARI = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
export function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 3);
}
export function getTextContent(msg) {
    return msg.content || "";
}
export function compressAssistantMessage(text) {
    if (!text) return "";
    let compressed = text.replace(/```[\s\S]*?```/g, "[kode]");
    compressed = compressed.replace(/\$\$[\s\S]*?\$\$/g, "[rumus]");
    if (compressed.length > COMPRESS_MAX_CHARS) {
        compressed = compressed.substring(0, COMPRESS_MAX_CHARS) + "\u2026";
    }
    return compressed;
}
export function trimMessages(messages) {
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
        return msg;
    });
    const processedRecent = recentMessages.map((msg, i) => {
        if (i >= recentMessages.length - 2) return msg;
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
export function formatScheduleCompact(jadwalData, days) {
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
export function getScheduleContext(text, jadwalData) {
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
export function getLastUserText(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
            return messages[i].content || "";
        }
    }
    return "";
}