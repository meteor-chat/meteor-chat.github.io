import { refs } from "./dom-refs.js";
import { drawEtcCostMeter, clearVisual34 } from "./math-visual-34.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function updatePm10Lines() {
    const container = document.getElementById("pm10-flow-container");
    const svg = document.getElementById("pm10-flow-svg");
    const inEac = refs.m34InEac || document.getElementById("math34-in-eac");
    const inAc = refs.m34InAc || document.getElementById("math34-in-ac");
    const targetEac = document.getElementById("pm10-eac");
    const targetAc = document.getElementById("pm10-ac");
    const pathEac = document.getElementById("pm10-path-eac");
    const pathAc = document.getElementById("pm10-path-ac");

    if (!container || !svg || !inEac || !inAc || !targetEac || !targetAc || !pathEac || !pathAc) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const eacRect = inEac.getBoundingClientRect();
    const acRect = inAc.getBoundingClientRect();
    const tEacRect = targetEac.getBoundingClientRect();
    const tAcRect = targetAc.getBoundingClientRect();

    const x1Eac = eacRect.right - cRect.left;
    const y1Eac = eacRect.top + eacRect.height / 2 - cRect.top;
    const x2Eac = tEacRect.left - cRect.left - 4;
    const y2Eac = tEacRect.top + tEacRect.height / 2 - cRect.top;

    const x1Ac = acRect.right - cRect.left;
    const y1Ac = acRect.top + acRect.height / 2 - cRect.top;
    const x2Ac = tAcRect.left + tAcRect.width / 2 - cRect.left;
    const y2Ac = tAcRect.bottom - cRect.top + 5;

    if (x2Eac > x1Eac + 10) {
        const dxEac = (x2Eac - x1Eac) * 0.55;
        pathEac.setAttribute("d", `M ${x1Eac} ${y1Eac} C ${x1Eac + dxEac} ${y1Eac}, ${x2Eac - dxEac} ${y2Eac}, ${x2Eac} ${y2Eac}`);
        pathEac.style.display = "";
    } else {
        pathEac.style.display = "none";
    }

    if (x2Ac > x1Ac + 10) {
        const yClear = Math.max(y1Ac, tEacRect.bottom - cRect.top, tAcRect.bottom - cRect.top) + 14;
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
        updatePm10Lines();
    }, { passive: true });
}

export function calculateMath34() {
    bindResize();
    const errEl = document.getElementById("pm10-error-msg");
    const pathEac = document.getElementById("pm10-path-eac");
    const pathAc = document.getElementById("pm10-path-ac");

    if (!refs.m34Steps) return;
    if (!refs.m34InEac || !refs.m34InAc) return;

    const rawEac = refs.m34InEac.value.trim();
    const rawAc = refs.m34InAc.value.trim();

    if (rawEac === "" || rawAc === "") {
        refs.m34Steps.textContent = "";
        if (pathEac) pathEac.style.display = "none";
        if (pathAc) pathAc.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual34();
        return;
    }

    const eac = parseFloat(rawEac);
    const ac = parseFloat(rawAc);

    if (isNaN(eac) || isNaN(ac) || eac < 0 || ac < 0) {
        refs.m34Steps.textContent = "";
        if (pathEac) pathEac.style.display = "none";
        if (pathAc) pathAc.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input EAC dan AC harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual34();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const etc = eac - ac;
    const etcNumStr = Number(etc.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const etcTexStr = etc < 0 ? `-\\text{\\$${Math.abs(etc).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, "{,}")}}` : `\\text{\\$${etcNumStr.replace(/,/g, "{,}")}}`;

    const eacNumStr = Number(eac.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const eacTexStr = `\\text{\\$${eacNumStr.replace(/,/g, "{,}")}}`;

    const acNumStr = Number(ac.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const acTexStr = `\\text{\\$${acNumStr.replace(/,/g, "{,}")}}`;

    const tex = `\\htmlId{pm10-eac}{${eacTexStr}} - \\htmlId{pm10-ac}{${acTexStr}} = \\mathbf{${etcTexStr}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m34Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m34Steps.textContent = tex;
    }

    updatePm10Lines();
    requestAnimationFrame(updatePm10Lines);
    drawEtcCostMeter(eac, ac, etc);
}
