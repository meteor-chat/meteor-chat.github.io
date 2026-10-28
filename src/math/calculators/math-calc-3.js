import { refs } from "../../core/dom-refs.js";
import { renderParamLabels3, renderFitnessCards } from "./math-calc-3-cards.js";
import { bindFitTokenHover } from "./math-calc-3-tokens.js";
import { drawFitnessLandscape, clearFitnessLandscape } from "../visuals/math-visual-3.js";

export function calculateMath3() {
    if (!refs.m3InH || typeof katex === "undefined") return;
    initFitEvents();

    const hStr = refs.m3InH.value || "5";
    const aStr = refs.m3InA.value || "0.1";
    const h = parseFloat(hStr);
    const a = parseFloat(aStr);

    clearFitnessLandscape();
    if (isNaN(h) || isNaN(a)) return;

    renderFitnessCards(h, a);
    drawFitnessLandscape(h, a);
}

function handleCanvasInteraction(e) {
    const canvas = document.getElementById("math3-canvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (clientX === undefined) return;

    const px = Math.min(Math.max(clientX - rect.left, 0), rect.width);

    const currentH = parseFloat(refs.m3InH?.value || "5");
    const currentA = parseFloat(refs.m3InA?.value || "0.1");
    const asymptote = -currentA;
    const spanH = Math.max(Math.abs(currentH - asymptote) * 1.8, 6);
    const minH = asymptote - spanH;
    const maxH = asymptote + spanH;

    const normX = px / rect.width;
    const worldH = minH + normX * (maxH - minH);

    if (refs.m3InH) refs.m3InH.value = worldH.toFixed(1);
    calculateMath3();
}

function initFitEvents() {
    const form = document.getElementById("math-calc-form-3");
    if (!form || form.dataset.fitInit === "true") return;
    form.dataset.fitInit = "true";

    renderParamLabels3();
    bindFitTokenHover();

    const btnImport = document.getElementById("btn-fit-import-obj");
    btnImport?.addEventListener("click", () => {
        const objRes = document.getElementById("obj-card-step5");
        let foundVal = null;
        if (objRes) {
            const match = objRes.textContent.match(/h\s*≈\s*([-\d.]+)/);
            if (match && match[1]) foundVal = parseFloat(match[1]);
        }
        if (foundVal === null) {
            try {
                const saved = typeof window !== "undefined" && window.sessionStorage ? window.sessionStorage.getItem("last_evaluated_obj_h") : null;
                if (saved) foundVal = parseFloat(saved);
            } catch {
                foundVal = null;
            }
        }
        if (foundVal !== null && !isNaN(foundVal)) {
            if (refs.m3InH) refs.m3InH.value = String(foundVal);
            calculateMath3();
        }
    });

    const canvas = document.getElementById("math3-canvas");
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
