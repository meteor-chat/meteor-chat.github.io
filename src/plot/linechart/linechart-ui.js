import { formatNumber, exportLineCSV } from "./parser.js";
import { getSeriesColor, generateLineSVG, exportCanvasAsPNG } from "./exporter.js";

export function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function getPrimaryVisibleSeries(windowDataset, hiddenSeries, focusedSeries) {
    if (!windowDataset || windowDataset.series.length === 0) {
        return null;
    }
    if (focusedSeries && !hiddenSeries.has(focusedSeries)) {
        const hit = windowDataset.series.find((s) => s.id === focusedSeries);
        if (hit) {
            return hit;
        }
    }
    return windowDataset.series.find((s) => !hiddenSeries.has(s.id)) || windowDataset.series[0];
}

export function updateMetricsBanner(state) {
    const setEl = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    };
    const ds = state.windowDataset;
    const primary = getPrimaryVisibleSeries(ds, state.hiddenSeries, state.focusedSeries);
    const st = primary ? state.statsBySeries[primary.id] : null;
    setEl("line-stat-points", ds ? `${ds.rowCount} (${ds.series.length} seri)` : "0");
    if (st && st.count > 0) {
        setEl("line-stat-range", `${formatNumber(st.min)}..${formatNumber(st.max)}`);
        setEl("line-stat-mean", formatNumber(st.mean));
        setEl("line-stat-delta", `${st.delta > 0 ? "+" : ""}${formatNumber(st.delta)}`);
        if (st.regression) {
            setEl("line-stat-slope", `${st.regression.slope > 0 ? "+" : ""}${formatNumber(st.regression.slope, 3)}`);
            setEl("line-stat-r2", formatNumber(st.regression.r2, 3));
        } else {
            setEl("line-stat-slope", "-");
            setEl("line-stat-r2", "-");
        }
    } else {
        setEl("line-stat-range", "-");
        setEl("line-stat-mean", "-");
        setEl("line-stat-delta", "-");
        setEl("line-stat-slope", "-");
        setEl("line-stat-r2", "-");
    }
}

export function renderLegendPills(state, callbacks) {
    const container = document.getElementById("line-legend-bar");
    if (!container || !state.windowDataset) {
        return;
    }
    container.innerHTML = "";
    state.windowDataset.series.forEach((s, idx) => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = state.hiddenSeries.has(s.id) ? "line-legend-pill is-hidden" : "line-legend-pill";
        const dot = document.createElement("span");
        dot.className = "line-legend-dot";
        dot.style.background = getSeriesColor(state.palette, idx);
        const label = document.createElement("span");
        label.textContent = s.name;
        pill.appendChild(dot);
        pill.appendChild(label);
        pill.addEventListener("click", () => callbacks.onToggle(s.id));
        pill.addEventListener("mouseenter", () => callbacks.onFocus(s.id));
        pill.addEventListener("mouseleave", () => callbacks.onFocus(null));
        container.appendChild(pill);
    });
}

export function syncInputsFromState(state) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = val;
        }
    };
    const setChecked = (id, flag) => {
        const el = document.getElementById(id);
        if (el) {
            el.checked = Boolean(flag);
        }
    };
    setVal("line-opt-mode", state.mode);
    setVal("line-opt-palette", state.palette);
    setVal("line-opt-markers", state.markerMode);
    setChecked("line-opt-zero", state.beginAtZero);
    setChecked("line-opt-area", state.areaFill);
    setChecked("line-opt-nulls", state.connectNull);
    setChecked("line-opt-mean", state.showMean);
    setChecked("line-opt-trend", state.showTrendline);
    setChecked("line-opt-region", state.showRegion);
    setVal("line-opt-range-start", String(state.rangeStartPct));
    setVal("line-opt-range-end", String(state.rangeEndPct));
    const rv = document.getElementById("line-opt-range-val");
    if (rv) {
        rv.textContent = `${state.rangeStartPct}% - ${state.rangeEndPct}%`;
    }
}

export function bindExportButtons(state, getCanvas) {
    const getSvg = () =>
        generateLineSVG({
            dataset: state.windowDataset,
            layout: state.layout,
            statsBySeries: state.statsBySeries,
            hiddenSeries: state.hiddenSeries,
            options: { ...state }
        });
    document.getElementById("line-btn-export-png")?.addEventListener("click", () => exportCanvasAsPNG(getCanvas(), "line-chart.png"));
    document.getElementById("line-btn-export-svg")?.addEventListener("click", () => {
        const svg = getSvg();
        if (svg) {
            downloadBlob(svg, "line-chart.svg", "image/svg+xml;charset=utf-8");
        }
    });
    document.getElementById("line-btn-export-csv")?.addEventListener("click", () => {
        if (state.windowDataset) {
            downloadBlob(exportLineCSV(state.windowDataset), "line-chart-data.csv", "text/csv;charset=utf-8");
        }
    });
    const copyBtn = document.getElementById("line-btn-copy-svg");
    copyBtn?.addEventListener("click", async () => {
        const svg = getSvg();
        if (svg && navigator.clipboard) {
            await navigator.clipboard.writeText(svg);
            const orig = copyBtn.textContent;
            copyBtn.textContent = "Disalin!";
            setTimeout(() => {
                copyBtn.textContent = orig;
            }, 1800);
        }
    });
}
