import { refs } from "./dom-refs.js";
import { makeEl } from "./math-calc-1-tokens.js";
import { renderChromoTable } from "./math-calc-1-table.js";
import { renderParamLabels, renderChromoCards } from "./math-calc-1-cards.js";
import { renderChromoSpectrum } from "./math-calc-1-spectrum.js";
import { renderChromoInsights } from "./math-calc-1-insights.js";

const MAX_BITS = 16;
let currentBits = [];

function focusCell(idx) {
    const el = document.querySelector(`.chromo-cell-input[data-index="${idx}"]`);
    if (el) {
        el.focus();
        try {
            el.select();
        } catch (_) {}
    }
}

function handleInputKey(e, i) {
    if (e.key === "0" || e.key === "1") {
        e.preventDefault();
        if (i < currentBits.length) {
            currentBits[i] = e.key;
            calculateMath(Math.min(i + 1, currentBits.length < MAX_BITS ? currentBits.length : MAX_BITS - 1));
        } else if (currentBits.length < MAX_BITS) {
            currentBits.push(e.key);
            calculateMath(currentBits.length < MAX_BITS ? currentBits.length : MAX_BITS - 1);
        }
    } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const cur = i < currentBits.length ? currentBits[i] : "0";
        const next = cur === "1" ? "0" : "1";
        if (i < currentBits.length) {
            currentBits[i] = next;
        } else if (currentBits.length < MAX_BITS) {
            currentBits.push(next);
        }
        calculateMath(i);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
    } else if (e.key === "Backspace") {
        e.preventDefault();
        if (i < currentBits.length) {
            currentBits.splice(i, 1);
            calculateMath(Math.max(0, i - 1));
        } else if (currentBits.length > 0) {
            currentBits.pop();
            calculateMath(currentBits.length);
        }
    } else if (e.key === "Delete") {
        e.preventDefault();
        if (i < currentBits.length) {
            currentBits.splice(i, 1);
            calculateMath(Math.min(i, currentBits.length));
        }
    } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (i > 0) focusCell(i - 1);
    } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const limit = currentBits.length < MAX_BITS ? currentBits.length : MAX_BITS - 1;
        if (i < limit) focusCell(i + 1);
    } else if (e.key === "Tab") {
        return;
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
    }
}

function handleInputChange(input, i) {
    const val = input.value;
    const last = val.slice(-1);
    if (last === "0" || last === "1") {
        if (i < currentBits.length) {
            currentBits[i] = last;
            calculateMath(i);
        } else if (currentBits.length < MAX_BITS) {
            currentBits.push(last);
            calculateMath(currentBits.length < MAX_BITS ? currentBits.length : MAX_BITS - 1);
        }
    } else if (val === "" && i < currentBits.length) {
        currentBits.splice(i, 1);
        calculateMath(Math.max(0, i - 1));
    } else {
        input.value = i < currentBits.length ? currentBits[i] : "";
    }
}

function handlePaste(e) {
    e.preventDefault();
    const clip = (e.clipboardData || window.clipboardData)?.getData("text") || "";
    const clean = clip.replace(/[^01]/g, "").slice(0, MAX_BITS);
    if (clean.length > 0) {
        currentBits = clean.split("");
        calculateMath(currentBits.length < MAX_BITS ? currentBits.length : MAX_BITS - 1);
    }
}

export function initChromoView() {
    currentBits = [];
    if (refs.inXmin) refs.inXmin.value = "";
    if (refs.inXmax) refs.inXmax.value = "";
    calculateMath(0);
}

export function calculateMath(focusIdx) {
    if (typeof katex === "undefined") return;
    renderParamLabels();

    const n = currentBits.length;
    const rawXmin = refs.inXmin ? refs.inXmin.value.trim() : "";
    const rawXmax = refs.inXmax ? refs.inXmax.value.trim() : "";
    const xMin = rawXmin !== "" && !isNaN(parseFloat(rawXmin)) ? parseFloat(rawXmin) : null;
    const xMax = rawXmax !== "" && !isNaN(parseFloat(rawXmax)) ? parseFloat(rawXmax) : null;

    const powers = [];
    const cleans = [];
    let d = 0;

    for (let i = 0; i < n; i++) {
        const bit = parseInt(currentBits[i], 10);
        const exp = n - 1 - i;
        const pVal = Math.pow(2, exp);
        const cleanVal = pVal * bit;
        powers.push({ exp, pVal });
        cleans.push(cleanVal);
        d += cleanVal;
    }

    const container = document.getElementById("chromo-diagram-container");
    if (container) {
        const row1Cells = [];
        const cellCount = n < MAX_BITS ? n + 1 : MAX_BITS;
        for (let i = 0; i < cellCount; i++) {
            const input = makeEl("input", "chromo-cell chromo-cell-input");
            input.type = "text";
            input.maxLength = 1;
            input.setAttribute("inputmode", "numeric");
            input.setAttribute("autocomplete", "off");
            input.setAttribute("spellcheck", "false");
            input.setAttribute("data-index", String(i));
            input.setAttribute("aria-label", `Gen ${i + 1}`);
            input.value = i < n ? currentBits[i] : "";
            input.addEventListener("keydown", (e) => handleInputKey(e, i));
            input.addEventListener("input", () => handleInputChange(input, i));
            input.addEventListener("paste", handlePaste);
            input.addEventListener("focus", () => {
                try {
                    input.select();
                } catch (_) {}
            });
            row1Cells.push(input);
        }
        renderChromoTable(container, n, currentBits, powers, cleans, d, row1Cells, MAX_BITS);
    }

    renderChromoCards(n, d, xMin, xMax, powers);
    renderChromoSpectrum(n, d, xMin, xMax);
    renderChromoInsights(n, d, xMin, xMax, currentBits);

    if (typeof focusIdx === "number") {
        requestAnimationFrame(() => focusCell(focusIdx));
    }
}
