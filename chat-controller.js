import { state } from "./app-state.js";
import { refs, getActiveSendBtn } from "./dom-refs.js";
import { callChatAPI } from "./api-client.js";
import { renderChat, showTypingIndicator, removeTypingIndicator, showThinking, removeThinking, updateStreamingMessage, scrollToBottom } from "./chat-render.js";
import { showError, hideError } from "./error-view.js";
import { exitEditMode } from "./edit-mode.js";
import { clearImagePreview } from "./image-upload.js";
import { stripThinkTags } from "./api-client.js";

export function stopGeneration() {
    if (state.abortController) {
        state.abortController.abort();
    }
}

function showContinueButton() {
    const btn = document.createElement("button");
    btn.className = "continue-btn";
    btn.id = "continue-btn";
    btn.textContent = "▶ Lanjutkan";
    btn.addEventListener("click", () => {
        btn.remove();
        sendMessage("Lanjutkan dari titik terakhir.");
    });
    refs.conversationEl.appendChild(btn);
    scrollToBottom();
}

export async function sendMessage(text) {
    if ([...text].length > state.config.max_message) {
        showError(`Pesan maksimal ${state.config.max_message} karakter.`);
        return;
    }
    hideError();
    state.isLoading = true;
    getActiveSendBtn().disabled = true;

    
    if (refs.stopBtn) {
        refs.stopBtn.style.display = "";
        refs.sendChat.style.display = "none";
    }

    
    const prevContinue = document.getElementById("continue-btn");
    if (prevContinue) prevContinue.remove();

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
        let firstChunk = true;
        removeTypingIndicator();
        showThinking();

        const result = await callChatAPI(state.messages, (currentText) => {
            if (firstChunk && currentText) {
                firstChunk = false;
                removeThinking();
                state.messages.push({ role: "assistant", content: "" });
                renderChat();
            }
            if (!firstChunk) {
                state.messages[state.messages.length - 1].content = currentText;
                updateStreamingMessage(currentText);
            }
        });
        if (firstChunk) {
            removeThinking();
            state.messages.push({ role: "assistant", content: result.text });
        } else {
            state.messages[state.messages.length - 1].content = result.text;
        }
        state.isLoading = false;
        renderChat();

        
        if (result.finishReason === "length") {
            showContinueButton();
        }
    } catch (err) {
        removeThinking();
        if (err.name === "AbortError") {
            
            const lastMsg = state.messages[state.messages.length - 1];
            if (lastMsg?.role === "assistant" && lastMsg.content) {
                lastMsg.content = stripThinkTags(lastMsg.content);
                state.isLoading = false;
                renderChat();
            } else {
                
                if (lastMsg?.role === "assistant") state.messages.pop();
                if (state.messages.length && state.messages[state.messages.length - 1].role === "user") state.messages.pop();
                state.isLoading = false;
                renderChat();
            }
        } else {
            showError(err.message);
            if (state.messages.length && state.messages[state.messages.length - 1].role === "assistant") state.messages.pop();
            if (state.messages.length && state.messages[state.messages.length - 1].role === "user") state.messages.pop();

            if (state.messages.length === 0) {
                refs.msgLanding.value = text;
            } else {
                refs.msgChat.value = text;
            }
            state.currentImageBase64 = null;
            renderChat();
        }
    } finally {
        state.isLoading = false;
        state.abortController = null;
        refs.sendChat.disabled = false;
        refs.sendLanding.disabled = false;
        refs.msgChat.readOnly = false;
        
        if (refs.stopBtn) {
            refs.stopBtn.style.display = "none";
            refs.sendChat.style.display = "";
        }
        if (window.innerWidth > 768) refs.msgChat.focus();
    }
}