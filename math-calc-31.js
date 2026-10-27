import { refs } from "./dom-refs.js";
import { drawCpiMeter, clearVisual31 } from "./math-visual-31.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm7Lines() {
    const container = document.getElementById("pm7-flow-container");
    const svg = document.getElementById("pm7-flow-svg");
    const inEv = refs.m31InEv || document.getElementById("math31-in-ev");
    const inAc = refs.m31InAc || document.getElementById("math31-in-ac");
    const targetEv = document.getElementById("pm7-ev");
    const targetAc = document.getElementById("pm7-ac");
    const pathEv = document.getElementById("pm7-path-ev");
    const pathAc = document.getElementById("pm7-path-ac");

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
    const x2Ac = tAcRect.left - cRect.left - 4;
    const y2Ac = tAcRect.top + tAcRect.height / 2 - cRect.top;

    if (x2Ev > x1Ev + 10) {
        const dxEv = (x2Ev - x1Ev) * 0.55;
        pathEv.setAttribute("d", `M ${x1Ev} ${y1Ev} C ${x1Ev + dxEv} ${y1Ev}, ${x2Ev - dxEv} ${y2Ev}, ${x2Ev} ${y2Ev}`);
        pathEv.style.display = "";
    } else {
        pathEv.style.display = "none";
    }

    if (x2Ac > x1Ac + 10) {
        const dxAc = (x2Ac - x1Ac) * 0.55;
        pathAc.setAttribute("d", `M ${x1Ac} ${y1Ac} C ${x1Ac + dxAc} ${y1Ac}, ${x2Ac - dxAc} ${y2Ac}, ${x2Ac} ${y2Ac}`);
        pathAc.style.display = "";
    } else {
        pathAc.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePm7Lines();
    }, { passive: true });
}

export function calculateMath31() {
    bindResize();
    const errEl = document.getElementById("pm7-error-msg");
    const pathEv = document.getElementById("pm7-path-ev");
    const pathAc = document.getElementById("pm7-path-ac");

    if (!refs.m31Steps) return;
    if (!refs.m31InEv || !refs.m31InAc) return;

    const rawEv = refs.m31InEv.value.trim();
    const rawAc = refs.m31InAc.value.trim();

    if (rawEv === "" || rawAc === "") {
        refs.m31Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathAc) pathAc.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual31();
        return;
    }

    const ev = parseFloat(rawEv);
    const ac = parseFloat(rawAc);

    if (isNaN(ev) || isNaN(ac) || ev < 0 || ac < 0) {
        refs.m31Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathAc) pathAc.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input EV dan AC harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual31();
        return;
    }

    if (ac === 0) {
        refs.m31Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathAc) pathAc.style.display = "none";
        if (errEl) {
            errEl.textContent = "Biaya aktual (AC) harus lebih besar dari 0 agar tidak terjadi pembagian dengan nol.";
            errEl.classList.remove("hidden");
        }
        clearVisual31();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const cpi = ev / ac;
    const cpiNumStr = Number(cpi.toFixed(4)).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
    const cpiTexStr = cpiNumStr.replace(/,/g, "{,}");
    const pctStr = (cpi * 100).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, "{,}") + "\\%";

    const isApprox = Math.abs(cpi - Math.round(cpi)) > 1e-6;
    const eqSymbol = isApprox ? "\\approx" : "=";

    const tex = `\\frac{\\htmlId{pm7-ev}{\\text{${formatCurrency(ev)}}}}{\\htmlId{pm7-ac}{\\text{${formatCurrency(ac)}}}} ${eqSymbol} \\mathbf{${cpiTexStr}} \\text{ (atau } ${pctStr}\\text{)}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m31Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m31Steps.textContent = tex;
    }

    updatePm7Lines();
    requestAnimationFrame(updatePm7Lines);
    drawCpiMeter(ev, ac, cpi);
}
