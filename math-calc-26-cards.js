import { formatMax3 } from "./math-format.js";
import { makeEl } from "./math-calc-1-tokens.js";

export function renderFpaTopFormula() {
    if (typeof katex === "undefined") return;
    const topBox = document.getElementById("math-calc-formula-display-26");
    if (topBox) {
        topBox.textContent = "";
        const topTex = "\\text{COCOMO II: } \\; \\text{Effort} = 3.13 \\times (\\text{KSLOC})^{1.072}, \\; \\text{Total Biaya} = \\text{Jam Kerja} \\times \\text{Tarif}";
        katex.render(topTex, topBox, { throwOnError: false, trust: true, displayMode: false });
    }
}

function getIntermediateElements() {
    return [
        document.getElementById("m26-card-step2"),
        document.getElementById("m26-arrow-2"),
        document.getElementById("m26-card-step3"),
        document.getElementById("m26-arrow-3"),
        document.getElementById("m26-card-step4"),
        document.getElementById("m26-arrow-4")
    ];
}

export function renderFpaCards(ei, eif, eo, eq, ilf, langEquiv, rate) {
    if (typeof katex === "undefined") return;
    renderFpaTopFormula();

    const card1 = document.getElementById("m26-card-step1");
    const intermediateEls = getIntermediateElements();
    const card5 = document.getElementById("m26-card-step5");

    const hasData = ei !== null && eif !== null && eo !== null && eq !== null && ilf !== null;

    if (!hasData) {
        if (card1) {
            card1.textContent = "";
            katex.render("\\text{Total FP} = \\sum (Q_j \\times W_j) = ?", card1, { throwOnError: false, trust: true, displayMode: true });
        }
        intermediateEls.forEach((el) => el && el.classList.add("hidden"));
        if (card5) {
            card5.textContent = "";
            card5.classList.add("hidden");
        }
        return;
    }

    intermediateEls.forEach((el) => el && el.classList.remove("hidden"));
    if (card5) card5.classList.remove("hidden");

    const fpEi = ei * 4;
    const fpEif = eif * 7;
    const fpEo = eo * 5;
    const fpEq = eq * 4;
    const fpIlf = ilf * 10;
    const totalFp = fpEi + fpEif + fpEo + fpEq + fpIlf;

    const le = langEquiv !== null && langEquiv > 0 ? langEquiv : 46;
    const sloc = totalFp * le;
    const ksloc = sloc / 1000;

    const effort = 3.13 * Math.pow(ksloc, 1.072);
    const hours = effort * 160;
    const hourlyRate = rate !== null && rate > 0 ? rate : 120;
    const totalCost = hours * hourlyRate;

    if (card1) {
        card1.textContent = "";
        const mEl = makeEl("div");
        const tex1 = `\\text{Total FP} = (${ei} \\times 4) + (${eif} \\times 7) + (${eo} \\times 5) + (${eq} \\times 4) + (${ilf} \\times 10) = ${totalFp}`;
        katex.render(tex1, mEl, { throwOnError: false, trust: true, displayMode: true });
        card1.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Hasil akumulasi 5 komponen Function Points (EI, EIF, EO, EQ, ILF)}`, sub, { throwOnError: false, trust: true });
        card1.appendChild(sub);
    }

    const card2 = document.getElementById("m26-card-step2");
    if (card2) {
        card2.textContent = "";
        const mEl = makeEl("div");
        const tex2 = `\\text{SLOC} = ${totalFp} \\times ${le} = ${formatMax3(sloc)}, \\; \\text{KSLOC} = \\frac{${formatMax3(sloc)}}{1000} = ${formatMax3(ksloc)}`;
        katex.render(tex2, mEl, { throwOnError: false, trust: true, displayMode: true });
        card2.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Estimasi baris kode dengan faktor kesetaraan bahasa } (${le} \\text{ SLOC/FP})`, sub, { throwOnError: false, trust: true });
        card2.appendChild(sub);
    }

    const card3 = document.getElementById("m26-card-step3");
    if (card3) {
        card3.textContent = "";
        const mEl = makeEl("div");
        const tex3 = `\\text{Effort} = 3.13 \\times (${formatMax3(ksloc)})^{1.072} = ${formatMax3(effort)} \\text{ person-months}`;
        katex.render(tex3, mEl, { throwOnError: false, trust: true, displayMode: true });
        card3.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Model parametrik COCOMO II (produktivitas } 3.13 \\text{ dan penalti } 1.072\\text{)}`, sub, { throwOnError: false, trust: true });
        card3.appendChild(sub);
    }

    const card4 = document.getElementById("m26-card-step4");
    if (card4) {
        card4.textContent = "";
        const mEl = makeEl("div");
        const tex4 = `\\text{Total Jam Kerja} = ${formatMax3(effort)} \\times 160 = ${formatMax3(hours)} \\text{ jam}`;
        katex.render(tex4, mEl, { throwOnError: false, trust: true, displayMode: true });
        card4.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Standar konversi: } 160 \\text{ jam kerja per orang-bulan}`, sub, { throwOnError: false, trust: true });
        card4.appendChild(sub);
    }

    if (card5) {
        card5.textContent = "";
        const mEl = makeEl("div");
        const tex5 = `\\mathbf{\\text{Total Biaya Estimasi} = \\$ ${formatMax3(totalCost)}}`;
        katex.render(tex5, mEl, { throwOnError: false, trust: true, displayMode: true });
        card5.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Perhitungan: } ${formatMax3(hours)} \\text{ jam} \\times \\$ ${hourlyRate}/\\text{jam}`, sub, { throwOnError: false, trust: true });
        card5.appendChild(sub);
    }
}
