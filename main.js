import { setupInputs } from "./input-controls.js";
import { refs } from "./dom-refs.js";
import { cancelEdit } from "./edit-mode.js";
import { copyCode } from "./message-actions.js";
import { showError } from "./error-view.js";
async function init() {
    try {
        setupInputs();
        if (document.getElementById("math-menu-view")) {
            const { initMath } = await import("./math-controller.js?v=4");
            initMath();
        }
        if (refs.cancelBtn) refs.cancelBtn.addEventListener("click", cancelEdit);
        if (refs.stopBtn) {
            refs.stopBtn.addEventListener("click", async () => {
                const { stopGeneration } = await import("./chat-controller.js");
                stopGeneration();
            });
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