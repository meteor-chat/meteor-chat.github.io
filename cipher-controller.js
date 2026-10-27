import { initCipherWheel, setWheelShift } from "./cipher-wheel.js?v=1";
import { caesarEncrypt, caesarDecrypt, caesarRot13, generateBruteForce, normalizeShift } from "./cipher-logic.js?v=1";

let currentShift = 3;
let currentMode = "encrypt";
let currentView = "wheel";

const canvasWheel = document.getElementById("cipher-wheel-canvas");
const sliderShift = document.getElementById("slider-shift");
const shiftDisplay = document.getElementById("shift-display");
const btnShiftDec = document.getElementById("btn-shift-dec");
const btnShiftInc = document.getElementById("btn-shift-inc");
const btnRot13 = document.getElementById("btn-rot13");

const btnModeEncrypt = document.getElementById("btn-mode-encrypt");
const btnModeDecrypt = document.getElementById("btn-mode-decrypt");

const btnViewWheel = document.getElementById("btn-view-wheel");
const btnViewBrute = document.getElementById("btn-view-brute");
const viewWheelWrapper = document.getElementById("view-wheel-wrapper");
const viewBruteWrapper = document.getElementById("view-brute-wrapper");

const inputCipher = document.getElementById("input-cipher-text");
const outputCipher = document.getElementById("output-cipher-text");
const btnCopyOutput = document.getElementById("btn-copy-output");
const bruteListEl = document.getElementById("brute-force-list");
const btnLeanVerify = document.getElementById("btn-lean-verify");

function updateShift(newShift) {
    currentShift = normalizeShift(newShift);
    if (sliderShift) sliderShift.value = currentShift;
    if (shiftDisplay) shiftDisplay.textContent = currentShift;
    setWheelShift(currentShift, true);
    processCipher();
    if (currentView === "brute") renderBruteForce();
}

function processCipher() {
    if (!inputCipher || !outputCipher) return;
    const text = inputCipher.value;
    if (currentMode === "encrypt") {
        outputCipher.value = caesarEncrypt(text, currentShift);
    } else {
        outputCipher.value = caesarDecrypt(text, currentShift);
    }
}

function renderBruteForce() {
    if (!bruteListEl || !inputCipher) return;
    const text = inputCipher.value;
    bruteListEl.textContent = "";

    if (!text.trim()) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "cipher-empty-msg";
        emptyMsg.textContent = "Ketik teks di atas untuk melihat 26 rotasi dekripsi simultan.";
        bruteListEl.appendChild(emptyMsg);
        return;
    }

    const rows = generateBruteForce(text);
    rows.forEach((row) => {
        const item = document.createElement("div");
        item.className = "brute-item";
        if (row.shift === currentShift) {
            item.classList.add("highlight");
        }

        const shiftBadge = document.createElement("span");
        shiftBadge.className = "brute-shift-badge";
        shiftBadge.textContent = `Shift ${row.shift}`;

        const textSpan = document.createElement("span");
        textSpan.className = "brute-text";
        textSpan.textContent = row.text;

        item.appendChild(shiftBadge);
        item.appendChild(textSpan);

        item.addEventListener("click", () => {
            updateShift(row.shift);
        });

        bruteListEl.appendChild(item);
    });
}

function setMode(mode) {
    currentMode = mode;
    if (btnModeEncrypt) btnModeEncrypt.classList.toggle("active", mode === "encrypt");
    if (btnModeDecrypt) btnModeDecrypt.classList.toggle("active", mode === "decrypt");
    processCipher();
}

function setView(view) {
    currentView = view;
    if (btnViewWheel) btnViewWheel.classList.toggle("active", view === "wheel");
    if (btnViewBrute) btnViewBrute.classList.toggle("active", view === "brute");
    if (viewWheelWrapper) viewWheelWrapper.classList.toggle("cipher-hidden", view !== "wheel");
    if (viewBruteWrapper) viewBruteWrapper.classList.toggle("cipher-hidden", view !== "brute");
    if (view === "brute") {
        renderBruteForce();
    }
}

if (sliderShift) {
    sliderShift.addEventListener("input", (e) => {
        updateShift(e.target.value);
    });
}
if (btnShiftDec) {
    btnShiftDec.addEventListener("click", () => {
        updateShift(currentShift - 1);
    });
}
if (btnShiftInc) {
    btnShiftInc.addEventListener("click", () => {
        updateShift(currentShift + 1);
    });
}
if (btnRot13) {
    btnRot13.addEventListener("click", () => {
        updateShift(13);
    });
}

if (btnModeEncrypt) btnModeEncrypt.addEventListener("click", () => setMode("encrypt"));
if (btnModeDecrypt) btnModeDecrypt.addEventListener("click", () => setMode("decrypt"));

if (btnViewWheel) btnViewWheel.addEventListener("click", () => setView("wheel"));
if (btnViewBrute) btnViewBrute.addEventListener("click", () => setView("brute"));

if (inputCipher) {
    inputCipher.addEventListener("input", () => {
        processCipher();
        if (currentView === "brute") renderBruteForce();
    });
}

if (btnCopyOutput) {
    btnCopyOutput.addEventListener("click", () => {
        if (!outputCipher || !outputCipher.value) return;
        navigator.clipboard.writeText(outputCipher.value).then(() => {
            const originalText = btnCopyOutput.textContent;
            btnCopyOutput.textContent = "Tersalin!";
            setTimeout(() => {
                btnCopyOutput.textContent = originalText;
            }, 1800);
        }).catch(() => {});
    });
}

if (btnLeanVerify) {
    btnLeanVerify.addEventListener("click", () => {
        import("./cipher-lean-modal.js?v=1")
            .then((m) => m.openLeanCipherModal())
            .catch(() => {});
    });
}

if (canvasWheel) {
    initCipherWheel(canvasWheel);
    setWheelShift(currentShift, false);
}

processCipher();
