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

export function renderChromoCards(n, d, xMin, xMax) {
    if (typeof katex === "undefined") return;
    const card1 = document.getElementById("chromo-card-step1");
    if (card1) {
        card1.textContent = "";
        const tex1 = n === 0
            ? "x = x_{\\min} + \\frac{x_{\\max} - x_{\\min}}{2^n - 1} \\cdot ?"
            : `x = x_{\\min} + \\frac{x_{\\max} - x_{\\min}}{2^n - 1} \\cdot ${d}`;
        katex.render(tex1, card1, { throwOnError: false, displayMode: true });
    }

    const card2 = document.getElementById("chromo-card-step2");
    if (card2) {
        card2.textContent = "";
        const partXmin = xMin !== null ? `${formatMax3(xMin)}` : "?";
        const partXminFmt = xMin !== null ? (xMin < 0 ? `(${formatMax3(xMin)})` : `${formatMax3(xMin)}`) : "?";
        const partXmax = xMax !== null ? `${formatMax3(xMax)}` : "?";
        const partN = n > 0 ? `${n}` : "?";
        const partD = n > 0 ? `${d}` : "?";
        const tex2 = `x = ${partXmin} + \\frac{${partXmax} - ${partXminFmt}}{2^{${partN}} - 1} \\cdot ${partD}`;
        katex.render(tex2, card2, { throwOnError: false, displayMode: true });
    }

    const card3 = document.getElementById("chromo-card-step3");
    if (card3) {
        card3.textContent = "";
        if (n === 0 || xMin === null || xMax === null) {
            katex.render("x \\approx ?", card3, { throwOnError: false, displayMode: true });
        } else {
            const den = Math.pow(2, n) - 1;
            if (den === 0) {
                katex.render("x = \\text{Error: } 2^n - 1 = 0", card3, { throwOnError: false, displayMode: true });
            } else {
                const res = xMin + ((xMax - xMin) / den) * d;
                katex.render(`x \\approx ${formatMax3(res)}`, card3, { throwOnError: false, displayMode: true });
            }
        }
    }
}
