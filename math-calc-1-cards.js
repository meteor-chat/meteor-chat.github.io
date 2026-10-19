import { formatCBP4 } from "./math-format.js";
import { makeEl, bindTokenHover } from "./math-calc-1-tokens.js";

export function renderTopFormula() {
    if (typeof katex === "undefined") return;
    const topBox = document.getElementById("math-calc-formula-display");
    if (topBox) {
        topBox.textContent = "";
        const topTex = "x = \\htmlClass{chromo-token-xmin}{x_{\\min}} + \\frac{\\htmlClass{chromo-token-xmax}{x_{\\max}} - \\htmlClass{chromo-token-xmin}{x_{\\min}}}{2^{\\htmlClass{chromo-token-n}{n}} - 1} \\cdot \\htmlClass{chromo-token-d}{d}";
        katex.render(topTex, topBox, { throwOnError: false, trust: true, displayMode: false });
    }
}

export function renderParamLabels() {
    if (typeof katex === "undefined") return;
    renderTopFormula();
    const xMinLabel = document.getElementById("chromo-label-xmin");
    if (xMinLabel) {
        xMinLabel.textContent = "";
        katex.render("\\htmlClass{chromo-token-xmin}{x_{\\min}}", xMinLabel, { throwOnError: false, trust: true });
    }
    const xMaxLabel = document.getElementById("chromo-label-xmax");
    if (xMaxLabel) {
        xMaxLabel.textContent = "";
        katex.render("\\htmlClass{chromo-token-xmax}{x_{\\max}}", xMaxLabel, { throwOnError: false, trust: true });
    }
}

function getIntermediateElements() {
    return [
        document.getElementById("chromo-card-step2"),
        document.getElementById("chromo-arrow-2"),
        document.getElementById("chromo-card-step3"),
        document.getElementById("chromo-arrow-3"),
        document.getElementById("chromo-card-step4"),
        document.getElementById("chromo-arrow-4"),
        document.getElementById("chromo-card-step5"),
        document.getElementById("chromo-arrow-5")
    ];
}

