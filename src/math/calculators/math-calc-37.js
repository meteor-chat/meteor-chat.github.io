import { refs } from "../../core/dom-refs.js";
import { drawNpvMeter, clearVisual37 } from "../visuals/math-visual-37.js";
import { renderPmGuide } from "./math-calc-pm-guide.js";

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function computeNpv(c0, ctList, r) {
    const list = Array.isArray(ctList) ? ctList : [ctList];
    const rDec = r / 100;

    let pv = 0;
    const pvList = list.map((ctVal, idx) => {
        const t = idx + 1;
        const df = 1 / Math.pow(1 + rDec, t);
        const itemPv = (parseFloat(ctVal) || 0) * df;
        pv += itemPv;
        return { t, ct: parseFloat(ctVal) || 0, df, itemPv };
    });

    const npv = pv - c0;
    const roi = c0 > 0 ? (npv / c0) * 100 : 0;

    let status = "NETRAL";
    if (npv > 0.005) {
        status = "DITERIMA";
    } else if (npv < -0.005) {
        status = "DITOLAK";
    }

    return {
        c0,
        ctList: list.map((v) => parseFloat(v) || 0),
        r,
        rDec,
        pvList,
        pv,
        npv,
        roi,
        status
    };
}

function reindexCtRows() {
    const container = document.getElementById("math37-ct-list");
    if (!container) return;
    const rows = container.querySelectorAll(".math37-ct-row");
    rows.forEach((row, idx) => {
        const t = idx + 1;
        row.dataset.t = String(t);
        const label = row.querySelector(".pm-flow-label");
        if (label) label.textContent = `Arus Kas C${t} (Tahun ${t})`;
        const input = row.querySelector(".math37-in-ct");
        if (input) {
            input.id = `math37-in-ct-${t}`;
            input.dataset.t = String(t);
        }
    });
}

function attachCtRowListeners(row) {
    const input = row.querySelector(".math37-in-ct");
    if (input) {
        input.addEventListener("input", () => {
            calculateMath37();
            ensureNextCtInput();
        });
    }

    const btnDel = row.querySelector(".math37-btn-del-ct");
    if (btnDel) {
        btnDel.addEventListener("click", () => {
            row.remove();
            reindexCtRows();
            calculateMath37();
            ensureNextCtInput();
        });
    }
}

function ensureNextCtInput() {
    const container = document.getElementById("math37-ct-list");
    if (!container) return;

    const rows = container.querySelectorAll(".math37-ct-row");
    if (rows.length >= 15) return;

    const lastRow = rows[rows.length - 1];
    if (!lastRow) return;

    const lastInput = lastRow.querySelector(".math37-in-ct");
    if (lastInput && lastInput.value.trim() !== "") {
        const nextT = rows.length + 1;
        const newRow = document.createElement("div");
        newRow.className = "pm-input-row math37-ct-row";
        newRow.dataset.t = String(nextT);
        newRow.innerHTML = `
            <label for="math37-in-ct-${nextT}" class="pm-flow-label">Arus Kas C${nextT} (Tahun ${nextT})</label>
            <div class="pm-ct-input-wrap">
                <input type="number" id="math37-in-ct-${nextT}" class="pm-flow-input pm-input-currency math37-in-ct" data-t="${nextT}" value="" step="any" placeholder="masukkan C${nextT}...">
                <button type="button" class="math37-btn-del-ct" data-t="${nextT}" aria-label="Hapus">&times;</button>
            </div>
        `;
        container.appendChild(newRow);
        attachCtRowListeners(newRow);
    }
}

