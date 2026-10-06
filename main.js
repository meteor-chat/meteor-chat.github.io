import { state } from "./app-state.js";
import { setupInputs } from "./input-controls.js";
import { setupMarkdown } from "./markdown-setup.js";
import { refs } from "./dom-refs.js";
import { cancelEdit } from "./edit-mode.js";
import { copyCode } from "./message-actions.js";
import { stopGeneration } from "./chat-controller.js";

async function loadTemplates() {
    const tpls = ["tpl-user-msg.html", "tpl-user-bubble.html", "tpl-user-actions.html", "tpl-assistant-msg.html", "tpl-typing.html", "tpl-thinking.html", "tpl-code-block.html"];
    for (const file of tpls) {
        const res = await fetch(file);
        state.templates[file.replace(".html", "")] = await res.text();
    }
}

async function loadJadwal() {
    try {
        const res = await fetch("jadwal-kuliah.json");
        if (res.ok) state.jadwalData = await res.json();
    } catch(e) {}
}

async function init() {
    await loadTemplates();
    await loadJadwal();
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
}
init();