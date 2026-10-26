import { refs } from "./dom-refs.js";
import { drawAcMeter, clearVisual28 } from "./math-visual-28.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm4Lines() {
    const container = document.getElementById("pm4-flow-container");
    const svg = document.getElementById("pm4-flow-svg");
    const inDirect = refs.m28InDirect || document.getElementById("math28-in-direct");
    const inIndirect = refs.m28InIndirect || document.getElementById("math28-in-indirect");
    const targetDirect = document.getElementById("pm4-direct");
    const targetIndirect = document.getElementById("pm4-indirect");
    const pathDirect = document.getElementById("pm4-path-direct");
    const pathIndirect = document.getElementById("pm4-path-indirect");

    if (!container || !svg || !inDirect || !inIndirect || !targetDirect || !targetIndirect || !pathDirect || !pathIndirect) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const dirRect = inDirect.getBoundingClientRect();
    const indRect = inIndirect.getBoundingClientRect();
    const tDirRect = targetDirect.getBoundingClientRect();
    const tIndRect = targetIndirect.getBoundingClientRect();

    const x1Dir = dirRect.right - cRect.left;
    const y1Dir = dirRect.top + dirRect.height / 2 - cRect.top;
    const x2Dir = tDirRect.left - cRect.left - 4;
    const y2Dir = tDirRect.top + tDirRect.height / 2 - cRect.top;

    const x1Ind = indRect.right - cRect.left;
    const y1Ind = indRect.top + indRect.height / 2 - cRect.top;
    const x2Ind = tIndRect.left - cRect.left - 4;
    const y2Ind = tIndRect.top + tIndRect.height / 2 - cRect.top;

    if (x2Dir > x1Dir + 10) {
        const dxDir = (x2Dir - x1Dir) * 0.55;
        pathDirect.setAttribute("d", `M ${x1Dir} ${y1Dir} C ${x1Dir + dxDir} ${y1Dir}, ${x2Dir - dxDir} ${y2Dir}, ${x2Dir} ${y2Dir}`);
        pathDirect.style.display = "";
    } else {
        pathDirect.style.display = "none";
    }

    if (x2Ind > x1Ind + 10) {
        const dxInd = (x2Ind - x1Ind) * 0.55;
        pathIndirect.setAttribute("d", `M ${x1Ind} ${y1Ind} C ${x1Ind + dxInd} ${y1Ind}, ${x2Ind - dxInd} ${y2Ind}, ${x2Ind} ${y2Ind}`);
        pathIndirect.style.display = "";
    } else {
        pathIndirect.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePm4Lines();
    }, { passive: true });
}

export function calculateMath28() {
    bindResize();
    const errEl = document.getElementById("pm4-error-msg");
    const pathDirect = document.getElementById("pm4-path-direct");
    const pathIndirect = document.getElementById("pm4-path-indirect");

    if (!refs.m28Steps) return;
    if (!refs.m28InDirect || !refs.m28InIndirect) return;

    const rawDirect = refs.m28InDirect.value.trim();
    const rawIndirect = refs.m28InIndirect.value.trim();

    if (rawDirect === "" || rawIndirect === "") {
        refs.m28Steps.textContent = "";
        if (pathDirect) pathDirect.style.display = "none";
        if (pathIndirect) pathIndirect.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual28();
        return;
    }

    const direct = parseFloat(rawDirect);
    const indirect = parseFloat(rawIndirect);

    if (isNaN(direct) || isNaN(indirect) || direct < 0 || indirect < 0) {
        refs.m28Steps.textContent = "";
        if (pathDirect) pathDirect.style.display = "none";
        if (pathIndirect) pathIndirect.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input biaya harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual28();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const ac = direct + indirect;
    const directRatio = ac > 0 ? direct / ac : 0;
    const indirectRatio = ac > 0 ? indirect / ac : 0;

    const tex = `\\htmlId{pm4-direct}{\\text{${formatCurrency(direct)}}} + \\htmlId{pm4-indirect}{\\text{${formatCurrency(indirect)}}} \\; \\longrightarrow \\; \\mathbf{\\text{${formatCurrency(ac)}}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m28Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m28Steps.textContent = tex;
    }

    updatePm4Lines();
    requestAnimationFrame(updatePm4Lines);
    drawAcMeter(direct, indirect, ac, directRatio, indirectRatio);
}
