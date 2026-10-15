import { refs } from "./dom-refs.js";
import {
    makeEl,
    makeArrowRow,
    makeCellRow,
    createBraceSvg,
    renderParamLabels,
    renderChromoCards
} from "./math-calc-1-dom.js";

const MAX_BITS = 10;
let currentBits = [];

function focusCell(idx) {
    const el = document.querySelector(`.chromo-cell-input[data-index="${idx}"]`);
    if (el) {
        el.focus();
        el.select();
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
    } else if (e.key === " ") {
        e.preventDefault();
        if (i < currentBits.length) {
            currentBits[i] = currentBits[i] === "1" ? "0" : "1";
            calculateMath(i);
        }
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
            calculateMath(Math.min(i + 1, currentBits.length < MAX_BITS ? currentBits.length : MAX_BITS - 1));
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
        container.textContent = "";
        const table = makeEl("div", "chromo-table");

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
            input.addEventListener("focus", () => input.select());
            row1Cells.push(input);
        }
        table.appendChild(makeCellRow("kromosom biner →", row1Cells));

        if (n > 0) {
            table.appendChild(makeArrowRow(n));

            const row2Cells = [];
            for (let i = 0; i < n; i++) {
                const cell = makeEl("div", "chromo-cell");
                katex.render(String(i + 1), cell, { throwOnError: false });
                row2Cells.push(cell);
            }
            const nTag = makeEl("div", n < MAX_BITS ? "chromo-n-tag chromo-n-tag-offset" : "chromo-n-tag");
            nTag.appendChild(makeEl("span", "chromo-n-arrow", "→ "));
            const nMath = makeEl("span", "chromo-n-math");
            katex.render(`n = \\htmlClass{chromo-token-n}{${n}}`, nMath, { throwOnError: false, trust: true });
            nTag.appendChild(nMath);
            nTag.addEventListener("mouseenter", () => {
                document.querySelectorAll(".chromo-token-n").forEach((el) => el.classList.add("chromo-glow"));
            });
            nTag.addEventListener("mouseleave", () => {
                document.querySelectorAll(".chromo-token-n").forEach((el) => el.classList.remove("chromo-glow"));
            });
            table.appendChild(makeCellRow("posisi gen (i) →", row2Cells, nTag));
            table.appendChild(makeArrowRow(n));

            const rowFormulaCells = [];
            for (let i = 0; i < n; i++) {
                const cell = makeEl("div", "chromo-cell");
                katex.render(`2^{\\htmlClass{chromo-token-n}{${n}}-${i + 1}}`, cell, { throwOnError: false, trust: true });
                rowFormulaCells.push(cell);
            }
            table.appendChild(makeCellRow("rumus bobot 2^(n-i) →", rowFormulaCells));
            table.appendChild(makeArrowRow(n));

            const row3Cells = [];
            for (let i = 0; i < n; i++) {
                const cell = makeEl("div", "chromo-cell");
                katex.render(`2^{${powers[i].exp}}`, cell, { throwOnError: false });
                row3Cells.push(cell);
            }
            table.appendChild(makeCellRow("bobot biner (2^p) →", row3Cells));
            table.appendChild(makeArrowRow(n));

            const row4Cells = powers.map((p) => {
                const cell = makeEl("div", "chromo-cell");
                katex.render(String(p.pVal), cell, { throwOnError: false });
                return cell;
            });
            table.appendChild(makeCellRow("nilai bobot →", row4Cells));
            table.appendChild(makeArrowRow(n));

            const row5Cells = powers.map((p, idx) => {
                let fitClass = "";
                if (p.pVal >= 10000) fitClass = " chromo-cell-fit-xs";
                else if (p.pVal >= 1000) fitClass = " chromo-cell-fit-sm";
                else if (p.pVal >= 100) fitClass = " chromo-cell-fit-md";
                const cell = makeEl("div", `chromo-cell chromo-cell-calc${fitClass}`);
                const bit = currentBits[idx];
                katex.render(`${p.pVal} \\times ${bit}`, cell, { throwOnError: false });
                return cell;
            });
            table.appendChild(makeCellRow("perkalian bobot × gen →", row5Cells));
            table.appendChild(makeArrowRow(n));

            const row6Cells = cleans.map((c) => {
                const cell = makeEl("div", "chromo-cell");
                katex.render(String(c), cell, { throwOnError: false });
                return cell;
            });
            table.appendChild(makeCellRow("nilai desimal gen →", row6Cells));

            const cellBlockWidth = n * 56 - 8;

            const sumRow = makeEl("div", "chromo-row");
            sumRow.appendChild(makeEl("div", "chromo-row-label", "penjumlahan nilai desimal →"));
            const sumContent = makeEl("div", "chromo-sum-content");
            katex.render(cleans.join(" + "), sumContent, { throwOnError: false });
            sumContent.style.width = `${cellBlockWidth}px`;
            sumRow.appendChild(sumContent);
            table.appendChild(sumRow);

            const braceRow = makeEl("div", "chromo-brace-row");
            braceRow.appendChild(makeEl("div", "chromo-arrow-label-spacer"));
            const braceContent = makeEl("div", "chromo-brace-content");
            braceContent.style.width = `${cellBlockWidth}px`;
            braceContent.appendChild(createBraceSvg(cellBlockWidth));
            braceRow.appendChild(braceContent);
            table.appendChild(braceRow);

            const finalRow = makeEl("div", "chromo-row");
            finalRow.appendChild(makeEl("div", "chromo-row-label", "nilai desimal (d) →"));
            const finalContent = makeEl("div", "chromo-final-content");
            finalContent.style.width = `${cellBlockWidth}px`;
            const finalMath = makeEl("span", "chromo-final-math");
            katex.render(`d\\text{ (desimal)} = \\htmlClass{chromo-token-d}{${d}}`, finalMath, { throwOnError: false, trust: true });
            finalContent.appendChild(finalMath);
            finalRow.appendChild(finalContent);
            finalRow.addEventListener("mouseenter", () => {
                document.querySelectorAll(".chromo-token-d").forEach((el) => el.classList.add("chromo-glow"));
            });
            finalRow.addEventListener("mouseleave", () => {
                document.querySelectorAll(".chromo-token-d").forEach((el) => el.classList.remove("chromo-glow"));
            });
            table.appendChild(finalRow);
        }

        container.appendChild(table);
    }

    renderChromoCards(n, d, xMin, xMax, powers);

    if (typeof focusIdx === "number") {
        requestAnimationFrame(() => focusCell(focusIdx));
    }
}
