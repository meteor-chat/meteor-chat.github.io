import { refs } from "./dom-refs.js";
import {
    makeEl,
    makeArrowRow,
    makeCellRow,
    createBraceSvg,
    renderParamLabels,
    renderChromoCards
} from "./math-calc-1-dom.js";

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
            calculateMath(i + 1);
        } else if (currentBits.length < 16) {
            currentBits.push(e.key);
            calculateMath(currentBits.length < 16 ? currentBits.length : 15);
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
        const limit = currentBits.length < 16 ? currentBits.length : 15;
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
            calculateMath(i + 1);
        } else if (currentBits.length < 16) {
            currentBits.push(last);
            calculateMath(currentBits.length < 16 ? currentBits.length : 15);
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
    const clean = clip.replace(/[^01]/g, "").slice(0, 16);
    if (clean.length > 0) {
        currentBits = clean.split("");
        calculateMath(currentBits.length < 16 ? currentBits.length : 15);
    }
}

export function initChromoView() {
    currentBits = [];
    if (refs.inXmin && !refs.inXmin.value) {
        refs.inXmin.value = "2";
    }
    if (refs.inXmax && !refs.inXmax.value) {
        refs.inXmax.value = "6";
    }
    calculateMath(0);
}

export function calculateMath(focusIdx) {
    if (typeof katex === "undefined") return;
    renderParamLabels();

    const n = currentBits.length;
    const xMinVal = refs.inXmin ? parseFloat(refs.inXmin.value || "2") : 2;
    const xMaxVal = refs.inXmax ? parseFloat(refs.inXmax.value || "6") : 6;
    const xMin = isNaN(xMinVal) ? 2 : xMinVal;
    const xMax = isNaN(xMaxVal) ? 6 : xMaxVal;

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
        const cellCount = n < 16 ? n + 1 : 16;
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
        table.appendChild(makeCellRow("kromosom biner kamu →", row1Cells));

        if (n > 0) {
            table.appendChild(makeArrowRow(n));

            const row2Cells = [];
            for (let i = 0; i < n; i++) {
                const cell = makeEl("div", "chromo-cell");
                katex.render(String(i + 1), cell, { throwOnError: false });
                row2Cells.push(cell);
            }
            const nTag = makeEl("div", n < 16 ? "chromo-n-tag chromo-n-tag-offset" : "chromo-n-tag");
            nTag.appendChild(makeEl("span", "chromo-n-arrow", "→ "));
            const nMath = makeEl("span", "chromo-n-math");
            katex.render(`n = ${n}`, nMath, { throwOnError: false });
            nTag.appendChild(nMath);
            table.appendChild(makeCellRow("posisi setiap gen →", row2Cells, nTag));
            table.appendChild(makeArrowRow(n));

            const row3Cells = [];
            for (let i = 0; i < n; i++) {
                const cell = makeEl("div", "chromo-cell");
                katex.render(`2^{${powers[i].exp}}`, cell, { throwOnError: false });
                row3Cells.push(cell);
            }
            table.appendChild(makeCellRow("proses konversi →", row3Cells));
            table.appendChild(makeArrowRow(n));

            const row4Cells = powers.map((p) => {
                const cell = makeEl("div", "chromo-cell");
                katex.render(String(p.pVal), cell, { throwOnError: false });
                return cell;
            });
            table.appendChild(makeCellRow("hasil kotor konversi →", row4Cells));
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
            table.appendChild(makeCellRow("hitung konversi →", row5Cells));
            table.appendChild(makeArrowRow(n));

            const row6Cells = cleans.map((c) => {
                const cell = makeEl("div", "chromo-cell");
                katex.render(String(c), cell, { throwOnError: false });
                return cell;
            });
            table.appendChild(makeCellRow("hasil bersih konversi →", row6Cells));

            const cellBlockWidth = n * 56 - 8;

            const sumRow = makeEl("div", "chromo-row");
            sumRow.appendChild(makeEl("div", "chromo-row-label", "penjumlahan hasil konversi →"));
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
            finalRow.appendChild(makeEl("div", "chromo-row-label", "hasil akhir →"));
            const finalContent = makeEl("div", "chromo-final-content");
            finalContent.style.width = `${cellBlockWidth}px`;
            const finalMath = makeEl("span", "chromo-final-math");
            katex.render(`d\\text{ (desimal)} = ${d}`, finalMath, { throwOnError: false });
            finalContent.appendChild(finalMath);
            finalRow.appendChild(finalContent);
            table.appendChild(finalRow);
        }

        container.appendChild(table);
    }

    renderChromoCards(n, d, xMin, xMax);

    if (typeof focusIdx === "number") {
        requestAnimationFrame(() => focusCell(focusIdx));
    }
}
