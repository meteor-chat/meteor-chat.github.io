import { state } from "./app-state.js";
import { refs } from "./dom-refs.js";
import { sendMessage } from "./chat-controller.js";

export function setupInputs() {
    const updateBtn = (input, btn) => {
        const img = btn.querySelector("img");
        if (img) img.src = input.value.trim() ? "send-active.svg" : "send-inactive.svg";
    };
    
    const autoResize = (input) => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 120) + "px";
    };

    [refs.msgLanding, refs.msgChat].forEach(input => {
        input.addEventListener("input", () => {
            updateBtn(input, input === refs.msgLanding ? refs.sendLanding : refs.sendChat);
            autoResize(input);
        });
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
                e.preventDefault();
                if (!state.isLoading) {
                    let text = input.value.trim();
                    if (text.length > 999) text = text.substring(0, 999);
                    if (text) {
                        input.value = "";
                        updateBtn(input, input === refs.msgLanding ? refs.sendLanding : refs.sendChat);
                        autoResize(input);
                        sendMessage(text);
                    }
                }
            }
        });
    });

    refs.sendLanding.addEventListener("click", () => {
        if (state.isLoading) return;
        let text = refs.msgLanding.value.trim();
        if (text.length > 999) text = text.substring(0, 999);
        if (text) {
            refs.msgLanding.value = "";
            sendMessage(text);
        }
    });

    refs.sendChat.addEventListener("click", () => {
        if (state.isLoading) return;
        let text = refs.msgChat.value.trim();
        if (text.length > 999) text = text.substring(0, 999);
        if (text) {
            refs.msgChat.value = "";
            sendMessage(text);
        }
    });
}