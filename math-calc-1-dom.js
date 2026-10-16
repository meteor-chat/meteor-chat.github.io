import { formatMax3 } from "./math-format.js";

export function makeEl(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
}

export function makeArrowCells(n) {
    const group = makeEl("div", "chromo-arrow-cells");
    for (let i = 0; i < n; i++) {
        group.appendChild(makeEl("div", "chromo-arrow-cell", "↓"));
    }
    return group;
}

export function makeArrowRow(n) {
    const row = makeEl("div", "chromo-arrow-row");
    row.appendChild(makeEl("div", "chromo-arrow-label-spacer"));
    row.appendChild(makeArrowCells(n));
    return row;
}

export function makeCellRow(label, cells, extraEl = null) {
    const row = makeEl("div", "chromo-row");
    row.appendChild(makeEl("div", "chromo-row-label", label));
    const group = makeEl("div", "chromo-cells-group");
    cells.forEach((c) => group.appendChild(c));
    row.appendChild(group);
    if (extraEl) row.appendChild(extraEl);
    return row;
}

export function createBraceSvg(width) {
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

export function renderParamLabels() {
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

export function bindTokenHover() {
    const dTokens = document.querySelectorAll(".chromo-token-d");
    dTokens.forEach((el) => {
        el.onmouseenter = () => dTokens.forEach((t) => t.classList.add("chromo-glow"));
        el.onmouseleave = () => dTokens.forEach((t) => t.classList.remove("chromo-glow"));
    });
    const nTokens = document.querySelectorAll(".chromo-token-n");
    nTokens.forEach((el) => {
        el.onmouseenter = () => nTokens.forEach((t) => t.classList.add("chromo-glow"));
        el.onmouseleave = () => nTokens.forEach((t) => t.classList.remove("chromo-glow"));
    });
}

export function renderChromoCards(n, d, xMin, xMax, powers = []) {
    if (typeof katex === "undefined") return;

    const card1 = document.getElementById("chromo-card-step1");
    if (card1) {
        card1.textContent = "";
        const partXmin = xMin !== null ? `${formatMax3(xMin)}` : "?";
        const partXminFmt = xMin !== null ? (xMin < 0 ? `(${formatMax3(xMin)})` : `${formatMax3(xMin)}`) : "?";
        const partXmax = xMax !== null ? `${formatMax3(xMax)}` : "?";
        const partN = n > 0 ? `\\htmlClass{chromo-token-n}{${n}}` : "?";
        const partD = n > 0 ? `\\htmlClass{chromo-token-d}{${d}}` : "?";
        const tex1 = `x = ${partXmin} + \\frac{${partXmax} - ${partXminFmt}}{2^{${partN}} - 1} \\cdot ${partD}`;
        katex.render(tex1, card1, { throwOnError: false, trust: true, displayMode: true });
    }

    const intermediateEls = [
        document.getElementById("chromo-card-step2"),
        document.getElementById("chromo-arrow-2"),
        document.getElementById("chromo-card-step3"),
        document.getElementById("chromo-arrow-3"),
        document.getElementById("chromo-card-step4"),
        document.getElementById("chromo-arrow-4")
    ];

    const card5 = document.getElementById("chromo-card-step5");

    if (n === 0 || xMin === null || xMax === null) {
        intermediateEls.forEach((el) => el && el.classList.add("hidden"));
        if (card5) {
            card5.textContent = "";
            katex.render("x \\approx ?", card5, { throwOnError: false, trust: true, displayMode: true });
        }
        bindTokenHover();
        return;
    }

    intermediateEls.forEach((el) => el && el.classList.remove("hidden"));

    const deltaX = xMax - xMin;
    const powVal = Math.pow(2, n);
    const den = powVal - 1;
    const stepSize = deltaX / den;
    const contrib = stepSize * d;
    const finalX = xMin + contrib;
    const partXmin = `${formatMax3(xMin)}`;

    const card2 = document.getElementById("chromo-card-step2");
    if (card2) {
        card2.textContent = "";
        const tex2 = `x = ${partXmin} + \\frac{${formatMax3(deltaX)}}{${powVal} - 1} \\cdot \\htmlClass{chromo-token-d}{${d}}`;
        katex.render(tex2, card2, { throwOnError: false, trust: true, displayMode: true });
    }

    const card3 = document.getElementById("chromo-card-step3");
    if (card3) {
        card3.textContent = "";
        const topMath = makeEl("div");
        const tex3 = `x = ${partXmin} + \\frac{${formatMax3(deltaX)}}{${den}} \\cdot \\htmlClass{chromo-token-d}{${d}}`;
        katex.render(tex3, topMath, { throwOnError: false, trust: true, displayMode: true });
        card3.appendChild(topMath);

        const subnote = makeEl("div", "chromo-card-subnote");
        let weightStr = "";
        if (powers && powers.length > 0) {
            if (n <= 6) {
                weightStr = powers.map((p) => p.pVal).join(" + ");
            } else {
                weightStr = `${powers[0].pVal} + ${powers[1].pVal} + \\dots + 1`;
            }
        }
        const noteTex = weightStr
            ? `\\text{penyebut } (2^{${n}} - 1 = ${den}) \\equiv \\sum \\text{bobot } (${weightStr})`
            : `\\text{penyebut } (2^{${n}} - 1 = ${den})`;
        katex.render(noteTex, subnote, { throwOnError: false, trust: true });
        card3.appendChild(subnote);
    }

    const card4 = document.getElementById("chromo-card-step4");
    if (card4) {
        card4.textContent = "";
        let tex4 = "";
        if (d === 0) {
            tex4 = `x = ${partXmin} + 0`;
        } else if (contrib < 0) {
            tex4 = `x = ${partXmin} - ${formatMax3(Math.abs(contrib))}`;
        } else {
            tex4 = `x = ${partXmin} + ${formatMax3(contrib)}`;
        }
        katex.render(tex4, card4, { throwOnError: false, trust: true, displayMode: true });
    }

    if (card5) {
        card5.textContent = "";
        const isExact = Number.isInteger(finalX) || parseFloat(finalX.toFixed(3)) === finalX;
        const sym = isExact ? "=" : "\\approx";
        const tex5 = `x ${sym} ${formatMax3(finalX)}`;
        katex.render(tex5, card5, { throwOnError: false, trust: true, displayMode: true });
    }

    bindTokenHover();
}

export function renderChromoTable(container, n, currentBits, powers, cleans, d, row1Cells, maxBits) {
    container.textContent = "";
    const table = makeEl("div", "chromo-table");
    table.appendChild(makeCellRow("kromosom biner →", row1Cells));

    if (n > 0) {
        table.appendChild(makeArrowRow(n));

        const row2Cells = [];
        for (let i = 0; i < n; i++) {
            const cell = makeEl("div", "chromo-cell");
            katex.render(String(i + 1), cell, { throwOnError: false });
            row2Cells.push(cell);
        }
        const nTag = makeEl("div", n < maxBits ? "chromo-n-tag chromo-n-tag-offset" : "chromo-n-tag");
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
