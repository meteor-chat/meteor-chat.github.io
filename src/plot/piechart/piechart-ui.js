import { formatNumber, exportPieCSV } from "./parser.js";
import { PIE_PRESETS, getSliceColor } from "./presets.js";
import { generatePieSVG, exportCanvasAsPNG } from "./exporter.js";

export function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function describeHhiLevel(hhi) {
    if (hhi <= 0) {
        return "-";
    }
    if (hhi < 1500) {
        return `${formatNumber(hhi, 0)} (Tersebar)`;
    }
    if (hhi <= 2500) {
        return `${formatNumber(hhi, 0)} (Sedang)`;
    }
    return `${formatNumber(hhi, 0)} (Terpusat)`;
}

export function updatePieMetricsBanner(state) {
    const setEl = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    };
    const st = state.stats;
    if (!st || st.activeCount === 0) {
        setEl("pie-stat-total", "0");
        setEl("pie-stat-slices", `0 / ${state.dataset?.rows?.length || 0}`);
        setEl("pie-stat-dominant", "-");
        setEl("pie-stat-smallest", "-");
        setEl("pie-stat-topshare", "-");
        setEl("pie-stat-hhi", "-");
        return;
    }
    const rawCount = state.dataset?.rows?.length || st.totalCategories;
    const hiddenCount = state.hiddenCategories.size;
    const activeRawCount = Math.max(0, rawCount - hiddenCount);
    const seriesLabel = state.prepared?.seriesCount > 1 && state.mode === "multi"
        ? ` | ${state.prepared.seriesCount} seri`
        : "";
    setEl("pie-stat-total", formatNumber(st.total));
    setEl("pie-stat-slices", `${activeRawCount} / ${rawCount}${seriesLabel}`);
    setEl("pie-stat-dominant", st.maxSlice ? st.maxSlice.label : "-");
    setEl("pie-stat-smallest", st.minSlice ? `${st.minSlice.label} (${st.minSlice.pct.toFixed(1)}%)` : "-");
    setEl("pie-stat-topshare", `${st.topSharePct.toFixed(1)}%`);
    setEl("pie-stat-hhi", describeHhiLevel(st.hhi));
}

export function renderPieLegendPills(state, callbacks) {
    const container = document.getElementById("pie-legend-bar");
    if (!container || !state.dataset || !state.prepared) {
        return;
    }
    container.innerHTML = "";
    const lastSeriesIdx = Math.max(0, state.prepared.seriesCount - 1);
    const activeTotal = state.prepared.ringTotals[lastSeriesIdx] || 0;

    state.dataset.rows.forEach((row) => {
        const isHidden = state.hiddenCategories.has(row.id);
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = isHidden ? "pie-legend-pill is-hidden" : "pie-legend-pill";
        pill.dataset.catId = row.id;

        const dot = document.createElement("span");
        dot.className = "pie-legend-dot";
        dot.style.background = getSliceColor(state.palette, row.colorIndex, {
            contrastOrder: state.contrastOrder
        });

        const label = document.createElement("span");
        label.textContent = row.label;

        const pctSpan = document.createElement("span");
        pctSpan.className = "pie-legend-pct";
        if (isHidden) {
            pctSpan.textContent = "off";
        } else {
            const val = row.values[lastSeriesIdx] || 0;
            const pct = activeTotal > 0 ? (val / activeTotal) * 100 : 0;
            pctSpan.textContent = `${pct.toFixed(1)}%`;
        }

        pill.appendChild(dot);
        pill.appendChild(label);
        pill.appendChild(pctSpan);
        pill.addEventListener("click", () => callbacks.onToggle(row.id));
        pill.addEventListener("mouseenter", () => callbacks.onFocus(row.id));
        pill.addEventListener("mouseleave", () => callbacks.onFocus(null));
        container.appendChild(pill);
    });
}

export function syncPieInputsFromState(state) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = String(val);
        }
    };
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = val;
        }
    };
    const setChecked = (id, flag) => {
        const el = document.getElementById(id);
        if (el) {
            el.checked = Boolean(flag);
        }
    };

    setVal("pie-opt-mode", state.mode);
    setVal("pie-opt-sort", state.sortOrder);
    setVal("pie-opt-cutout", state.cutoutPct);
    setText("pie-opt-cutout-val", state.mode === "pie" ? "0%" : `${state.cutoutPct}%`);
    setVal("pie-opt-gap", state.gapWidth);
    setText("pie-opt-gap-val", `${state.gapWidth}px`);
    setVal("pie-opt-angle", state.startAngleDeg);
    setText("pie-opt-angle-val", `${state.startAngleDeg} deg`);
    setChecked("pie-opt-group-small", state.groupSmall);
    setVal("pie-opt-palette", state.palette);
    setChecked("pie-opt-contrast-order", state.contrastOrder);
    setVal("pie-opt-labels", state.labelMode);
    setVal("pie-opt-label-format", state.labelFormat);
    setVal("pie-opt-threshold", state.labelThresholdPct);
    setText("pie-opt-threshold-val", `${state.labelThresholdPct}%`);
    setChecked("pie-opt-expand", state.expandOnHover);
    setChecked("pie-opt-center-kpi", state.showCenterKpi);
}

export function bindPiePresetButtons(state, getTextArea, onApply) {
    Object.values(PIE_PRESETS).forEach((preset) => {
        document.getElementById(`pie-preset-${preset.id}`)?.addEventListener("click", () => {
            const ta = getTextArea();
            if (ta) {
                ta.value = preset.data;
            }
            Object.assign(state, {
                rawText: preset.data,
                title: preset.title,
                mode: preset.mode,
                sortOrder: preset.sortOrder,
                cutoutPct: preset.cutoutPct,
                groupSmall: preset.groupSmall,
                smallThresholdPct: preset.smallThresholdPct
            });
            state.hiddenCategories.clear();
            state.focusedCategoryId = null;
            syncPieInputsFromState(state);
            onApply();
        });
    });
}

export function bindPieExportButtons(state, getCanvas) {
    const getSvg = () =>
        generatePieSVG({
            prepared: state.prepared,
            layout: state.layout,
            stats: state.stats,
            options: { ...state }
        });
    document.getElementById("pie-btn-export-png")?.addEventListener("click", () => exportCanvasAsPNG(getCanvas(), "pie-chart.png"));
    document.getElementById("pie-btn-export-svg")?.addEventListener("click", () => {
        const svg = getSvg();
        if (svg) {
            downloadBlob(svg, "pie-chart.svg", "image/svg+xml;charset=utf-8");
        }
    });
    document.getElementById("pie-btn-export-csv")?.addEventListener("click", () => {
        if (state.dataset) {
            downloadBlob(exportPieCSV(state.dataset), "pie-chart-data.csv", "text/csv;charset=utf-8");
        }
    });
    const copyBtn = document.getElementById("pie-btn-copy-svg");
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
