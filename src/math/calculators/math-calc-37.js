import { refs } from "../../core/dom-refs.js";
import { drawNpvMeter, clearVisual37 } from "../visuals/math-visual-37.js";
import { renderPmGuide } from "./math-calc-pm-guide.js";

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function computeNpv(c0, ct, r) {
    const rDec = r / 100;
    const pv = ct / (1 + rDec);
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
        ct,
        r,
        rDec,
        pv,
        npv,
        roi,
        status
    };
}

export function calculateMath37() {
    renderPmGuide(37);

    const errEl = document.getElementById("pm12-error-msg");
    const inC0 = refs.m37InC0 || document.getElementById("math37-in-c0");
    const inCt = refs.m37InCt || document.getElementById("math37-in-ct");
    const inR = refs.m37InR || document.getElementById("math37-in-r");
    const stepsEl = refs.m37Steps || document.getElementById("math37-steps-container");

    if (!stepsEl || !inC0 || !inCt || !inR) return;

    const rawC0 = inC0.value.trim();
    const rawCt = inCt.value.trim();
    const rawR = inR.value.trim();

    if (rawC0 === "" || rawCt === "" || rawR === "") {
        stepsEl.textContent = "";
        if (errEl) errEl.classList.add("hidden");
        clearVisual37();
        return;
    }

    const c0 = parseFloat(rawC0);
    const ct = parseFloat(rawCt);
    const r = parseFloat(rawR);

    if (isNaN(c0) || isNaN(ct) || isNaN(r) || c0 < 0 || r < 0) {
        stepsEl.textContent = "";
        if (errEl) {
            errEl.textContent = "Input C0 dan r harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual37();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const res = computeNpv(c0, ct, r);

    const rDecStr = (res.rDec).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 }).replace(/,/g, "{,}");
    const pvStr = formatCurrency(res.pv);
    const c0Str = formatCurrency(res.c0);
    const npvStr = (res.npv >= 0 ? "+" : "-") + formatCurrency(Math.abs(res.npv));

    let decisionTex = "\\text{Keputusan: } \\mathbf{\\text{DITERIMA (Add Value)}}";
    if (res.status === "DITOLAK") {
        decisionTex = "\\text{Keputusan: } \\mathbf{\\text{DITOLAK (Subtract Value)}}";
    } else if (res.status === "NETRAL") {
        decisionTex = "\\text{Keputusan: } \\mathbf{\\text{NETRAL (Indifferent)}}";
    }

    const tex = `\\begin{aligned}
NPV &= \\frac{\\htmlId{pm12-ct}{\\text{${formatCurrency(ct)}}}}{1 + \\htmlId{pm12-r}{${rDecStr}}} - \\htmlId{pm12-c0}{\\text{${c0Str}}} \\\\[4pt]
&= ${pvStr} - ${c0Str} = \\mathbf{${npvStr}} \\\\[4pt]
&\\quad ${decisionTex}
\\end{aligned}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, stepsEl, { throwOnError: false, trust: true, displayMode: true });
    } else {
        stepsEl.textContent = `NPV = $${res.npv.toFixed(2)} (${res.status})`;
    }

    drawNpvMeter(res.c0, res.ct, res.r, res.pv, res.npv);
}