import { refs } from "./dom-refs.js";
import { drawEacMeter, clearVisual33 } from "./math-visual-33.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm9Lines() {
    const container = document.getElementById("pm9-flow-container");
    const svg = document.getElementById("pm9-flow-svg");
    const inBac = refs.m33InBac || document.getElementById("math33-in-bac");
    const inCpi = refs.m33InCpi || document.getElementById("math33-in-cpi");
    const targetBac = document.getElementById("pm9-bac");
    const targetCpi = document.getElementById("pm9-cpi");
    const pathBac = document.getElementById("pm9-path-bac");
    const pathCpi = document.getElementById("pm9-path-cpi");

    if (!container || !svg || !inBac || !inCpi || !targetBac || !targetCpi || !pathBac || !pathCpi) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const bacRect = inBac.getBoundingClientRect();
    const cpiRect = inCpi.getBoundingClientRect();
    const tBacRect = targetBac.getBoundingClientRect();
    const tCpiRect = targetCpi.getBoundingClientRect();

    const x1Bac = bacRect.right - cRect.left;
    const y1Bac = bacRect.top + bacRect.height / 2 - cRect.top;
    const x2Bac = tBacRect.left - cRect.left - 4;
    const y2Bac = tBacRect.top + tBacRect.height / 2 - cRect.top;

    const x1Cpi = cpiRect.right - cRect.left;
    const y1Cpi = cpiRect.top + cpiRect.height / 2 - cRect.top;
    const x2Cpi = tCpiRect.left - cRect.left - 4;
    const y2Cpi = tCpiRect.top + tCpiRect.height / 2 - cRect.top;

    if (x2Bac > x1Bac + 10) {
        const dxBac = (x2Bac - x1Bac) * 0.55;
        pathBac.setAttribute("d", `M ${x1Bac} ${y1Bac} C ${x1Bac + dxBac} ${y1Bac}, ${x2Bac - dxBac} ${y2Bac}, ${x2Bac} ${y2Bac}`);
        pathBac.style.display = "";
    } else {
        pathBac.style.display = "none";
    }

    if (x2Cpi > x1Cpi + 10) {
        const dxCpi = (x2Cpi - x1Cpi) * 0.55;
        pathCpi.setAttribute("d", `M ${x1Cpi} ${y1Cpi} C ${x1Cpi + dxCpi} ${y1Cpi}, ${x2Cpi - dxCpi} ${y2Cpi}, ${x2Cpi} ${y2Cpi}`);
        pathCpi.style.display = "";
    } else {
        pathCpi.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePm9Lines();
    }, { passive: true });
}

export function calculateMath33() {
    bindResize();
    const errEl = document.getElementById("pm9-error-msg");
    const pathBac = document.getElementById("pm9-path-bac");
    const pathCpi = document.getElementById("pm9-path-cpi");

    if (!refs.m33Steps) return;
    if (!refs.m33InBac || !refs.m33InCpi) return;

    const rawBac = refs.m33InBac.value.trim();
    const rawCpi = refs.m33InCpi.value.trim();

    if (rawBac === "" || rawCpi === "") {
        refs.m33Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathCpi) pathCpi.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual33();
        return;
    }

    const bac = parseFloat(rawBac);
    const cpi = parseFloat(rawCpi);

    if (isNaN(bac) || isNaN(cpi) || bac < 0 || cpi < 0) {
        refs.m33Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathCpi) pathCpi.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input BAC dan CPI harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual33();
        return;
    }

    if (cpi === 0) {
        refs.m33Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathCpi) pathCpi.style.display = "none";
        if (errEl) {
            errEl.textContent = "Nilai CPI harus lebih besar dari 0 agar tidak terjadi pembagian dengan nol.";
            errEl.classList.remove("hidden");
        }
        clearVisual33();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const eac = bac / cpi;
    const eacNumStr = Number(eac.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const eacTexStr = `\\text{\\$${eacNumStr.replace(/,/g, "{,}")}}`;
    const cpiStr = cpi.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 }).replace(/,/g, "{,}");

    const isApprox = Math.abs(eac - Math.round(eac * 100) / 100) > 1e-6;
    const eqSymbol = isApprox ? "\\approx" : "=";

    const tex = `\\frac{\\htmlId{pm9-bac}{\\text{${formatCurrency(bac)}}}}{\\htmlId{pm9-cpi}{${cpiStr}}} ${eqSymbol} \\mathbf{${eacTexStr}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m33Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m33Steps.textContent = tex;
    }

    updatePm9Lines();
    requestAnimationFrame(updatePm9Lines);
    drawEacMeter(bac, cpi, eac);
}
