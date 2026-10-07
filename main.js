import { state } from "./app-state.js";
import { setupInputs } from "./input-controls.js";
import { setupMarkdown } from "./markdown-setup.js";
import { refs } from "./dom-refs.js";
import { cancelEdit } from "./edit-mode.js";
import { copyCode } from "./message-actions.js";
import { stopGeneration } from "./chat-controller.js";
import { showError } from "./error-view.js";
async function loadTemplates() {
    const tpls = ["tpl-user-msg.html", "tpl-user-bubble.html", "tpl-user-actions.html", "tpl-assistant-msg.html", "tpl-typing.html", "tpl-thinking.html", "tpl-code-block.html"];
    const promises = tpls.map(async (file) => {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`Gagal memuat template: ${file}`);
        const text = await res.text();
        state.templates[file.replace(".html", "")] = text;
    });
    await Promise.all(promises);
}
async function loadJadwal() {
    try {
        const res = await fetch("jadwal-kuliah.json");
        if (res.ok) {
            const data = await res.json();
            const validData = {};
            for (const day in data) {
                if (Array.isArray(data[day])) {
                    validData[day] = data[day].filter(item => 
                        item && typeof item.jam === 'string' && typeof item.nama_mata_kuliah === 'string' && typeof item.lokasi === 'string'
                    );
                }
            }
            state.jadwalData = validData;
        }
    } catch(e) {
        console.warn("Gagal memuat jadwal kuliah", e);
    }
}
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
        await Promise.all([loadTemplates(), loadJadwal()]);
        setupInputs();
        setupMarkdown();
        refs.cancelBtn.addEventListener("click", cancelEdit);
        if (refs.stopBtn) {
            refs.stopBtn.addEventListener("click", stopGeneration);
        }
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".copy-btn");
            if (btn) copyCode(btn);
        });
    } catch (e) {
        showError(`Inisialisasi aplikasi gagal: ${e.message}`);
        const landing = document.getElementById("landing");
        landing.textContent = ""; // clear content safely without innerHTML
        const errDiv = document.createElement("div");
        errDiv.className = "error-box";
        errDiv.style.display = "block";
        errDiv.style.margin = "2rem";
        errDiv.textContent = e.message + " - Silakan muat ulang halaman.";
        landing.appendChild(errDiv);
    }
}
init();