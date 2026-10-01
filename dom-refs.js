import { state } from "./app-state.js";
export const $ = (id) => document.getElementById(id);
export const refs = {
    landingEl: $("landing"),
    chatViewEl: $("chat-view"),
    msgLanding: $("message-landing"),
    msgChat: $("message-chat"),
    sendLanding: $("send-landing"),
    sendChat: $("send-chat"),
    cancelBtn: $("cancel-btn"),
    editNotice: $("edit-notice"),
    errorBox: $("error-box"),
    conversationEl: $("conversation"),
    chatMessagesEl: $("chat-messages"),
    stopBtn: $("stop-chat")
};
export const getActiveInput = () => state.currentView === "landing" ? refs.msgLanding : refs.msgChat;
export const getActiveSendBtn = () => state.currentView === "landing" ? refs.sendLanding : refs.sendChat;