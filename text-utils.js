export function escapeHTML(text) {
    return (text || '').replace(/[&<>"']/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return m;
        }
    });
}
export function stripThinkTags(text) {
    if (!text) return text;
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
    const openIdx = cleaned.lastIndexOf("<think>");
    if (openIdx !== -1 && cleaned.indexOf("</think>", openIdx) === -1) {
        cleaned = cleaned.substring(0, openIdx);
    }
    const lastOpenAngle = cleaned.lastIndexOf("<");
    if (lastOpenAngle !== -1) {
        const partial = cleaned.substring(lastOpenAngle);
        if ("<think>".startsWith(partial)) {
            cleaned = cleaned.substring(0, lastOpenAngle);
        }
    }
    const closeIdx = cleaned.indexOf("</think>");
    if (closeIdx !== -1 && cleaned.indexOf("<think>") === -1) {
        cleaned = cleaned.substring(closeIdx + 8);
    }
    return cleaned.trim();
}
export function getQueryType(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return "micro";
    const lower = trimmed.toLowerCase();
    const heavyKeywords = [
        "kode", "code", "program", "script", "buatkan", "implementasi",
        "lanjutkan", "proyek", "lengkap", "buatlah", "bikin", "algoritma"
    ];
    const isHeavy = heavyKeywords.some(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, "i");
        return regex.test(lower);
    });
    if (isHeavy) return "heavy";

    const explainKeywords = ["jelaskan", "explain", "mengapa", "kenapa", "bagaimana", "bandingkan", "analisis", "uraikan", "ceritakan", "langkah", "steps"];
    const wantsExplanation = explainKeywords.some(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, "i");
        return regex.test(lower);
    });
    if (wantsExplanation) return "standard";

    const words = trimmed.split(/\s+/);
    if (words.length <= 6 && trimmed.length <= 45) {
        return "micro";
    }

    return "standard";
}

export function getMaxTokens(text) {
    const type = getQueryType(text);
    if (type === "heavy") return 2560;
    if (type === "micro") return 384;
    return 1024;
}