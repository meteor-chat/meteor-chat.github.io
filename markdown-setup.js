import { state } from "./app-state.js";
import { setupMath } from "./math-plugin.js";

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
    marked.use({ renderer });
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}