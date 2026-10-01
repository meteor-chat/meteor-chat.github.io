import { refs } from "./dom-refs.js";
export function showError(msg) {
    refs.errorBox.textContent = msg;
    refs.errorBox.classList.remove("hidden");
}
export function hideError() {
    refs.errorBox.classList.add("hidden");
}