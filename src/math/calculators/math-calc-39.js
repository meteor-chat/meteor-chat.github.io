import { refs } from "../../core/dom-refs.js";
import { LR_PRESETS, computeLinearRegressionOLS, createGDState, stepGD } from "./math-calc-39-engine.js";
import { renderTopFormula39, renderLRSteps } from "./math-calc-39-cards.js";
import { renderScatterCanvas, renderLossCanvas, hitTestScatterPoint } from "../visuals/math-visual-39.js";

let initialized = false;
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

function renderPointRows() {
    const listEl = refs.m39Rows || document.getElementById("math39-rows-container");
    if (!listEl) return;
    listEl.innerHTML = "";

    currentPoints.forEach((pt, idx) => {
        const row = document.createElement("div");
        row.className = "lr-data-row";

        const badge = document.createElement("span");
        badge.className = "lr-row-tag";
        badge.textContent = pt.label || defaultLabelAt(idx);

        const inX = document.createElement("input");
        inX.type = "number";
        inX.step = "any";
        inX.inputMode = "decimal";
        inX.className = "lr-row-input";
        inX.value = String(pt.x);
        inX.setAttribute("aria-label", `Nilai x untuk data ${badge.textContent}`);
        inX.addEventListener("input", () => {
            const val = parseFloat(inX.value);
            if (Number.isFinite(val)) {
                currentPoints[idx].x = val;
                if (currentMode === "gd") resetGD();
                calculateMath39();
            }
        });

        const inY = document.createElement("input");
        inY.type = "number";
        inY.step = "any";
        inY.inputMode = "decimal";
        inY.className = "lr-row-input";
        inY.value = String(pt.y);
        inY.setAttribute("aria-label", `Nilai y untuk data ${badge.textContent}`);
        inY.addEventListener("input", () => {
            const val = parseFloat(inY.value);
            if (Number.isFinite(val)) {
                currentPoints[idx].y = val;
                if (currentMode === "gd") resetGD();
                calculateMath39();
            }
        });

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "lr-row-del";
        delBtn.textContent = "\u00d7";
        delBtn.disabled = currentPoints.length <= 2;
        delBtn.setAttribute("aria-label", `Hapus data ${badge.textContent}`);
        delBtn.addEventListener("click", () => {
            if (currentPoints.length <= 2) return;
            currentPoints.splice(idx, 1);
            renderPointRows();
            if (currentMode === "gd") resetGD();
            calculateMath39();
        });

        row.appendChild(badge);
        row.appendChild(inX);
        row.appendChild(inY);
        row.appendChild(delBtn);
        listEl.appendChild(row);
    });
}

function syncModeUI() {
    const tabOls = document.getElementById("math39-tab-ols");
    const tabGd = document.getElementById("math39-tab-gd");
    const gdControls = document.getElementById("math39-gd-panel");
    const olsQueryBox = document.getElementById("math39-query-box");
    const lossWrap = document.getElementById("math39-loss-wrap");

    if (tabOls) {
        tabOls.classList.toggle("active", currentMode === "ols");
        tabOls.setAttribute("aria-selected", String(currentMode === "ols"));
    }
    if (tabGd) {
        tabGd.classList.toggle("active", currentMode === "gd");
        tabGd.setAttribute("aria-selected", String(currentMode === "gd"));
    }
    if (gdControls) gdControls.classList.toggle("hidden", currentMode !== "gd");
    if (lossWrap) lossWrap.classList.toggle("hidden", currentMode !== "gd");
    if (olsQueryBox) olsQueryBox.classList.toggle("hidden", currentMode === "gd");
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
    renderPointRows();
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
            const listEl = refs.m39Rows || document.getElementById("math39-rows-container");
            const row = listEl?.children[draggedIdx];
            const inputs = row?.querySelectorAll(".lr-row-input");
            if (inputs && inputs.length === 2) {
                inputs[0].value = String(mathPos.x);
                inputs[1].value = String(mathPos.y);
            }
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
    if (!initialized) {
        initialized = true;
        const selPreset = refs.m39Preset || document.getElementById("math39-preset");
        if (selPreset) {
            selPreset.addEventListener("change", () => loadPreset(selPreset.value));
        }

        const btnAdd = document.getElementById("math39-btn-add");
        if (btnAdd) {
            btnAdd.addEventListener("click", () => {
                if (currentPoints.length >= 12) return;
                const last = currentPoints[currentPoints.length - 1] || { x: 0, y: 0 };
                currentPoints.push({
                    label: defaultLabelAt(currentPoints.length),
                    x: Math.round((last.x + 2) * 10) / 10,
                    y: Math.round((last.y + 5) * 10) / 10
                });
                renderPointRows();
                if (currentMode === "gd") resetGD();
                calculateMath39();
            });
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
        if (inQx) inQx.addEventListener("input", calculateMath39);
        if (chkStd) {
            chkStd.addEventListener("change", () => {
                resetGD();
                calculateMath39();
            });
        }
        if (inLr) inLr.addEventListener("input", calculateMath39);

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
        renderPointRows();
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

    renderLRSteps(ols, currentMode, gdState, currentPresetMeta.queryLabel);
}
