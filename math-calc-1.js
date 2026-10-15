import { refs } from "./dom-refs.js";

function makeEl(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
}

function makeArrowCells(n) {
    const group = makeEl("div", "chromo-arrow-cells");
    for (let i = 0; i < n; i++) {
        group.appendChild(makeEl("div", "chromo-arrow-cell", "↓"));
    }
    return group;
}

function makeArrowRow(n) {
    const row = makeEl("div", "chromo-arrow-row");
    row.appendChild(makeEl("div", "chromo-arrow-label-spacer"));
    row.appendChild(makeArrowCells(n));
    return row;
}

function makeCellRow(label, cells, extraEl = null) {
    const row = makeEl("div", "chromo-row");
    row.appendChild(makeEl("div", "chromo-row-label", label));
    const group = makeEl("div", "chromo-cells-group");
    cells.forEach((c) => group.appendChild(c));
    row.appendChild(group);
    if (extraEl) row.appendChild(extraEl);
    return row;
}

function createBraceSvg(width) {
    const w = Math.max(width, 60);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "chromo-brace-svg");
    svg.setAttribute("viewBox", `0 0 ${w} 18`);
    svg.style.width = `${w}px`;
    svg.style.height = "18px";
    const mid = w / 2;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M 0 0 Q 0 8 10 8 L ${mid - 12} 8 Q ${mid} 8 ${mid} 16 Q ${mid} 8 ${mid + 12} 8 L ${w - 10} 8 Q ${w} 8 ${w} 0`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "1.6");
    svg.appendChild(path);
    return svg;
}

function renderParamLabels() {
    if (typeof katex === "undefined") return;
    const xMinLabel = document.getElementById("chromo-label-xmin");
    if (xMinLabel) {
        xMinLabel.textContent = "";
        katex.render("x_{\\min}", xMinLabel, { throwOnError: false });
    }
    const xMaxLabel = document.getElementById("chromo-label-xmax");
    if (xMaxLabel) {
        xMaxLabel.textContent = "";
        katex.render("x_{\\max}", xMaxLabel, { throwOnError: false });
    }
}

export function initChromoView() {
    if (refs.inKromosom && !refs.inKromosom.value) {
        refs.inKromosom.value = "1001";
    }
    if (refs.inXmin && !refs.inXmin.value) {
        refs.inXmin.value = "2";
    }
    if (refs.inXmax && !refs.inXmax.value) {
        refs.inXmax.value = "6";
    }
    calculateMath();
}

export function calculateMath() {
    if (typeof katex === "undefined") return;
    renderParamLabels();
    const raw = refs.inKromosom ? refs.inKromosom.value.trim() : "";
    const cleanKromosom = raw.replace(/[^01]/g, "");
    if (refs.inKromosom && refs.inKromosom.value !== cleanKromosom) {
        refs.inKromosom.value = cleanKromosom;
    }
    const kromosom = cleanKromosom || "1001";
    const n = kromosom.length;
    if (n < 1) return;

    const xMinVal = refs.inXmin ? parseFloat(refs.inXmin.value || "2") : 2;
    const xMaxVal = refs.inXmax ? parseFloat(refs.inXmax.value || "6") : 6;
    const xMin = isNaN(xMinVal) ? 2 : xMinVal;
    const xMax = isNaN(xMaxVal) ? 6 : xMaxVal;

    const powers = [];
    const cleans = [];
    let d = 0;

    for (let i = 0; i < n; i++) {
        const bit = parseInt(kromosom[i], 10);
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
        for (let i = 0; i < n; i++) {
            const cell = makeEl("button", "chromo-cell chromo-cell-interactive");
            cell.type = "button";
            cell.setAttribute("aria-label", `Toggle gen ${i + 1}`);
            katex.render(kromosom[i], cell, { throwOnError: false });
            cell.addEventListener("click", () => {
                const arr = kromosom.split("");
                arr[i] = arr[i] === "1" ? "0" : "1";
                if (refs.inKromosom) refs.inKromosom.value = arr.join("");
                calculateMath();
            });
            row1Cells.push(cell);
        }
        table.appendChild(makeCellRow("kromosom biner kamu →", row1Cells));
        table.appendChild(makeArrowRow(n));

        const row2Cells = [];
        for (let i = 0; i < n; i++) {
            const cell = makeEl("div", "chromo-cell");
            katex.render(String(i + 1), cell, { throwOnError: false });
            row2Cells.push(cell);
        }
        const nTag = makeEl("div", "chromo-n-tag");
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
            const cell = makeEl("div", "chromo-cell");
            const bit = kromosom[idx];
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

        container.appendChild(table);
    }

    const card1 = document.getElementById("chromo-card-step1");
    if (card1) {
        card1.textContent = "";
        const tex1 = `x = x_{\\min} + \\frac{x_{\\max} - x_{\\min}}{2^n - 1} \\cdot ${d}`;
        katex.render(tex1, card1, { throwOnError: false, displayMode: true });
    }

    const card2 = document.getElementById("chromo-card-step2");
    if (card2) {
        card2.textContent = "";
        const xMinFmt = xMin < 0 ? `(${xMin})` : `${xMin}`;
        const tex2 = `x = ${xMin} + \\frac{${xMax} - ${xMinFmt}}{2^{${n}} - 1} \\cdot ${d}`;
        katex.render(tex2, card2, { throwOnError: false, displayMode: true });
    }

    const card3 = document.getElementById("chromo-card-step3");
    if (card3) {
        card3.textContent = "";
        const den = Math.pow(2, n) - 1;
        if (den === 0) {
            katex.render("x = \\text{Error: } 2^n - 1 = 0", card3, { throwOnError: false, displayMode: true });
        } else {
            const res = xMin + ((xMax - xMin) / den) * d;
            katex.render(`x \\approx ${res.toFixed(3)}`, card3, { throwOnError: false, displayMode: true });
        }
    }
}
