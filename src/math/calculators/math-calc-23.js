import { refs } from "../../core/dom-refs.js";
import { initCube, renderCube, setCubeProjection, setCubeHighlight } from "../geometry/cube-3d.js";
import { initCubeAnimation, triggerCubeAnimation } from "../geometry/cube-animation.js";
import { computeCubeMetrics } from "../geometry/cube-metrics.js";
import { renderCubeCriticalCards } from "../geometry/cube-critical.js";
import { drawCubeScalingChart } from "../geometry/cube-chart.js";

let cubeInitialized = false;
let displayedSisi = "12";
let pulseSequence = 0;
let lastCubeSeq = 0;
let lastResultsSeq = 0;

export function getCubeSisiValue() {
    return displayedSisi;
}

export function renderTopFormula23() {
    if (typeof katex === "undefined") return;
    const box = document.getElementById("math-calc-formula-display-23");
    if (!box) return;
    box.textContent = "";
    const tex = "V = s^3, \\quad L_p = 6s^2, \\quad P_r = 12s, \\quad d_s = s\\sqrt{2}, \\quad d_r = s\\sqrt{3}, \\quad B_d = s^2\\sqrt{2}";
    try {
        katex.render(tex, box, { throwOnError: false, trust: true, displayMode: false });
    } catch {
        box.textContent = tex;
    }
}

export function updateCubeLines() {
    if (window.innerWidth <= 768) return;
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
        const path = document.getElementById(`cube-path-r${i}`);
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
    const rightPanel = document.getElementById("cube-right-panel");
    if (!rightPanel) return;
    const rows = rightPanel.querySelectorAll(".cube-out-row");
    rows.forEach((row) => {
        row.classList.remove("cube-row-highlight");
        void row.offsetWidth;
        row.classList.add("cube-row-highlight");
    });
}

export function applyCubeResultsToDOM(metrics) {
    const outVol = document.getElementById("cube-out-volume");
    const outLp = document.getElementById("cube-out-lp");
    const outPr = document.getElementById("cube-out-pr");
    const outDs = document.getElementById("cube-out-ds");
    const outDr = document.getElementById("cube-out-dr");
    const outBd = document.getElementById("cube-out-bd");

    if (outVol) outVol.textContent = metrics.vol;
    if (outLp) outLp.textContent = metrics.lp;
    if (outPr) outPr.textContent = metrics.pr;
    if (outDs) outDs.textContent = metrics.ds;
    if (outDr) outDr.textContent = metrics.dr;
    if (outBd) outBd.textContent = metrics.bd;

    flashResultRows();

    const critBox = document.getElementById("cube-critical-container");
    if (critBox && metrics.valid) {
        renderCubeCriticalCards(metrics.sisi, critBox);
    }
    drawCubeScalingChart(metrics.sisi);
}

function onCubeInputBlur() {
    if (!refs.cubeInSisi) return;
    const raw = refs.cubeInSisi.value.trim();
    const s = parseFloat(raw);
    if (isNaN(s) || s <= 0) {
        refs.cubeInSisi.value = displayedSisi;
    }
}

export function calculateMath23() {
    if (!refs.cubeInSisi) return;
    const raw = refs.cubeInSisi.value.trim();
    const metrics = computeCubeMetrics(raw);
    if (!metrics.valid) return;
    refs.cubeInSisi.placeholder = metrics.sisiText;

    const rangeSlider = document.getElementById("cube-range-sisi");
    if (rangeSlider && rangeSlider.value !== raw) {
        rangeSlider.value = metrics.sisi;
    }

    if (window.innerWidth <= 768) {
        displayedSisi = metrics.sisiText;
        renderCube();
        applyCubeResultsToDOM(metrics);
        return;
    }
    requestAnimationFrame(updateCubeLines);
    const seq = ++pulseSequence;

    triggerCubeAnimation({
        payload: {
            seq: seq,
            sisiText: metrics.sisiText,
            metrics: metrics
        },
        onReachCube: (payload) => {
            if (payload && payload.seq >= lastCubeSeq) {
                lastCubeSeq = payload.seq;
                displayedSisi = payload.sisiText;
                renderCube();
            }
        },
        onReachResults: (payload) => {
            if (payload && payload.seq >= lastResultsSeq) {
                lastResultsSeq = payload.seq;
                applyCubeResultsToDOM(payload.metrics);
            }
        }
    });
}

function initCubeControls() {
    const btnPersp = document.getElementById("cube-proj-persp");
    const btnOrtho = document.getElementById("cube-proj-ortho");
    if (btnPersp && btnOrtho) {
        btnPersp.addEventListener("click", () => {
            btnPersp.classList.add("active");
            btnOrtho.classList.remove("active");
            setCubeProjection("perspective");
        });
        btnOrtho.addEventListener("click", () => {
            btnOrtho.classList.add("active");
            btnPersp.classList.remove("active");
            setCubeProjection("orthographic");
        });
    }

    const spotButtons = document.querySelectorAll(".cube-spotlight-btn");
    const rightPanel = document.getElementById("cube-right-panel");
    const map = ["all", "lp", "pr", "ds", "dr", "bd"];

    spotButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            spotButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const target = btn.dataset.target || "all";
            setCubeHighlight(target);
            if (rightPanel) {
                const rows = rightPanel.querySelectorAll(".cube-out-row");
                rows.forEach((r, rIdx) => {
                    r.classList.toggle("cube-row-selected", map[rIdx] === target);
                });
            }
        });
    });

    const rangeSlider = document.getElementById("cube-range-sisi");
    if (rangeSlider && refs.cubeInSisi) {
        rangeSlider.addEventListener("input", (e) => {
            refs.cubeInSisi.value = e.target.value;
            calculateMath23();
        });
    }

    if (rightPanel) {
        const rows = rightPanel.querySelectorAll(".cube-out-row");
        rows.forEach((row, idx) => {
            row.style.cursor = "pointer";
            row.addEventListener("click", () => {
                const target = map[idx] || "all";
                setCubeHighlight(target);
                spotButtons.forEach((b) => {
                    b.classList.toggle("active", b.dataset.target === target);
                });
                rows.forEach((r, rIdx) => {
                    r.classList.toggle("cube-row-selected", rIdx === idx);
                });
            });
        });
    }
}

export function initCubeView() {
    renderTopFormula23();
    if (!cubeInitialized && refs.cubeCanvas) {
        initCube(refs.cubeCanvas, getCubeSisiValue);
        initCubeAnimation();
        initCubeControls();
        window.addEventListener("resize", updateCubeLines);
        if (refs.cubeInSisi) {
            refs.cubeInSisi.addEventListener("blur", onCubeInputBlur);
            refs.cubeInSisi.addEventListener("input", () => {
                const rangeSlider = document.getElementById("cube-range-sisi");
                if (rangeSlider) rangeSlider.value = refs.cubeInSisi.value;
            });
        }
        cubeInitialized = true;
    }
    const raw = refs.cubeInSisi ? refs.cubeInSisi.value.trim() : "12";
    const s = parseFloat(raw);
    const initialVal = isNaN(s) || s <= 0 ? "12" : raw;
    displayedSisi = initialVal;
    if (refs.cubeInSisi) {
        refs.cubeInSisi.placeholder = initialVal;
    }
    const metrics = computeCubeMetrics(initialVal);
    applyCubeResultsToDOM(metrics);
    renderCube();
    requestAnimationFrame(updateCubeLines);
}
