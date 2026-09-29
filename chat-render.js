import { state } from "./app-state.js";
import { refs } from "./dom-refs.js";
import { buildUserMsg, buildAssistantMsg, buildTyping } from "./message-view.js";
import { formatContent } from "./markdown-render.js";
import { showChatView, showLanding } from "./view-switch.js";

export function renderChat() {
    if (state.messages.length === 0) {
        showLanding();
        refs.conversationEl.innerHTML = '';
        return;
    }
    showChatView();
    refs.conversationEl.innerHTML = '';
    state.messages.forEach((msg, i) => {
        if (msg.role === "user") {
            refs.conversationEl.appendChild(buildUserMsg(msg, i));
        } else {
            refs.conversationEl.appendChild(buildAssistantMsg(msg, i, i === state.messages.length - 1));
        }
    });
    scrollToBottom();
}

let renderFrame;
export function updateStreamingMessage(text) {
    if (renderFrame) cancelAnimationFrame(renderFrame);
    renderFrame = requestAnimationFrame(() => {
        const target = document.getElementById("streaming-target");
        if (target) {
            target.innerHTML = formatContent(text, true);
            scrollToBottom();
        }
    });
}

export function showTypingIndicator() {
    refs.conversationEl.appendChild(buildTyping());
    scrollToBottom();
}

export function removeTypingIndicator() {
    const el = document.getElementById("typing-indicator");
    if (el) el.remove();
}

export function scrollToBottom() {
    if (state.currentView === "chat") {
        refs.chatMessagesEl.scrollTop = refs.chatMessagesEl.scrollHeight;
    }
}
