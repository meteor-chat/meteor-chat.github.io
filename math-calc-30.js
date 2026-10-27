import { refs } from "./dom-refs.js";
import { drawSvMeter, clearVisual30 } from "./math-visual-30.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm6Lines() {
    const container = document.getElementById("pm6-flow-container");
    const svg = document.getElementById("pm6-flow-svg");
    const inEv = refs.m30InEv || document.getElementById("math30-in-ev");
    const inPv = refs.m30InPv || document.getElementById("math30-in-pv");
    const targetEv = document.getElementById("pm6-ev");
    const targetPv = document.getElementById("pm6-pv");
    const pathEv = document.getElementById("pm6-path-ev");
    const pathPv = document.getElementById("pm6-path-pv");

    if (!container || !svg || !inEv || !inPv || !targetEv || !targetPv || !pathEv || !pathPv) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const evRect = inEv.getBoundingClientRect();
    const pvRect = inPv.getBoundingClientRect();
    const tEvRect = targetEv.getBoundingClientRect();
    const tPvRect = targetPv.getBoundingClientRect();

    const x1Ev = evRect.right - cRect.left;
    const y1Ev = evRect.top + evRect.height / 2 - cRect.top;
    const x2Ev = tEvRect.left - cRect.left - 4;
    const y2Ev = tEvRect.top + tEvRect.height / 2 - cRect.top;

    const x1Pv = pvRect.right - cRect.left;
    const y1Pv = pvRect.top + pvRect.height / 2 - cRect.top;
    const x2Pv = tPvRect.left + tPvRect.width / 2 - cRect.left;
    const y2Pv = tPvRect.bottom - cRect.top + 5;

    if (x2Ev > x1Ev + 10) {
        const dxEv = (x2Ev - x1Ev) * 0.55;
        pathEv.setAttribute("d", `M ${x1Ev} ${y1Ev} C ${x1Ev + dxEv} ${y1Ev}, ${x2Ev - dxEv} ${y2Ev}, ${x2Ev} ${y2Ev}`);
        pathEv.style.display = "";
    } else {
        pathEv.style.display = "none";
    }

    if (x2Pv > x1Pv + 10) {
        const yClear = Math.max(y1Pv, tEvRect.bottom - cRect.top, tPvRect.bottom - cRect.top) + 14;
        pathPv.setAttribute("d", `M ${x1Pv} ${y1Pv} C ${x1Pv + (x2Pv - x1Pv) * 0.45} ${yClear}, ${x2Pv} ${yClear}, ${x2Pv} ${y2Pv}`);
        pathPv.style.display = "";
    } else {
        pathPv.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePm6Lines();
    }, { passive: true });
}

export function calculateMath30() {
    bindResize();
    const errEl = document.getElementById("pm6-error-msg");
    const pathEv = document.getElementById("pm6-path-ev");
    const pathPv = document.getElementById("pm6-path-pv");

    if (!refs.m30Steps) return;
    if (!refs.m30InEv || !refs.m30InPv) return;

    const rawEv = refs.m30InEv.value.trim();
    const rawPv = refs.m30InPv.value.trim();

    if (rawEv === "" || rawPv === "") {
        refs.m30Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathPv) pathPv.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual30();
        return;
    }

    const ev = parseFloat(rawEv);
    const pv = parseFloat(rawPv);

    if (isNaN(ev) || isNaN(pv) || ev < 0 || pv < 0) {
        refs.m30Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathPv) pathPv.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input EV dan PV harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual30();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const sv = ev - pv;
    let svStr;
    if (sv < 0) {
        svStr = `-\\text{${formatCurrency(Math.abs(sv))}}`;
    } else if (sv > 0) {
        svStr = `+\\text{${formatCurrency(sv)}}`;
    } else {
        svStr = `\\text{${formatCurrency(0)}}`;
    }

    const tex = `\\htmlId{pm6-ev}{\\text{${formatCurrency(ev)}}} - \\htmlId{pm6-pv}{\\text{${formatCurrency(pv)}}} = \\mathbf{${svStr}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m30Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m30Steps.textContent = tex;
    }

    updatePm6Lines();
    requestAnimationFrame(updatePm6Lines);
    drawSvMeter(ev, pv, sv);
}
