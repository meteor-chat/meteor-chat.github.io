import { formatMax3 } from "./math-format.js";
import { makeEl } from "./math-calc-1-tokens.js";

export function renderEvmTopFormula() {
    if (typeof katex === "undefined") return;
    const topBox = document.getElementById("math-calc-formula-display-25");
    if (topBox) {
        topBox.textContent = "";
        const topTex = "EVM: \\; \\text{CPI} = \\frac{\\htmlClass{evm-token-ev}{\\text{EV}}}{\\htmlClass{evm-token-ac}{\\text{AC}}}, \\; \\text{SPI} = \\frac{\\htmlClass{evm-token-ev}{\\text{EV}}}{\\htmlClass{evm-token-pv}{\\text{PV}}}, \\; \\text{EAC} = \\frac{\\htmlClass{evm-token-bac}{\\text{BAC}}}{\\htmlClass{evm-token-cpi}{\\text{CPI}}}";
        katex.render(topTex, topBox, { throwOnError: false, trust: true, displayMode: false });
    }
}

function getIntermediateElements() {
    return [
        document.getElementById("m25-card-step2"),
        document.getElementById("m25-arrow-2"),
        document.getElementById("m25-card-step3"),
        document.getElementById("m25-arrow-3"),
        document.getElementById("m25-card-step4"),
        document.getElementById("m25-arrow-4"),
        document.getElementById("m25-card-step5"),
        document.getElementById("m25-arrow-5")
    ];
}

