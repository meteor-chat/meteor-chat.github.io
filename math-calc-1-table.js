import { makeEl, createBraceSvg } from "./math-calc-1-tokens.js";

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
        table.appendChild(makeCellRow("bobot biner 2^p (p = n-i) →", row3Cells));
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
        table.appendChild(finalRow);
    }

    container.appendChild(table);
}
