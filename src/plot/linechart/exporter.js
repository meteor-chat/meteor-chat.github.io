import { buildSeriesRuns } from "./geometry.js";
import { formatNumber } from "./parser.js";

export const PALETTES = {
    okabe_ito: ["#56b4e9", "#e69f00", "#009e73", "#cc79a7", "#f0e442", "#0072b2", "#d55e00"],
    ocean: ["#38bdf8", "#818cf8", "#2dd4bf", "#a78bfa", "#60a5fa", "#34d399"],
    aurora: ["#34d399", "#22d3ee", "#a78bfa", "#fb7185", "#fbbf24", "#60a5fa"],
    ember: ["#fb923c", "#f43f5e", "#facc15", "#e879f9", "#38bdf8", "#4ade80"],
    monochrome: ["#f1f5f9", "#94a3b8", "#cbd5e1", "#64748b", "#e2e8f0"]
};

export function getSeriesColor(paletteId, index) {
    const pal = PALETTES[paletteId] || PALETTES.okabe_ito;
    return pal[index % pal.length];
}

export function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const full = clean.length === 3
        ? clean.split("").map((c) => c + c).join("")
        : clean;
    const r = parseInt(full.slice(0, 2), 16) || 56;
    const g = parseInt(full.slice(2, 4), 16) || 189;
    const b = parseInt(full.slice(4, 6), 16) || 248;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function escapeXml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function segmentsToSvgPath(run) {
    const pts = run.points;
    if (!pts || pts.length === 0) {
        return "";
    }
    const parts = [`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`];
    for (let i = 0; i < run.segments.length; i += 1) {
        const seg = run.segments[i];
        if (seg.type === "cubic") {
            parts.push(
                `C ${seg.cx1.toFixed(2)} ${seg.cy1.toFixed(2)}, ${seg.cx2.toFixed(2)} ${seg.cy2.toFixed(2)}, ${seg.x1.toFixed(2)} ${seg.y1.toFixed(2)}`
            );
        } else if (seg.type === "step") {
            parts.push(`L ${seg.x1.toFixed(2)} ${seg.y0.toFixed(2)} L ${seg.x1.toFixed(2)} ${seg.y1.toFixed(2)}`);
        } else {
            parts.push(`L ${seg.x1.toFixed(2)} ${seg.y1.toFixed(2)}`);
        }
    }
    return parts.join(" ");
}

