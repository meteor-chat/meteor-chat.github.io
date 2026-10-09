export function escapeHTML(text) {
    if (typeof document === 'undefined') {
        return text.replace(/[&<>"']/g, function(m) {
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
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
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
export function getMaxTokens(text) {
    const lower = (text || "").toLowerCase();
    const longKeywords = [
        "kode", "code", "program", "script", "jelaskan", "explain",
        "langkah", "steps", "tulis", "write", "buatkan", "implementasi",
        "lanjutkan"
    ];
    const isLong = longKeywords.some(kw => {
        const regex = new RegExp(`\\b${kw}\\b`);
        return regex.test(lower);
    });
    return isLong ? 3072 : 1536;
}