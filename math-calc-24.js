import { refs } from "./dom-refs.js";
import { initCone, renderCone } from "./cone-3d.js";
import { initConeAnimation, triggerConeAnimation } from "./cone-animation.js";
import { computeConeMetrics } from "./cone-metrics.js";

let coneInitialized = false;
let pulseSequence = 0;
let lastConeSeq = 0;
let lastResultsSeq = 0;

let displayedDims = { r: 3, t: 4, s: 5, rText: "3", tText: "4", sText: "5" };

const MODE_DEFAULTS = {
    rt: { a: "3", b: "4" },
    rs: { a: "3", b: "5" },
    ts: { a: "4", b: "5" }
};

const MODE_LABELS = {
    rt: { a: "Jari-jari (r)", b: "Tinggi (t)" },
    rs: { a: "Jari-jari (r)", b: "Garis pelukis (s)" },
    ts: { a: "Tinggi (t)", b: "Garis pelukis (s)" }
};

function getMode() {
    return (refs.coneInMode && refs.coneInMode.value) || "rt";
}

export function getConeDims() {
    return displayedDims;
}

function syncModeLabels() {
    const mode = getMode();
    const labels = MODE_LABELS[mode];
    if (refs.coneLabelA) refs.coneLabelA.textContent = labels.a + " :";
    if (refs.coneLabelB) refs.coneLabelB.textContent = labels.b + " :";
}

export function updateConeLines() {
    if (window.innerWidth <= 768) return;
    const layout = document.getElementById("cone-calc-layout");
    const svg = document.getElementById("cone-lines-svg");
    const leftPanel = document.getElementById("cone-left-panel");
    const canvas = refs.coneCanvas || document.getElementById("cone-canvas");
    const rightPanel = document.getElementById("cone-right-panel");
    if (!layout || !svg || !leftPanel || !canvas || !rightPanel) return;

    const layoutRect = layout.getBoundingClientRect();
    if (layoutRect.width === 0 || layoutRect.height === 0) return;

    const leftRect = leftPanel.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const rows = rightPanel.querySelectorAll(".cube-out-row");

    svg.setAttribute("viewBox", `0 0 ${layoutRect.width} ${layoutRect.height}`);

    const lineLeft = document.getElementById("cone-line-left");
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
        const path = document.getElementById(`cone-path-r${i}`);
        if (path) {
            const rowRect = row.getBoundingClientRect();
            const rx2 = rowRect.left - layoutRect.left;
            const ry2 = rowRect.top + rowRect.height / 2 - layoutRect.top;
            const w = rx2 - rx1;
            const xStem = rx1 + w * 0.25;
            const cpx = xStem + (rx2 - xStem) * 0.5;
            const d = `M ${rx1} ${ry1} L ${xStem} ${ry1} C ${cpx} ${ry1}, ${cpx} ${ry2}, ${rx2} ${ry2}`;
            path.setAttribute("d", d);
        }
    });
}

function flashResultRows() {
    const rightPanel = document.getElementById("cone-right-panel");
    if (!rightPanel) return;
    const rows = rightPanel.querySelectorAll(".cube-out-row");
    rows.forEach((row) => {
        row.classList.remove("cube-row-highlight");
        void row.offsetWidth;
        row.classList.add("cube-row-highlight");
    });
}

export function applyConeResultsToDOM(metrics) {
    const outVol = document.getElementById("cone-out-volume");
    const outLa = document.getElementById("cone-out-la");
    const outLs = document.getElementById("cone-out-ls");
    const outLp = document.getElementById("cone-out-lp");

    if (outVol) outVol.textContent = metrics.vol;
    if (outLa) outLa.textContent = metrics.la;
    if (outLs) outLs.textContent = metrics.ls;
    if (outLp) outLp.textContent = metrics.lp;

    flashResultRows();
}

function readMetrics() {
    const mode = getMode();
    const a = refs.coneInA ? refs.coneInA.value : "";
    const b = refs.coneInB ? refs.coneInB.value : "";
    return computeConeMetrics(mode, a, b);
}

function syncDisplayedDims(metrics) {
    if (metrics.valid) {
        displayedDims = {
            r: metrics.r, t: metrics.t, s: metrics.s,
            rText: metrics.rText, tText: metrics.tText, sText: metrics.sText
        };
    }
}

export function calculateMath24() {
    if (!refs.coneInA || !refs.coneInB) return;
    const metrics = readMetrics();
    if (window.innerWidth <= 768) {
        syncDisplayedDims(metrics);
        renderCone();
        applyConeResultsToDOM(metrics);
        return;
    }
    const seq = ++pulseSequence;
    requestAnimationFrame(updateConeLines);

    triggerConeAnimation({
        payload: { seq, metrics },
        onReachCone: (payload) => {
            if (payload && payload.seq >= lastConeSeq) {
                lastConeSeq = payload.seq;
                syncDisplayedDims(payload.metrics);
                renderCone();
            }
        },
        onReachResults: (payload) => {
            if (payload && payload.seq >= lastResultsSeq) {
                lastResultsSeq = payload.seq;
                applyConeResultsToDOM(payload.metrics);
            }
        }
    });
}

function onModeChange() {
    const mode = getMode();
    const defaults = MODE_DEFAULTS[mode];
    if (refs.coneInA) refs.coneInA.value = defaults.a;
    if (refs.coneInB) refs.coneInB.value = defaults.b;
    syncModeLabels();
    const metrics = readMetrics();
    syncDisplayedDims(metrics);
    applyConeResultsToDOM(metrics);
    renderCone();
    requestAnimationFrame(updateConeLines);
}

export function initConeView() {
    if (!coneInitialized && refs.coneCanvas) {
        initCone(refs.coneCanvas, getConeDims);
        initConeAnimation();
        window.addEventListener("resize", updateConeLines);
        if (refs.coneInMode) refs.coneInMode.addEventListener("change", onModeChange);
        coneInitialized = true;
    }
    syncModeLabels();
    const metrics = readMetrics();
    syncDisplayedDims(metrics);
    applyConeResultsToDOM(metrics);
    renderCone();
    requestAnimationFrame(updateConeLines);
}
