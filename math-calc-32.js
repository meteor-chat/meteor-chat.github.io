import { refs } from "./dom-refs.js";
import { drawSpiMeter, clearVisual32 } from "./math-visual-32.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm8Lines() {
    const container = document.getElementById("pm8-flow-container");
    const svg = document.getElementById("pm8-flow-svg");
    const inEv = refs.m32InEv || document.getElementById("math32-in-ev");
    const inPv = refs.m32InPv || document.getElementById("math32-in-pv");
    const targetEv = document.getElementById("pm8-ev");
    const targetPv = document.getElementById("pm8-pv");
    const pathEv = document.getElementById("pm8-path-ev");
    const pathPv = document.getElementById("pm8-path-pv");

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
    const x2Pv = tPvRect.left - cRect.left - 4;
    const y2Pv = tPvRect.top + tPvRect.height / 2 - cRect.top;

    if (x2Ev > x1Ev + 10) {
        const dxEv = (x2Ev - x1Ev) * 0.55;
        pathEv.setAttribute("d", `M ${x1Ev} ${y1Ev} C ${x1Ev + dxEv} ${y1Ev}, ${x2Ev - dxEv} ${y2Ev}, ${x2Ev} ${y2Ev}`);
        pathEv.style.display = "";
    } else {
        pathEv.style.display = "none";
    }

    if (x2Pv > x1Pv + 10) {
        const dxPv = (x2Pv - x1Pv) * 0.55;
        pathPv.setAttribute("d", `M ${x1Pv} ${y1Pv} C ${x1Pv + dxPv} ${y1Pv}, ${x2Pv - dxPv} ${y2Pv}, ${x2Pv} ${y2Pv}`);
        pathPv.style.display = "";
    } else {
        pathPv.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePm8Lines();
    }, { passive: true });
}

export function calculateMath32() {
    bindResize();
    const errEl = document.getElementById("pm8-error-msg");
    const pathEv = document.getElementById("pm8-path-ev");
    const pathPv = document.getElementById("pm8-path-pv");

    if (!refs.m32Steps) return;
    if (!refs.m32InEv || !refs.m32InPv) return;

    const rawEv = refs.m32InEv.value.trim();
    const rawPv = refs.m32InPv.value.trim();

    if (rawEv === "" || rawPv === "") {
        refs.m32Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathPv) pathPv.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual32();
        return;
    }

    const ev = parseFloat(rawEv);
    const pv = parseFloat(rawPv);

    if (isNaN(ev) || isNaN(pv) || ev < 0 || pv < 0) {
        refs.m32Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathPv) pathPv.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input EV dan PV harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual32();
        return;
    }

    if (pv === 0) {
        refs.m32Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathPv) pathPv.style.display = "none";
        if (errEl) {
            errEl.textContent = "Planned Value (PV) harus lebih besar dari 0 agar tidak terjadi pembagian dengan nol.";
            errEl.classList.remove("hidden");
        }
        clearVisual32();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const spi = ev / pv;
    const spiNumStr = Number(spi.toFixed(4)).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    const spiTexStr = spiNumStr.replace(/,/g, "{,}");
    const pctStr = (spi * 100).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, "{,}") + "\\%";

    const isApprox = Math.abs(spi - Math.round(spi * 100) / 100) > 1e-6;
    const eqSymbol = isApprox ? "\\approx" : "=";

    const tex = `\\frac{\\htmlId{pm8-ev}{\\text{${formatCurrency(ev)}}}}{\\htmlId{pm8-pv}{\\text{${formatCurrency(pv)}}}} ${eqSymbol} \\mathbf{${spiTexStr}} \\text{ (atau } ${pctStr}\\text{)}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m32Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m32Steps.textContent = tex;
    }

    updatePm8Lines();
    requestAnimationFrame(updatePm8Lines);
    drawSpiMeter(ev, pv, spi);
}
