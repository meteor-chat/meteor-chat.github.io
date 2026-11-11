import { parseBarData, computeDatasetStats, sortBarData, exportToCSV, formatNumber } from "./parser.js";
import { calculateBarLayout, hitTestBar } from "./geometry.js";
import { renderBarChart, generateBarSVG, exportCanvasAsPNG } from "./renderer.js";
import { getPresetData } from "./presets.js";

export function createBarChartApp() {
    const state = {
        rawText: getPresetData("benchmark"),
        items: [],
        sortedItems: [],
        stats: null,
        layout: null,
        orientation: "vertical",
        clusterRatio: 0.7,
        palette: "okabe_ito",
        showValues: true,
        showAverage: true,
        colorNegative: true,
        sortMode: "none",
        hoveredBar: null
    };

    let canvas = null;
    let textArea = null;

    function updateData() {
        if (!textArea) return;
        state.rawText = textArea.value;
        state.items = parseBarData(state.rawText);
        state.sortedItems = sortBarData(state.items, state.sortMode);
        state.stats = computeDatasetStats(state.sortedItems);
        updateStatsUI();
        recomputeLayout();
        render();
    }

    function updateStatsUI() {
        const s = state.stats;
        if (!s) return;
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setVal("bar-stat-count", s.count.toString());
        setVal("bar-stat-sum", formatNumber(s.sum));
        setVal("bar-stat-mean", formatNumber(s.mean));
        setVal("bar-stat-min", formatNumber(s.min));
        setVal("bar-stat-max", formatNumber(s.max));
        setVal("bar-stat-stddev", formatNumber(s.stdDev));
    }

    function recomputeLayout() {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const displayW = Math.max(320, Math.floor(rect.width || 760));
        const displayH = Math.max(300, Math.floor(rect.height || 460));
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(displayW * dpr);
        canvas.height = Math.floor(displayH * dpr);

        state.layout = calculateBarLayout({
            items: state.sortedItems,
            width: canvas.width,
            height: canvas.height,
            orientation: state.orientation,
            clusterRatio: state.clusterRatio,
            beginAtZero: true
        });
    }

    function render() {
        if (!canvas || !state.layout) return;
        renderBarChart(canvas, {
            layout: state.layout,
            stats: state.stats,
            options: {
                palette: state.palette,
                showValues: state.showValues,
                showAverage: state.showAverage,
                colorNegative: state.colorNegative
            },
            hoveredBar: state.hoveredBar
        });
    }

    function handleMouseMove(e) {
        if (!canvas || !state.layout) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const mouseX = (e.clientX - rect.left) * dpr;
        const mouseY = (e.clientY - rect.top) * dpr;
        const bar = hitTestBar(mouseX, mouseY, state.layout.bars);
        if (bar !== state.hoveredBar) {
            state.hoveredBar = bar;
            render();
        }
    }

    function handleMouseLeave() {
        if (state.hoveredBar) {
            state.hoveredBar = null;
            render();
        }
    }

    function downloadBlob(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function setupEventListeners() {
        if (textArea) textArea.addEventListener("input", updateData);

        const bindPreset = (id, key) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener("click", () => {
                    textArea.value = getPresetData(key);
                    updateData();
                });
            }
        };
        bindPreset("bar-preset-benchmark", "benchmark");
        bindPreset("bar-preset-finance", "finance");
        bindPreset("bar-preset-languages", "languages");

        const orientationSelect = document.getElementById("bar-opt-orientation");
        if (orientationSelect) {
            orientationSelect.addEventListener("change", (e) => {
                state.orientation = e.target.value;
                recomputeLayout();
                render();
            });
        }

        const paletteSelect = document.getElementById("bar-opt-palette");
        if (paletteSelect) {
            paletteSelect.addEventListener("change", (e) => {
                state.palette = e.target.value;
                render();
            });
        }

        const sortSelect = document.getElementById("bar-opt-sort");
        if (sortSelect) {
            sortSelect.addEventListener("change", (e) => {
                state.sortMode = e.target.value;
                state.sortedItems = sortBarData(state.items, state.sortMode);
                recomputeLayout();
                render();
            });
        }

        const widthSlider = document.getElementById("bar-opt-width");
        const widthValEl = document.getElementById("bar-opt-width-val");
        if (widthSlider) {
            widthSlider.addEventListener("input", (e) => {
                state.clusterRatio = parseFloat(e.target.value);
                if (widthValEl) widthValEl.textContent = Math.round(state.clusterRatio * 100) + "%";
                recomputeLayout();
                render();
            });
        }

        const bindCheck = (id, prop) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", (e) => {
                    state[prop] = e.target.checked;
                    render();
                });
            }
        };
        bindCheck("bar-opt-show-values", "showValues");
        bindCheck("bar-opt-show-avg", "showAverage");
        bindCheck("bar-opt-color-neg", "colorNegative");

        if (canvas) {
            canvas.addEventListener("mousemove", handleMouseMove);
            canvas.addEventListener("mouseleave", handleMouseLeave);
        }

        const exportPngBtn = document.getElementById("bar-btn-export-png");
        if (exportPngBtn) {
            exportPngBtn.addEventListener("click", () => {
                if (canvas) exportCanvasAsPNG(canvas, "bar-chart.png");
            });
        }

        const getSvg = () => {
            if (!state.layout || !canvas) return "";
            return generateBarSVG({
                width: canvas.width,
                height: canvas.height,
                layout: state.layout,
                stats: state.stats,
                options: {
                    palette: state.palette,
                    showValues: state.showValues,
                    showAverage: state.showAverage,
                    colorNegative: state.colorNegative
                }
            });
        };

        const exportSvgBtn = document.getElementById("bar-btn-export-svg");
        if (exportSvgBtn) {
            exportSvgBtn.addEventListener("click", () => {
                const svgString = getSvg();
                if (svgString) downloadBlob(svgString, "bar-chart.svg", "image/svg+xml;charset=utf-8");
            });
        }

        const exportCsvBtn = document.getElementById("bar-btn-export-csv");
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener("click", () => {
                const csv = exportToCSV(state.sortedItems);
                downloadBlob(csv, "bar-chart-data.csv", "text/csv;charset=utf-8");
            });
        }

        const copySvgBtn = document.getElementById("bar-btn-copy-svg");
        if (copySvgBtn) {
            copySvgBtn.addEventListener("click", async () => {
                const svgString = getSvg();
                if (svgString && navigator.clipboard) {
                    await navigator.clipboard.writeText(svgString);
                    const original = copySvgBtn.textContent;
                    copySvgBtn.textContent = "Disalin!";
                    setTimeout(() => { copySvgBtn.textContent = original; }, 1800);
                }
            });
        }

        window.addEventListener("resize", () => {
            recomputeLayout();
            render();
        });
    }

    function init() {
        canvas = document.getElementById("bar-canvas");
        textArea = document.getElementById("bar-input-text");
        if (textArea && !textArea.value) {
            textArea.value = state.rawText;
        }
        setupEventListeners();
        updateData();
    }

    return {
        init,
        updateData,
        getState: () => state,
        recomputeLayout,
        render
    };
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            const app = createBarChartApp();
            app.init();
        });
    } else {
        const app = createBarChartApp();
        app.init();
    }
}
