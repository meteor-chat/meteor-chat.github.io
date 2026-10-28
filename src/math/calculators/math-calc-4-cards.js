function renderKatexSafe(tex, element, isDisplay = true) {
    if (!element) return;
    if (typeof window !== "undefined" && window.katex) {
        window.katex.render(tex, element, { displayMode: isDisplay, throwOnError: false });
    } else {
        element.textContent = tex;
    }
}

export function renderTopFormula4() {
    const el = document.getElementById("math-calc-formula-display-4");
    if (!el) return;
    const tex = "\\htmlClass{sel-token-pi}{P_i} = \\frac{\\htmlClass{sel-token-fi}{F_i}}{\\sum_{j=1}^{n} \\htmlClass{sel-token-fi}{F_j}} = \\frac{\\htmlClass{sel-token-fi}{F_i}}{\\htmlClass{sel-token-sumf}{\\sum F}}";
    renderKatexSafe(tex, el, false);
}

export function renderSelectionCards(values) {
    const c1 = document.getElementById("sel-card-step1");
    const c2 = document.getElementById("sel-card-step2");
    const c3 = document.getElementById("sel-card-step3");
    const c4 = document.getElementById("sel-card-step4");
    if (!c1 || !c2 || !c3 || !c4) return;

    if (!values || values.length === 0) {
        renderKatexSafe("\\sum F = 0", c1);
        renderKatexSafe("P_i = \\text{--}", c2);
        renderKatexSafe("P_i \\approx \\text{--}", c3);
        renderKatexSafe("\\sum P_i = \\text{--}", c4);
        return;
    }

    const sum = values.reduce((acc, v) => acc + Math.max(0, v), 0);
    const sumFormatted = sum.toFixed(4);

    if (sum <= 0) {
        renderKatexSafe("\\sum F = 0.0000", c1);
        renderKatexSafe("P_i = \\frac{F_i}{0} \\quad (\\text{Tidak terdefinisi})", c2);
        renderKatexSafe("P_i \\approx 0.0000", c3);
        renderKatexSafe("\\sum P_i = 0.0000", c4);
        return;
    }

    const sumTerms = values.map((v, i) => {
        const numStr = (Math.max(0, v)).toFixed(2);
        return `\\htmlClass{sel-token-val-${i}}{${numStr}}`;
    }).join(" + ");
    const step1Tex = `\\htmlClass{sel-token-sumf}{\\sum F} = ${sumTerms} = \\mathbf{${sumFormatted}}`;
    renderKatexSafe(step1Tex, c1);

    const ratioTerms = values.map((v, i) => {
        const numStr = (Math.max(0, v)).toFixed(2);
        return `\\frac{\\htmlClass{sel-token-val-${i}}{${numStr}}}{\\htmlClass{sel-token-sumf}{${sum.toFixed(2)}}}`;
    }).join(",\\; ");
    const step2Tex = `P_i = \\frac{F_i}{\\sum F} \\implies \\left[ ${ratioTerms} \\right]`;
    renderKatexSafe(step2Tex, c2);

    const probs = values.map(v => Math.max(0, v) / sum);
    const probTerms = probs.map((p, i) => {
        const pStr = p.toFixed(4);
        return `\\htmlClass{sel-token-p-${i}}{P_{${i + 1}} \\approx ${pStr}}`;
    }).join("\\quad ");
    const step3Tex = probTerms;
    renderKatexSafe(step3Tex, c3);

    const probSumTerms = probs.map((p, i) => {
        return `\\htmlClass{sel-token-p-${i}}{${p.toFixed(4)}}`;
    }).join(" + ");
    const totalP = probs.reduce((a, b) => a + b, 0).toFixed(4);
    const step4Tex = `\\sum_{i=1}^{${values.length}} P_i = ${probSumTerms} = \\mathbf{${totalP}}`;
    renderKatexSafe(step4Tex, c4);
}
