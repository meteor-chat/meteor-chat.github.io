import { state } from "./app-state.js";
import { refs } from "./dom-refs.js";
import { showError, hideError } from "./error-view.js";
export function syncInputUI(input) {
    const btn = input === refs.msgLanding ? refs.sendLanding : refs.sendChat;
    const img = btn.querySelector("img");
    if (img) img.src = input.value.trim() ? "send-active.svg" : "send-inactive.svg";
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
}
let preparing = false;
async function submit(input) {
    if (state.isLoading || preparing) return;
    let text = input.value.trim();
    if (!text) return;
    const maxLen = state.config.max_message || 4000;
    if ([...text].length > maxLen) {
        showError(`Pesan maksimal ${maxLen} karakter.`);
        return;
    }
    hideError();
    preparing = true;
    try {
        const chat = await import("./chat-controller.js");
        await chat.prepareChat();
        input.value = "";
        syncInputUI(input);
        chat.sendMessage(text);
    } catch (e) {
        showError(e.message);
    } finally {
        preparing = false;
    }
}
export function setupInputs() {
    [refs.msgLanding, refs.msgChat].forEach(input => {
        if (!input) return;
        input.addEventListener("focus", () => {
            import("./chat-controller.js").then((chat) => chat.prepareChat()).catch(() => {});
        }, { once: true });
        input.addEventListener("input", () => syncInputUI(input));
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
                e.preventDefault();
                submit(input);
            }
        });
    });
    if (refs.sendLanding) refs.sendLanding.addEventListener("click", () => submit(refs.msgLanding));
    if (refs.sendChat) refs.sendChat.addEventListener("click", () => submit(refs.msgChat));
}