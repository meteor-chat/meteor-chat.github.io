import { normalizeMath } from "../math/math-plugin.js";
import { sanitize } from "../core/sanitize.js";
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
    const text = String(contentObj);
    if (isMarkdown) {
        const normalized = normalizeMath(text);
        return sanitize(marked.parse(normalized));
    }
    return escapeTextAndNewlines(text);
}