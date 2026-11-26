import { refs } from "../../core/dom-refs.js";
import { LR_PRESETS, computeLinearRegressionOLS, createGDState, stepGD, fmtNum } from "./math-calc-39-engine.js";
import { renderTopFormula39, renderLRInputsRow, updateLRMeansTags, renderLRDerivedRows } from "./math-calc-39-diagram.js";
import { renderLRSteps } from "./math-calc-39-cards.js";
import { renderScatterCanvas, renderLossCanvas, hitTestScatterPoint } from "../visuals/math-visual-39.js";

let currentMode = "ols";
let currentPoints = LR_PRESETS.manual.points.map((p) => ({ ...p }));
let currentPresetMeta = LR_PRESETS.manual;
let gdState = null;
let isRunning = false;
let runTimer = null;
let hoveredIdx = -1;
let draggedIdx = -1;
let lastGeom = null;

function stopGdLoop() {
    isRunning = false;
    if (runTimer) {
        clearTimeout(runTimer);
        runTimer = null;
    }
    const btnPlay = refs.m39BtnPlay || document.getElementById("math39-btn-play");
    if (btnPlay) {
        btnPlay.textContent = "Jalankan";
        btnPlay.classList.remove("lr-btn-active");
    }
}

function getLrValue() {
    const el = refs.m39InLr || document.getElementById("math39-in-lr");
    const v = el ? parseFloat(el.value) : 0.1;
    return Number.isFinite(v) && v > 0 ? v : 0.1;
}

function getQueryX() {
    const el = refs.m39InQx || document.getElementById("math39-in-qx");
    const v = el ? parseFloat(el.value) : currentPresetMeta.queryX;
    return Number.isFinite(v) ? v : 3;
}

function isStdEnabled() {
    const el = refs.m39ChkStd || document.getElementById("math39-chk-std");
    return el ? el.checked : true;
}

function resetGD() {
    stopGdLoop();
    gdState = createGDState(currentPoints, 0, 0, isStdEnabled());
}

function defaultLabelAt(i) {
    const code = 65 + (i % 26);
    const suffix = i >= 26 ? String(Math.floor(i / 26)) : "";
    return String.fromCharCode(code) + suffix;
}

function addPoint() {
    if (currentPoints.length >= 12) return;
    const last = currentPoints[currentPoints.length - 1] || { x: 0, y: 0 };
    currentPoints.push({
        label: defaultLabelAt(currentPoints.length),
        x: Math.round((last.x + 2) * 10) / 10,
        y: Math.round((last.y + 5) * 10) / 10
    });
    renderInputMatrix();
    if (currentMode === "gd") resetGD();
    calculateMath39();
}

function removePoint(idx) {
    if (currentPoints.length <= 2) return;
    currentPoints.splice(idx, 1);
    renderInputMatrix();
    if (currentMode === "gd") resetGD();
    calculateMath39();
}

function renderInputMatrix() {
    const inputsEl = document.getElementById("math39-cells-inputs");
    const olsQuick = computeLinearRegressionOLS(currentPoints, getQueryX());
    renderLRInputsRow(
        inputsEl,
        currentPoints,
        olsQuick.meanX,
        olsQuick.meanY,
        {
            onEdit: (idx, axis, val) => {
                if (!currentPoints[idx]) return;
                currentPoints[idx][axis] = val;
                if (currentMode === "gd") resetGD();
                calculateMath39();
            },
            onAdd: addPoint,
            onRemove: removePoint
        }
    );
}

function syncModeUI() {
    const tabOls = document.getElementById("math39-tab-ols");
    const tabGd = document.getElementById("math39-tab-gd");
    const gdPanel = document.getElementById("math39-gd-panel");
    const olsParams = document.getElementById("math39-ols-params");
    const lossWrap = document.getElementById("math39-loss-wrap");

    if (tabOls) {
        tabOls.classList.toggle("active", currentMode === "ols");
        tabOls.setAttribute("aria-selected", String(currentMode === "ols"));
    }
    if (tabGd) {
        tabGd.classList.toggle("active", currentMode === "gd");
        tabGd.setAttribute("aria-selected", String(currentMode === "gd"));
    }
    if (gdPanel) gdPanel.classList.toggle("hidden", currentMode !== "gd");
    if (lossWrap) lossWrap.classList.toggle("hidden", currentMode !== "gd");
    if (olsParams) olsParams.classList.toggle("hidden", currentMode === "gd");
}

