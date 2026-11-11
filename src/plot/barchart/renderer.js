import { formatNumber } from "./parser.js";

export const PALETTES = {
    okabe_ito: ["#0072B2", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#D55E00", "#CC79A7"],
    cyan: ["#38bdf8", "#818cf8", "#34d399", "#f472b6", "#fbbf24", "#a78bfa", "#2dd4bf"],
    emerald: ["#10b981", "#34d399", "#059669", "#047857", "#6ee7b7", "#a7f3d0", "#065f46"],
    sunset: ["#f97316", "#fb923c", "#fdba74", "#ea580c", "#c2410c", "#fed7aa", "#9a3412"],
    crimson: ["#f43f5e", "#fb7185", "#e11d48", "#be123c", "#9f1239", "#fda4af", "#fecdd3"],
    mono: ["#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#e2e8f0", "#1e293b"]
};

export function getBarColor(index, isNegative, paletteName = "okabe_ito", colorNegative = true) {
    if (isNegative && colorNegative) return "#ef4444";
    const colors = PALETTES[paletteName] || PALETTES.okabe_ito;
    return colors[index % colors.length];
}

export function renderBarChart(canvas, { layout, stats, options = {}, hoveredBar = null }) {
    if (!canvas || !layout) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { plotArea, scale, bars, orientation, zeroPos } = layout;
    const isVert = orientation === "vertical";
    const palette = options.palette || "okabe_ito";
    const showValues = options.showValues !== false;
    const showAverage = Boolean(options.showAverage);
    const colorNegative = options.colorNegative !== false;
    const span = scale.niceMax - scale.niceMin || 1;

    ctx.save();
    ctx.fillStyle = "#0c0f14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.font = "11px 'Roboto Mono', monospace";
    ctx.fillStyle = "#64748b";

    for (let i = 0; i < scale.ticks.length; i++) {
        const tick = scale.ticks[i];
        if (isVert) {
            const y = plotArea.top + ((scale.niceMax - tick) / span) * plotArea.height;
            ctx.beginPath();
            ctx.moveTo(plotArea.left, y);
            ctx.lineTo(plotArea.right, y);
            ctx.stroke();
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillText(formatNumber(tick), plotArea.left - 8, y);
        } else {
            const x = plotArea.left + ((tick - scale.niceMin) / span) * plotArea.width;
            ctx.beginPath();
            ctx.moveTo(x, plotArea.top);
            ctx.lineTo(x, plotArea.bottom);
            ctx.stroke();
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(formatNumber(tick), x, plotArea.bottom + 8);
        }
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (isVert) {
        ctx.moveTo(plotArea.left, zeroPos);
        ctx.lineTo(plotArea.right, zeroPos);
    } else {
        ctx.moveTo(zeroPos, plotArea.top);
        ctx.lineTo(zeroPos, plotArea.bottom);
    }
    ctx.stroke();

    for (let i = 0; i < bars.length; i++) {
        const b = bars[i];
        const isHovered = hoveredBar && hoveredBar.index === b.index;
        ctx.fillStyle = getBarColor(b.index, b.isNegative, palette, colorNegative);
        ctx.fillRect(b.x, b.y, b.width, b.height);

        if (isHovered) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, b.y, b.width, b.height);
        }

        ctx.font = "12px 'Google Sans', sans-serif";
        ctx.fillStyle = isHovered ? "#38bdf8" : "#94a3b8";
        if (isVert) {
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            let displayLabel = b.category;
            if (displayLabel.length > 9) displayLabel = displayLabel.slice(0, 8) + "..";
            ctx.fillText(displayLabel, b.slotCenter, plotArea.bottom + 8);
        } else {
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            let displayLabel = b.category;
            if (displayLabel.length > 14) displayLabel = displayLabel.slice(0, 13) + "..";
            ctx.fillText(displayLabel, plotArea.left - 10, b.slotCenter);
        }

        if (showValues) {
            ctx.font = "11px 'Roboto Mono', monospace";
            ctx.fillStyle = "#e2e8f0";
            if (isVert) {
                ctx.textAlign = "center";
                const valY = b.isNegative ? b.y + b.height + 12 : b.y - 6;
                ctx.fillText(formatNumber(b.value), b.slotCenter, valY);
            } else {
                ctx.textBaseline = "middle";
                if (b.isNegative) {
                    ctx.textAlign = "right";
                    ctx.fillText(formatNumber(b.value), b.x - 6, b.slotCenter);
                } else {
                    ctx.textAlign = "left";
                    ctx.fillText(formatNumber(b.value), b.x + b.width + 6, b.slotCenter);
                }
            }
        }
    }

    if (showAverage && stats && stats.count > 0) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        if (isVert) {
            const avgY = plotArea.top + ((scale.niceMax - stats.mean) / span) * plotArea.height;
            ctx.moveTo(plotArea.left, avgY);
            ctx.lineTo(plotArea.right, avgY);
            ctx.stroke();
            ctx.fillStyle = "#f59e0b";
            ctx.font = "10px 'Roboto Mono', monospace";
            ctx.textAlign = "right";
            ctx.fillText("Avg: " + formatNumber(stats.mean), plotArea.right, avgY - 6);
        } else {
            const avgX = plotArea.left + ((stats.mean - scale.niceMin) / span) * plotArea.width;
            ctx.moveTo(avgX, plotArea.top);
            ctx.lineTo(avgX, plotArea.bottom);
            ctx.stroke();
            ctx.fillStyle = "#f59e0b";
            ctx.font = "10px 'Roboto Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText("Avg: " + formatNumber(stats.mean), avgX, plotArea.top - 8);
        }
        ctx.setLineDash([]);
    }

    if (hoveredBar) drawTooltip(ctx, hoveredBar, stats, canvas.width, canvas.height);
    ctx.restore();
}