export function calculateMath37() {
    renderPmGuide(37);

    const errEl = document.getElementById("pm12-error-msg");
    const inC0 = refs.m37InC0 || document.getElementById("math37-in-c0");
    const inR = refs.m37InR || document.getElementById("math37-in-r");
    const stepsEl = refs.m37Steps || document.getElementById("math37-steps-container");
    const container = document.getElementById("math37-ct-list");

    if (!stepsEl || !inC0 || !inR || !container) return;

    const ctInputs = container.querySelectorAll(".math37-in-ct");
    const rawC0 = inC0.value.trim();
    const rawR = inR.value.trim();

    if (rawC0 === "" || rawR === "" || ctInputs.length === 0) {
        stepsEl.textContent = "";
        if (errEl) errEl.classList.add("hidden");
        clearVisual37();
        return;
    }

    const c0 = parseFloat(rawC0);
    const r = parseFloat(rawR);

    if (isNaN(c0) || isNaN(r) || c0 < 0 || r < 0) {
        stepsEl.textContent = "";
        if (errEl) {
            errEl.textContent = "Input C0 dan r harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual37();
        return;
    }

    const rawList = [];
    ctInputs.forEach((input) => {
        const val = input.value.trim();
        if (val !== "") rawList.push(parseFloat(val) || 0);
    });

    if (rawList.length === 0) {
        stepsEl.textContent = "";
        if (errEl) errEl.classList.add("hidden");
        clearVisual37();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const res = computeNpv(c0, rawList, r);

    const rDecStr = (res.rDec).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 }).replace(/,/g, "{,}");
    const c0Str = formatCurrency(res.c0);
    const pvStr = formatCurrency(res.pv);
    const npvStr = (res.npv >= 0 ? "+" : "-") + formatCurrency(Math.abs(res.npv));

    let decisionTex = "\\text{Keputusan: } \\mathbf{\\text{DITERIMA (Add Value)}}";
    if (res.status === "DITOLAK") {
        decisionTex = "\\text{Keputusan: } \\mathbf{\\text{DITOLAK (Subtract Value)}}";
    } else if (res.status === "NETRAL") {
        decisionTex = "\\text{Keputusan: } \\mathbf{\\text{NETRAL (Indifferent)}}";
    }

    let tex = "";
    if (res.pvList.length === 1) {
        const singleCt = res.pvList[0].ct;
        tex = `\\begin{aligned}
NPV &= \\frac{\\htmlId{pm12-ct-1}{\\text{${formatCurrency(singleCt)}}}}{1 + \\htmlId{pm12-r}{${rDecStr}}} - \\htmlId{pm12-c0}{\\text{${c0Str}}} \\\\[4pt]
&= ${pvStr} - ${c0Str} = \\mathbf{${npvStr}} \\\\[4pt]
&\\quad ${decisionTex}
\\end{aligned}`;
    } else {
        const termsTex = res.pvList.map((p) => `\\frac{\\text{${formatCurrency(p.ct)}}}{(1 + ${rDecStr})^${p.t}}`).join(" + ");
        const pvValsTex = res.pvList.map((p) => formatCurrency(p.itemPv)).join(" + ");
        tex = `\\begin{aligned}
NPV &= \\left( ${termsTex} \\right) - \\htmlId{pm12-c0}{\\text{${c0Str}}} \\\\[4pt]
&= \\left( ${pvValsTex} \\right) - ${c0Str} \\\\[4pt]
&= ${pvStr} - ${c0Str} = \\mathbf{${npvStr}} \\\\[4pt]
&\\quad ${decisionTex}
\\end{aligned}`;
    }

    if (typeof katex !== "undefined") {
        katex.render(tex, stepsEl, { throwOnError: false, trust: true, displayMode: true });
    } else {
        stepsEl.textContent = `NPV = $${res.npv.toFixed(2)} (${res.status})`;
    }

    drawNpvMeter(res.c0, res.ctList, res.r, res.pv, res.npv);
}

let initDone = false;
export function initMath37() {
    const container = document.getElementById("math37-ct-list");
    if (!container) return;

    if (!initDone) {
        initDone = true;
        const initialRows = container.querySelectorAll(".math37-ct-row");
        initialRows.forEach((row) => attachCtRowListeners(row));

        const inC0 = refs.m37InC0 || document.getElementById("math37-in-c0");
        const inR = refs.m37InR || document.getElementById("math37-in-r");
        if (inC0) inC0.addEventListener("input", calculateMath37);
        if (inR) inR.addEventListener("input", calculateMath37);
    }

    ensureNextCtInput();
    calculateMath37();
}