export function generateLineSVG({
    dataset,
    layout,
    statsBySeries = {},
    hiddenSeries = new Set(),
    options = {}
}) {
    if (!layout || !dataset) {
        return "";
    }
    const {
        palette = "okabe_ito",
        mode = "monotone",
        connectNull = false,
        areaFill = false,
        markerMode = "auto",
        strokeWidth = 2.4,
        showMean = false,
        showTrendline = false,
        showRegion = false,
        regionStartPct = 60,
        regionEndPct = 85,
        title = ""
    } = options;
    const { width, height, plotBox, yScale, xTicks, baselineY, pointSpacing, seriesPoints } = layout;
    const showMarkers = markerMode === "show" || (markerMode === "auto" && pointSpacing >= 14);
    const defs = [];
    defs.push(`<clipPath id="plot-clip"><rect x="${plotBox.x}" y="${plotBox.y - 4}" width="${plotBox.width}" height="${plotBox.height + 8}"/></clipPath>`);
    dataset.series.forEach((s, idx) => {
        const color = getSeriesColor(palette, idx);
        defs.push(
            `<linearGradient id="area-${idx}" x1="0" y1="0" x2="0" y2="1">` +
            `<stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>` +
            `<stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>` +
            `</linearGradient>`
        );
    });
    const layers = [];
    layers.push(`<rect width="${width}" height="${height}" fill="#0b0e14" rx="14"/>`);
    if (title) {
        layers.push(`<text x="${plotBox.x}" y="28" fill="#f1f5f9" font-family="Google Sans, sans-serif" font-size="15" font-weight="600">${escapeXml(title)}</text>`);
    }
    if (showRegion && dataset.rowCount >= 2) {
        const rx0 = plotBox.x + (Math.min(regionStartPct, regionEndPct) / 100) * plotBox.width;
        const rx1 = plotBox.x + (Math.max(regionStartPct, regionEndPct) / 100) * plotBox.width;
        layers.push(`<rect x="${rx0.toFixed(1)}" y="${plotBox.y}" width="${Math.max(2, rx1 - rx0).toFixed(1)}" height="${plotBox.height}" fill="rgba(56,189,248,0.08)"/>`);
        layers.push(`<line x1="${rx0.toFixed(1)}" y1="${plotBox.y}" x2="${rx0.toFixed(1)}" y2="${plotBox.y + plotBox.height}" stroke="rgba(56,189,248,0.35)" stroke-dasharray="4 4"/>`);
        layers.push(`<line x1="${rx1.toFixed(1)}" y1="${plotBox.y}" x2="${rx1.toFixed(1)}" y2="${plotBox.y + plotBox.height}" stroke="rgba(56,189,248,0.35)" stroke-dasharray="4 4"/>`);
    }
    for (let i = 0; i < yScale.ticks.length; i += 1) {
        const tick = yScale.ticks[i];
        const y = layout.valueToY(tick);
        const isZero = tick === 0;
        const stroke = isZero ? "rgba(241,245,249,0.28)" : "rgba(255,255,255,0.06)";
        const sw = isZero ? "1.25" : "1";
        layers.push(`<line x1="${plotBox.x}" y1="${y.toFixed(2)}" x2="${plotBox.x + plotBox.width}" y2="${y.toFixed(2)}" stroke="${stroke}" stroke-width="${sw}"/>`);
        layers.push(`<text x="${plotBox.x - 10}" y="${(y + 4).toFixed(2)}" fill="#94a3b8" font-family="Roboto Mono, monospace" font-size="11" text-anchor="end">${escapeXml(formatNumber(tick))}</text>`);
    }
    for (let i = 0; i < xTicks.length; i += 1) {
        const t = xTicks[i];
        layers.push(`<text x="${t.x.toFixed(2)}" y="${plotBox.y + plotBox.height + 22}" fill="#94a3b8" font-family="Roboto Mono, monospace" font-size="11" text-anchor="middle">${escapeXml(t.label)}</text>`);
    }
    const curveGroup = [];
    dataset.series.forEach((s, idx) => {
        if (hiddenSeries.has(s.id)) {
            return;
        }
        const color = getSeriesColor(palette, idx);
        const pts = seriesPoints[idx] || [];
        const runs = buildSeriesRuns(pts, { mode, connectNull });
        for (let r = 0; r < runs.length; r += 1) {
            const run = runs[r];
            const pathD = segmentsToSvgPath(run);
            if (areaFill && run.segments.length > 0) {
                const firstPt = run.points[0];
                const lastPt = run.points[run.points.length - 1];
                const areaD = `${pathD} L ${lastPt.x.toFixed(2)} ${baselineY.toFixed(2)} L ${firstPt.x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
                curveGroup.push(`<path d="${areaD}" fill="url(#area-${idx})"/>`);
            }
            if (run.segments.length > 0) {
                curveGroup.push(`<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`);
            }
            if (showMarkers || run.points.length === 1) {
                for (let p = 0; p < run.points.length; p += 1) {
                    const pt = run.points[p];
                    curveGroup.push(`<circle cx="${pt.x.toFixed(2)}" cy="${pt.y.toFixed(2)}" r="3.4" fill="#0b0e14" stroke="${color}" stroke-width="2"/>`);
                }
            }
        }
        const st = statsBySeries[s.id];
        if (showMean && st && st.mean !== null) {
            const my = layout.valueToY(st.mean);
            curveGroup.push(`<line x1="${plotBox.x}" y1="${my.toFixed(2)}" x2="${plotBox.x + plotBox.width}" y2="${my.toFixed(2)}" stroke="${color}" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="5 5"/>`);
        }
        if (showTrendline && st && st.regression && dataset.xValues.length >= 2) {
            const x0Val = dataset.xValues[0];
            const x1Val = dataset.xValues[dataset.xValues.length - 1];
            const y0Val = st.regression.slope * x0Val + st.regression.intercept;
            const y1Val = st.regression.slope * x1Val + st.regression.intercept;
            const sx0 = layout.xCoords[0];
            const sx1 = layout.xCoords[layout.xCoords.length - 1];
            curveGroup.push(`<line x1="${sx0.toFixed(2)}" y1="${layout.valueToY(y0Val).toFixed(2)}" x2="${sx1.toFixed(2)}" y2="${layout.valueToY(y1Val).toFixed(2)}" stroke="${color}" stroke-opacity="0.7" stroke-width="1.4" stroke-dasharray="8 4"/>`);
        }
    });
    layers.push(`<g clip-path="url(#plot-clip)">${curveGroup.join("")}</g>`);
    let lx = plotBox.x + plotBox.width;
    for (let idx = dataset.series.length - 1; idx >= 0; idx -= 1) {
        const s = dataset.series[idx];
        if (hiddenSeries.has(s.id)) {
            continue;
        }
        const labelLen = s.name.length * 6.5 + 22;
        lx -= labelLen;
        if (lx < plotBox.x + 120) {
            break;
        }
        const color = getSeriesColor(palette, idx);
        layers.push(`<circle cx="${lx + 5}" cy="24" r="4" fill="${color}"/>`);
        layers.push(`<text x="${lx + 14}" y="28" fill="#cbd5e1" font-family="Google Sans, sans-serif" font-size="11">${escapeXml(s.name)}</text>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs.join("")}</defs>${layers.join("")}</svg>`;
}

export function exportCanvasAsPNG(canvas, filename = "line-chart.png") {
    if (!canvas) {
        return;
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}

