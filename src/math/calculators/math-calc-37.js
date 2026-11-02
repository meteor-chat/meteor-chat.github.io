import { drawNpvCanvas } from "../visuals/math-visual-37.js";
import { renderPmGuide } from "./math-calc-pm-guide.js";

let state = {
    initial: 140000,
    rate: 0.08,
    periods: [
        { benefit: 200000, cost: 40000 },
        { benefit: 200000, cost: 40000 },
        { benefit: 200000, cost: 40000 }
    ]
};

export function computeNpv(initial, rate, periods) {
    let totDiscBen = 0;
    let totDiscCost = initial;
    let cum = -initial;
    let paybackYear = null;
    let discPaybackYear = null;

    let cumNom = -initial;
    const computedPeriods = periods.map((p, idx) => {
        const t = idx + 1;
        const net = p.benefit - p.cost;
        const df = 1 / Math.pow(1 + rate, t);
        const discBen = p.benefit * df;
        const discCost = p.cost * df;
        const discNet = net * df;

        totDiscBen += discBen;
        totDiscCost += discCost;

        const prevCum = cum;
        cum += discNet;

        const prevNom = cumNom;
        cumNom += net;

        if (prevNom < 0 && cumNom >= 0 && paybackYear === null) {
            paybackYear = (t - 1) + (-prevNom) / net;
        }

        if (prevCum < 0 && cum >= 0 && discPaybackYear === null) {
            discPaybackYear = (t - 1) + (-prevCum) / discNet;
        }

        return {
            year: t,
            benefit: p.benefit,
            cost: p.cost,
            net,
            df,
            discBen,
            discCost,
            discNet,
            discountedNet: discNet,
            cumDisc: cum,
            cumNom
        };
    });

    if (cumNom < 0) paybackYear = null;
    if (cum < 0) discPaybackYear = null;

    const npv = totDiscBen - totDiscCost;
    const roi = totDiscCost > 0 ? (npv / totDiscCost) * 100 : 0;

    return {
        initial,
        rate,
        npv,
        roi,
        totDiscBen,
        totDiscCost,
        paybackYear,
        discPaybackYear,
        periods: computedPeriods
    };
}

function renderTable(res) {
    const tbody = document.getElementById("math37-cashflow-tbody");
    if (!tbody) return;

    tbody.innerHTML = res.periods.map((p, idx) => `
        <tr>
            <td style="font-weight:600;">${p.year}</td>
            <td><input type="number" class="math37-tb-in" data-idx="${idx}" data-field="benefit" value="${p.benefit}"></td>
            <td><input type="number" class="math37-tb-in" data-idx="${idx}" data-field="cost" value="${p.cost}"></td>
            <td style="font-family:var(--mono-stack); color:${p.net >= 0 ? "#4ade80" : "#f87171"};">${p.net >= 0 ? "+" : ""}${p.net.toLocaleString("id-ID")}</td>
            <td style="font-family:var(--mono-stack); color:#94a3b8;">${p.df.toFixed(4)}</td>
            <td style="font-family:var(--mono-stack); color:${p.discNet >= 0 ? "#38bdf8" : "#f87171"};">${p.discNet >= 0 ? "+" : ""}${Math.round(p.discNet).toLocaleString("id-ID")}</td>
            <td style="font-family:var(--mono-stack); font-weight:600; color:${p.cumDisc >= 0 ? "#4ade80" : "#f87171"};">${p.cumDisc >= 0 ? "+" : ""}${Math.round(p.cumDisc).toLocaleString("id-ID")}</td>
        </tr>
    `).join("");

    tbody.querySelectorAll(".math37-tb-in").forEach((input) => {
        input.addEventListener("input", (e) => {
            const idx = parseInt(e.target.dataset.idx, 10);
            const field = e.target.dataset.field;
            const val = parseFloat(e.target.value) || 0;
            state.periods[idx][field] = val;
            calculateMath37();
        });
    });
}

