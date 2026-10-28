function renderCardWithSubnote(card, tex, subnoteText) {
    if (!card) return;
    card.textContent = "";
    const topMath = document.createElement("div");
    if (typeof window !== "undefined" && window.katex) {
        window.katex.render(tex, topMath, { displayMode: true, throwOnError: false, trust: true, strict: false });
    } else {
        topMath.textContent = tex;
    }
    card.appendChild(topMath);
    if (subnoteText) {
        const sub = document.createElement("div");
        sub.className = "chromo-card-subnote";
        sub.textContent = subnoteText;
        card.appendChild(sub);
    }
}

export function renderTopFormula4() {
    const el = document.getElementById("math-calc-formula-display-4");
    if (!el) return;
    el.textContent = "";
    const tex = "\\htmlClass{sel-token-pi}{P_i} = \\frac{\\htmlClass{sel-token-fi}{F_i}}{\\sum_{j=1}^{n} \\htmlClass{sel-token-fi}{F_j}} = \\frac{\\htmlClass{sel-token-fi}{F_i}}{\\htmlClass{sel-token-sumf}{\\sum F}}";
    if (typeof window !== "undefined" && window.katex) {
        window.katex.render(tex, el, { displayMode: false, throwOnError: false, trust: true, strict: false });
    } else {
        el.textContent = tex;
    }
}

export function renderSelectionCards(values, activeIndex = 0) {
    const c1 = document.getElementById("sel-card-step1");
    const c2 = document.getElementById("sel-card-step2");
    const c3 = document.getElementById("sel-card-step3");
    const c4 = document.getElementById("sel-card-step4");
    if (!c1 || !c2 || !c3 || !c4) return;

    if (!values || values.length === 0) {
        renderCardWithSubnote(c1, "\\sum F = 0", "Populasi kosong");
        renderCardWithSubnote(c2, "P_i = \\text{--}", "Belum ada individu");
        renderCardWithSubnote(c3, "P_i \\approx \\text{--}", "Menunggu data");
        renderCardWithSubnote(c4, "\\sum P_i = \\text{--}", "Belum dihitung");
        return;
    }

    const sum = values.reduce((acc, v) => acc + Math.max(0, v), 0);
    const sumFormatted = sum.toFixed(4);

    if (sum <= 0) {
        renderCardWithSubnote(c1, "\\htmlClass{sel-token-sumf}{\\sum F} = 0.0000", "Masukkan nilai fitness > 0");
        renderCardWithSubnote(c2, "P_i = \\frac{F_i}{0}", "Penyebut bernilai nol");
        renderCardWithSubnote(c3, "P_i \\approx 0.0000", "Menunggu input nilai valid");
        renderCardWithSubnote(c4, "\\sum P_i = 0.0000", "Normalisasi belum terpenuhi");
        return;
    }

    const idx = (activeIndex >= 0 && activeIndex < values.length) ? activeIndex : 0;
    const actVal = Math.max(0, values[idx]);

    let step1Tex;
    if (values.length <= 4) {
        const sumTerms = values.map((v, i) => {
            const numStr = (Math.max(0, v)).toFixed(2);
            return `\\htmlClass{sel-token-val-${i}}{${numStr}}`;
        }).join(" + ");
        step1Tex = `\\htmlClass{sel-token-sumf}{\\sum F} = ${sumTerms} = \\mathbf{${sumFormatted}}`;
    } else {
        step1Tex = `\\htmlClass{sel-token-sumf}{\\sum F} = \\sum_{j=1}^{${values.length}} F_j = \\mathbf{${sumFormatted}}`;
    }
    renderCardWithSubnote(c1, step1Tex, "Total kebugaran seluruh populasi");

    const step2Tex = `P_{${idx + 1}} = \\frac{\\htmlClass{sel-token-val-${idx}}{${actVal.toFixed(2)}}}{\\htmlClass{sel-token-sumf}{${sum.toFixed(2)}}}`;
    renderCardWithSubnote(c2, step2Tex, `Rasio proporsional Individu ${idx + 1}`);

    const matrixRows = [];
    for (let i = 0; i < values.length; i += 2) {
        const row = [];
        const p1 = (Math.max(0, values[i]) / sum).toFixed(4);
        row.push(`\\htmlClass{sel-token-p-${i}}{P_{${i + 1}} \\approx ${p1}}`);
        if (i + 1 < values.length) {
            const p2 = (Math.max(0, values[i + 1]) / sum).toFixed(4);
            row.push(`\\htmlClass{sel-token-p-${i + 1}}{P_{${i + 2}} \\approx ${p2}}`);
        }
        matrixRows.push(row.join(" & "));
    }
    const step3Tex = `\\begin{matrix} ${matrixRows.join(" \\\\ ")} \\end{matrix}`;
    renderCardWithSubnote(c3, step3Tex, "Probabilitas presisi 4 desimal (silabus)");

    const step4Tex = `\\sum_{i=1}^{${values.length}} P_i = \\mathbf{1.0000}`;
    renderCardWithSubnote(c4, step4Tex, "Total probabilitas normal (100%)");
}
