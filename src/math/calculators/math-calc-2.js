import { refs } from "../../core/dom-refs.js";
import { renderParamLabels2, renderObjectiveCards } from "./math-calc-2-cards.js";
import { bindObjTokenHover } from "./math-calc-2-tokens.js";
import { drawObjectiveLandscape, clearObjectiveLandscape } from "../visuals/math-visual-2.js";

export function calculateMath2() {
    if (!refs.m2InX1 || typeof katex === "undefined") return;
    initObjEvents();

    const x1Str = refs.m2InX1.value || "2";
    const x2Str = refs.m2InX2.value || "3";
    const x1 = parseFloat(x1Str);
    const x2 = parseFloat(x2Str);

    const presetSelect = document.getElementById("obj-preset-select");
    const preset = presetSelect ? presetSelect.value : "default";

    clearObjectiveLandscape();
    if (isNaN(x1) || isNaN(x2)) return;

    renderObjectiveCards(x1, x2, preset);
    drawObjectiveLandscape(x1, x2, preset);
}

function handleCanvasInteraction(e) {
    const canvas = document.getElementById("math2-canvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return;

    const px = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const py = Math.min(Math.max(clientY - rect.top, 0), rect.height);

    const currentX1 = parseFloat(refs.m2InX1?.value || "2");
    const currentX2 = parseFloat(refs.m2InX2?.value || "3");
    const span = Math.max(Math.max(Math.abs(currentX1), Math.abs(currentX2)) * 1.4, 4.5);

    const normX = px / rect.width;
    const normY = py / rect.height;
    const worldX1 = -span + normX * (span * 2);
    const worldX2 = span - normY * (span * 2);

    if (refs.m2InX1) refs.m2InX1.value = worldX1.toFixed(1);
    if (refs.m2InX2) refs.m2InX2.value = worldX2.toFixed(1);

    calculateMath2();
}

function initObjEvents() {
    const form = document.getElementById("math-calc-form-2");
    if (!form || form.dataset.objInit === "true") return;
    form.dataset.objInit = "true";

    renderParamLabels2();
    bindObjTokenHover();

    const presetSelect = document.getElementById("obj-preset-select");
    presetSelect?.addEventListener("change", () => {
        calculateMath2();
    });

    const btnImport = document.getElementById("btn-obj-import-chromo");
    btnImport?.addEventListener("click", () => {
        const chromoRes = document.getElementById("chromo-card-step6");
        let foundVal = null;
        if (chromoRes) {
            const match = chromoRes.textContent.match(/x\s*≈\s*([-\d.]+)/);
            if (match && match[1]) foundVal = parseFloat(match[1]);
        }
        if (foundVal === null) {
            try {
                const saved = typeof window !== "undefined" && window.sessionStorage ? window.sessionStorage.getItem("last_decoded_chromo_x") : null;
                if (saved) foundVal = parseFloat(saved);
            } catch {
                foundVal = null;
            }
        }
        if (foundVal !== null && !isNaN(foundVal)) {
            if (refs.m2InX1) refs.m2InX1.value = String(foundVal);
            calculateMath2();
        }
    });

    const canvas = document.getElementById("math2-canvas");
    if (!canvas) return;

    let isDragging = false;
    canvas.addEventListener("pointerdown", (e) => {
        isDragging = true;
        try {
            canvas.setPointerCapture(e.pointerId);
        } catch {}
        handleCanvasInteraction(e);
    });

    canvas.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        handleCanvasInteraction(e);
    });

    const stopDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;
        try {
            canvas.releasePointerCapture(e.pointerId);
        } catch {}
    };

    canvas.addEventListener("pointerup", stopDrag);
    canvas.addEventListener("pointercancel", stopDrag);
}