function drawTooltip(ctx, bar, stats, canvasW, canvasH) {
    const pad = 10;
    const line1 = bar.category;
    const line2 = "Nilai: " + bar.value.toLocaleString();
    let line3 = "";
    if (stats && stats.mean !== 0) {
        const delta = bar.value - stats.mean;
        line3 = "Delta Avg: " + (delta >= 0 ? "+" : "") + delta.toFixed(1);
    }

    ctx.font = "bold 12px 'Google Sans', sans-serif";
    const w1 = ctx.measureText(line1).width;
    ctx.font = "11px 'Roboto Mono', monospace";
    const w2 = ctx.measureText(line2).width;
    const w3 = line3 ? ctx.measureText(line3).width : 0;
    const boxW = Math.max(w1, w2, w3) + pad * 2;
    const boxH = line3 ? 62 : 46;

    let tipX = bar.x + bar.width / 2 - boxW / 2;
    let tipY = bar.y - boxH - 10;
    if (tipX < 10) tipX = 10;
    if (tipX + boxW > canvasW - 10) tipX = canvasW - boxW - 10;
    if (tipY < 10) tipY = bar.y + bar.height + 10;
    if (tipY + boxH > canvasH - 10) tipY = canvasH - boxH - 10;

    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(tipX, tipY, boxW, boxH, 6) : ctx.rect(tipX, tipY, boxW, boxH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px 'Google Sans', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(line1, tipX + pad, tipY + 16);

    ctx.font = "11px 'Roboto Mono', monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(line2, tipX + pad, tipY + 34);
    if (line3) {
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(line3, tipX + pad, tipY + 50);
    }
}

export function generateBarSVG({ width = 800, height = 500, layout, stats, options = {} }) {
    if (!layout) return "";
    const { plotArea, scale, bars, orientation, zeroPos } = layout;
    const isVert = orientation === "vertical";
    const palette = options.palette || "okabe_ito";
    const showValues = options.showValues !== false;
    const showAverage = Boolean(options.showAverage);
    const colorNegative = options.colorNegative !== false;
    const span = scale.niceMax - scale.niceMin || 1;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#0c0f14;font-family:'Google Sans',sans-serif;">\n<rect width="${width}" height="${height}" fill="#0c0f14"/>\n`;

    for (let i = 0; i < scale.ticks.length; i++) {
        const tick = scale.ticks[i];
        if (isVert) {
            const y = plotArea.top + ((scale.niceMax - tick) / span) * plotArea.height;
            svg += `<line x1="${plotArea.left}" y1="${y}" x2="${plotArea.right}" y2="${y}" stroke="#1e293b" stroke-dasharray="3,3" stroke-width="1"/>\n`;
            svg += `<text x="${plotArea.left - 8}" y="${y + 4}" fill="#64748b" font-size="11" text-anchor="end" font-family="'Roboto Mono',monospace">${formatNumber(tick)}</text>\n`;
        } else {
            const x = plotArea.left + ((tick - scale.niceMin) / span) * plotArea.width;
            svg += `<line x1="${x}" y1="${plotArea.top}" x2="${x}" y2="${plotArea.bottom}" stroke="#1e293b" stroke-dasharray="3,3" stroke-width="1"/>\n`;
            svg += `<text x="${x}" y="${plotArea.bottom + 18}" fill="#64748b" font-size="11" text-anchor="middle" font-family="'Roboto Mono',monospace">${formatNumber(tick)}</text>\n`;
        }
    }

    if (isVert) {
        svg += `<line x1="${plotArea.left}" y1="${zeroPos}" x2="${plotArea.right}" y2="${zeroPos}" stroke="#475569" stroke-width="1.5"/>\n`;
    } else {
        svg += `<line x1="${zeroPos}" y1="${plotArea.top}" x2="${zeroPos}" y2="${plotArea.bottom}" stroke="#475569" stroke-width="1.5"/>\n`;
    }

    for (let i = 0; i < bars.length; i++) {
        const b = bars[i];
        const color = getBarColor(b.index, b.isNegative, palette, colorNegative);
        svg += `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="${color}" rx="3"/>\n`;
        if (isVert) {
            svg += `<text x="${b.slotCenter}" y="${plotArea.bottom + 18}" fill="#94a3b8" font-size="12" text-anchor="middle">${b.category}</text>\n`;
            if (showValues) {
                const valY = b.isNegative ? b.y + b.height + 14 : b.y - 6;
                svg += `<text x="${b.slotCenter}" y="${valY}" fill="#e2e8f0" font-size="11" text-anchor="middle" font-family="'Roboto Mono',monospace">${formatNumber(b.value)}</text>\n`;
            }
        } else {
            svg += `<text x="${plotArea.left - 10}" y="${b.slotCenter + 4}" fill="#94a3b8" font-size="12" text-anchor="end">${b.category}</text>\n`;
            if (showValues) {
                const valX = b.isNegative ? b.x - 6 : b.x + b.width + 6;
                const anchor = b.isNegative ? "end" : "start";
                svg += `<text x="${valX}" y="${b.slotCenter + 4}" fill="#e2e8f0" font-size="11" text-anchor="${anchor}" font-family="'Roboto Mono',monospace">${formatNumber(b.value)}</text>\n`;
            }
        }
    }

    if (showAverage && stats && stats.count > 0) {
        if (isVert) {
            const avgY = plotArea.top + ((scale.niceMax - stats.mean) / span) * plotArea.height;
            svg += `<line x1="${plotArea.left}" y1="${avgY}" x2="${plotArea.right}" y2="${avgY}" stroke="#f59e0b" stroke-dasharray="5,4" stroke-width="1.5"/>\n<text x="${plotArea.right}" y="${avgY - 6}" fill="#f59e0b" font-size="10" text-anchor="end" font-family="'Roboto Mono',monospace">Avg: ${formatNumber(stats.mean)}</text>\n`;
        } else {
            const avgX = plotArea.left + ((stats.mean - scale.niceMin) / span) * plotArea.width;
            svg += `<line x1="${avgX}" y1="${plotArea.top}" x2="${avgX}" y2="${plotArea.bottom}" stroke="#f59e0b" stroke-dasharray="5,4" stroke-width="1.5"/>\n<text x="${avgX}" y="${plotArea.top - 8}" fill="#f59e0b" font-size="10" text-anchor="middle" font-family="'Roboto Mono',monospace">Avg: ${formatNumber(stats.mean)}</text>\n`;
        }
    }

    svg += `</svg>`;
    return svg;
}

export function exportCanvasAsPNG(canvas, filename = "barchart.png") {
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
}
