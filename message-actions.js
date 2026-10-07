import { state } from "./app-state.js";
import { writeText } from "./clipboard.js";
import { showError } from "./error-view.js";

export async function copyMessage(index) {
    const text = state.messages[index].content;
    const success = await writeText(text);
    if (!success) showError("Gagal menyalin pesan.");
}

export async function copyCode(btn) {
    const wrapper = btn.closest(".code-block-wrapper");
    if (!wrapper) return;
    const pre = wrapper.querySelector("pre");
    const code = pre?.querySelector("code");
    if (code) {
        const success = await writeText(code.textContent);
        if (success) {
            btn.textContent = "Copied!";
        } else {
            btn.textContent = "Failed";
            showError("Gagal menyalin kode.");
        }
        setTimeout(() => {
            btn.textContent = "";
            const img = document.createElement("img");
            img.src = "copy.svg";
            img.alt = "Copy";
            btn.appendChild(img);
        }, 1500);
    }
}