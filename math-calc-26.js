import { refs } from "./dom-refs.js";
import { formatMax3 } from "./math-format.js";
import { drawPvMeter, clearVisual26 } from "./math-visual-26.js";

let resizeBound = false;

function formatCurrency(n) {
    return "$" + Number(n).toLocaleString("id-ID");
}

export function updatePm2Lines() {
    const container = document.getElementById("pm2-flow-container");
    const svg = document.getElementById("pm2-flow-svg");
    const inBac = refs.m26InBac || document.getElementById("math26-in-bac");
    const inPlanned = refs.m26InPlanned || document.getElementById("math26-in-planned");
    const targetBac = document.getElementById("pm2-bac");
    const targetPlanned = document.getElementById("pm2-planned");
    const pathBac = document.getElementById("pm2-path-bac");
    const pathPlanned = document.getElementById("pm2-path-planned");

    if (!container || !svg || !inBac || !inPlanned || !targetBac || !targetPlanned || !pathBac || !pathPlanned) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const bacRect = inBac.getBoundingClientRect();
    const planRect = inPlanned.getBoundingClientRect();
    const tBacRect = targetBac.getBoundingClientRect();
    const tPlanRect = targetPlanned.getBoundingClientRect();

    const x1Bac = bacRect.right - cRect.left;
    const y1Bac = bacRect.top + bacRect.height / 2 - cRect.top;
    const x2Bac = tBacRect.left - cRect.left - 4;
    const y2Bac = tBacRect.top + tBacRect.height / 2 - cRect.top;

    const x1Plan = planRect.right - cRect.left;
    const y1Plan = planRect.top + planRect.height / 2 - cRect.top;
    const x2Plan = tPlanRect.left - cRect.left - 4;
    const y2Plan = tPlanRect.top + tPlanRect.height / 2 - cRect.top;

    if (x2Bac > x1Bac + 10) {
        const dxBac = (x2Bac - x1Bac) * 0.55;
        pathBac.setAttribute("d", `M ${x1Bac} ${y1Bac} C ${x1Bac + dxBac} ${y1Bac}, ${x2Bac - dxBac} ${y2Bac}, ${x2Bac} ${y2Bac}`);
        pathBac.style.display = "";
    } else {
        pathBac.style.display = "none";
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
        updatePm2Lines();
    }, { passive: true });
}

export function calculateMath26() {
    bindResize();
    const errEl = document.getElementById("pm2-error-msg");
    const pathBac = document.getElementById("pm2-path-bac");
    const pathPlanned = document.getElementById("pm2-path-planned");

    if (!refs.m26Steps) return;

    if (!refs.m26InBac || !refs.m26InPlanned) return;

    const rawBac = refs.m26InBac.value.trim();
    const rawPlanned = refs.m26InPlanned.value.trim();

    if (rawBac === "" || rawPlanned === "") {
        refs.m26Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathPlanned) pathPlanned.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual26();
        return;
    }

    const bac = parseFloat(rawBac);
    const planned = parseFloat(rawPlanned);

    if (isNaN(bac) || isNaN(planned) || bac < 0 || planned < 0) {
        refs.m26Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathPlanned) pathPlanned.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual26();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const plannedFraction = planned / 100;
    const pv = bac * plannedFraction;

    const tex = `\\htmlId{pm2-bac}{\\text{${formatCurrency(bac)}}} \\times \\htmlId{pm2-planned}{${formatMax3(planned)}\\%} \\; \\longrightarrow \\; \\text{${formatCurrency(bac)}} \\times ${formatMax3(plannedFraction)} = \\mathbf{\\text{${formatCurrency(pv)}}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m26Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m26Steps.textContent = tex;
    }

    updatePm2Lines();
    requestAnimationFrame(updatePm2Lines);
    drawPvMeter(bac, planned, pv, plannedFraction);
}
