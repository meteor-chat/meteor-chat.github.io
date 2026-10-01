function createErrorNode(text, isBlock) {
    const el = document.createElement(isBlock ? "div" : "span");
    el.className = "katex-error";
    el.textContent = text;
    return el.outerHTML;
}

export function normalizeMath(text) {
    if (!text) return "";
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (m, eq) => `\n\n$$\n${eq.trim()}\n$$\n\n`);
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (m, eq) => `$${eq.trim()}$`);
    return text;
}

export function setupMath() {
    const displayMath = {
        name: "displayMath",
        level: "inline",
        start(src) { return src.indexOf("$$"); },
        tokenizer(src) {
            const match = /^\$\$([\s\S]+?)\$\$/.exec(src);
            if (match) return { type: "displayMath", raw: match[0], text: match[1].trim() };
        },
        renderer(token) {
            try { return katex.renderToString(token.text, { displayMode: true, throwOnError: false }); }
            catch { return createErrorNode(token.text, true); }
        }
    };
    const inlineMath = {
        name: "inlineMath",
        level: "inline",
        start(src) {
            let idx = 0;
            while (idx < src.length) {
                idx = src.indexOf("$", idx);
                if (idx === -1) return -1;
                if (src[idx + 1] === "$") { idx += 2; continue; }
                return idx;
            }
            return -1;
        },
        tokenizer(src) {
            const match = /^\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\d)/.exec(src);
            if (!match) return;
            const content = match[1];
            if (/^[\d,.]+$/.test(content)) return;
            if (!/[\\^_{}=+\-*/()[\]|<>!]|\\[a-zA-Z]/.test(content) && content.length > 30) return;
            return { type: "inlineMath", raw: match[0], text: content.trim() };
        },
        renderer(token) {
            try { return katex.renderToString(token.text, { displayMode: false, throwOnError: false }); }
            catch { return createErrorNode(token.text, false); }
        }
    };
    marked.use({ extensions: [displayMath, inlineMath] });
}
