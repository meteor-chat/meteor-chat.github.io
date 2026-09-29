import { state } from "./app-state.js";
import { refs, getActiveSendBtn } from "./dom-refs.js";
import { callChatAPI } from "./api-client.js";
import { renderChat, showTypingIndicator, removeTypingIndicator, updateStreamingMessage } from "./chat-render.js";
import { showError, hideError } from "./error-view.js";
import { exitEditMode } from "./edit-mode.js";
import { clearImagePreview } from "./image-upload.js";

export async function sendMessage(text) {
    if ([...text].length > state.config.max_message) {
        showError(`Pesan maksimal ${state.config.max_message} karakter.`);
        return;
    }
    hideError();
    state.isLoading = true;
    getActiveSendBtn().disabled = true;

    if (state.editIndex !== null) {
        state.messages = state.messages.slice(0, state.editIndex);
        exitEditMode();
    }

    let content = text;
    if (state.currentImageBase64) {
        content = [{ type: "text", text: text || " " }, { type: "image_url", image_url: { url: state.currentImageBase64 } }];
    }
    state.messages.push({ role: "user", content });
    clearImagePreview();
    renderChat();
    showTypingIndicator();
    refs.msgChat.readOnly = true;

    try {
        state.messages.push({ role: "assistant", content: "" });
        removeTypingIndicator();
        renderChat();
        
        const fullText = await callChatAPI(state.messages.slice(0, -1), (currentText) => {
            state.messages[state.messages.length - 1].content = currentText;
            updateStreamingMessage(currentText);
        });
        state.messages[state.messages.length - 1].content = fullText;
        renderChat();
    } catch (err) {
        if (err.name !== "AbortError") showError(err.message);
        if (state.messages.length && state.messages[state.messages.length - 1].role === "assistant") state.messages.pop();
        if (state.messages.length && state.messages[state.messages.length - 1].role === "user") state.messages.pop();
        
        if (state.messages.length === 0) {
            refs.msgLanding.value = text;
        } else {
            refs.msgChat.value = text;
        }
        renderChat();
    } finally {
        state.isLoading = false;
        state.abortController = null;
        refs.sendChat.disabled = false;
        refs.sendLanding.disabled = false;
        refs.msgChat.readOnly = false;
        if (window.innerWidth > 768) refs.msgChat.focus();
    }
}
