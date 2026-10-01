import { state } from "./app-state.js";
import { refs } from "./dom-refs.js";

export function showLanding() {
    state.currentView = "landing";
    refs.landingEl.classList.remove("hidden");
    refs.chatViewEl.classList.add("hidden");
    if (window.innerWidth > 768) refs.msgLanding.focus();
}

export function showChatView() {
    state.currentView = "chat";
    refs.landingEl.classList.add("hidden");
    refs.chatViewEl.classList.remove("hidden");
    if (window.innerWidth > 768) refs.msgChat.focus();
}