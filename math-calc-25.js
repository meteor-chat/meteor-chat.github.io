import { refs } from "./dom-refs.js";
import { formatMax3 } from "./math-format.js";
import { drawPerformanceMeter, clearVisual25 } from "./math-visual-25.js?v=13";

let resizeBound = false;

export function updatePmLines() {
    const container = document.getElementById("pm-flow-container");
    const svg = document.getElementById("pm-flow-svg");
    const inActual = refs.m25InActual || document.getElementById("math25-in-actual");
    const inPlanned = refs.m25InPlanned || document.getElementById("math25-in-planned");
    const targetNum = document.getElementById("pm-num");
    const targetDen = document.getElementById("pm-den");
    const pathActual = document.getElementById("pm-path-actual");
    const pathPlanned = document.getElementById("pm-path-planned");

    if (!container || !svg || !inActual || !inPlanned || !targetNum || !targetDen || !pathActual || !pathPlanned) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const actRect = inActual.getBoundingClientRect();
    const planRect = inPlanned.getBoundingClientRect();
    const numRect = targetNum.getBoundingClientRect();
    const denRect = targetDen.getBoundingClientRect();

    const x1Act = actRect.right - cRect.left;
    const y1Act = actRect.top + actRect.height / 2 - cRect.top;
    const x2Act = numRect.left - cRect.left - 4;
    const y2Act = numRect.top + numRect.height / 2 - cRect.top;

    const x1Plan = planRect.right - cRect.left;
    const y1Plan = planRect.top + planRect.height / 2 - cRect.top;
    const x2Plan = denRect.left - cRect.left - 4;
    const y2Plan = denRect.top + denRect.height / 2 - cRect.top;

    if (x2Act > x1Act + 10) {
        const dxAct = (x2Act - x1Act) * 0.55;
        pathActual.setAttribute("d", `M ${x1Act} ${y1Act} C ${x1Act + dxAct} ${y1Act}, ${x2Act - dxAct} ${y2Act}, ${x2Act} ${y2Act}`);
        pathActual.style.display = "";
    } else {
        pathActual.style.display = "none";
    }

    if (x2Plan > x1Plan + 10) {
        const dxPlan = (x2Plan - x1Plan) * 0.55;
        pathPlanned.setAttribute("d", `M ${x1Plan} ${y1Plan} C ${x1Plan + dxPlan} ${y1Plan}, ${x2Plan - dxPlan} ${y2Plan}, ${x2Plan} ${y2Plan}`);
        pathPlanned.style.display = "";
    } else {
        pathPlanned.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePmLines();
    }, { passive: true });
}

export function calculateMath25() {
    bindResize();
    const errEl = document.getElementById("pm-error-msg");
    const pathActual = document.getElementById("pm-path-actual");
    const pathPlanned = document.getElementById("pm-path-planned");

    if (!refs.m25Steps) return;

    if (!refs.m25InActual || !refs.m25InPlanned) return;

    const rawActual = refs.m25InActual.value.trim();
    const rawPlanned = refs.m25InPlanned.value.trim();

    if (rawActual === "" || rawPlanned === "") {
        refs.m25Steps.textContent = "";
        if (pathActual) pathActual.style.display = "none";
        if (pathPlanned) pathPlanned.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual25();
        return;
    }

    const actual = parseFloat(rawActual);
    const planned = parseFloat(rawPlanned);

    if (isNaN(actual) || isNaN(planned) || actual < 0 || planned < 0) {
        refs.m25Steps.textContent = "";
        if (pathActual) pathActual.style.display = "none";
        if (pathPlanned) pathPlanned.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual25();
        return;
    }

    if (planned === 0) {
        refs.m25Steps.textContent = "";
        if (pathActual) pathActual.style.display = "none";
        if (pathPlanned) pathPlanned.style.display = "none";
        if (errEl) {
            errEl.textContent = "Planned Work Completed tidak boleh 0 (mencegah pembagian dengan nol).";
            errEl.classList.remove("hidden");
        }
        clearVisual25();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const ratio = actual / planned;
    const rpPercent = ratio * 100;
    const devPercent = rpPercent - 100;

    let status = "ahead";
    if (Math.abs(devPercent) < 1e-6) {
        status = "on-track";
    } else if (devPercent < 0) {
        status = "behind";
    }

    const tex = `\\frac{\\htmlId{pm-num}{${formatMax3(actual)}}}{\\htmlId{pm-den}{${formatMax3(planned)}}} \\times 100\\% \\; \\longrightarrow \\; ${formatMax3(ratio)} \\times 100\\% = ${formatMax3(rpPercent)}\\%`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m25Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m25Steps.textContent = tex;
    }

    updatePmLines();
    requestAnimationFrame(updatePmLines);
    drawPerformanceMeter(actual, planned, rpPercent, ratio, devPercent, status);
}
