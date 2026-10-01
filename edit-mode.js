import { state } from "./app-state.js";
import { refs } from "./dom-refs.js";
import { hideError } from "./error-view.js";
import { clearImagePreview } from "./image-upload.js";

export function startEdit(index) {
    if (state.isLoading) return;
    state.editIndex = index;
    const item = state.messages[index].content;
    let text = "";
    let imgUrl = null;

    if (Array.isArray(item)) {
        text = item.find(p => p.type === "text")?.text || "";
        const imgPart = item.find(p => p.type === "image_url");
        if (imgPart) imgUrl = imgPart.image_url.url;
    } else {
        text = item;
    }

    refs.msgChat.value = text;
    refs.cancelBtn.classList.remove("hidden");
    refs.editNotice.classList.remove("hidden");
    if (window.innerWidth > 768) refs.msgChat.focus();
    hideError();

    if (imgUrl) {
        state.currentImageBase64 = imgUrl;
        const wrap = refs.chatViewEl.querySelector(".input-wrap");
        wrap.querySelector(".image-preview").src = imgUrl;
        wrap.querySelector(".image-preview-container").classList.remove("hidden");
    } else {
        clearImagePreview();
    }
}

export function cancelEdit() {
    exitEditMode();
    refs.msgChat.value = "";
    hideError();
    clearImagePreview();
}

export function exitEditMode() {
    state.editIndex = null;
    refs.cancelBtn.classList.add("hidden");
    refs.editNotice.classList.add("hidden");
}