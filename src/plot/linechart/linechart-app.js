import { parseLineData, sliceDatasetWindow, computeSeriesStats } from "./parser.js";
import { calculateLineLayout, hitTestNearestX } from "./geometry.js";
import { renderLineCanvas } from "./renderer.js";
import { LINE_PRESETS } from "./presets.js";
import { updateMetricsBanner, renderLegendPills, syncInputsFromState, bindExportButtons } from "./linechart-ui.js";

export function createLineChartApp() {
    const initial = LINE_PRESETS.climate;
    const state = {
        rawText: initial.data,
        title: initial.title,
        yTitle: initial.yTitle,
        mode: initial.mode,
        palette: "okabe_ito",
        markerMode: "auto",
        strokeWidth: 2.4,
        beginAtZero: initial.beginAtZero,
        areaFill: initial.areaFill,
        connectNull: initial.connectNull,
        showMean: initial.showMean,
        showTrendline: initial.showTrendline,
        showRegion: false,
        regionStartPct: 58,
        regionEndPct: 86,
        rangeStartPct: 0,
        rangeEndPct: 100,
        dataset: null,
        windowDataset: null,
        statsBySeries: {},
        hiddenSeries: new Set(),
        focusedSeries: null,
        hoverIndex: null,
        layout: null,
        logicalW: 880,
        logicalH: 480,
        dpr: 1
    };

    let canvas = null;
    let textArea = null;

    function recomputeLayout() {
        if (!state.windowDataset) {
            return;
        }
        const container = canvas ? canvas.parentElement : null;
        const w = container && container.clientWidth ? Math.max(320, container.clientWidth - 24) : 880;
        const h = Math.min(540, Math.max(360, Math.round(w * 0.54)));
        const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        state.logicalW = w;
        state.logicalH = h;
        state.dpr = dpr;
        if (canvas) {
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
        }
        state.layout = calculateLineLayout({
            dataset: state.windowDataset,
            hiddenSeries: state.hiddenSeries,
            width: w,
            height: h,
            beginAtZero: state.beginAtZero
        });
    }

    function render() {
        if (!canvas || !state.layout || !state.windowDataset) {
            return;
        }
        const ctx = typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
        if (!ctx) {
            return;
        }
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        renderLineCanvas(ctx, {
            dataset: state.windowDataset,
            layout: state.layout,
            statsBySeries: state.statsBySeries,
            hiddenSeries: state.hiddenSeries,
            focusedSeries: state.focusedSeries,
            hoverIndex: state.hoverIndex,
            options: { ...state }
        });
    }

    function refreshLegend() {
        renderLegendPills(state, {
            onToggle: (id) => {
                if (state.hiddenSeries.has(id)) {
                    state.hiddenSeries.delete(id);
                } else {
                    state.hiddenSeries.add(id);
                }
                if (state.focusedSeries === id) {
                    state.focusedSeries = null;
                }
                recomputeLayout();
                refreshLegend();
                updateMetricsBanner(state);
                render();
            },
            onFocus: (id) => {
                if (id && state.hiddenSeries.has(id)) {
                    return;
                }
                state.focusedSeries = id;
                updateMetricsBanner(state);
                render();
            }
        });
    }

    function applyWindowAndLayout() {
        if (!state.dataset) {
            return;
        }
        state.windowDataset = sliceDatasetWindow(state.dataset, state.rangeStartPct, state.rangeEndPct);
        state.statsBySeries = {};
        for (let i = 0; i < state.windowDataset.series.length; i += 1) {
            const s = state.windowDataset.series[i];
            state.statsBySeries[s.id] = computeSeriesStats(s.values, state.windowDataset.xValues);
        }
        state.hoverIndex = null;
        recomputeLayout();
        updateMetricsBanner(state);
        render();
    }

    function updateData() {
        state.rawText = textArea ? textArea.value : state.rawText;
        state.dataset = parseLineData(state.rawText);
        const validIds = new Set(state.dataset.series.map((s) => s.id));
        for (const id of Array.from(state.hiddenSeries)) {
            if (!validIds.has(id)) {
                state.hiddenSeries.delete(id);
            }
        }
        applyWindowAndLayout();
        refreshLegend();
    }

    function bindPresetButtons() {
        Object.values(LINE_PRESETS).forEach((preset) => {
            const btn = document.getElementById(`line-preset-${preset.id}`);
            if (!btn) {
                return;
            }
            btn.addEventListener("click", () => {
                if (textArea) {
                    textArea.value = preset.data;
                }
                Object.assign(state, {
                    rawText: preset.data,
                    title: preset.title,
                    yTitle: preset.yTitle,
                    mode: preset.mode,
                    beginAtZero: preset.beginAtZero,
                    areaFill: preset.areaFill,
                    connectNull: preset.connectNull,
                    showMean: preset.showMean,
                    showTrendline: preset.showTrendline,
                    rangeStartPct: 0,
                    rangeEndPct: 100
                });
                state.hiddenSeries.clear();
                syncInputsFromState(state);
                updateData();
            });
        });
    }

    function bindControls() {
        textArea?.addEventListener("input", updateData);
        bindPresetButtons();
        const bindSelect = (id, prop) => {
            document.getElementById(id)?.addEventListener("change", (e) => {
                state[prop] = e.target.value;
                if (prop === "palette") {
                    refreshLegend();
                }
                render();
            });
        };
        bindSelect("line-opt-mode", "mode");
        bindSelect("line-opt-palette", "palette");
        bindSelect("line-opt-markers", "markerMode");
        const bindCheck = (id, prop, needsLayout = false) => {
            document.getElementById(id)?.addEventListener("change", (e) => {
                state[prop] = e.target.checked;
                if (needsLayout) {
                    recomputeLayout();
                }
                render();
            });
        };
        bindCheck("line-opt-zero", "beginAtZero", true);
        bindCheck("line-opt-area", "areaFill");
        bindCheck("line-opt-nulls", "connectNull");
        bindCheck("line-opt-mean", "showMean");
        bindCheck("line-opt-trend", "showTrendline");
        bindCheck("line-opt-region", "showRegion");
        const widthSlider = document.getElementById("line-opt-width");
        const widthVal = document.getElementById("line-opt-width-val");
        widthSlider?.addEventListener("input", (e) => {
            state.strokeWidth = parseFloat(e.target.value);
            if (widthVal) {
                widthVal.textContent = `${state.strokeWidth.toFixed(1)}px`;
            }
            render();
        });
        const rs = document.getElementById("line-opt-range-start");
        const re = document.getElementById("line-opt-range-end");
        const rv = document.getElementById("line-opt-range-val");
        const onRange = () => {
            let sVal = rs ? parseInt(rs.value, 10) : 0;
            const eVal = re ? parseInt(re.value, 10) : 100;
            if (sVal > eVal - 5) {
                sVal = Math.max(0, eVal - 5);
                if (rs) {
                    rs.value = String(sVal);
                }
            }
            state.rangeStartPct = sVal;
            state.rangeEndPct = eVal;
            if (rv) {
                rv.textContent = `${sVal}% - ${eVal}%`;
            }
            applyWindowAndLayout();
        };
        rs?.addEventListener("input", onRange);
        re?.addEventListener("input", onRange);
        if (canvas) {
            canvas.addEventListener("mousemove", (e) => {
                if (!state.layout) {
                    return;
                }
                const rect = canvas.getBoundingClientRect();
                const hit = hitTestNearestX(e.clientX - rect.left, e.clientY - rect.top, state.layout);
                const nextIdx = hit ? hit.index : null;
                if (nextIdx !== state.hoverIndex) {
                    state.hoverIndex = nextIdx;
                    render();
                }
            });
            canvas.addEventListener("mouseleave", () => {
                if (state.hoverIndex !== null) {
                    state.hoverIndex = null;
                    render();
                }
            });
        }
        bindExportButtons(state, () => canvas);
        window.addEventListener("resize", () => {
            recomputeLayout();
            render();
        });
    }

    function init() {
        canvas = document.getElementById("line-canvas");
        textArea = document.getElementById("line-input-text");
        if (textArea && !textArea.value) {
            textArea.value = state.rawText;
        }
        syncInputsFromState(state);
        bindControls();
        updateData();
    }

    return { init, updateData, recomputeLayout, render, getState: () => state };
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => createLineChartApp().init());
    } else {
        createLineChartApp().init();
    }
}
