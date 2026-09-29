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
        start(src) { return src.indexOf("$"); },
        tokenizer(src) {
            const match = /^\$([^$\n]+?)\$/.exec(src);
            if (match && !/^\d/.test(match[1])) return { type: "inlineMath", raw: match[0], text: match[1].trim() };
        },
        renderer(token) {
            try { return katex.renderToString(token.text, { displayMode: false, throwOnError: false }); }
            catch { return createErrorNode(token.text, false); }
        }
    };
    marked.use({ extensions: [displayMath, inlineMath] });
}
