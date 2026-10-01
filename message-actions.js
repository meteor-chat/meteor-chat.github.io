import { state } from "./app-state.js";
import { writeText } from "./clipboard.js";

export function copyMessage(index) {
    const item = state.messages[index].content;
    const text = Array.isArray(item) ? (item.find(p => p.type === "text")?.text || "") : item;
    writeText(text);
}

export function copyCode(btn) {
    const pre = btn.closest(".code-block-wrapper").querySelector("pre");
    const code = pre?.querySelector("code");
    if (code) {
        writeText(code.textContent).then(() => {
            btn.textContent = "Copied!";
            setTimeout(() => {
                btn.textContent = "";
                const img = document.createElement("img");
                img.src = "copy.svg";
                img.alt = "Copy";
                btn.appendChild(img);
            }, 1500);
        });
    }
}