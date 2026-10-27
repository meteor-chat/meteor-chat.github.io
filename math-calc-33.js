import { refs } from "./dom-refs.js";
import { drawEtcMeter, clearVisual33 } from "./math-visual-33.js?v=13";

let resizeBound = false;

export function updatePm9Lines() {
    const container = document.getElementById("pm9-flow-container");
    const svg = document.getElementById("pm9-flow-svg");
    const inOte = refs.m33InOte || document.getElementById("math33-in-ote");
    const inSpi = refs.m33InSpi || document.getElementById("math33-in-spi");
    const targetOte = document.getElementById("pm9-ote");
    const targetSpi = document.getElementById("pm9-spi");
    const pathOte = document.getElementById("pm9-path-ote");
    const pathSpi = document.getElementById("pm9-path-spi");

    if (!container || !svg || !inOte || !inSpi || !targetOte || !targetSpi || !pathOte || !pathSpi) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const oteRect = inOte.getBoundingClientRect();
    const spiRect = inSpi.getBoundingClientRect();
    const tOteRect = targetOte.getBoundingClientRect();
    const tSpiRect = targetSpi.getBoundingClientRect();

    const x1Ote = oteRect.right - cRect.left;
    const y1Ote = oteRect.top + oteRect.height / 2 - cRect.top;
    const x2Ote = tOteRect.left - cRect.left - 4;
    const y2Ote = tOteRect.top + tOteRect.height / 2 - cRect.top;

    const x1Spi = spiRect.right - cRect.left;
    const y1Spi = spiRect.top + spiRect.height / 2 - cRect.top;
    const x2Spi = tSpiRect.left - cRect.left - 4;
    const y2Spi = tSpiRect.top + tSpiRect.height / 2 - cRect.top;

    if (x2Ote > x1Ote + 10) {
        const dxOte = (x2Ote - x1Ote) * 0.55;
        pathOte.setAttribute("d", `M ${x1Ote} ${y1Ote} C ${x1Ote + dxOte} ${y1Ote}, ${x2Ote - dxOte} ${y2Ote}, ${x2Ote} ${y2Ote}`);
        pathOte.style.display = "";
    } else {
        pathOte.style.display = "none";
    }

    if (x2Spi > x1Spi + 10) {
        const dxSpi = (x2Spi - x1Spi) * 0.55;
        pathSpi.setAttribute("d", `M ${x1Spi} ${y1Spi} C ${x1Spi + dxSpi} ${y1Spi}, ${x2Spi - dxSpi} ${y2Spi}, ${x2Spi} ${y2Spi}`);
        pathSpi.style.display = "";
    } else {
        pathSpi.style.display = "none";
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
    const pathOte = document.getElementById("pm9-path-ote");
    const pathSpi = document.getElementById("pm9-path-spi");

    if (!refs.m33Steps) return;
    if (!refs.m33InOte || !refs.m33InSpi) return;

    const rawOte = refs.m33InOte.value.trim();
    const rawSpi = refs.m33InSpi.value.trim();

    if (rawOte === "" || rawSpi === "") {
        refs.m33Steps.textContent = "";
        if (pathOte) pathOte.style.display = "none";
        if (pathSpi) pathSpi.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual33();
        return;
    }

    const ote = parseFloat(rawOte);
    const spi = parseFloat(rawSpi);

    if (isNaN(ote) || isNaN(spi) || ote < 0 || spi < 0) {
        refs.m33Steps.textContent = "";
        if (pathOte) pathOte.style.display = "none";
        if (pathSpi) pathSpi.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input Estimasi Durasi Awal dan SPI harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual33();
        return;
    }

    if (spi === 0) {
        refs.m33Steps.textContent = "";
        if (pathOte) pathOte.style.display = "none";
        if (pathSpi) pathSpi.style.display = "none";
        if (errEl) {
            errEl.textContent = "Nilai SPI harus lebih besar dari 0 agar tidak terjadi pembagian dengan nol.";
            errEl.classList.remove("hidden");
        }
        clearVisual33();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const etc = ote / spi;
    const etcNumStr = Number(etc.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const etcTexStr = etcNumStr.replace(/,/g, "{,}");
    const spiStr = spi.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 }).replace(/,/g, "{,}");
    const oteStr = Number(ote).toLocaleString("id-ID");

    const isApprox = Math.abs(etc - Math.round(etc * 100) / 100) > 1e-6;
    const eqSymbol = isApprox ? "\\approx" : "=";

    const tex = `\\frac{\\htmlId{pm9-ote}{${oteStr}}}{\\htmlId{pm9-spi}{${spiStr}}} ${eqSymbol} \\mathbf{${etcTexStr}\\text{ bulan}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m33Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m33Steps.textContent = tex;
    }

    updatePm9Lines();
    requestAnimationFrame(updatePm9Lines);
    drawEtcMeter(ote, spi, etc);
}
