import { state } from "./app-state.js";
import { refs } from "./dom-refs.js";

export function showLanding() {
    if (document.activeElement) document.activeElement.blur();
    state.currentView = "landing";
    refs.landingEl.style.display = "";
    refs.chatViewEl.style.display = "none";
    if (window.innerWidth > 768) refs.msgLanding.focus();
}

export function showChatView() {
    if (document.activeElement) document.activeElement.blur();
    state.currentView = "chat";
    refs.landingEl.style.display = "none";
    refs.chatViewEl.style.display = "flex";
    if (window.innerWidth > 768) refs.msgChat.focus();
}