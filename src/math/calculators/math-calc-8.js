import { refs } from "../../core/dom-refs.js";
import { evaluatePareto, PARETO_PRESETS } from "./math-calc-8-core.js";
import { renderTopFormula8, renderParetoCards } from "./math-calc-8-cards.js";
import { drawParetoCanvas, initParetoCanvasInteraction } from "./math-calc-8-canvas.js";

let isInitialized = false;

function parseDirection(val) {
    if (val === "min-max") return ["min", "max"];
    if (val === "max-max") return ["max", "max"];
    if (val === "max-min") return ["max", "min"];
    return ["min", "min"];
}

function getElements() {
    return {
        canvas: document.getElementById("math8-canvas"),
        f1a: document.getElementById("math8-in-f1a"),
        f2a: document.getElementById("math8-in-f2a"),
        f1b: document.getElementById("math8-in-f1b"),
        f2b: document.getElementById("math8-in-f2b"),
        dirSelect: document.getElementById("math8-in-dir"),
        presetsWrap: document.getElementById("math8-presets"),
        legacyA: refs.m8InA || document.getElementById("math8-in-a"),
        legacyB: refs.m8InB || document.getElementById("math8-in-b"),
        legacySteps: refs.m8Steps || document.getElementById("math8-steps-container")
    };
}

function syncInputs(els, vecA, vecB) {
    if (els.f1a) els.f1a.value = String(vecA[0]);
    if (els.f2a) els.f2a.value = String(vecA[1]);
    if (els.f1b) els.f1b.value = String(vecB[0]);
    if (els.f2b) els.f2b.value = String(vecB[1]);
    if (els.legacyA) els.legacyA.value = `${vecA[0]}, ${vecA[1]}`;
    if (els.legacyB) els.legacyB.value = `${vecB[0]}, ${vecB[1]}`;
}

export function calculateMath8() {
    const els = getElements();
    initParetoView();

    let a1 = els.f1a ? parseFloat(els.f1a.value) : 3;
    let a2 = els.f2a ? parseFloat(els.f2a.value) : 29;
    let b1 = els.f1b ? parseFloat(els.f1b.value) : 4;
    let b2 = els.f2b ? parseFloat(els.f2b.value) : 44;

    if (isNaN(a1) || isNaN(a2)) {
        if (els.legacyA && els.legacyA.value) {
            const parts = els.legacyA.value.split(",").map(s => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                a1 = parts[0];
                a2 = parts[1];
            }
        }
    }
    if (isNaN(b1) || isNaN(b2)) {
        if (els.legacyB && els.legacyB.value) {
            const parts = els.legacyB.value.split(",").map(s => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                b1 = parts[0];
                b2 = parts[1];
            }
        }
    }

    if (isNaN(a1)) a1 = 3;
    if (isNaN(a2)) a2 = 29;
    if (isNaN(b1)) b1 = 4;
    if (isNaN(b2)) b2 = 44;

    const vecA = [a1, a2];
    const vecB = [b1, b2];
    syncInputs(els, vecA, vecB);

    const dirVal = els.dirSelect ? els.dirSelect.value : "min-min";
    const directions = parseDirection(dirVal);

    const evalResult = evaluatePareto(vecA, vecB, directions);
    if (!evalResult) return;

    if (els.canvas) {
        drawParetoCanvas(els.canvas, vecA, vecB, directions);
    }
    renderParetoCards(evalResult);

    if (els.legacySteps) {
        els.legacySteps.textContent = evalResult.status;
    }
}

export function resetParetoInit() {
    isInitialized = false;
}

export function initParetoView() {
    const els = getElements();
    if (!els.canvas && !els.f1a) return;
    if (isInitialized && els.presetsWrap && els.presetsWrap.children.length > 0) return;
    isInitialized = true;

    renderTopFormula8();

    if (els.presetsWrap) {
        els.presetsWrap.innerHTML = "";
        PARETO_PRESETS.forEach((item) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "pareto-preset-btn";
            btn.textContent = item.label;
            btn.title = item.desc;
            btn.addEventListener("click", () => {
                syncInputs(els, item.a, item.b);
                calculateMath8();
            });
            els.presetsWrap.appendChild(btn);
        });
    }

    if (els.canvas) {
        initParetoCanvasInteraction(els.canvas, (which, nx, ny) => {
            if (which === "A") {
                if (els.f1a) els.f1a.value = String(nx);
                if (els.f2a) els.f2a.value = String(ny);
            } else if (which === "B") {
                if (els.f1b) els.f1b.value = String(nx);
                if (els.f2b) els.f2b.value = String(ny);
            }
            calculateMath8();
        });
    }

    [els.f1a, els.f2a, els.f1b, els.f2b].forEach((inp) => {
        if (!inp) return;
        inp.addEventListener("input", () => calculateMath8());
    });

    if (els.dirSelect) {
        els.dirSelect.addEventListener("change", () => calculateMath8());
    }

    if (els.legacyA) {
        els.legacyA.addEventListener("input", () => {
            const parts = els.legacyA.value.split(",").map(s => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                if (els.f1a) els.f1a.value = String(parts[0]);
                if (els.f2a) els.f2a.value = String(parts[1]);
                calculateMath8();
            }
        });
    }

    if (els.legacyB) {
        els.legacyB.addEventListener("input", () => {
            const parts = els.legacyB.value.split(",").map(s => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                if (els.f1b) els.f1b.value = String(parts[0]);
                if (els.f2b) els.f2b.value = String(parts[1]);
                calculateMath8();
            }
        });
    }
}