function renderSteps(res) {
    const box = document.getElementById("math37-steps-container");
    if (!box) return;

    const terms = res.periods.map((p) => `\\frac{${p.net.toLocaleString("id-ID")}}{(1 + ${res.rate})^${p.year}}`).join(" + ");
    const discVals = res.periods.map((p) => `${Math.round(p.discNet).toLocaleString("id-ID")}`).join(" + ");
    const initFmt = res.initial.toLocaleString("id-ID");
    const npvFmt = Math.round(res.npv).toLocaleString("id-ID");

    const tex = `\\begin{aligned}
NPV &= \\left( ${terms} \\right) - ${initFmt} \\\\[6pt]
&= \\left( ${discVals} \\right) - ${initFmt} \\\\[6pt]
&= \\mathbf{${res.npv >= 0 ? "+" : ""}\\$${npvFmt}}
\\end{aligned}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, box, { throwOnError: false, displayMode: true });
    } else {
        box.textContent = `NPV = $${npvFmt}`;
    }
}

export function calculateMath37() {
    renderPmGuide(37);

    const inInit = document.getElementById("math37-in-initial");
    const inRate = document.getElementById("math37-in-rate");

    if (inInit) state.initial = Math.max(0, parseFloat(inInit.value) || 0);
    if (inRate) state.rate = Math.max(0, Math.min(1, (parseFloat(inRate.value) || 0) / 100));

    const res = computeNpv(state.initial, state.rate, state.periods);

    const elNpv = document.getElementById("math37-val-npv");
    const elBadge = document.getElementById("math37-status-badge");
    const elRoi = document.getElementById("math37-val-roi");
    const elPayback = document.getElementById("math37-val-payback");
    const elDiscPayback = document.getElementById("math37-val-disc-payback");

    if (elNpv) {
        elNpv.textContent = `${res.npv >= 0 ? "+" : ""}$${Math.round(res.npv).toLocaleString("id-ID")}`;
        elNpv.className = `math37-metric-val ${res.npv >= 0 ? "metric-good" : "metric-bad"}`;
    }

    if (elBadge) {
        if (res.npv > 0) {
            elBadge.textContent = "NPV > 0: DITERIMA (Menambah Nilai Perusahaan)";
            elBadge.className = "math37-badge math37-badge-accept";
        } else if (res.npv < 0) {
            elBadge.textContent = "NPV < 0: DITOLAK (Mengurangi Nilai Perusahaan)";
            elBadge.className = "math37-badge math37-badge-reject";
        } else {
            elBadge.textContent = "NPV = 0: NETRAL (Keputusan Berdasar Faktor Strategis)";
            elBadge.className = "math37-badge math37-badge-neutral";
        }
    }

    if (elRoi) elRoi.textContent = `${res.roi.toFixed(1)}%`;
    if (elPayback) elPayback.textContent = res.paybackYear !== null ? `${res.paybackYear.toFixed(2)} Tahun` : "Belum Impas";
    if (elDiscPayback) elDiscPayback.textContent = res.discPaybackYear !== null ? `${res.discPaybackYear.toFixed(2)} Tahun` : "Belum Impas";

    renderTable(res);
    renderSteps(res);

    const canvas = document.getElementById("math37-canvas");
    if (canvas) {
        drawNpvCanvas(canvas, {
            initial: res.initial,
            periods: res.periods,
            npv: res.npv,
            paybackYear: res.discPaybackYear || res.paybackYear
        });
    }
}

export function applyNpvPreset(name) {
    if (name === "jwd") {
        state = {
            initial: 140000,
            rate: 0.08,
            periods: [
                { benefit: 200000, cost: 40000 },
                { benefit: 200000, cost: 40000 },
                { benefit: 200000, cost: 40000 }
            ]
        };
    } else if (name === "proj1") {
        state = {
            initial: 5000,
            rate: 0.10,
            periods: [
                { benefit: 2000, cost: 1000 },
                { benefit: 3000, cost: 1000 },
                { benefit: 4000, cost: 1000 },
                { benefit: 5000, cost: 1000 }
            ]
        };
    } else if (name === "proj2") {
        state = {
            initial: 1000,
            rate: 0.10,
            periods: [
                { benefit: 2000, cost: 2000 },
                { benefit: 4000, cost: 2000 },
                { benefit: 4000, cost: 2000 },
                { benefit: 4000, cost: 2000 }
            ]
        };
    } else {
        state = {
            initial: 10000,
            rate: 0.10,
            periods: [
                { benefit: 4000, cost: 1000 },
                { benefit: 5000, cost: 1000 },
                { benefit: 6000, cost: 1000 }
            ]
        };
    }

    const inInit = document.getElementById("math37-in-initial");
    const inRate = document.getElementById("math37-in-rate");
    if (inInit) inInit.value = state.initial;
    if (inRate) inRate.value = (state.rate * 100).toFixed(1);

    document.querySelectorAll(".math37-preset-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.preset === name);
    });

    calculateMath37();
}

let eventsBound = false;
export function initMath37() {
    if (eventsBound) {
        calculateMath37();
        return;
    }
    eventsBound = true;

    document.querySelectorAll(".math37-preset-btn").forEach((btn) => {
        btn.addEventListener("click", () => applyNpvPreset(btn.dataset.preset));
    });

    const inInit = document.getElementById("math37-in-initial");
    const inRate = document.getElementById("math37-in-rate");
    if (inInit) inInit.addEventListener("input", calculateMath37);
    if (inRate) inRate.addEventListener("input", calculateMath37);

    const btnAdd = document.getElementById("math37-btn-add-year");
    if (btnAdd) {
        btnAdd.addEventListener("click", () => {
            if (state.periods.length >= 10) return;
            const last = state.periods[state.periods.length - 1] || { benefit: 3000, cost: 1000 };
            state.periods.push({ benefit: last.benefit, cost: last.cost });
            calculateMath37();
        });
    }

    const btnRem = document.getElementById("math37-btn-remove-year");
    if (btnRem) {
        btnRem.addEventListener("click", () => {
            if (state.periods.length <= 1) return;
            state.periods.pop();
            calculateMath37();
        });
    }

    applyNpvPreset("jwd");
}
