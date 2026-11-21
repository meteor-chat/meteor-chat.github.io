export function extractArticleMetadata(doc, fallbackUrl = "") {
    if (!doc) return { title: "", author: "", description: "", date: "", url: fallbackUrl };
    const getMeta = (names) => {
        for (const name of names) {
            const el = doc.querySelector(`meta[name="${name}" i], meta[property="${name}" i]`);
            if (el && el.getAttribute("content")) {
                const val = el.getAttribute("content").trim();
                if (val) return val;
            }
        }
        return "";
    };
    const title = getMeta(["og:title", "twitter:title"])
        || (doc.querySelector("title") ? doc.querySelector("title").textContent.trim() : "")
        || (doc.querySelector("h1") ? doc.querySelector("h1").textContent.trim() : "Untitled Article");
    const author = getMeta(["author", "article:author", "og:article:author", "twitter:creator"]);
    const description = getMeta(["description", "og:description", "twitter:description"]);
    const date = getMeta(["article:published_time", "og:article:published_time", "date", "pubdate"]);
    const url = getMeta(["og:url", "twitter:url"]) || fallbackUrl;
    return { title, author, description, date, url };
}

export function cleanDomTree(rootElement) {
    if (!rootElement) return;
    const dropTags = ["script", "style", "noscript", "iframe", "svg", "form", "button", "nav", "header", "footer", "aside"];
    dropTags.forEach((tag) => {
        rootElement.querySelectorAll(tag).forEach((el) => el.remove());
    });
    const dropClasses = ["ads", "advertisement", "cookie-banner", "social-share", "sidebar", "comments", "related-posts"];
    dropClasses.forEach((cls) => {
        rootElement.querySelectorAll(`[class*="${cls}" i], [id*="${cls}" i]`).forEach((el) => el.remove());
    });
}

export function findMainContentElement(doc) {
    if (!doc) return null;
    const candidates = [
        doc.querySelector("article"),
        doc.querySelector("main"),
        doc.querySelector('[role="main"]'),
        doc.querySelector(".article-content, .post-content, .entry-content, .content")
    ];
    for (const c of candidates) {
        if (c && c.textContent.trim().length > 100) return c;
    }
    const body = doc.body;
    if (!body) return null;
    let bestEl = body;
    let maxParas = 0;
    body.querySelectorAll("div, section").forEach((container) => {
        const count = container.querySelectorAll("p").length;
        if (count > maxParas) {
            maxParas = count;
            bestEl = container;
        }
    });
    return bestEl;
}

function processTableRow(tr) {
    const cells = Array.from(tr.querySelectorAll("th, td"));
    if (cells.length === 0) return "";
    return `| ${cells.map((c) => c.textContent.trim().replace(/\|/g, "\\|")).join(" | ")} |`;
}

export function domNodeToMarkdown(node, options = {}) {
    if (!node) return "";
    if (node.nodeType === 3) {
        return node.textContent.replace(/\s+/g, " ");
    }
    if (node.nodeType !== 1) return "";

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes);
    const renderChildren = () => children.map((c) => domNodeToMarkdown(c, options)).join("");

    switch (tag) {
    case "h1": return `\n\n# ${renderChildren().trim()}\n\n`;
    case "h2": return `\n\n## ${renderChildren().trim()}\n\n`;
    case "h3": return `\n\n### ${renderChildren().trim()}\n\n`;
    case "h4": return `\n\n#### ${renderChildren().trim()}\n\n`;
    case "h5": return `\n\n##### ${renderChildren().trim()}\n\n`;
    case "h6": return `\n\n###### ${renderChildren().trim()}\n\n`;
    case "p": {
        const pText = renderChildren().trim();
        return pText ? `\n\n${pText}\n\n` : "";
    }
    case "strong":
    case "b": return `**${renderChildren().trim()}**`;
    case "em":
    case "i": return `*${renderChildren().trim()}*`;
    case "del":
    case "s": return `~~${renderChildren().trim()}~~`;
    case "code": {
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === "pre") {
            return node.textContent;
        }
        return `\`${node.textContent}\``;
    }
    case "pre": {
        const codeEl = node.querySelector("code");
        const lang = codeEl && codeEl.className ? (codeEl.className.match(/language-(\w+)/) || [])[1] || "" : "";
        const codeText = codeEl ? codeEl.textContent : node.textContent;
        return `\n\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n\n`;
    }
    case "blockquote": {
        const lines = renderChildren().trim().split("\n");
        return `\n\n${lines.map((l) => `> ${l}`).join("\n")}\n\n`;
    }
    case "a": {
        const text = renderChildren().trim();
        const href = node.getAttribute("href") || "";
        if (!text) return "";
        if (options.keepLinks === false || !href || href.startsWith("#") || href.startsWith("javascript:")) {
            return text;
        }
        return `[${text}](${href})`;
    }
    case "img": {
        if (options.keepImages === false) return "";
        const alt = node.getAttribute("alt") || "image";
        const src = node.getAttribute("src") || "";
        if (!src) return "";
        return `\n\n![${alt}](${src})\n\n`;
    }
    case "ul": {
        const items = Array.from(node.children)
            .filter((c) => c.tagName.toLowerCase() === "li")
            .map((li) => `- ${domNodeToMarkdown(li, options).trim()}`);
        return `\n\n${items.join("\n")}\n\n`;
    }
    case "ol": {
        const items = Array.from(node.children)
            .filter((c) => c.tagName.toLowerCase() === "li")
            .map((li, idx) => `${idx + 1}. ${domNodeToMarkdown(li, options).trim()}`);
        return `\n\n${items.join("\n")}\n\n`;
    }
    case "li": return renderChildren();
    case "table": {
        if (options.keepTables === false) return "";
        const rows = Array.from(node.querySelectorAll("tr"));
        if (rows.length === 0) return "";
        const head = processTableRow(rows[0]);
        const thCount = rows[0].querySelectorAll("th, td").length;
        const divider = `| ${new Array(thCount).fill("---").join(" | ")} |`;
        const bodyRows = rows.slice(1).map(processTableRow).filter(Boolean);
        return `\n\n${[head, divider, ...bodyRows].join("\n")}\n\n`;
    }
    case "hr": return "\n\n---\n\n";
    case "br": return "\n";
    default: return renderChildren();
    }
}

