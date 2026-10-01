import { refs } from "./dom-refs.js";
export function showError(msg) {
    refs.errorBox.textContent = msg;
    refs.errorBox.style.display = "";
}
export function hideError() {
    refs.errorBox.style.display = "none";
}