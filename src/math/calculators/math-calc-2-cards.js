import { formatMax3 } from "../math-format.js";

export function renderTopFormula2(preset = "default") {
    if (typeof katex === "undefined") return;
    const box = document.getElementById("math-calc-formula-display-2");
    if (!box) return;
    box.textContent = "";

    let tex = "h = \\htmlClass{obj-token-x1}{x_1}^3 + \\frac{1}{3}\\htmlClass{obj-token-x2}{x_2}^2";
    if (preset === "sphere") {
        tex = "h = \\htmlClass{obj-token-x1}{x_1}^2 + \\htmlClass{obj-token-x2}{x_2}^2";
    } else if (preset === "saddle") {
        tex = "h = \\htmlClass{obj-token-x1}{x_1}^2 - \\htmlClass{obj-token-x2}{x_2}^2";
    } else if (preset === "rosenbrock") {
        tex = "h = 100(\\htmlClass{obj-token-x2}{x_2} - \\htmlClass{obj-token-x1}{x_1}^2)^2 + (1 - \\htmlClass{obj-token-x1}{x_1})^2";
    }

    katex.render(tex, box, { throwOnError: false, trust: true, displayMode: false });
}

export function renderParamLabels2() {
    if (typeof katex === "undefined") return;
    renderTopFormula2();
    const l1 = document.getElementById("obj-label-x1");
    if (l1) {
        l1.textContent = "";
        katex.render("\\htmlClass{obj-token-x1}{x_1}", l1, { throwOnError: false, trust: true });
    }
    const l2 = document.getElementById("obj-label-x2");
    if (l2) {
        l2.textContent = "";
        katex.render("\\htmlClass{obj-token-x2}{x_2}", l2, { throwOnError: false, trust: true });
    }
}

export function renderObjectiveCards(x1, x2, preset = "default") {
    if (typeof katex === "undefined") return;

    const card1 = document.getElementById("obj-card-step1");
    const card2 = document.getElementById("obj-card-step2");
    const card3 = document.getElementById("obj-card-step3");
    const card4 = document.getElementById("obj-card-step4");
    const card5 = document.getElementById("obj-card-step5");

    if (isNaN(x1) || isNaN(x2)) {
        if (card1) card1.textContent = "Masukkan nilai x₁ dan x₂ yang valid";
        [card2, card3, card4, card5].forEach((c) => {
            if (c) c.textContent = "";
        });
        return;
    }

    const x1Fmt = x1 < 0 ? `(\\htmlClass{obj-token-x1}{${formatMax3(x1)}})` : `\\htmlClass{obj-token-x1}{${formatMax3(x1)}}`;
    const x2Fmt = x2 < 0 ? `(\\htmlClass{obj-token-x2}{${formatMax3(x2)}})` : `\\htmlClass{obj-token-x2}{${formatMax3(x2)}}`;

    if (preset === "default") {
        const x1Cubed = Math.pow(x1, 3);
        const x2Sq = Math.pow(x2, 2);
        const term2 = x2Sq / 3;
        const total = x1Cubed + term2;

        if (card1) {
            card1.textContent = "";
            const tex1 = `h = ${x1Fmt}^3 + \\frac{1}{3}${x2Fmt}^2`;
            katex.render(tex1, card1, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card2) {
            card2.textContent = "";
            const tex2 = `\\text{Suku } 1 = ${x1Fmt}^3 = \\mathbf{${formatMax3(x1Cubed)}}`;
            katex.render(tex2, card2, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card3) {
            card3.textContent = "";
            const tex3 = `\\text{Suku } 2 = \\frac{1}{3}${x2Fmt}^2 = \\frac{${formatMax3(x2Sq)}}{3} = \\mathbf{${formatMax3(term2)}}`;
            katex.render(tex3, card3, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card4) {
            card4.textContent = "";
            const tex4 = `h = ${formatMax3(x1Cubed)} + ${formatMax3(term2)}`;
            katex.render(tex4, card4, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card5) {
            card5.textContent = "";
            const tex5 = `h \\approx \\htmlClass{obj-token-h}{\\mathbf{${formatMax3(total)}}}`;
            katex.render(tex5, card5, { throwOnError: false, trust: true, displayMode: true });

            const sub = document.createElement("div");
            sub.className = "chromo-card-subnote";
            sub.textContent = "Nilai evaluasi fenotipe individu untuk seleksi algoritma genetika";
            card5.appendChild(sub);
        }
    } else if (preset === "sphere") {
        const t1 = Math.pow(x1, 2);
        const t2 = Math.pow(x2, 2);
        const total = t1 + t2;

        if (card1) {
            card1.textContent = "";
            katex.render(`h = ${x1Fmt}^2 + ${x2Fmt}^2`, card1, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card2) {
            card2.textContent = "";
            katex.render(`x_1^2 = \\mathbf{${formatMax3(t1)}}`, card2, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card3) {
            card3.textContent = "";
            katex.render(`x_2^2 = \\mathbf{${formatMax3(t2)}}`, card3, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card4) {
            card4.textContent = "";
            katex.render(`h = ${formatMax3(t1)} + ${formatMax3(t2)}`, card4, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card5) {
            card5.textContent = "";
            katex.render(`h = \\htmlClass{obj-token-h}{\\mathbf{${formatMax3(total)}}}`, card5, { throwOnError: false, trust: true, displayMode: true });
        }
    } else if (preset === "saddle") {
        const t1 = Math.pow(x1, 2);
        const t2 = Math.pow(x2, 2);
        const total = t1 - t2;

        if (card1) {
            card1.textContent = "";
            katex.render(`h = ${x1Fmt}^2 - ${x2Fmt}^2`, card1, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card2) {
            card2.textContent = "";
            katex.render(`x_1^2 = \\mathbf{${formatMax3(t1)}}`, card2, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card3) {
            card3.textContent = "";
            katex.render(`x_2^2 = \\mathbf{${formatMax3(t2)}}`, card3, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card4) {
            card4.textContent = "";
            katex.render(`h = ${formatMax3(t1)} - ${formatMax3(t2)}`, card4, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card5) {
            card5.textContent = "";
            katex.render(`h = \\htmlClass{obj-token-h}{\\mathbf{${formatMax3(total)}}}`, card5, { throwOnError: false, trust: true, displayMode: true });
        }
    } else if (preset === "rosenbrock") {
        const termInside = x2 - Math.pow(x1, 2);
        const t1 = 100 * Math.pow(termInside, 2);
        const t2 = Math.pow(1 - x1, 2);
        const total = t1 + t2;

        if (card1) {
            card1.textContent = "";
            katex.render(`h = 100(${x2Fmt} - ${x1Fmt}^2)^2 + (1 - ${x1Fmt})^2`, card1, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card2) {
            card2.textContent = "";
            katex.render(`100(${formatMax3(termInside)})^2 = \\mathbf{${formatMax3(t1)}}`, card2, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card3) {
            card3.textContent = "";
            katex.render(`(1 - ${formatMax3(x1)})^2 = \\mathbf{${formatMax3(t2)}}`, card3, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card4) {
            card4.textContent = "";
            katex.render(`h = ${formatMax3(t1)} + ${formatMax3(t2)}`, card4, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card5) {
            card5.textContent = "";
            katex.render(`h = \\htmlClass{obj-token-h}{\\mathbf{${formatMax3(total)}}}`, card5, { throwOnError: false, trust: true, displayMode: true });
        }
    }
}
