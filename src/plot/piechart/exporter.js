import { describeWedgePath } from "./geometry.js";
import { getSliceColor } from "./presets.js";
import { formatNumber } from "./parser.js";

const SVG_NS = ["http:", "", "www.w3.org", "2000", "svg"].join("/");

export function escapeXml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function getContrastTextColor(hex) {
    const clean = String(hex || "").replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
        return "#f8fafc";
    }
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.64 ? "#0b0e14" : "#f8fafc";
}

export function formatSliceLabel(slice, labelFormat = "pct") {
    const pctStr = `${slice.pct >= 10 ? slice.pct.toFixed(1) : slice.pct.toFixed(2).replace(/\.00$/, "")}%`;
    if (labelFormat === "value") {
        return formatNumber(slice.value);
    }
    if (labelFormat === "name_pct") {
        return `${slice.label} (${pctStr})`;
    }
    if (labelFormat === "full") {
        return `${slice.label}: ${formatNumber(slice.value)} (${pctStr})`;
    }
    return pctStr;
}

export function getCenterKpiContent({ stats, prepared, hoveredSlice, focusedCategoryId, palette, contrastOrder }) {
    if (hoveredSlice) {
        return {
            overline: hoveredSlice.seriesName || "Irisan",
            valueText: `${hoveredSlice.pct.toFixed(1)}%`,
            subText: `${hoveredSlice.label} | ${formatNumber(hoveredSlice.value)}`,
            accentColor: getSliceColor(palette, hoveredSlice.colorIndex, {
                contrastOrder,
                isGrouped: hoveredSlice.isGrouped
            })
        };
    }
    if (focusedCategoryId && prepared?.activeRows) {
        const row = prepared.activeRows.find((r) => r.id === focusedCategoryId);
        if (row) {
            const lastIdx = Math.max(0, prepared.seriesCount - 1);
            const val = row.values[lastIdx] || 0;
            const total = prepared.ringTotals[lastIdx] || 0;
            const pct = total > 0 ? (val / total) * 100 : 0;
            return {
                overline: row.label,
                valueText: `${pct.toFixed(1)}%`,
                subText: formatNumber(val),
                accentColor: getSliceColor(palette, row.colorIndex, {
                    contrastOrder,
                    isGrouped: row.isGrouped
                })
            };
        }
    }
    const seriesTitle = prepared && prepared.seriesCount > 1
        ? `Total ${prepared.seriesNames[prepared.seriesCount - 1]}`
        : "Total Aktif";
    return {
        overline: seriesTitle,
        valueText: formatNumber(stats?.total || 0),
        subText: stats?.maxSlice ? `${stats.maxSlice.label} (${stats.maxSlice.pct.toFixed(1)}%)` : "-",
        accentColor: "#38bdf8"
    };
}

