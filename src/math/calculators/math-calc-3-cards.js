import { formatMax3 } from "../math-format.js";

function formatFit(val) {
    if (!isFinite(val)) return String(val);
    const parsed = parseFloat(val.toFixed(4));
    return Object.is(parsed, -0) || parsed === 0 ? "0" : parsed.toString();
}

export function renderTopFormula3() {
    if (typeof katex === "undefined") return;
    const box = document.getElementById("math-calc-formula-display-3");
    if (!box) return;
    box.textContent = "";

    const tex = "\\text{Fitness} = \\frac{1}{\\htmlClass{fit-token-h}{h} + \\htmlClass{fit-token-a}{a}}";
    katex.render(tex, box, { throwOnError: false, trust: true, displayMode: false });
}

export function renderParamLabels3() {
    if (typeof katex === "undefined") return;
    renderTopFormula3();
    const lh = document.getElementById("fit-label-h");
    if (lh) {
        lh.textContent = "";
        katex.render("\\htmlClass{fit-token-h}{h}", lh, { throwOnError: false, trust: true });
    }
    const la = document.getElementById("fit-label-a");
    if (la) {
        la.textContent = "";
        katex.render("\\htmlClass{fit-token-a}{a}", la, { throwOnError: false, trust: true });
    }
}

export function renderFitnessCards(h, a) {
    if (typeof katex === "undefined") return;

    const card1 = document.getElementById("fit-card-step1");
    const card2 = document.getElementById("fit-card-step2");
    const card3 = document.getElementById("fit-card-step3");
    const card4 = document.getElementById("fit-card-step4");

    if (isNaN(h) || isNaN(a)) {
        if (card1) card1.textContent = "Masukkan nilai h dan a yang valid";
        [card2, card3, card4].forEach((c) => {
            if (c) c.textContent = "";
        });
        return;
    }

    const hFmt = h < 0 ? `(\\htmlClass{fit-token-h}{${formatMax3(h)}})` : `\\htmlClass{fit-token-h}{${formatMax3(h)}}`;
    const aFmt = a < 0 ? `(\\htmlClass{fit-token-a}{${formatMax3(a)}})` : `\\htmlClass{fit-token-a}{${formatMax3(a)}}`;

    const denom = h + a;
    const denomFmt = formatMax3(denom);

    if (card1) {
        card1.textContent = "";
        const tex1 = `\\text{Fitness} = \\frac{1}{${hFmt} + ${aFmt}}`;
        katex.render(tex1, card1, { throwOnError: false, trust: true, displayMode: true });
    }

    if (card2) {
        card2.textContent = "";
        const tex2 = `\\text{Penyebut } (\\Sigma) = ${hFmt} + ${aFmt} = \\mathbf{${denomFmt}}`;
        katex.render(tex2, card2, { throwOnError: false, trust: true, displayMode: true });
    }

    if (Math.abs(denom) < 1e-12) {
        if (card3) {
            card3.textContent = "";
            katex.render("\\text{Fitness} = \\frac{1}{0}", card3, { throwOnError: false, trust: true, displayMode: true });
        }
        if (card4) {
            card4.textContent = "";
            katex.render("\\text{Singular: } \\text{Pembagian dengan nol}", card4, { throwOnError: false, trust: true, displayMode: true });
        }
        return;
    }

    const fitVal = 1 / denom;
    const fitFmt = formatFit(fitVal);

    if (card3) {
        card3.textContent = "";
        const tex3 = `\\text{Fitness} = \\frac{1}{${denomFmt}}`;
        katex.render(tex3, card3, { throwOnError: false, trust: true, displayMode: true });
    }

    if (card4) {
        card4.textContent = "";
        const tex4 = `\\text{Fitness} \\approx \\htmlClass{fit-token-f}{\\mathbf{${fitFmt}}}`;
        katex.render(tex4, card4, { throwOnError: false, trust: true, displayMode: true });
    }
}
