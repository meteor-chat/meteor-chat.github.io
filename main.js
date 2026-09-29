import { state } from "./app-state.js";
import { fetchConfig } from "./api-client.js";
import { setupInputs } from "./input-controls.js";
import { setupImageUpload } from "./image-upload.js";
import { setupMarkdown } from "./markdown-setup.js";
import { refs } from "./dom-refs.js";
import { cancelEdit } from "./edit-mode.js";
import { copyCode } from "./message-actions.js";

async function loadTemplates() {
    const tpls = ["tpl-user-msg.html", "tpl-user-bubble.html", "tpl-img-wrap.html", "tpl-user-actions.html", "tpl-assistant-msg.html", "tpl-typing.html", "tpl-code-block.html"];
    for (const file of tpls) {
        const res = await fetch(file);
        state.templates[file.replace(".html", "")] = await res.text();
    }
}

async function init() {
    await fetchConfig();
    await loadTemplates();
    setupInputs();
    setupImageUpload();
    setupMarkdown();
    refs.cancelBtn.addEventListener("click", cancelEdit);
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".copy-btn");
        if (btn) copyCode(btn);
    });
}
init();
