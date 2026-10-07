function createErrorNode(text, isBlock) {
    const el = document.createElement(isBlock ? "div" : "span");
    el.className = "katex-error";
    el.textContent = text;
    return el.outerHTML;
}

export function normalizeMath(text) {
    if (!text) return "";
    let result = "";
    let inBlockCode = false;
    let inInlineCode = false;
    let buffer = "";

    const flushBuffer = (isCode) => {
        if (!buffer) return;
        if (isCode) {
            result += buffer;
        } else {
            let processed = buffer.replace(/\\\[([\s\S]*?)\\\]/g, (m, eq) => `\n\n$$\n${eq.trim()}\n$$\n\n`);
            processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (m, eq) => `$${eq.trim()}$`);
            result += processed;
        }
        buffer = "";
    };

    for (let i = 0; i < text.length; i++) {
        if (!inBlockCode && !inInlineCode && text.startsWith("```", i)) {
            flushBuffer(false);
            buffer += "```";
            inBlockCode = true;
            i += 2;
        } else if (inBlockCode && text.startsWith("```", i)) {
            buffer += "```";
            inBlockCode = false;
            flushBuffer(true);
            i += 2;
        } else if (!inBlockCode && !inInlineCode && text[i] === "`") {
            flushBuffer(false);
            buffer += "`";
            inInlineCode = true;
        } else if (!inBlockCode && inInlineCode && text[i] === "`") {
            buffer += "`";
            inInlineCode = false;
            flushBuffer(true);
        } else {
            buffer += text[i];
        }
    }
    flushBuffer(inBlockCode || inInlineCode);
    return result;
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