export function generatePieSVG({
    prepared,
    layout,
    stats,
    options = {}
}) {
    if (!layout || !prepared) {
        return "";
    }
    const {
        palette = "okabe_ito",
        contrastOrder = true,
        gapWidth = 2,
        labelFormat = "pct",
        showCenterKpi = true,
        title = ""
    } = options;
    const { width, height, cx, cy, rings, polarTicks, baseInnerR, ringCount } = layout;
    const layers = [];
    layers.push(`<rect width="${width}" height="${height}" fill="#0b0e14" rx="14"/>`);
    if (title) {
        layers.push(`<text x="24" y="30" fill="#f1f5f9" font-family="Google Sans, sans-serif" font-size="15" font-weight="600">${escapeXml(title)}</text>`);
    }

    if (layout.mode === "polar" && polarTicks.length > 0) {
        for (let i = 0; i < polarTicks.length; i += 1) {
            const t = polarTicks[i];
            layers.push(`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${t.r.toFixed(2)}" fill="none" stroke="rgba(148,163,184,0.18)" stroke-dasharray="4 4"/>`);
            layers.push(`<text x="${(cx + 4).toFixed(2)}" y="${(cy - t.r + 12).toFixed(2)}" fill="#64748b" font-family="Roboto Mono, monospace" font-size="10">${escapeXml(formatNumber(t.value, 1))}</text>`);
        }
    }

    for (let r = 0; r < rings.length; r += 1) {
        const ring = rings[r];
        for (let s = 0; s < ring.slices.length; s += 1) {
            const slice = ring.slices[s];
            const d = describeWedgePath(cx, cy, slice.innerR, slice.outerR, slice.startAngle, slice.endAngle);
            if (!d) {
                continue;
            }
            const color = getSliceColor(palette, slice.colorIndex, {
                contrastOrder,
                isGrouped: slice.isGrouped
            });
            const fillOpacity = layout.mode === "polar" ? "0.86" : "1";
            layers.push(`<path d="${d}" fill="${color}" fill-opacity="${fillOpacity}" stroke="#0b0e14" stroke-width="${gapWidth}" stroke-linejoin="round"/>`);
        }
        if (ringCount > 1) {
            const labelR = (ring.innerR + ring.outerR) / 2;
            layers.push(`<text x="${cx.toFixed(2)}" y="${(cy - labelR + 3).toFixed(2)}" fill="#e2e8f0" stroke="#0b0e14" stroke-width="3" paint-order="stroke" font-family="Roboto Mono, monospace" font-size="10" font-weight="600" text-anchor="middle">${escapeXml(ring.seriesName)}</text>`);
        }
    }

    if (showCenterKpi && baseInnerR >= 36 && layout.mode !== "polar") {
        const kpi = getCenterKpiContent({ stats, prepared, palette, contrastOrder });
        layers.push(`<text x="${cx.toFixed(2)}" y="${(cy - 14).toFixed(2)}" fill="#94a3b8" font-family="Google Sans, sans-serif" font-size="11" text-anchor="middle">${escapeXml(kpi.overline)}</text>`);
        layers.push(`<text x="${cx.toFixed(2)}" y="${(cy + 8).toFixed(2)}" fill="#f8fafc" font-family="Roboto Mono, monospace" font-size="18" font-weight="700" text-anchor="middle">${escapeXml(kpi.valueText)}</text>`);
        layers.push(`<text x="${cx.toFixed(2)}" y="${(cy + 25).toFixed(2)}" fill="${kpi.accentColor}" font-family="Google Sans, sans-serif" font-size="10.5" font-weight="600" text-anchor="middle">${escapeXml(kpi.subText)}</text>`);
    }

    for (let r = 0; r < rings.length; r += 1) {
        const ring = rings[r];
        for (let s = 0; s < ring.slices.length; s += 1) {
            const slice = ring.slices[s];
            if (!slice.showLabel) {
                continue;
            }
            const color = getSliceColor(palette, slice.colorIndex, {
                contrastOrder,
                isGrouped: slice.isGrouped
            });
            const txt = formatSliceLabel(slice, labelFormat);
            if (slice.placeOutside) {
                const tickX = slice.elbowX + (slice.side === "right" ? 8 : -8);
                const anchor = slice.side === "right" ? "start" : "end";
                layers.push(`<polyline points="${slice.anchorX.toFixed(1)},${slice.anchorY.toFixed(1)} ${slice.elbowX.toFixed(1)},${slice.elbowY.toFixed(1)} ${tickX.toFixed(1)},${slice.labelY.toFixed(1)}" fill="none" stroke="${color}" stroke-opacity="0.75" stroke-width="1.2"/>`);
                layers.push(`<circle cx="${slice.anchorX.toFixed(1)}" cy="${slice.anchorY.toFixed(1)}" r="2.2" fill="${color}"/>`);
                layers.push(`<text x="${slice.labelX.toFixed(1)}" y="${(slice.labelY + 4).toFixed(1)}" fill="#e2e8f0" font-family="Google Sans, sans-serif" font-size="11" font-weight="500" text-anchor="${anchor}">${escapeXml(txt)}</text>`);
            } else {
                const insideColor = getContrastTextColor(color);
                layers.push(`<text x="${slice.centroidX.toFixed(1)}" y="${(slice.centroidY + 4).toFixed(1)}" fill="${insideColor}" font-family="Roboto Mono, monospace" font-size="11" font-weight="600" text-anchor="middle">${escapeXml(txt)}</text>`);
            }
        }
    }

    return `<svg xmlns="${SVG_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layers.join("")}</svg>`;
}

export function exportCanvasAsPNG(canvas, filename = "pie-chart.png") {
    if (!canvas) {
        return;
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}