export function renderEvmCards(bac, plannedPct, actualPct, ac, planTime) {
    if (typeof katex === "undefined") return;
    renderEvmTopFormula();

    const card1 = document.getElementById("m25-card-step1");
    const intermediateEls = getIntermediateElements();
    const card6 = document.getElementById("m25-card-step6");

    const hasData = bac !== null && plannedPct !== null && actualPct !== null && ac !== null;

    if (!hasData) {
        if (card1) {
            card1.textContent = "";
            const tex1 = "\\text{PV} = \\text{BAC} \\times \\%\\text{Plan}, \\; \\text{EV} = \\text{BAC} \\times \\%\\text{Actual}, \\; \\text{RP} = \\frac{\\%\\text{Actual}}{\\%\\text{Plan}}";
            katex.render(tex1, card1, { throwOnError: false, trust: true, displayMode: true });
        }
        intermediateEls.forEach((el) => el && el.classList.add("hidden"));
        if (card6) {
            card6.textContent = "";
            katex.render("\\text{Status Proyek} = ?", card6, { throwOnError: false, trust: true, displayMode: true });
        }
        return;
    }

    intermediateEls.forEach((el) => el && el.classList.remove("hidden"));

    const pv = bac * (plannedPct / 100);
    const ev = bac * (actualPct / 100);
    const rp = plannedPct > 0 ? (actualPct / plannedPct) : 0;
    const cv = ev - ac;
    const sv = ev - pv;
    const cpi = ac > 0 ? (ev / ac) : 0;
    const spi = pv > 0 ? (ev / pv) : 0;
    const eac = cpi > 0 ? (bac / cpi) : 0;
    const etc = eac > 0 ? (eac - ac) : 0;
    const vac = eac > 0 ? (bac - eac) : 0;
    const estTime = (spi > 0 && planTime !== null && planTime > 0) ? (planTime / spi) : null;

    const tokenBac = `\\htmlClass{evm-token-bac}{${formatMax3(bac)}}`;
    const tokenPv = `\\htmlClass{evm-token-pv}{${formatMax3(pv)}}`;
    const tokenEv = `\\htmlClass{evm-token-ev}{${formatMax3(ev)}}`;
    const tokenAc = `\\htmlClass{evm-token-ac}{${formatMax3(ac)}}`;
    const tokenCpi = `\\htmlClass{evm-token-cpi}{${formatMax3(cpi)}}`;
    const tokenSpi = `\\htmlClass{evm-token-spi}{${formatMax3(spi)}}`;

    if (card1) {
        card1.textContent = "";
        const mEl = makeEl("div");
        const tex1 = `\\text{PV} = ${tokenBac} \\times ${formatMax3(plannedPct)}\\% = ${tokenPv}, \\; \\text{EV} = ${tokenBac} \\times ${formatMax3(actualPct)}\\% = ${tokenEv}`;
        katex.render(tex1, mEl, { throwOnError: false, trust: true, displayMode: true });
        card1.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Rate of Performance (RP)} = \\frac{${formatMax3(actualPct)}\\%}{${formatMax3(plannedPct)}\\%} = ${formatMax3(rp * 100)}\\%`, sub, { throwOnError: false, trust: true });
        card1.appendChild(sub);
    }

    const card2 = document.getElementById("m25-card-step2");
    if (card2) {
        card2.textContent = "";
        const mEl = makeEl("div");
        const cvWrap = cv < 0 ? `(${formatMax3(cv)})` : formatMax3(cv);
        const svWrap = sv < 0 ? `(${formatMax3(sv)})` : formatMax3(sv);
        const tex2 = `\\text{CV} = ${tokenEv} - ${tokenAc} = ${cvWrap}, \\; \\text{SV} = ${tokenEv} - ${tokenPv} = ${svWrap}`;
        katex.render(tex2, mEl, { throwOnError: false, trust: true, displayMode: true });
        card2.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        const cvText = cv < 0 ? "\\text{Biaya membengkak (over budget)}" : (cv > 0 ? "\\text{Biaya hemat (under budget)}" : "\\text{Biaya tepat anggaran}");
        const svText = sv < 0 ? "\\text{Proyek terlambat (behind schedule)}" : (sv > 0 ? "\\text{Proyek lebih cepat (ahead of schedule)}" : "\\text{Proyek tepat jadwal}");
        katex.render(`${cvText} \\; | \\; ${svText}`, sub, { throwOnError: false, trust: true });
        card2.appendChild(sub);
    }

    const card3 = document.getElementById("m25-card-step3");
    if (card3) {
        card3.textContent = "";
        const mEl = makeEl("div");
        const tex3 = `\\text{CPI} = \\frac{${tokenEv}}{${tokenAc}} = ${tokenCpi}, \\; \\text{SPI} = \\frac{${tokenEv}}{${tokenPv}} = ${tokenSpi}`;
        katex.render(tex3, mEl, { throwOnError: false, trust: true, displayMode: true });
        card3.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        const cpiPct = formatMax3(cpi * 100);
        const spiPct = formatMax3(spi * 100);
        katex.render(`\\text{Efektivitas Biaya: } ${cpiPct}\\% \\; | \\; \\text{Efektivitas Jadwal: } ${spiPct}\\%`, sub, { throwOnError: false, trust: true });
        card3.appendChild(sub);
    }

    const card4 = document.getElementById("m25-card-step4");
    if (card4) {
        card4.textContent = "";
        const mEl = makeEl("div");
        const tex4 = `\\text{EAC} = \\frac{${tokenBac}}{${tokenCpi}} = ${formatMax3(eac)}, \\; \\text{ETC} = ${formatMax3(eac)} - ${tokenAc} = ${formatMax3(etc)}`;
        katex.render(tex4, mEl, { throwOnError: false, trust: true, displayMode: true });
        card4.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        katex.render(`\\text{Proyeksi total biaya akhir (EAC) dan estimasi sisa dana penyelesaian (ETC)}`, sub, { throwOnError: false, trust: true });
        card4.appendChild(sub);
    }

    const card5 = document.getElementById("m25-card-step5");
    if (card5) {
        card5.textContent = "";
        const mEl = makeEl("div");
        const vacWrap = vac < 0 ? `(${formatMax3(vac)})` : formatMax3(vac);
        let tex5 = `\\text{VAC} = ${tokenBac} - ${formatMax3(eac)} = ${vacWrap}`;
        if (estTime !== null) {
            tex5 += `, \\; \\text{Waktu Akhir} = \\frac{${formatMax3(planTime)}}{${tokenSpi}} = ${formatMax3(estTime)}`;
        }
        katex.render(tex5, mEl, { throwOnError: false, trust: true, displayMode: true });
        card5.appendChild(mEl);
        const sub = makeEl("div", "chromo-card-subnote");
        const vacDesc = vac < 0 ? `\\text{Defisit akhir sebesar } ${formatMax3(Math.abs(vac))}` : `\\text{Surplus akhir sebesar } ${formatMax3(vac)}`;
        katex.render(vacDesc, sub, { throwOnError: false, trust: true });
        card5.appendChild(sub);
    }

    if (card6) {
        card6.textContent = "";
        const mEl = makeEl("div");
        let statusTitle = "\\text{Kondisi Proyek: On Track}";
        if (cpi < 1 && spi < 1) {
            statusTitle = "\\text{Kondisi Proyek: Kritis (Over Budget & Behind Schedule)}";
        } else if (cpi < 1) {
            statusTitle = "\\text{Kondisi Proyek: Anggaran Membengkak (Over Budget)}";
        } else if (spi < 1) {
            statusTitle = "\\text{Kondisi Proyek: Jadwal Terlambat (Behind Schedule)}";
        } else if (cpi >= 1 && spi >= 1) {
            statusTitle = "\\text{Kondisi Proyek: Unggul (Under Budget & Ahead of Schedule)}";
        }
        const tex6 = `\\mathbf{${statusTitle}}`;
        katex.render(tex6, mEl, { throwOnError: false, trust: true, displayMode: true });
        card6.appendChild(mEl);

        const sub = makeEl("div", "chromo-card-subnote");
        const summaryTex = `\\text{CPI} = ${formatMax3(cpi)} \\; | \\; \\text{SPI} = ${formatMax3(spi)} \\; | \\; \\text{EAC} = ${formatMax3(eac)} \\; | \\; \\text{VAC} = ${formatMax3(vac)}`;
        katex.render(summaryTex, sub, { throwOnError: false, trust: true });
        card6.appendChild(sub);
    }
}
