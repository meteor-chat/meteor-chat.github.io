import { refs } from "../../core/dom-refs.js";
import { drawSvMeter, clearVisual29 } from "../visuals/math-visual-29.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm5Lines() {
    const container = document.getElementById("pm5-flow-container");
    const svg = document.getElementById("pm5-flow-svg");
    const inEv = refs.m29InEv || document.getElementById("math29-in-ev");
    const inPv = refs.m29InPv || document.getElementById("math29-in-pv");
    const targetEv = document.getElementById("pm5-ev");
    const targetPv = document.getElementById("pm5-pv");
    const pathEv = document.getElementById("pm5-path-ev");
    const pathPv = document.getElementById("pm5-path-pv");

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
        updatePm5Lines();
    }, { passive: true });
}

export function calculateMath29() {
    bindResize();
    const errEl = document.getElementById("pm5-error-msg");
    const pathEv = document.getElementById("pm5-path-ev");
    const pathPv = document.getElementById("pm5-path-pv");

    if (!refs.m29Steps) return;
    if (!refs.m29InEv || !refs.m29InPv) return;

    const rawEv = refs.m29InEv.value.trim();
    const rawPv = refs.m29InPv.value.trim();

    if (rawEv === "" || rawPv === "") {
        refs.m29Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathPv) pathPv.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual29();
        return;
    }

    const ev = parseFloat(rawEv);
    const pv = parseFloat(rawPv);

    if (isNaN(ev) || isNaN(pv) || ev < 0 || pv < 0) {
        refs.m29Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathPv) pathPv.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input EV dan PV harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual29();
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

    const tex = `\\htmlId{pm5-ev}{\\text{${formatCurrency(ev)}}} - \\htmlId{pm5-pv}{\\text{${formatCurrency(pv)}}} = \\mathbf{${svStr}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m29Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m29Steps.textContent = tex;
    }

    updatePm5Lines();
    requestAnimationFrame(updatePm5Lines);
    drawSvMeter(ev, pv, sv);
}
