import { formatMax3 } from "./math-format.js";
import { makeEl } from "./math-calc-1-tokens.js";

export function renderFinancialTopFormula() {
    if (typeof katex === "undefined") return;
    const topBox = document.getElementById("math-calc-formula-display-27");
    if (topBox) {
        topBox.textContent = "";
        const topTex = "P = R - E, \\; \\text{Margin} = \\frac{P}{R}, \\; \\text{LCC} = C_{\\text{dev}} + C_{\\text{support}}, \\; \\Delta C = C_{\\text{act}} - C_{\\text{est}}";
        katex.render(topTex, topBox, { throwOnError: false, trust: true, displayMode: false });
    }
}

function getIntermediateElements() {
    return [
        document.getElementById("m27-card-step2"),
        document.getElementById("m27-arrow-2"),
        document.getElementById("m27-card-step3"),
        document.getElementById("m27-arrow-3"),
        document.getElementById("m27-card-step4"),
        document.getElementById("m27-arrow-4")
    ];
}

export function renderFinancialCards(rev, exp, dev, support, est, act) {
    if (typeof katex === "undefined") return;
    renderFinancialTopFormula();

    const card1 = document.getElementById("m27-card-step1");
    const intermediateEls = getIntermediateElements();
    const card5 = document.getElementById("m27-card-step5");

    const hasData = rev !== null || exp !== null || dev !== null || support !== null || est !== null || act !== null;

    if (!hasData) {
        if (card1) {
            card1.textContent = "";
            katex.render("P = R - E, \\; \\text{Margin} = \\frac{P}{R}", card1, { throwOnError: false, trust: true, displayMode: true });
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

    const r = rev || 0;
    const e = exp || 0;
    const profit = r - e;
    const margin = r > 0 ? (profit / r) * 100 : 0;

    const d = dev || 0;
    const s = support || 0;
    const lcc = d + s;

    const cEst = est || 0;
    const cAct = act || 0;
    const overrun = cAct - cEst;
    const overrunPct = cEst > 0 ? (overrun / cEst) * 100 : 0;

    const reserve = cEst * 0.20;
    const testing = cEst * 0.10;

    if (card1) {
        card1.textContent = "";
        const mEl = makeEl("div");
        const tex1 = `P = ${formatMax3(r)} - ${formatMax3(e)} = ${formatMax3(profit)}, \\; \\text{Margin} = \\frac{${formatMax3(profit)}}{${formatMax3(r)}} = ${formatMax3(margin)}\\%`;
        katex.render(tex1, mEl, { throwOnError: false, trust: true, displayMode: true });
        card1.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        const profitStatus = profit >= 0 ? "\\text{Proyek menghasilkan laba bersih}" : "\\text{Proyek mengalami kerugian operasional}";
        katex.render(profitStatus, sub, { throwOnError: false, trust: true });
        card1.appendChild(sub);
    }

    const card2 = document.getElementById("m27-card-step2");
    if (card2) {
        card2.textContent = "";
        const mEl = makeEl("div");
        const tex2 = `\\text{LCC} = C_{\\text{dev}} + C_{\\text{support}} = ${formatMax3(d)} + ${formatMax3(s)} = ${formatMax3(lcc)}`;
        katex.render(tex2, mEl, { throwOnError: false, trust: true, displayMode: true });
        card2.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Total Cost of Ownership (TCO) mencakup fase pengembangan dan pemeliharaan}`, sub, { throwOnError: false, trust: true });
        card2.appendChild(sub);
    }

    const card3 = document.getElementById("m27-card-step3");
    if (card3) {
        card3.textContent = "";
        const mEl = makeEl("div");
        const ovWrap = overrun < 0 ? `(${formatMax3(overrun)})` : formatMax3(overrun);
        const tex3 = `\\Delta C = ${formatMax3(cAct)} - ${formatMax3(cEst)} = ${ovWrap}, \\; \\%\\text{Overrun} = ${formatMax3(overrunPct)}\\%`;
        katex.render(tex3, mEl, { throwOnError: false, trust: true, displayMode: true });
        card3.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        const ovDesc = overrun > 0
            ? `\\text{Pembengkakan biaya sebesar } ${formatMax3(overrun)} \\text{ di atas estimasi awal}`
            : (overrun < 0 ? `\\text{Penghematan biaya sebesar } ${formatMax3(Math.abs(overrun))} \\text{ dari estimasi}` : `\\text{Pengeluaran persis sesuai estimasi}`);
        katex.render(ovDesc, sub, { throwOnError: false, trust: true });
        card3.appendChild(sub);
    }

    const card4 = document.getElementById("m27-card-step4");
    if (card4) {
        card4.textContent = "";
        const mEl = makeEl("div");
        const tex4 = `\\text{Cadangan (20\\%)} = ${formatMax3(reserve)}, \\; \\text{Pengujian (10\\%)} = ${formatMax3(testing)}`;
        katex.render(tex4, mEl, { throwOnError: false, trust: true, displayMode: true });
        card4.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Standar estimasi WBS untuk alokasi risiko dan verifikasi mutu proyek}`, sub, { throwOnError: false, trust: true });
        card4.appendChild(sub);
    }

    if (card5) {
        card5.textContent = "";
        const mEl = makeEl("div");
        const isHealthy = profit >= 0 && overrun <= 0;
        const statusTex = isHealthy
            ? `\\mathbf{\\text{Status Finansial: Layak & Terkendali (Profitable & Within Budget)}}`
            : `\\mathbf{\\text{Status Finansial: Perlu Evaluasi (Defisit / Biaya Membengkak)}}`;
        katex.render(statusTex, mEl, { throwOnError: false, trust: true, displayMode: true });
        card5.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        const sumTex = `\\text{Laba: } ${formatMax3(profit)} \\; | \\; \\text{Margin: } ${formatMax3(margin)}\\% \\; | \\; \\text{LCC: } ${formatMax3(lcc)}`;
        katex.render(sumTex, sub, { throwOnError: false, trust: true });
        card5.appendChild(sub);
    }
}