export function renderChromoCards(n, d, xMin, xMax, powers = []) {
    if (typeof katex === "undefined") return;

    const card1 = document.getElementById("chromo-card-step1");
    if (card1) {
        card1.textContent = "";
        const partXmin = xMin !== null ? `\\htmlClass{chromo-token-xmin}{${formatCBP4(xMin)}}` : "\\htmlClass{chromo-token-xmin}{?}";
        const partXminFmt = xMin !== null
            ? (xMin < 0 ? `(\\htmlClass{chromo-token-xmin}{${formatCBP4(xMin)}})` : `\\htmlClass{chromo-token-xmin}{${formatCBP4(xMin)}}`)
            : "\\htmlClass{chromo-token-xmin}{?}";
        const partXmax = xMax !== null ? `\\htmlClass{chromo-token-xmax}{${formatCBP4(xMax)}}` : "\\htmlClass{chromo-token-xmax}{?}";
        const partN = n > 0 ? `\\htmlClass{chromo-token-n}{${n}}` : "\\htmlClass{chromo-token-n}{?}";
        const partD = n > 0 ? `\\htmlClass{chromo-token-d}{${d}}` : "\\htmlClass{chromo-token-d}{?}";
        const tex1 = `x = ${partXmin} + \\frac{${partXmax} - ${partXminFmt}}{2^{${partN}} - 1} \\cdot ${partD}`;
        katex.render(tex1, card1, { throwOnError: false, trust: true, displayMode: true });
    }

    const intermediateEls = getIntermediateElements();
    const card6 = document.getElementById("chromo-card-step6");

    if (n === 0 || xMin === null || xMax === null) {
        intermediateEls.forEach((el) => el && el.classList.add("hidden"));
        if (card6) {
            card6.textContent = "";
            katex.render("x \\approx ?", card6, { throwOnError: false, trust: true, displayMode: true });
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
    const partXmin = `\\htmlClass{chromo-token-xmin}{${formatCBP4(xMin)}}`;
    const tokenD = `\\htmlClass{chromo-token-d}{${d}}`;

    const card2 = document.getElementById("chromo-card-step2");
    if (card2) {
        card2.textContent = "";
        const topMath = makeEl("div");
        const tex2 = `x = ${partXmin} + \\frac{${formatCBP4(deltaX)}}{${powVal} - 1} \\cdot ${tokenD}`;
        katex.render(tex2, topMath, { throwOnError: false, trust: true, displayMode: true });
        card2.appendChild(topMath);
        const subnote2 = makeEl("div", "chromo-card-subnote");
        katex.render(`\\Delta R = ${formatCBP4(xMax)} - (${formatCBP4(xMin)}) = ${formatCBP4(deltaX)} \\text{ (rentang domain fenotipe)}`, subnote2, { throwOnError: false, trust: true });
        card2.appendChild(subnote2);
    }

    const card3 = document.getElementById("chromo-card-step3");
    if (card3) {
        card3.textContent = "";
        const topMath = makeEl("div");
        const tex3 = `x = ${partXmin} + \\frac{${formatCBP4(deltaX)}}{${den}} \\cdot ${tokenD}`;
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
            ? `\\text{Prinsip Tiang Pagar: } 2^{${n}} - 1 = \\sum \\text{bobot} = ${weightStr} = ${den}`
            : `\\text{Prinsip Tiang Pagar: } 2^{${n}} - 1 = ${den}`;
        katex.render(noteTex, subnote, { throwOnError: false, trust: true });
        card3.appendChild(subnote);
    }

    const card4 = document.getElementById("chromo-card-step4");
    if (card4) {
        card4.textContent = "";
        const stepFmt = formatCBP4(stepSize);
        const stepFmtWrap = stepSize < 0 ? `(${stepFmt})` : stepFmt;
        const topMath = makeEl("div");
        const tex4 = `x = ${partXmin} + (${stepFmtWrap} \\cdot ${tokenD})`;
        katex.render(tex4, topMath, { throwOnError: false, trust: true, displayMode: true });
        card4.appendChild(topMath);
        const subnote4 = makeEl("div", "chromo-card-subnote");
        katex.render(`\\Delta x = \\frac{${formatCBP4(deltaX)}}{${den}} = ${stepFmt} \\text{ (resolusi kisi / step size)}`, subnote4, { throwOnError: false, trust: true });
        card4.appendChild(subnote4);
    }

    const card5 = document.getElementById("chromo-card-step5");
    if (card5) {
        card5.textContent = "";
        const topMath = makeEl("div");
        let tex5 = "";
        if (d === 0) {
            tex5 = `x = ${partXmin} + 0`;
        } else if (contrib < 0) {
            tex5 = `x = ${partXmin} - ${formatCBP4(Math.abs(contrib))}`;
        } else {
            tex5 = `x = ${partXmin} + ${formatCBP4(contrib)}`;
        }
        katex.render(tex5, topMath, { throwOnError: false, trust: true, displayMode: true });
        card5.appendChild(topMath);
        const subnote5 = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Pergeseran } = \\Delta x \\cdot d = ${formatCBP4(stepSize)} \\times ${d} = ${formatCBP4(contrib)}`, subnote5, { throwOnError: false, trust: true });
        card5.appendChild(subnote5);
    }

    if (card6) {
        card6.textContent = "";
        const topTag = makeEl("div", "chromo-result-label", "Nilai Fenotipe Riil (x)");
        card6.appendChild(topTag);
        const mathEl = makeEl("div");
        const isExact = Number.isInteger(finalX) || parseFloat(finalX.toFixed(4)) === finalX;
        const sym = isExact ? "=" : "\\approx";
        const tex6 = `x ${sym} ${formatCBP4(finalX)}`;
        katex.render(tex6, mathEl, { throwOnError: false, trust: true, displayMode: true });
        card6.appendChild(mathEl);
        const pctPos = den > 0 ? (d / den) * 100 : 0;
        const subnote6 = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Posisi Domain: } ${pctPos.toFixed(2)}\\% \\text{ (Standar CBP 1: 4 Desimal)}`, subnote6, { throwOnError: false, trust: true });
        card6.appendChild(subnote6);
    }

    bindTokenHover();
}
