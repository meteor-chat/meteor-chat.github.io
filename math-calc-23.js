import { refs } from "./dom-refs.js";
import { initCube, renderCube } from "./cube-3d.js";

let cubeInitialized = false;

function formatVal(v) {
    if (isNaN(v) || !isFinite(v) || v <= 0) return "0";
    if (Number.isInteger(v)) return v.toString();
    return parseFloat(v.toFixed(2)).toString();
}

export function getCubeSisiValue() {
    if (!refs.cubeInSisi) return "12";
    const v = refs.cubeInSisi.value.trim();
    return v === "" ? "12" : v;
}

export function updateCubeLines() {
    const layout = document.getElementById("cube-calc-layout");
    const svg = document.getElementById("cube-lines-svg");
    const leftPanel = document.getElementById("cube-left-panel");
    const canvas = refs.cubeCanvas || document.getElementById("cube-canvas");
    const rightPanel = document.getElementById("cube-right-panel");
    if (!layout || !svg || !leftPanel || !canvas || !rightPanel) return;

    const layoutRect = layout.getBoundingClientRect();
    if (layoutRect.width === 0 || layoutRect.height === 0) return;

    const leftRect = leftPanel.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const rows = rightPanel.querySelectorAll(".cube-out-row");

    svg.setAttribute("viewBox", `0 0 ${layoutRect.width} ${layoutRect.height}`);

    const lineLeft = document.getElementById("cube-line-left");
    if (lineLeft) {
        const x1 = leftRect.right - layoutRect.left;
        const y1 = leftRect.top + leftRect.height / 2 - layoutRect.top;
        const x2 = canvasRect.left - layoutRect.left;
        const y2 = canvasRect.top + canvasRect.height / 2 - layoutRect.top;
        lineLeft.setAttribute("x1", x1);
        lineLeft.setAttribute("y1", y1);
        lineLeft.setAttribute("x2", x2);
        lineLeft.setAttribute("y2", y2);
    }

    const rx1 = canvasRect.right - layoutRect.left;
    const ry1 = canvasRect.top + canvasRect.height / 2 - layoutRect.top;

    rows.forEach((row, i) => {
        const line = document.getElementById(`cube-line-r${i}`);
        if (line) {
            const rowRect = row.getBoundingClientRect();
            const rx2 = rowRect.left - layoutRect.left;
            const ry2 = rowRect.top + rowRect.height / 2 - layoutRect.top;
            line.setAttribute("x1", rx1);
            line.setAttribute("y1", ry1);
            line.setAttribute("x2", rx2);
            line.setAttribute("y2", ry2);
        }
    });
}

export function calculateMath23() {
    if (!refs.cubeInSisi) return;
    const raw = refs.cubeInSisi.value.trim();
    const s = parseFloat(raw);

    const outVol = document.getElementById("cube-out-volume");
    const outLp = document.getElementById("cube-out-lp");
    const outPr = document.getElementById("cube-out-pr");
    const outDs = document.getElementById("cube-out-ds");
    const outDr = document.getElementById("cube-out-dr");
    const outBd = document.getElementById("cube-out-bd");

    if (isNaN(s) || s < 0) {
        if (outVol) outVol.textContent = "0";
        if (outLp) outLp.textContent = "0";
        if (outPr) outPr.textContent = "0";
        if (outDs) outDs.textContent = "0";
        if (outDr) outDr.textContent = "0";
        if (outBd) outBd.textContent = "0";
    } else {
        const vol = Math.pow(s, 3);
        const lp = 6 * s * s;
        const pr = 12 * s;
        const ds = parseFloat((s * Math.SQRT2).toFixed(2));
        const dr = parseFloat((s * Math.SQRT3).toFixed(2));
        const bd = parseFloat((s * ds).toFixed(2));

        if (outVol) outVol.textContent = formatVal(vol);
        if (outLp) outLp.textContent = formatVal(lp);
        if (outPr) outPr.textContent = formatVal(pr);
        if (outDs) outDs.textContent = ds.toFixed(2);
        if (outDr) outDr.textContent = dr.toFixed(2);
        if (outBd) outBd.textContent = bd.toFixed(2);
    }
    renderCube();
    requestAnimationFrame(updateCubeLines);
}

export function initCubeView() {
    if (!cubeInitialized && refs.cubeCanvas) {
        initCube(refs.cubeCanvas, getCubeSisiValue);
        window.addEventListener("resize", updateCubeLines);
        cubeInitialized = true;
    }
    calculateMath23();
    requestAnimationFrame(updateCubeLines);
}
