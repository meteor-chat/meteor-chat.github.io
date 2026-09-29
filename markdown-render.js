import { normalizeMath } from "./math-plugin.js";
import { sanitize } from "./sanitize.js";

function escapeTextAndNewlines(text) {
    const div = document.createElement("div");
    const lines = String(text).split("\n");
    for (let i = 0; i < lines.length; i++) {
        div.appendChild(document.createTextNode(lines[i]));
        if (i < lines.length - 1) div.appendChild(document.createElement("br"));
    }
    return div.innerHTML;
}

export function formatContent(contentObj, isMarkdown = false) {
    if (Array.isArray(contentObj)) {
        let out = "";
        for (const part of contentObj) {
            if (part.type === "text") out += escapeTextAndNewlines(part.text);
            else if (part.type === "image_url") out += `<div class="img-wrap"><img src="${sanitize(part.image_url.url)}" alt="img"></div>`;
        }
        return out;
    }
    const text = String(contentObj);
    if (isMarkdown) {
        const normalized = normalizeMath(text);
        return sanitize(marked.parse(normalized));
    }
    return escapeTextAndNewlines(text);
}