function stepOnceGD() {
    if (!gdState) resetGD();
    gdState = stepGD(gdState, currentPoints, getLrValue());
    calculateMath39();
}

function startGdLoop() {
    if (isRunning) return;
    if (!gdState) resetGD();
    isRunning = true;
    const btnPlay = refs.m39BtnPlay || document.getElementById("math39-btn-play");
    if (btnPlay) {
        btnPlay.textContent = "Jeda";
        btnPlay.classList.add("lr-btn-active");
    }
    const tick = () => {
        if (!isRunning) return;
        stepOnceGD();
        if (!gdState || gdState.diverged || gdState.iter >= 120) {
            stopGdLoop();
            return;
        }
        runTimer = setTimeout(tick, 140);
    };
    tick();
}

function loadPreset(key) {
    const preset = LR_PRESETS[key] || LR_PRESETS.manual;
    currentPresetMeta = preset;
    currentPoints = preset.points.map((p) => ({ ...p }));
    const inQx = refs.m39InQx || document.getElementById("math39-in-qx");
    if (inQx) inQx.value = String(preset.queryX);
    const inLr = refs.m39InLr || document.getElementById("math39-in-lr");
    if (inLr) inLr.value = String(preset.gdLr);
    const chkStd = refs.m39ChkStd || document.getElementById("math39-chk-std");
    if (chkStd) chkStd.checked = Boolean(preset.gdStd);
    renderInputMatrix();
    resetGD();
    calculateMath39();
}

function bindCanvasPointer(canvas) {
    if (!canvas) return;
    const getRelPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return {
            sx: e.clientX - rect.left,
            sy: e.clientY - rect.top
        };
    };

    canvas.addEventListener("pointerdown", (e) => {
        if (!lastGeom) return;
        const { sx, sy } = getRelPos(e);
        const idx = hitTestScatterPoint(lastGeom, sx, sy, currentPoints, 18);
        if (idx >= 0) {
            draggedIdx = idx;
            canvas.style.touchAction = "none";
            try {
                canvas.setPointerCapture(e.pointerId);
            } catch {}
            calculateMath39();
        }
    });

    canvas.addEventListener("pointermove", (e) => {
        if (!lastGeom) return;
        const { sx, sy } = getRelPos(e);
        if (draggedIdx >= 0 && draggedIdx < currentPoints.length) {
            const mathPos = lastGeom.toMath(sx, sy);
            currentPoints[draggedIdx].x = mathPos.x;
            currentPoints[draggedIdx].y = mathPos.y;
            const xEl = document.querySelector(`.lr-cell-x[data-idx="${draggedIdx}"]`);
            const yEl = document.querySelector(`.lr-cell-y[data-idx="${draggedIdx}"]`);
            if (xEl) xEl.value = String(mathPos.x);
            if (yEl) yEl.value = String(mathPos.y);
            if (currentMode === "gd") resetGD();
            calculateMath39();
            return;
        }
        const hit = hitTestScatterPoint(lastGeom, sx, sy, currentPoints, 16);
        if (hit !== hoveredIdx) {
            hoveredIdx = hit;
            canvas.style.cursor = hit >= 0 ? "grab" : "default";
            calculateMath39();
        }
    });

    const release = (e) => {
        if (draggedIdx >= 0) {
            draggedIdx = -1;
            canvas.style.touchAction = "pan-y";
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch {}
            calculateMath39();
        }
    };

    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("pointerleave", () => {
        if (hoveredIdx !== -1 && draggedIdx === -1) {
            hoveredIdx = -1;
            calculateMath39();
        }
    });
}