export function htmlToMarkdown(htmlString, options = {}) {
    if (!htmlString || typeof htmlString !== "string") {
        return { title: "", markdown: "", metadata: {} };
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const metadata = extractArticleMetadata(doc, options.url || "");
    const mainEl = findMainContentElement(doc);
    if (!mainEl) {
        return { title: metadata.title, markdown: "", metadata };
    }
    cleanDomTree(mainEl);
    let rawMd = domNodeToMarkdown(mainEl, options);
    rawMd = rawMd.replace(/\n{3,}/g, "\n\n").trim();
    return { title: metadata.title, markdown: rawMd, metadata };
}

export function applyMarkdownPreset(data, preset = "custom", customOptions = {}) {
    const title = data.title || "Untitled Article";
    const body = (data.markdown || "").trim();
    const meta = data.metadata || {};

    if (preset === "minimal") {
        return `# ${title}\n\n${body}`.trim();
    }

    if (preset === "pkm") {
        const stats = calculateStats(body);
        const isoDate = meta.date ? new Date(meta.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const yaml = [
            "---",
            `title: "${title.replace(/"/g, '\\"')}"`,
            meta.author ? `author: "${meta.author.replace(/"/g, '\\"')}"` : null,
            meta.url ? `url: "${meta.url}"` : null,
            `date: ${isoDate}`,
            `reading_time: "${stats.readingTimeMinutes} min"`,
            "tags:",
            "  - web-clip",
            "  - meteor-reader",
            "---"
        ].filter(Boolean).join("\n");
        return `${yaml}\n\n# ${title}\n\n${body}`.trim();
    }

    let out = "";
    if (customOptions.frontmatter) {
        const yaml = [
            "---",
            `title: "${title.replace(/"/g, '\\"')}"`,
            meta.url ? `url: "${meta.url}"` : null,
            `date: ${new Date().toISOString().split("T")[0]}`,
            "---"
        ].filter(Boolean).join("\n");
        out += `${yaml}\n\n`;
    }
    out += `# ${title}\n\n${body}`;
    return out.trim();
}

export function calculateStats(markdownText) {
    const text = (markdownText || "").trim();
    if (!text) return { words: 0, chars: 0, readingTimeMinutes: 0 };
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingTimeMinutes };
}

export function slugify(text) {
    return (text || "article")
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 60);
}

export async function fetchArticleFromUrl(targetUrl, fetchFn = fetch) {
    if (!targetUrl || typeof targetUrl !== "string") {
        throw new Error("URL artikel tidak valid.");
    }
    const cleanUrl = targetUrl.trim();
    const jinaUrl = `https://r.jina.ai/${encodeURI(cleanUrl)}`;
    try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 12000);
        const res = await fetchFn(jinaUrl, {
            method: "GET",
            headers: { Accept: "text/markdown" },
            signal: ctrl.signal
        });
        clearTimeout(tid);
        if (res.ok) {
            const md = await res.text();
            if (md && md.length > 50) {
                const titleMatch = md.match(/^#\s+(.+)$/m) || md.match(/Title:\s*(.+)$/m);
                const title = titleMatch ? titleMatch[1].trim() : "Artikel Ekstraksi";
                return { success: true, title, markdown: md.trim(), source: "jina", url: cleanUrl };
            }
        }
    } catch {}

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
    try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 12000);
        const res = await fetchFn(proxyUrl, { signal: ctrl.signal });
        clearTimeout(tid);
        if (res.ok) {
            const rawHtml = await res.text();
            const parsed = htmlToMarkdown(rawHtml, { url: cleanUrl });
            if (parsed.markdown && parsed.markdown.length > 50) {
                return { success: true, title: parsed.title, markdown: parsed.markdown, source: "proxy", url: cleanUrl, metadata: parsed.metadata };
            }
        }
    } catch {}

    throw new Error("Gagal mengambil artikel dari URL tersebut. Gunakan tab 'Tempel HTML' untuk mengekstrak secara lokal.");
}
