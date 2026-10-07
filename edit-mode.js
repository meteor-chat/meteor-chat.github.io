import { state } from "./app-state.js";
import { refs } from "./dom-refs.js";
import { hideError } from "./error-view.js";
export function startEdit(index) {
    if (state.isLoading) return;
    state.editIndex = index;
    const text = state.messages[index].content;
    refs.msgChat.value = text;
    refs.cancelBtn.classList.remove("hidden");
    refs.editNotice.classList.remove("hidden");
    if (window.innerWidth > 768) refs.msgChat.focus();
    hideError();
}
export function cancelEdit() {
    exitEditMode();
    refs.msgChat.value = "";
    hideError();
}
export function exitEditMode() {
    state.editIndex = null;
    refs.cancelBtn.classList.add("hidden");
    refs.editNotice.classList.add("hidden");
}