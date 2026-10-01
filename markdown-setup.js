import { state } from "./app-state.js";
import { setupMath } from "./math-plugin.js";

function isAllowedImageSrc(src) {
    if (!src) return false;
    if (src.startsWith("data:image/")) return true;
    try {
        const url = new URL(src, window.location.origin);
        return url.origin === window.location.origin;
    } catch (e) {
        return false;
    }
}

export function setupMarkdown() {
    setupMath();
    marked.use({
        breaks: true,
        gfm: true,
    });
    const renderer = new marked.Renderer();
    renderer.code = function(obj) {
        const code = obj.text || obj;
        const lang = obj.lang || "";
        let highlighted;
        if (lang && hljs.getLanguage(lang)) {
            try { highlighted = hljs.highlight(code, { language: lang }).value; }
            catch { highlighted = escapeHTML(code); }
        } else {
            try { highlighted = hljs.highlightAuto(code).value; }
            catch { highlighted = escapeHTML(code); }
        }

        const div = document.createElement("div");
        div.innerHTML = state.templates["tpl-code-block"];
        const tpl = div.firstElementChild;
        tpl.querySelector(".code-lang").textContent = lang || "code";
        const codeEl = tpl.querySelector("code");
        codeEl.className = lang ? `hljs language-${lang}` : "hljs";
        codeEl.innerHTML = highlighted;
        return tpl.outerHTML;
    };
    renderer.image = function(obj) {
        const src = obj.href || obj.src || "";
        const alt = escapeHTML(obj.text || obj.title || "image");
        if (!isAllowedImageSrc(src)) {
            const span = document.createElement("span");
            span.className = "blocked-image";
            span.textContent = "[gambar eksternal diblokir]";
            return span.outerHTML;
        }
        const img = document.createElement("img");
        img.src = src;
        img.alt = alt;
        return img.outerHTML;
    };
    renderer.link = function(obj) {
        const href = obj.href || "";
        const text = obj.text || href;
        if (href.startsWith("javascript:") || href.startsWith("data:") || href.startsWith("vbscript:")) {
            const span = document.createElement("span");
            span.textContent = text;
            return span.outerHTML;
        }
        const a = document.createElement("a");
        a.href = href;
        a.textContent = text;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        return a.outerHTML;
    };
    marked.use({ renderer });
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}