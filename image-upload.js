import { state } from "./app-state.js";
import { refs } from "./dom-refs.js";
import { resizeImage } from "./image-resize.js";

export function setupImageUpload() {
    document.querySelectorAll(".input-wrap").forEach(wrap => {
        const fileInput = wrap.querySelector(".file-input");
        const uploadBtn = wrap.querySelector(".upload-btn");
        const previewContainer = wrap.querySelector(".image-preview-container");
        const previewImg = wrap.querySelector(".image-preview");
        const removeBtn = wrap.querySelector(".remove-image-btn");

        uploadBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0], previewContainer, previewImg);
            }
        });
        removeBtn.addEventListener("click", () => {
            state.currentImageBase64 = null;
            previewContainer.classList.add("hidden");
            fileInput.value = "";
        });
    });

    window.addEventListener("paste", (e) => {
        if (e.clipboardData && e.clipboardData.items) {
            for (const item of e.clipboardData.items) {
                if (item.type.indexOf("image") !== -1) {
                    const file = item.getAsFile();
                    if (!file) continue;
                    const wrap = state.currentView === "landing" ? refs.landingEl.querySelector(".input-wrap") : refs.chatViewEl.querySelector(".input-wrap");
                    processFile(file, wrap.querySelector(".image-preview-container"), wrap.querySelector(".image-preview"));
                    break;
                }
            }
        }
    });
}

function processFile(file, container, imgEl) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        resizeImage(e.target.result, (base64) => {
            state.currentImageBase64 = base64;
            if (imgEl && container) {
                imgEl.src = base64;
                container.classList.remove("hidden");
            }
        });
    };
    reader.onerror = () => console.warn("Read failed");
    reader.readAsDataURL(file);
}

export function clearImagePreview() {
    state.currentImageBase64 = null;
    document.querySelectorAll(".image-preview-container").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll(".file-input").forEach(el => el.value = "");
}