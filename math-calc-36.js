import { refs } from "./dom-refs.js";
import { drawThermometers, clearVisual36 } from "./math-visual-36.js";
import { formatMax3 } from "./math-format.js";

let activeUnit = "c";
let eventsBound = false;

function renderKatexMath(tex) {
    if (typeof katex !== "undefined" && katex.renderToString) {
        return katex.renderToString(tex, { throwOnError: false, displayMode: false });
    }
    return tex;
}

function buildStepHtml(sourceUnit, sourceVal, c, r, f, k) {
    const sValStr = formatMax3(sourceVal);
    const cStr = formatMax3(c);
    const rStr = formatMax3(r);
    const fStr = formatMax3(f);
    const kStr = formatMax3(k);

    const unitLabels = {
        c: `Celcius (${sValStr} \u00B0C)`,
        r: `Reamur (${sValStr} \u00B0R)`,
        f: `Fahrenheit (${sValStr} \u00B0F)`,
        k: `Kelvin (${sValStr} K)`
    };

    let steps = [];

    if (sourceUnit === "c") {
        steps.push({
            target: "Reamur",
            tex: `R = \\frac{4}{5} \\cdot C = \\frac{4}{5} \\cdot ${sValStr} = ${rStr}^\\circ\\text{R}`
        });
        steps.push({
            target: "Fahrenheit",
            tex: `F = \\left(\\frac{9}{5} \\cdot C\\right) + 32 = \\left(\\frac{9}{5} \\cdot ${sValStr}\\right) + 32 = ${fStr}^\\circ\\text{F}`
        });
        steps.push({
            target: "Kelvin",
            tex: `K = C + 273.15 = ${sValStr} + 273.15 = ${kStr}\\text{ K}`
        });
    } else if (sourceUnit === "r") {
        steps.push({
            target: "Celcius",
            tex: `C = \\frac{5}{4} \\cdot R = \\frac{5}{4} \\cdot ${sValStr} = ${cStr}^\\circ\\text{C}`
        });
        steps.push({
            target: "Fahrenheit",
            tex: `F = \\left(\\frac{9}{4} \\cdot R\\right) + 32 = \\left(\\frac{9}{4} \\cdot ${sValStr}\\right) + 32 = ${fStr}^\\circ\\text{F}`
        });
        steps.push({
            target: "Kelvin",
            tex: `K = \\left(\\frac{5}{4} \\cdot R\\right) + 273.15 = ${cStr} + 273.15 = ${kStr}\\text{ K}`
        });
    } else if (sourceUnit === "f") {
        steps.push({
            target: "Celcius",
            tex: `C = \\frac{5}{9} \\cdot (F - 32) = \\frac{5}{9} \\cdot (${sValStr} - 32) = ${cStr}^\\circ\\text{C}`
        });
        steps.push({
            target: "Reamur",
            tex: `R = \\frac{4}{9} \\cdot (F - 32) = \\frac{4}{9} \\cdot (${sValStr} - 32) = ${rStr}^\\circ\\text{R}`
        });
        steps.push({
            target: "Kelvin",
            tex: `K = \\frac{5}{9} \\cdot (F - 32) + 273.15 = ${cStr} + 273.15 = ${kStr}\\text{ K}`
        });
    } else {
        steps.push({
            target: "Celcius",
            tex: `C = K - 273.15 = ${sValStr} - 273.15 = ${cStr}^\\circ\\text{C}`
        });
        steps.push({
            target: "Reamur",
            tex: `R = \\frac{4}{5} \\cdot (K - 273.15) = \\frac{4}{5} \\cdot ${cStr} = ${rStr}^\\circ\\text{R}`
        });
        steps.push({
            target: "Fahrenheit",
            tex: `F = \\left(\\frac{9}{5} \\cdot (K - 273.15)\\right) + 32 = \\left(\\frac{9}{5} \\cdot ${cStr}\\right) + 32 = ${fStr}^\\circ\\text{F}`
        });
    }

    let html = `<div class="math-step">`;
    html += `<div class="math-step-box math-step-selected">Basis Konversi: <strong>${unitLabels[sourceUnit]}</strong></div>`;
    steps.forEach((st) => {
        html += `<div class="math-step-box math-step-valid math-mt-15"><strong>Ke ${st.target}:</strong><br>${renderKatexMath(st.tex)}</div>`;
    });
    if (k < 0) {
        html += `<div class="math-step-box math-step-invalid math-mt-15">\u26A0\uFE0F <strong>Peringatan Fisika:</strong> Nilai ini berada di bawah 0 K (\u2212273.15 \u00B0C). Dalam termodinamika, 0 K adalah Nol Mutlak (Absolute Zero) dan suhu di bawahnya secara fisis tidak mungkin dicapai.</div>`;
    }
    html += `</div>`;
    return html;
}

