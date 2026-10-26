import { refs } from "./dom-refs.js";
import { formatMax3 } from "./math-format.js";
import { drawEvMeter, clearVisual27 } from "./math-visual-27.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm3Lines() {
    const container = document.getElementById("pm3-flow-container");
    const svg = document.getElementById("pm3-flow-svg");
    const inBac = refs.m27InBac || document.getElementById("math27-in-bac");
    const inActual = refs.m27InActual || document.getElementById("math27-in-actual");
    const targetBac = document.getElementById("pm3-bac");
    const targetActual = document.getElementById("pm3-actual");
    const pathBac = document.getElementById("pm3-path-bac");
    const pathActual = document.getElementById("pm3-path-actual");

    if (!container || !svg || !inBac || !inActual || !targetBac || !targetActual || !pathBac || !pathActual) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const bacRect = inBac.getBoundingClientRect();
    const actRect = inActual.getBoundingClientRect();
    const tBacRect = targetBac.getBoundingClientRect();
    const tActRect = targetActual.getBoundingClientRect();

    const x1Bac = bacRect.right - cRect.left;
    const y1Bac = bacRect.top + bacRect.height / 2 - cRect.top;
    const x2Bac = tBacRect.left - cRect.left - 4;
    const y2Bac = tBacRect.top + tBacRect.height / 2 - cRect.top;

    const x1Act = actRect.right - cRect.left;
    const y1Act = actRect.top + actRect.height / 2 - cRect.top;
    const x2Act = tActRect.left - cRect.left - 4;
    const y2Act = tActRect.top + tActRect.height / 2 - cRect.top;

    if (x2Bac > x1Bac + 10) {
        const dxBac = (x2Bac - x1Bac) * 0.55;
        pathBac.setAttribute("d", `M ${x1Bac} ${y1Bac} C ${x1Bac + dxBac} ${y1Bac}, ${x2Bac - dxBac} ${y2Bac}, ${x2Bac} ${y2Bac}`);
        pathBac.style.display = "";
    } else {
        pathBac.style.display = "none";
    }

    if (x2Act > x1Act + 10) {
        const dxAct = (x2Act - x1Act) * 0.55;
        pathActual.setAttribute("d", `M ${x1Act} ${y1Act} C ${x1Act + dxAct} ${y1Act}, ${x2Act - dxAct} ${y2Act}, ${x2Act} ${y2Act}`);
        pathActual.style.display = "";
    } else {
        pathActual.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePm3Lines();
    }, { passive: true });
}

export function calculateMath27() {
    bindResize();
    const errEl = document.getElementById("pm3-error-msg");
    const pathBac = document.getElementById("pm3-path-bac");
    const pathActual = document.getElementById("pm3-path-actual");

    if (!refs.m27Steps) return;

    if (!refs.m27InBac || !refs.m27InActual) return;

    const rawBac = refs.m27InBac.value.trim();
    const rawActual = refs.m27InActual.value.trim();

    if (rawBac === "" || rawActual === "") {
        refs.m27Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathActual) pathActual.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual27();
        return;
    }

    const bac = parseFloat(rawBac);
    const actual = parseFloat(rawActual);

    if (isNaN(bac) || isNaN(actual) || bac < 0 || actual < 0) {
        refs.m27Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathActual) pathActual.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual27();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const actualFraction = actual / 100;
    const ev = bac * actualFraction;

    const tex = `\\htmlId{pm3-bac}{\\text{${formatCurrency(bac)}}} \\times \\htmlId{pm3-actual}{${formatMax3(actual)}\\%} \\; \\longrightarrow \\; \\text{${formatCurrency(bac)}} \\times ${formatMax3(actualFraction)} = \\mathbf{\\text{${formatCurrency(ev)}}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m27Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m27Steps.textContent = tex;
    }

    updatePm3Lines();
    requestAnimationFrame(updatePm3Lines);
    drawEvMeter(bac, actual, ev, actualFraction);
}
