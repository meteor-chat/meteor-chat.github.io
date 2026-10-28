import { refs } from "../../core/dom-refs.js";
import { drawCvMeter, clearVisual28 } from "../visuals/math-visual-28.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm4Lines() {
    const container = document.getElementById("pm4-flow-container");
    const svg = document.getElementById("pm4-flow-svg");
    const inEv = refs.m28InEv || document.getElementById("math28-in-ev");
    const inAc = refs.m28InAc || document.getElementById("math28-in-ac");
    const targetEv = document.getElementById("pm4-ev");
    const targetAc = document.getElementById("pm4-ac");
    const pathEv = document.getElementById("pm4-path-ev");
    const pathAc = document.getElementById("pm4-path-ac");

    if (!container || !svg || !inEv || !inAc || !targetEv || !targetAc || !pathEv || !pathAc) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const evRect = inEv.getBoundingClientRect();
    const acRect = inAc.getBoundingClientRect();
    const tEvRect = targetEv.getBoundingClientRect();
    const tAcRect = targetAc.getBoundingClientRect();

    const x1Ev = evRect.right - cRect.left;
    const y1Ev = evRect.top + evRect.height / 2 - cRect.top;
    const x2Ev = tEvRect.left - cRect.left - 4;
    const y2Ev = tEvRect.top + tEvRect.height / 2 - cRect.top;

    const x1Ac = acRect.right - cRect.left;
    const y1Ac = acRect.top + acRect.height / 2 - cRect.top;
    const x2Ac = tAcRect.left + tAcRect.width / 2 - cRect.left;
    const y2Ac = tAcRect.bottom - cRect.top + 5;

    if (x2Ev > x1Ev + 10) {
        const dxEv = (x2Ev - x1Ev) * 0.55;
        pathEv.setAttribute("d", `M ${x1Ev} ${y1Ev} C ${x1Ev + dxEv} ${y1Ev}, ${x2Ev - dxEv} ${y2Ev}, ${x2Ev} ${y2Ev}`);
        pathEv.style.display = "";
    } else {
        pathEv.style.display = "none";
    }

    if (x2Ac > x1Ac + 10) {
        const yClear = Math.max(y1Ac, tEvRect.bottom - cRect.top, tAcRect.bottom - cRect.top) + 14;
        pathAc.setAttribute("d", `M ${x1Ac} ${y1Ac} C ${x1Ac + (x2Ac - x1Ac) * 0.45} ${yClear}, ${x2Ac} ${yClear}, ${x2Ac} ${y2Ac}`);
        pathAc.style.display = "";
    } else {
        pathAc.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePm4Lines();
    }, { passive: true });
}

export function calculateMath28() {
    bindResize();
    const errEl = document.getElementById("pm4-error-msg");
    const pathEv = document.getElementById("pm4-path-ev");
    const pathAc = document.getElementById("pm4-path-ac");

    if (!refs.m28Steps) return;
    if (!refs.m28InEv || !refs.m28InAc) return;

    const rawEv = refs.m28InEv.value.trim();
    const rawAc = refs.m28InAc.value.trim();

    if (rawEv === "" || rawAc === "") {
        refs.m28Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathAc) pathAc.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual28();
        return;
    }

    const ev = parseFloat(rawEv);
    const ac = parseFloat(rawAc);

    if (isNaN(ev) || isNaN(ac) || ev < 0 || ac < 0) {
        refs.m28Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathAc) pathAc.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input EV dan AC harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual28();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const cv = ev - ac;
    let cvStr;
    if (cv < 0) {
        cvStr = `-\\text{${formatCurrency(Math.abs(cv))}}`;
    } else if (cv > 0) {
        cvStr = `+\\text{${formatCurrency(cv)}}`;
    } else {
        cvStr = `\\text{${formatCurrency(0)}}`;
    }

    const tex = `\\htmlId{pm4-ev}{\\text{${formatCurrency(ev)}}} - \\htmlId{pm4-ac}{\\text{${formatCurrency(ac)}}} = \\mathbf{${cvStr}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m28Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m28Steps.textContent = tex;
    }

    updatePm4Lines();
    requestAnimationFrame(updatePm4Lines);
    drawCvMeter(ev, ac, cv);
}
