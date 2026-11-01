import { computeOLS, gradientDescentStep } from "./linear-model.js";
import { computeMetrics } from "./linear-metrics.js";
import {
    getStudyHoursPreset,
    getCarAgePreset,
    getOutlierPreset,
    getRandomPreset,
    getHouseAreaPreset,
    PRESET_INFOS
} from "./linear-presets.js";
import { createLinearCanvas } from "./linear-canvas.js";
import { bindCanvasEvents } from "./linear-events.js";
import { renderLossCanvas } from "./linear-loss-canvas.js";
import { generateKatexBreakdown, renderKatex } from "./linear-katex.js";
import { CODE_SNIPPETS } from "./linear-code-snippets.js";
import { renderLinearGuide } from "./linear-guide.js";

export function initLinearApp() {
    const mainCanvas = document.getElementById("linear-canvas");
    const lossCanvas = document.getElementById("linear-loss-canvas");
    if (!mainCanvas) return;

    const canvasRenderer = createLinearCanvas(mainCanvas);

    const state = {
        points: getStudyHoursPreset(),
        activePreset: "study-hours",
        mode: "ols",
        w: 5.6,
        b: 47.0,
        manualW: 5.6,
        manualB: 47.0,
        showResiduals: true,
        showSquares: false,
        hoveredIdx: -1,
        draggedIdx: -1,
        learningRate: 0.005,
        gdRunning: false,
        lossHistory: []
    };

    const els = {
        metricW: document.getElementById("metric-w"),
        metricB: document.getElementById("metric-b"),
        metricMse: document.getElementById("metric-mse"),
        metricRmse: document.getElementById("metric-rmse"),
        metricMae: document.getElementById("metric-mae"),
        metricR2: document.getElementById("metric-r2"),
        metricR: document.getElementById("metric-r"),
        texSummary: document.getElementById("linear-tex-summary"),
        texSlope: document.getElementById("linear-tex-slope"),
        texIntercept: document.getElementById("linear-tex-intercept"),
        texLine: document.getElementById("linear-tex-line"),
        texR2: document.getElementById("linear-tex-r2"),
        sliderW: document.getElementById("slider-w"),
        sliderB: document.getElementById("slider-b"),
        valSliderW: document.getElementById("val-slider-w"),
        valSliderB: document.getElementById("val-slider-b"),
        sliderLr: document.getElementById("slider-lr"),
        valSliderLr: document.getElementById("val-slider-lr"),
        codePre: document.getElementById("linear-code-pre"),
        codePanel: document.getElementById("linear-code-panel"),
        guideBox: document.getElementById("linear-guide-container"),
        btnStep: document.getElementById("btn-gd-step"),
        btnRun: document.getElementById("btn-gd-run"),
        btnResetGd: document.getElementById("btn-gd-reset"),
        chkResiduals: document.getElementById("chk-residuals"),
        chkSquares: document.getElementById("chk-squares"),
        presetDesc: document.getElementById("linear-preset-desc"),
        btnCodeFloating: document.getElementById("btn-code-floating"),
        btnCodeClose: document.getElementById("linear-code-close")
    };

    if (els.guideBox) {
        renderLinearGuide(els.guideBox);
    }

    function syncUI() {
        const ols = computeOLS(state.points);
        if (state.mode === "ols") {
            state.w = ols.w;
            state.b = ols.b;
            if (els.sliderW) els.sliderW.value = ols.w.toFixed(2);
            if (els.sliderB) els.sliderB.value = ols.b.toFixed(2);
            if (els.valSliderW) els.valSliderW.textContent = ols.w.toFixed(2);
            if (els.valSliderB) els.valSliderB.textContent = ols.b.toFixed(2);
        } else if (state.mode === "manual") {
            state.w = state.manualW;
            state.b = state.manualB;
        }

        const metrics = computeMetrics(state.points, state.w, state.b);

        if (els.metricW) els.metricW.textContent = state.w.toFixed(3);
        if (els.metricB) els.metricB.textContent = state.b.toFixed(3);
        if (els.metricMse) els.metricMse.textContent = metrics.mse.toFixed(2);
        if (els.metricRmse) els.metricRmse.textContent = metrics.rmse.toFixed(2);
        if (els.metricMae) els.metricMae.textContent = metrics.mae.toFixed(2);
        if (els.metricR2) {
            els.metricR2.textContent = metrics.r2.toFixed(3);
            els.metricR2.className = metrics.r2 >= 0.7 ? "metric-val metric-good" : metrics.r2 >= 0 ? "metric-val metric-warn" : "metric-val metric-bad";
        }
        if (els.metricR) els.metricR.textContent = metrics.r.toFixed(3);

        const texData = generateKatexBreakdown(ols, metrics);
        renderKatex(texData.summaryTex, els.texSummary);
        renderKatex(texData.slopeTex, els.texSlope);
        renderKatex(texData.interceptTex, els.texIntercept);
        renderKatex(texData.lineTex, els.texLine);
        renderKatex(texData.r2Tex, els.texR2);

        canvasRenderer.render(state);
        renderLossCanvas(lossCanvas, state.lossHistory);

        if (els.presetDesc && PRESET_INFOS[state.activePreset]) {
            els.presetDesc.textContent = PRESET_INFOS[state.activePreset].desc;
        }
    }

    function applyPreset(name) {
        state.activePreset = name;
        if (name === "study-hours") state.points = getStudyHoursPreset();
        if (name === "car-age") state.points = getCarAgePreset();
        if (name === "outlier") state.points = getOutlierPreset();
        if (name === "random") state.points = getRandomPreset();
        if (name === "house-area") state.points = getHouseAreaPreset();
        state.lossHistory = [];
        syncUI();
    }

    function setMode(newMode) {
        state.mode = newMode;
        document.querySelectorAll(".btn-linear-mode").forEach((b) => {
            b.classList.toggle("active", b.dataset.mode === newMode);
        });

        const manualWrap = document.getElementById("linear-manual-controls");
        const gdWrap = document.getElementById("linear-gd-controls");
        if (manualWrap) manualWrap.classList.toggle("hidden", newMode !== "manual");
        if (gdWrap) gdWrap.classList.toggle("hidden", newMode !== "gd");

        if (newMode === "gd") {
            state.w = 0;
            state.b = state.points.length > 0 ? state.points[0].y : 0;
            state.lossHistory = [computeMetrics(state.points, state.w, state.b).mse];
        }
        syncUI();
    }

    let animationId = null;

    function stepGradientDescent() {
        if (state.points.length < 2) return;
        const res = gradientDescentStep(state.points, state.w, state.b, state.learningRate);
        state.w = res.w;
        state.b = res.b;
        const curMse = computeMetrics(state.points, state.w, state.b).mse;
        state.lossHistory.push(curMse);
        if (state.lossHistory.length > 80) state.lossHistory.shift();
        syncUI();
    }

    function toggleRun() {
        state.gdRunning = !state.gdRunning;
        if (els.btnRun) els.btnRun.textContent = state.gdRunning ? "Jeda \u23f8" : "Jalankan Otomatis \u25b6";

        if (state.gdRunning) {
            function loop() {
                if (!state.gdRunning) return;
                stepGradientDescent();
                animationId = requestAnimationFrame(loop);
            }
            animationId = requestAnimationFrame(loop);
        } else if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }

    bindCanvasEvents(mainCanvas, canvasRenderer, state, syncUI);

    document.querySelectorAll(".btn-linear-preset").forEach((b) => {
        b.addEventListener("click", () => {
            document.querySelectorAll(".btn-linear-preset").forEach((btn) => btn.classList.remove("active"));
            b.classList.add("active");
            applyPreset(b.dataset.preset);
        });
    });

    document.querySelectorAll(".btn-linear-mode").forEach((b) => {
        b.addEventListener("click", () => setMode(b.dataset.mode));
    });

    if (els.chkResiduals) {
        els.chkResiduals.addEventListener("change", (e) => {
            state.showResiduals = e.target.checked;
            canvasRenderer.render(state);
        });
    }

    if (els.chkSquares) {
        els.chkSquares.addEventListener("change", (e) => {
            state.showSquares = e.target.checked;
            canvasRenderer.render(state);
        });
    }

    if (els.sliderW) {
        els.sliderW.addEventListener("input", (e) => {
            state.manualW = parseFloat(e.target.value);
            if (els.valSliderW) els.valSliderW.textContent = state.manualW.toFixed(2);
            syncUI();
        });
    }

    if (els.sliderB) {
        els.sliderB.addEventListener("input", (e) => {
            state.manualB = parseFloat(e.target.value);
            if (els.valSliderB) els.valSliderB.textContent = state.manualB.toFixed(2);
            syncUI();
        });
    }

    if (els.sliderLr) {
        els.sliderLr.addEventListener("input", (e) => {
            state.learningRate = parseFloat(e.target.value);
            if (els.valSliderLr) els.valSliderLr.textContent = state.learningRate.toFixed(4);
        });
    }

    if (els.btnStep) els.btnStep.addEventListener("click", stepGradientDescent);
    if (els.btnRun) els.btnRun.addEventListener("click", toggleRun);
    if (els.btnResetGd) {
        els.btnResetGd.addEventListener("click", () => {
            if (state.gdRunning) toggleRun();
            state.w = 0;
            state.b = state.points.length > 0 ? state.points[0].y : 0;
            state.lossHistory = [computeMetrics(state.points, state.w, state.b).mse];
            syncUI();
        });
    }

    const btnClear = document.getElementById("btn-clear-points");
    if (btnClear) {
        btnClear.addEventListener("click", () => {
            state.points = [];
            state.lossHistory = [];
            syncUI();
        });
    }

    document.querySelectorAll(".btn-code-tab").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".btn-code-tab").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const lang = btn.dataset.lang;
            if (els.codePre && CODE_SNIPPETS[lang]) {
                els.codePre.textContent = CODE_SNIPPETS[lang];
            }
        });
    });

    if (els.btnCodeFloating && els.codePanel) {
        els.btnCodeFloating.addEventListener("click", () => {
            els.codePanel.classList.toggle("sort-code-hidden");
        });
    }

    if (els.btnCodeClose && els.codePanel) {
        els.btnCodeClose.addEventListener("click", () => {
            els.codePanel.classList.add("sort-code-hidden");
        });
    }

    if (els.codePre) {
        els.codePre.textContent = CODE_SNIPPETS.python;
    }

    syncUI();
}

if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLinearApp);
    } else {
        initLinearApp();
    }
}
