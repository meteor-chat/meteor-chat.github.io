import { state } from "./app-state.js";
import { refs } from "./dom-refs.js";
import { buildUserMsg, buildAssistantMsg, buildTyping, buildThinking } from "./message-view.js";
import { formatContent } from "./markdown-render.js";
import { showChatView, showLanding } from "./view-switch.js";

function isAtBottom() {
    if (state.currentView !== "chat") return false;
    const { scrollTop, scrollHeight, clientHeight } = refs.chatMessagesEl;
    return scrollHeight - scrollTop - clientHeight < 50;
}

let lastRenderedCount = 0;

export function renderChat() {
    if (state.messages.length === 0) {
        showLanding();
        refs.conversationEl.innerHTML = "";
        lastRenderedCount = 0;
        return;
    }
    showChatView();
    const atBottom = isAtBottom();
    if (state.messages.length < lastRenderedCount) {
        refs.conversationEl.innerHTML = "";
        lastRenderedCount = 0;
    }
    const wasNewMessageAdded = state.messages.length > lastRenderedCount;
    for (let i = lastRenderedCount; i < state.messages.length; i++) {
        const msg = state.messages[i];
        if (msg.role === "user") {
            refs.conversationEl.appendChild(buildUserMsg(msg, i));
        } else {
            refs.conversationEl.appendChild(buildAssistantMsg(msg, i, i === state.messages.length - 1));
        }
    }
    lastRenderedCount = state.messages.length;
    if (atBottom || wasNewMessageAdded) {
        scrollToBottom();
    }
}

let pendingStreamingText = "";
let rafStreamingId = null;

function renderStreamingFrame() {
    rafStreamingId = null;
    const target = document.getElementById("streaming-target");
    if (target && pendingStreamingText) {
        const atBottom = isAtBottom();
        target.innerHTML = formatContent(pendingStreamingText, true);
        if (atBottom) scrollToBottom();
    }
    state.isStreamingChunk = false;
}

export function updateStreamingMessage(text) {
    pendingStreamingText = text;
    state.isStreamingChunk = true;
    if (rafStreamingId === null) {
        rafStreamingId = requestAnimationFrame(renderStreamingFrame);
    }
}

export function flushStreamingMessage() {
    if (rafStreamingId !== null) {
        cancelAnimationFrame(rafStreamingId);
        renderStreamingFrame();
    }
}

export function showTypingIndicator() {
    refs.conversationEl.appendChild(buildTyping());
    scrollToBottom();
}

export function removeTypingIndicator() {
    const el = document.getElementById("typing-indicator");
    if (el) el.remove();
}

export function showThinking() {
    refs.conversationEl.appendChild(buildThinking());
    scrollToBottom();
}

export function removeThinking() {
    const el = document.getElementById("thinking-indicator");
    if (el) el.remove();
}

export function scrollToBottom() {
    if (state.currentView === "chat") {
        refs.chatMessagesEl.scrollTop = refs.chatMessagesEl.scrollHeight;
    }
}