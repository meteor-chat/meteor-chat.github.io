export function escapeHTML(text) {
    return (text || "").replace(/[&<>"']/g, function(m) {
        switch (m) {
            case "&": return "&amp;";
            case "<": return "&lt;";
            case ">": return "&gt;";
            case '"': return "&quot;";
            case "'": return "&#039;";
            default: return m;
        }
    });
}

function stripRawThinking(text) {
    if (!text) return text;
    const markerRegex = /^(?:\*{0,2}(?:Here(?:'s| is) a thinking process|Thinking Process|Thought Process)\*{0,2}:?\s*)/i;
    if (!markerRegex.test(text.trim())) {
        return text;
    }
    const withoutMarker = text.trim().replace(markerRegex, "");
    const explicitMatch = withoutMarker.match(/\n\n(?:(?:Final )?Answer|Response|Jawaban):\s*([\s\S]*)$/i);
    if (explicitMatch && explicitMatch[1].trim()) {
        return explicitMatch[1].trim();
    }
    const paragraphs = withoutMarker.split(/\n\s*\n/);
    const metaKeywords = [
        "analyze", "constraint", "guideline", "system note", "user says",
        "i need to", "i should", "i could", "i can't", "let's ", "rules summary",
        "the user", "my identity", "opening sentences", "thinking process"
    ];
    let answerParagraphs = [];
    let inAnswer = false;
    for (let i = 0; i < paragraphs.length; i += 1) {
        const p = paragraphs[i].trim();
        if (!p) continue;
        const lower = p.toLowerCase();
        const hasMeta = metaKeywords.some((kw) => lower.includes(kw));
        if (!hasMeta && i > 0) {
            inAnswer = true;
        }
        if (inAnswer) {
            answerParagraphs.push(p);
        }
    }
    if (answerParagraphs.length > 0) {
        return answerParagraphs.join("\n\n").trim();
    }
    return "";
}

export function stripThinkTags(text) {
    if (!text) return text;
    let cleaned = text
        .replace(/<(think|thought|reasoning)>[\s\S]*?<\/\1>/gi, "")
        .replace(/\[(?:Thinking|Thought Process):[\s\S]*?\]/gi, "");

    const tags = ["think", "thought", "reasoning"];
    for (let i = 0; i < tags.length; i += 1) {
        const tag = tags[i];
        const openTag = `<${tag}>`;
        const closeTag = `</${tag}>`;
        const openIdx = cleaned.toLowerCase().lastIndexOf(openTag);
        if (openIdx !== -1 && cleaned.toLowerCase().indexOf(closeTag, openIdx) === -1) {
            cleaned = cleaned.substring(0, openIdx);
        }
        const closeIdx = cleaned.toLowerCase().indexOf(closeTag);
        if (closeIdx !== -1 && cleaned.toLowerCase().indexOf(openTag) === -1) {
            cleaned = cleaned.substring(closeIdx + closeTag.length);
        }
    }

    const lastOpenAngle = cleaned.lastIndexOf("<");
    if (lastOpenAngle !== -1) {
        const partial = cleaned.substring(lastOpenAngle).toLowerCase();
        if ("<think>".startsWith(partial) || "<thought>".startsWith(partial) || "<reasoning>".startsWith(partial)) {
            cleaned = cleaned.substring(0, lastOpenAngle);
        }
    }

    return stripRawThinking(cleaned).trim();
}

export function getQueryType(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return "micro";
    const lower = trimmed.toLowerCase();
    const heavyKeywords = [
        "kode", "code", "program", "script", "buatkan", "implementasi",
        "lanjutkan", "proyek", "lengkap", "buatlah", "bikin", "algoritma"
    ];
    const isHeavy = heavyKeywords.some((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, "i");
        return regex.test(lower);
    });
    if (isHeavy) return "heavy";

    const explainKeywords = ["jelaskan", "explain", "mengapa", "kenapa", "bagaimana", "bandingkan", "analisis", "uraikan", "ceritakan", "langkah", "steps"];
    const wantsExplanation = explainKeywords.some((kw) => {
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
