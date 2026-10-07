import { state } from "./app-state.js";
import { setupMath } from "./math-plugin.js";
import { escapeHTML } from "./text-utils.js";

export function setupMarkdown() {
    setupMath();
    marked.use({
        breaks: true,
        gfm: true,
    });
    const renderer = new marked.Renderer();
    
    renderer.code = function(obj) {
        const code = obj.text ?? "";
        const lang = obj.lang || "";
        let highlighted;
        if (state.isStreamingChunk) {
            highlighted = escapeHTML(code);
        } else {
            if (lang && hljs.getLanguage(lang)) {
                try { highlighted = hljs.highlight(code, { language: lang }).value; }
                catch { highlighted = escapeHTML(code); }
            } else {
                try { highlighted = hljs.highlightAuto(code).value; }
                catch { highlighted = escapeHTML(code); }
            }
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
        const alt = obj.text || obj.title || "image"; // Don't double escape, DOM string assignment is safe or marked handles it
        const img = document.createElement("img");
        img.src = src;
        img.alt = alt; // Setting attribute directly is safe from XSS
        return img.outerHTML;
    };
    
    renderer.link = function(obj) {
        const href = obj.href || "";
        const text = this.parser.parseInline(obj.tokens || []);
        
        const a = document.createElement("a");
        a.href = href;
        a.innerHTML = text || href; // innerHTML because parseInline returns HTML
        if (obj.title) a.title = obj.title;
        // Target blank and rel noopener is now handled by DOMPurify hook
        return a.outerHTML;
    };
    
    marked.use({ renderer });
}