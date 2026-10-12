import { setupInputs } from "./input-controls.js";
import { refs } from "./dom-refs.js";
import { showError } from "./error-view.js";
async function init() {
    try {
        setupInputs();
        if (refs.cancelBtn) {
            refs.cancelBtn.addEventListener("click", async () => {
                const { cancelEdit } = await import("./edit-mode.js");
                cancelEdit();
            });
        }
        if (refs.stopBtn) {
            refs.stopBtn.addEventListener("click", async () => {
                const { stopGeneration } = await import("./chat-controller.js");
                stopGeneration();
            });
        }
        document.addEventListener("click", async (e) => {
            const btn = e.target.closest(".copy-btn");
            if (!btn) return;
            const { copyCode } = await import("./message-actions.js");
            copyCode(btn);
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
