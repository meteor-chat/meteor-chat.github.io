import { refs } from "../../core/dom-refs.js";
import { drawEacMeter, clearVisual32 } from "../visuals/math-visual-32.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm8Lines() {
    const container = document.getElementById("pm8-flow-container");
    const svg = document.getElementById("pm8-flow-svg");
    const inBac = refs.m32InBac || document.getElementById("math32-in-bac");
    const inCpi = refs.m32InCpi || document.getElementById("math32-in-cpi");
    const targetBac = document.getElementById("pm8-bac");
    const targetCpi = document.getElementById("pm8-cpi");
    const pathBac = document.getElementById("pm8-path-bac");
    const pathCpi = document.getElementById("pm8-path-cpi");

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
        updatePm8Lines();
    }, { passive: true });
}

export function calculateMath32() {
    bindResize();
    const errEl = document.getElementById("pm8-error-msg");
    const pathBac = document.getElementById("pm8-path-bac");
    const pathCpi = document.getElementById("pm8-path-cpi");

    if (!refs.m32Steps) return;
    if (!refs.m32InBac || !refs.m32InCpi) return;

    const rawBac = refs.m32InBac.value.trim();
    const rawCpi = refs.m32InCpi.value.trim();

    if (rawBac === "" || rawCpi === "") {
        refs.m32Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathCpi) pathCpi.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual32();
        return;
    }

    const bac = parseFloat(rawBac);
    const cpi = parseFloat(rawCpi);

    if (isNaN(bac) || isNaN(cpi) || bac < 0 || cpi < 0) {
        refs.m32Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathCpi) pathCpi.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input BAC dan CPI harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual32();
        return;
    }

    if (cpi === 0) {
        refs.m32Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathCpi) pathCpi.style.display = "none";
        if (errEl) {
            errEl.textContent = "Nilai CPI harus lebih besar dari 0 agar tidak terjadi pembagian dengan nol.";
            errEl.classList.remove("hidden");
        }
        clearVisual32();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const eac = bac / cpi;
    const eacNumStr = Number(eac.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const eacTexStr = `\\text{\\$${eacNumStr.replace(/,/g, "{,}")}}`;
    const cpiStr = cpi.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 }).replace(/,/g, "{,}");

    const isApprox = Math.abs(eac - Math.round(eac * 100) / 100) > 1e-6;
    const eqSymbol = isApprox ? "\\approx" : "=";

    const tex = `\\frac{\\htmlId{pm8-bac}{\\text{${formatCurrency(bac)}}}}{\\htmlId{pm8-cpi}{${cpiStr}}} ${eqSymbol} \\mathbf{${eacTexStr}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m32Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m32Steps.textContent = tex;
    }

    updatePm8Lines();
    requestAnimationFrame(updatePm8Lines);
    drawEacMeter(bac, cpi, eac);
}