export function initMath39() {
    const root = document.getElementById("math-calc-form-39");
    if (root && root.dataset.lrBound !== "1") {
        root.dataset.lrBound = "1";
        currentMode = "ols";
        currentPresetMeta = LR_PRESETS.manual;
        currentPoints = LR_PRESETS.manual.points.map((p) => ({ ...p }));

        const selPreset = refs.m39Preset || document.getElementById("math39-preset");
        if (selPreset) {
            selPreset.value = "manual";
            selPreset.addEventListener("change", () => loadPreset(selPreset.value));
        }

        const tabOls = document.getElementById("math39-tab-ols");
        const tabGd = document.getElementById("math39-tab-gd");
        if (tabOls) {
            tabOls.addEventListener("click", () => {
                stopGdLoop();
                currentMode = "ols";
                syncModeUI();
                calculateMath39();
            });
        }
        if (tabGd) {
            tabGd.addEventListener("click", () => {
                currentMode = "gd";
                if (!gdState) resetGD();
                syncModeUI();
                calculateMath39();
            });
        }

        const chkRes = document.getElementById("math39-chk-residuals");
        const chkSq = document.getElementById("math39-chk-squares");
        const chkStd = refs.m39ChkStd || document.getElementById("math39-chk-std");
        const inQx = refs.m39InQx || document.getElementById("math39-in-qx");
        const inLr = refs.m39InLr || document.getElementById("math39-in-lr");
        const btnPlay = refs.m39BtnPlay || document.getElementById("math39-btn-play");
        const btnStep = refs.m39BtnStep || document.getElementById("math39-btn-step");
        const btnReset = refs.m39BtnReset || document.getElementById("math39-btn-reset");

        if (chkRes) chkRes.addEventListener("change", calculateMath39);
        if (chkSq) chkSq.addEventListener("change", calculateMath39);
        if (inQx) {
            inQx.value = String(currentPresetMeta.queryX);
            inQx.addEventListener("input", calculateMath39);
        }
        if (chkStd) {
            chkStd.checked = Boolean(currentPresetMeta.gdStd);
            chkStd.addEventListener("change", () => {
                resetGD();
                calculateMath39();
            });
        }
        if (inLr) {
            inLr.value = String(currentPresetMeta.gdLr);
            inLr.addEventListener("input", calculateMath39);
        }

        document.querySelectorAll(".lr-lr-pill").forEach((pill) => {
            pill.addEventListener("click", () => {
                if (inLr && pill.dataset.lr) {
                    inLr.value = pill.dataset.lr;
                    calculateMath39();
                }
            });
        });

        if (btnPlay) {
            btnPlay.addEventListener("click", () => {
                if (isRunning) stopGdLoop();
                else startGdLoop();
            });
        }
        if (btnStep) {
            btnStep.addEventListener("click", () => {
                stopGdLoop();
                stepOnceGD();
            });
        }
        if (btnReset) {
            btnReset.addEventListener("click", () => {
                resetGD();
                calculateMath39();
            });
        }

        bindCanvasPointer(refs.m39CanvasScatter || document.getElementById("math39-canvas-scatter"));
        renderInputMatrix();
        resetGD();
    }

    syncModeUI();
    renderTopFormula39();
    calculateMath39();
}

export function calculateMath39() {
    const qx = getQueryX();
    const ols = computeLinearRegressionOLS(currentPoints, qx);
    if (!gdState) resetGD();

    const inputsEl = document.getElementById("math39-cells-inputs");
    updateLRMeansTags(inputsEl, ols.meanX, ols.meanY);

    const centroidLabel = document.getElementById("math39-centroid-pill");
    if (centroidLabel) {
        centroidLabel.textContent = Number.isFinite(ols.meanX)
            ? `n=${ols.n} (${fmtNum(ols.meanX, 2)}, ${fmtNum(ols.meanY, 2)})`
            : `n=${ols.n}`;
    }

    const qxLabel = document.getElementById("math39-label-qx");
    if (qxLabel && typeof katex !== "undefined") {
        katex.render("\\htmlClass{lr-tok-w1}{x_{\\text{baru}}}", qxLabel, { throwOnError: false, trust: true });
    }

    const derivedEl = document.getElementById("math39-cells-derived");
    renderLRDerivedRows(derivedEl, currentMode, ols, gdState);

    const chkRes = document.getElementById("math39-chk-residuals");
    const chkSq = document.getElementById("math39-chk-squares");
    const showResiduals = chkRes ? chkRes.checked : true;
    const showSquares = chkSq ? chkSq.checked : false;

    const scatterCanvas = refs.m39CanvasScatter || document.getElementById("math39-canvas-scatter");
    if (scatterCanvas) {
        lastGeom = renderScatterCanvas(scatterCanvas, {
            ols,
            mode: currentMode,
            gdState,
            showResiduals,
            showSquares,
            hoveredIdx,
            draggedIdx,
            queryLabel: currentPresetMeta.queryLabel,
            xName: currentPresetMeta.xName,
            yName: currentPresetMeta.yName
        });
    }

    if (currentMode === "gd") {
        const lossCanvas = refs.m39CanvasLoss || document.getElementById("math39-canvas-loss");
        if (lossCanvas) {
            renderLossCanvas(lossCanvas, gdState, ols?.valid ? ols.mse : undefined);
        }
    }

    renderLRSteps({ mode: currentMode, ols, gdState, lr: getLrValue() });
}
