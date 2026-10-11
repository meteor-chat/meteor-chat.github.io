import { setupInputs } from "./input-controls.js";
import { setupMarkdown } from "./markdown-setup.js";
import { refs } from "./dom-refs.js";
import { cancelEdit } from "./edit-mode.js";
import { copyCode } from "./message-actions.js";
import { stopGeneration } from "./chat-controller.js";
import { showError } from "./error-view.js";
import { ensureTemplates, loadJadwal } from "./template-loader.js";
function checkDependencies() {
    const missing = [];
    if (typeof window.marked === 'undefined') missing.push('marked');
    if (typeof window.DOMPurify === 'undefined') missing.push('DOMPurify');
    if (typeof window.katex === 'undefined') missing.push('katex');
    if (typeof window.hljs === 'undefined') missing.push('highlight.js');
    if (missing.length > 0) {
        throw new Error(`Library CDN gagal dimuat: ${missing.join(', ')}`);
    }
}
async function init() {
    try {
        checkDependencies();
        ensureTemplates();
        loadJadwal();
        setupInputs();
        setupMarkdown();
        if (document.getElementById("math-menu-view")) {
            const { initMath } = await import("./math-controller.js?v=3");
            initMath();
        }
        if (refs.cancelBtn) refs.cancelBtn.addEventListener("click", cancelEdit);
        if (refs.stopBtn) {
            refs.stopBtn.addEventListener("click", stopGeneration);
        }
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".copy-btn");
            if (btn) copyCode(btn);
        });
    } catch (e) {
        showError(`Inisialisasi aplikasi gagal: ${e.message}`);
        const landing = document.getElementById("landing") || document.body;
        if (landing.id === "landing") landing.textContent = "";
        const errDiv = document.createElement("div");
        errDiv.className = "error-box error-box-fallback";
        errDiv.textContent = e.message + " - Silakan muat ulang halaman.";
        landing.appendChild(errDiv);
    }
}
init();