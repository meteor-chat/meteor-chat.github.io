import { state } from "./app-state.js";
import { refs, getActiveSendBtn } from "./dom-refs.js";
import { callChatAPI } from "./api-client.js";
import { renderChat, showTypingIndicator, removeTypingIndicator, showThinking, removeThinking, updateStreamingMessage, scrollToBottom } from "./chat-render.js";
import { showError, hideError } from "./error-view.js";
import { exitEditMode } from "./edit-mode.js";
import { stripThinkTags } from "./text-utils.js";

export function stopGeneration() {
    if (state.abortController) {
        state.abortController.abort();
    }
}

function showContinueButton(label = "▶ Lanjutkan") {
    const btn = document.createElement("button");
    btn.className = "continue-btn";
    btn.id = "continue-btn";
    btn.textContent = label;
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
        refs.stopBtn.classList.remove("hidden");
        refs.sendChat.classList.add("hidden");
    }

    const prevContinue = document.getElementById("continue-btn");
    if (prevContinue) prevContinue.remove();

    const originalEditIndex = state.editIndex;
    let backupMessages = null;
    if (originalEditIndex !== null) {
        backupMessages = [...state.messages];
        state.messages = state.messages.slice(0, originalEditIndex);
        exitEditMode();
    }

    let content = text;
    state.messages.push({ role: "user", content });
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
            if (!result.text) throw new Error("Pesan kosong dari provider.");
            state.messages.push({ role: "assistant", content: result.text });
        } else {
            state.messages[state.messages.length - 1].content = result.text;
        }
        state.isLoading = false;
        renderChat();

        if (result.finishReason !== "stop") {
            const isLength = result.finishReason === "length";
            showContinueButton(isLength ? "▶ Lanjutkan (Batas tercapai)" : "▶ Coba Lanjutkan (Terputus)");
        }
    } catch (err) {
        removeThinking();
        const restoreState = () => {
            if (backupMessages) {
                state.messages = backupMessages;
                state.editIndex = originalEditIndex;
                refs.cancelBtn.classList.remove("hidden");
                refs.editNotice.classList.remove("hidden");
                refs.msgChat.value = text;
            } else {
                if (state.messages.length && state.messages[state.messages.length - 1].role === "assistant") state.messages.pop();
                if (state.messages.length && state.messages[state.messages.length - 1].role === "user") state.messages.pop();
                if (state.messages.length === 0) {
                    refs.msgLanding.value = text;
                } else {
                    refs.msgChat.value = text;
                }
            }
        };

        if (err.name === "AbortError") {
            const lastMsg = state.messages[state.messages.length - 1];
            if (lastMsg?.role === "assistant" && lastMsg.content) {
                lastMsg.content = stripThinkTags(lastMsg.content);
                if (!lastMsg.content) {
                    restoreState();
                }
            } else {
                restoreState();
            }
        } else {
            showError(err.message);
            restoreState();
        }
        state.isLoading = false;
        renderChat();
    } finally {
        state.isLoading = false;
        state.abortController = null;
        refs.sendChat.disabled = false;
        refs.sendLanding.disabled = false;
        refs.msgChat.readOnly = false;

        if (refs.stopBtn) {
            refs.stopBtn.classList.add("hidden");
            refs.sendChat.classList.remove("hidden");
        }
        if (window.innerWidth > 768) refs.msgChat.focus();
    }
}