export function calculateMath36() {
    const inC = refs.m36InC || document.getElementById("math36-in-c");
    const inR = refs.m36InR || document.getElementById("math36-in-r");
    const inF = refs.m36InF || document.getElementById("math36-in-f");
    const inK = refs.m36InK || document.getElementById("math36-in-k");
    const stepsBox = refs.m36Steps || document.getElementById("math36-steps-container");

    if (!inC || !inR || !inF || !inK) return;

    const focused = document.activeElement;
    if (focused === inC) activeUnit = "c";
    else if (focused === inR) activeUnit = "r";
    else if (focused === inF) activeUnit = "f";
    else if (focused === inK) activeUnit = "k";

    let activeInput = inC;
    if (activeUnit === "r") activeInput = inR;
    else if (activeUnit === "f") activeInput = inF;
    else if (activeUnit === "k") activeInput = inK;

    const raw = activeInput.value.trim();
    if (raw === "" || isNaN(Number(raw))) {
        clearVisual36();
        if (stepsBox) stepsBox.innerHTML = "";
        return;
    }

    const val = parseFloat(raw);
    let c = 0;
    if (activeUnit === "c") {
        c = val;
    } else if (activeUnit === "r") {
        c = val * 1.25;
    } else if (activeUnit === "f") {
        c = ((val - 32) * 5) / 9;
    } else if (activeUnit === "k") {
        c = val - 273.15;
    }

    const r = c * 0.8;
    const f = (c * 9) / 5 + 32;
    const k = c + 273.15;

    if (activeUnit !== "c") inC.value = formatMax3(c);
    if (activeUnit !== "r") inR.value = formatMax3(r);
    if (activeUnit !== "f") inF.value = formatMax3(f);
    if (activeUnit !== "k") inK.value = formatMax3(k);

    drawThermometers(c, r, f, k);

    if (stepsBox) {
        stepsBox.innerHTML = buildStepHtml(activeUnit, val, c, r, f, k);
    }
}

export function initMath36() {
    const inC = refs.m36InC || document.getElementById("math36-in-c");
    const inR = refs.m36InR || document.getElementById("math36-in-r");
    const inF = refs.m36InF || document.getElementById("math36-in-f");
    const inK = refs.m36InK || document.getElementById("math36-in-k");

    if (!eventsBound) {
        eventsBound = true;
        const formEl = document.getElementById("math-calc-form-36");
        if (formEl) {
            formEl.addEventListener("click", (e) => {
                const btn = e.target.closest(".phy-preset-btn");
                if (!btn) return;
                const cVal = btn.dataset.c;
                if (cVal !== undefined && inC) {
                    activeUnit = "c";
                    inC.value = cVal;
                    calculateMath36();
                }
            });
        }
        [
            { el: inC, unit: "c" },
            { el: inR, unit: "r" },
            { el: inF, unit: "f" },
            { el: inK, unit: "k" }
        ].forEach(({ el, unit }) => {
            if (!el) return;
            el.addEventListener("focus", () => {
                activeUnit = unit;
            });
            el.addEventListener("input", () => {
                activeUnit = unit;
                calculateMath36();
            });
        });
    }

    calculateMath36();
}
