import { parsePieData, preparePieData, computePieStats } from "./parser.js";
import { calculatePieLayout, hitTestPie } from "./geometry.js";
import { renderPieCanvas } from "./renderer.js";
import { PIE_PRESETS } from "./presets.js";
import {
    updatePieMetricsBanner,
    renderPieLegendPills,
    syncPieInputsFromState,
    bindPiePresetButtons,
    bindPieExportButtons
} from "./piechart-ui.js";

export function createPieChartApp() {
    const initial = PIE_PRESETS.budget;
    const state = {
        rawText: initial.data,
        title: initial.title,
        mode: initial.mode,
        sortOrder: initial.sortOrder,
        cutoutPct: initial.cutoutPct,
        gapWidth: 2,
        startAngleDeg: -90,
        groupSmall: initial.groupSmall,
        smallThresholdPct: initial.smallThresholdPct,
        palette: "okabe_ito",
        contrastOrder: true,
        labelMode: "auto",
        labelFormat: "pct",
        labelThresholdPct: 4,
        expandOnHover: true,
        showCenterKpi: true,
        dataset: null,
        prepared: null,
        stats: null,
        hiddenCategories: new Set(),
        focusedCategoryId: null,
        hoveredSlice: null,
        layout: null,
        logicalW: 860,
        logicalH: 500,
        dpr: 1
    };

    let canvas = null;
    let textArea = null;

    function recomputeLayout() {
        if (!state.prepared) {
            return;
        }
        const container = canvas ? canvas.parentElement : null;
        const w = container && container.clientWidth ? Math.max(320, container.clientWidth - 24) : 860;
        const h = Math.min(540, Math.max(380, Math.round(w * 0.58)));
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
        state.layout = calculatePieLayout({
            prepared: state.prepared,
            mode: state.mode,
            width: w,
            height: h,
            title: state.title,
            cutoutPct: state.cutoutPct,
            startAngleDeg: state.startAngleDeg,
            labelMode: state.labelMode,
            labelThresholdPct: state.labelThresholdPct
        });
    }

    function render() {
        if (!canvas || !state.layout || !state.prepared) {
            return;
        }
        const ctx = typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
        if (!ctx) {
            return;
        }
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        renderPieCanvas(ctx, {
            prepared: state.prepared,
            layout: state.layout,
            stats: state.stats,
            hoveredSlice: state.hoveredSlice,
            focusedCategoryId: state.focusedCategoryId,
            options: { ...state }
        });
    }

    function refreshLegend() {
        renderPieLegendPills(state, {
            onToggle: (id) => {
                if (state.hiddenCategories.has(id)) {
                    state.hiddenCategories.delete(id);
                } else {
                    state.hiddenCategories.add(id);
                }
                if (state.focusedCategoryId === id) {
                    state.focusedCategoryId = null;
                }
                rebuildPreparedAndRender();
            },
            onFocus: (id) => {
                if (id && state.hiddenCategories.has(id)) {
                    return;
                }
                state.focusedCategoryId = id;
                render();
            }
        });
    }

    function rebuildPreparedAndRender() {
        if (!state.dataset) {
            return;
        }
        state.prepared = preparePieData(state.dataset, {
            hiddenCategories: state.hiddenCategories,
            sortOrder: state.sortOrder,
            groupSmall: state.groupSmall,
            smallThresholdPct: state.smallThresholdPct
        });
        const primarySeriesIdx = Math.max(0, state.prepared.seriesCount - 1);
        state.stats = computePieStats(state.prepared, primarySeriesIdx);
        state.hoveredSlice = null;
        recomputeLayout();
        updatePieMetricsBanner(state);
        refreshLegend();
        render();
    }

    function updateData() {
        const prevSeriesCount = state.dataset ? state.dataset.seriesNames.length : 1;
        state.rawText = textArea ? textArea.value : state.rawText;
        state.dataset = parsePieData(state.rawText);
        const validIds = new Set(state.dataset.rows.map((r) => r.id));
        for (const id of Array.from(state.hiddenCategories)) {
            if (!validIds.has(id)) {
                state.hiddenCategories.delete(id);
            }
        }
        const nextSeriesCount = state.dataset.seriesNames.length;
        if (nextSeriesCount > 1 && prevSeriesCount === 1 && (state.mode === "donut" || state.mode === "pie")) {
            state.mode = "multi";
            if (state.cutoutPct < 24) {
                state.cutoutPct = 34;
            }
            syncPieInputsFromState(state);
        } else if (nextSeriesCount === 1 && state.mode === "multi") {
            state.mode = "donut";
            syncPieInputsFromState(state);
        }
        rebuildPreparedAndRender();
    }

    function bindControls() {
        textArea?.addEventListener("input", updateData);
        bindPiePresetButtons(state, () => textArea, updateData);

        document.getElementById("pie-opt-mode")?.addEventListener("change", (e) => {
            state.mode = e.target.value;
            if (state.mode === "donut" && state.cutoutPct < 20) {
                state.cutoutPct = 52;
            } else if (state.mode === "multi" && state.cutoutPct < 20) {
                state.cutoutPct = 34;
            }
            syncPieInputsFromState(state);
            recomputeLayout();
            render();
        });

        const bindChange = (id, prop, after) => {
            document.getElementById(id)?.addEventListener("change", (e) => {
                state[prop] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
                after();
            });
        };
        bindChange("pie-opt-sort", "sortOrder", rebuildPreparedAndRender);
        bindChange("pie-opt-palette", "palette", () => {
            refreshLegend();
            render();
        });
        bindChange("pie-opt-labels", "labelMode", () => {
            recomputeLayout();
            render();
        });
        bindChange("pie-opt-label-format", "labelFormat", render);
        bindChange("pie-opt-group-small", "groupSmall", rebuildPreparedAndRender);
        bindChange("pie-opt-contrast-order", "contrastOrder", () => {
            refreshLegend();
            render();
        });
        bindChange("pie-opt-expand", "expandOnHover", render);
        bindChange("pie-opt-center-kpi", "showCenterKpi", render);

        const bindRange = (id, badgeId, prop, suffix, callback) => {
            const input = document.getElementById(id);
            const badge = document.getElementById(badgeId);
            input?.addEventListener("input", (e) => {
                state[prop] = parseFloat(e.target.value);
                if (badge) {
                    badge.textContent = `${state[prop]}${suffix}`;
                }
                callback();
            });
        };

        bindRange("pie-opt-cutout", "pie-opt-cutout-val", "cutoutPct", "%", () => {
            if (state.mode === "pie" && state.cutoutPct > 0) {
                state.mode = "donut";
                syncPieInputsFromState(state);
            } else if (state.mode === "donut" && state.cutoutPct === 0) {
                state.mode = "pie";
                syncPieInputsFromState(state);
            }
            recomputeLayout();
            render();
        });
        bindRange("pie-opt-gap", "pie-opt-gap-val", "gapWidth", "px", render);
        bindRange("pie-opt-angle", "pie-opt-angle-val", "startAngleDeg", " deg", () => {
            recomputeLayout();
            render();
        });
        bindRange("pie-opt-threshold", "pie-opt-threshold-val", "labelThresholdPct", "%", () => {
            recomputeLayout();
            render();
        });

        if (canvas) {
            canvas.addEventListener("mousemove", (e) => {
                if (!state.layout) {
                    return;
                }
                const rect = canvas.getBoundingClientRect();
                const hit = hitTestPie(e.clientX - rect.left, e.clientY - rect.top, state.layout);
                const prevId = state.hoveredSlice ? state.hoveredSlice.id : null;
                const nextId = hit ? hit.id : null;
                if (prevId !== nextId) {
                    state.hoveredSlice = hit;
                    render();
                }
            });
            canvas.addEventListener("mouseleave", () => {
                if (state.hoveredSlice) {
                    state.hoveredSlice = null;
                    render();
                }
            });
        }

        bindPieExportButtons(state, () => canvas);
        window.addEventListener("resize", () => {
            recomputeLayout();
            render();
        });
    }

    function init() {
        canvas = document.getElementById("pie-canvas");
        textArea = document.getElementById("pie-input-text");
        if (textArea && !textArea.value) {
            textArea.value = state.rawText;
        }
        syncPieInputsFromState(state);
        bindControls();
        updateData();
    }

    return { init, updateData, recomputeLayout, render, getState: () => state };
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => createPieChartApp().init());
    } else {
        createPieChartApp().init();
    }
}
