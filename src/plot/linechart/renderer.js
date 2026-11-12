import { buildSeriesRuns } from "./geometry.js";
import { formatNumber } from "./parser.js";
import { getSeriesColor, hexToRgba } from "./exporter.js";

function traceRunPath(ctx, run) {
    const pts = run.points;
    if (!pts || pts.length === 0) {
        return;
    }
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < run.segments.length; i += 1) {
        const seg = run.segments[i];
        if (seg.type === "cubic") {
            ctx.bezierCurveTo(seg.cx1, seg.cy1, seg.cx2, seg.cy2, seg.x1, seg.y1);
        } else if (seg.type === "step") {
            ctx.lineTo(seg.x1, seg.y0);
            ctx.lineTo(seg.x1, seg.y1);
        } else {
            ctx.lineTo(seg.x1, seg.y1);
        }
    }
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
}

function drawCrosshairAndTooltip(ctx, renderState) {
    const { dataset, layout, hoverIndex, hiddenSeries, options } = renderState;
    if (hoverIndex === null || hoverIndex < 0 || hoverIndex >= dataset.rowCount) {
        return;
    }
    const { plotBox, xCoords, seriesPoints } = layout;
    const cx = xCoords[hoverIndex];
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, plotBox.y);
    ctx.lineTo(cx, plotBox.y + plotBox.height);
    ctx.stroke();
    ctx.setLineDash([]);
    const rows = [];
    dataset.series.forEach((s, idx) => {
        if (hiddenSeries.has(s.id)) {
            return;
        }
        const pt = seriesPoints[idx]?.[hoverIndex];
        const color = getSeriesColor(options.palette, idx);
        const val = pt ? pt.value : null;
        if (pt && val !== null && pt.y !== null) {
            ctx.fillStyle = hexToRgba(color, 0.25);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#0b0e14";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        rows.push({ name: s.name, value: val, color });
    });
    if (rows.length === 0) {
        ctx.restore();
        return;
    }
    const xLabel = dataset.xLabels[hoverIndex] || String(hoverIndex);
    ctx.font = "600 12px Google Sans, sans-serif";
    let maxTextW = ctx.measureText(xLabel).width + 24;
    ctx.font = "500 11px Roboto Mono, monospace";
    for (let i = 0; i < rows.length; i += 1) {
        const w = ctx.measureText(`${rows[i].name}: ${formatNumber(rows[i].value)}`).width + 42;
        if (w > maxTextW) {
            maxTextW = w;
        }
    }
    const boxW = Math.min(260, Math.max(152, maxTextW));
    const boxH = 34 + rows.length * 20;
    let tx = cx + 14;
    if (tx + boxW > plotBox.x + plotBox.width) {
        tx = cx - boxW - 14;
    }
    tx = Math.max(plotBox.x + 4, tx);
    const ty = plotBox.y + 10;
    drawRoundedRect(ctx, tx, ty, boxW, boxH, 9);
    ctx.fillStyle = "rgba(11, 14, 20, 0.94)";
    ctx.fill();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "600 12px Google Sans, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(xLabel, tx + 11, ty + 20);
    for (let i = 0; i < rows.length; i += 1) {
        const rowY = ty + 38 + i * 20;
        ctx.fillStyle = rows[i].color;
        ctx.beginPath();
        ctx.arc(tx + 15, rowY - 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "500 11px Google Sans, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(rows[i].name.slice(0, 18), tx + 24, rowY);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 11px Roboto Mono, monospace";
        ctx.textAlign = "right";
        ctx.fillText(formatNumber(rows[i].value), tx + boxW - 11, rowY);
    }
    ctx.restore();
}

function drawAxesAndRegion(ctx, dataset, layout, options) {
    const { plotBox, yScale, xTicks } = layout;
    if (options.title) {
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "600 15px Google Sans, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(options.title, plotBox.x, 30);
    }
    if (options.yTitle) {
        ctx.save();
        ctx.translate(16, plotBox.y + plotBox.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = "#64748b";
        ctx.font = "500 11px Google Sans, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(options.yTitle, 0, 0);
        ctx.restore();
    }
    if (options.showRegion && dataset.rowCount >= 2) {
        const lo = Math.min(options.regionStartPct, options.regionEndPct) / 100;
        const hi = Math.max(options.regionStartPct, options.regionEndPct) / 100;
        const rx0 = plotBox.x + lo * plotBox.width;
        const rx1 = plotBox.x + hi * plotBox.width;
        ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
        ctx.fillRect(rx0, plotBox.y, Math.max(2, rx1 - rx0), plotBox.height);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(rx0, plotBox.y);
        ctx.lineTo(rx0, plotBox.y + plotBox.height);
        ctx.moveTo(rx1, plotBox.y);
        ctx.lineTo(rx1, plotBox.y + plotBox.height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(125, 211, 252, 0.85)";
        ctx.font = "600 10px Roboto Mono, monospace";
        ctx.textAlign = "left";
        ctx.fillText("ZONA SOROTAN", Math.min(rx0 + 6, plotBox.x + plotBox.width - 80), plotBox.y + 14);
    }
    for (let i = 0; i < yScale.ticks.length; i += 1) {
        const tick = yScale.ticks[i];
        const y = layout.valueToY(tick);
        const isZero = tick === 0;
        ctx.strokeStyle = isZero ? "rgba(241, 245, 249, 0.28)" : "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = isZero ? 1.25 : 1;
        ctx.beginPath();
        ctx.moveTo(plotBox.x, y);
        ctx.lineTo(plotBox.x + plotBox.width, y);
        ctx.stroke();
        ctx.fillStyle = "#94a3b8";
        ctx.font = "400 11px Roboto Mono, monospace";
        ctx.textAlign = "right";
        ctx.fillText(formatNumber(tick), plotBox.x - 10, y + 4);
    }
    ctx.fillStyle = "#94a3b8";
    ctx.font = "400 11px Roboto Mono, monospace";
    ctx.textAlign = "center";
    for (let i = 0; i < xTicks.length; i += 1) {
        ctx.fillText(xTicks[i].label, xTicks[i].x, plotBox.y + plotBox.height + 22);
    }
}

export function renderLineCanvas(ctx, renderState) {
    const { dataset, layout, statsBySeries = {}, hiddenSeries = new Set(), focusedSeries = null, options = {} } = renderState;
    if (!ctx || !layout || !dataset) {
        return;
    }
    const {
        palette = "okabe_ito",
        mode = "monotone",
        connectNull = false,
        areaFill = false,
        markerMode = "auto",
        strokeWidth = 2.4,
        showMean = false,
        showTrendline = false
    } = options;
    const { width, height, plotBox, baselineY, pointSpacing, seriesPoints } = layout;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    drawAxesAndRegion(ctx, dataset, layout, options);
    ctx.save();
    ctx.beginPath();
    ctx.rect(plotBox.x - 2, plotBox.y - 6, plotBox.width + 4, plotBox.height + 12);
    ctx.clip();
    const showMarkers = markerMode === "show" || (markerMode === "auto" && pointSpacing >= 14);
    const markerRadius = pointSpacing >= 28 ? 3.8 : 2.6;
    dataset.series.forEach((s, idx) => {
        if (hiddenSeries.has(s.id)) {
            return;
        }
        const isFocused = focusedSeries === s.id;
        const dimmed = focusedSeries !== null && !isFocused;
        const color = getSeriesColor(palette, idx);
        const runs = buildSeriesRuns(seriesPoints[idx] || [], { mode, connectNull });
        ctx.save();
        ctx.globalAlpha = dimmed ? 0.16 : 1;
        for (let r = 0; r < runs.length; r += 1) {
            const run = runs[r];
            if (areaFill && run.segments.length > 0) {
                const grad = ctx.createLinearGradient(0, plotBox.y, 0, baselineY);
                grad.addColorStop(0, hexToRgba(color, 0.28));
                grad.addColorStop(1, hexToRgba(color, 0.02));
                ctx.beginPath();
                traceRunPath(ctx, run);
                ctx.lineTo(run.points[run.points.length - 1].x, baselineY);
                ctx.lineTo(run.points[0].x, baselineY);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();
            }
            if (run.segments.length > 0) {
                ctx.beginPath();
                traceRunPath(ctx, run);
                ctx.strokeStyle = color;
                ctx.lineWidth = isFocused ? strokeWidth + 0.9 : strokeWidth;
                ctx.lineJoin = "round";
                ctx.lineCap = "round";
                ctx.stroke();
            }
            if (showMarkers || run.points.length === 1) {
                for (let p = 0; p < run.points.length; p += 1) {
                    const pt = run.points[p];
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, markerRadius, 0, Math.PI * 2);
                    ctx.fillStyle = "#0b0e14";
                    ctx.fill();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.8;
                    ctx.stroke();
                }
            }
        }
        const st = statsBySeries[s.id];
        if (showMean && st && st.mean !== null) {
            const my = layout.valueToY(st.mean);
            ctx.strokeStyle = hexToRgba(color, 0.65);
            ctx.lineWidth = 1.2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(plotBox.x, my);
            ctx.lineTo(plotBox.x + plotBox.width, my);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        if (showTrendline && st && st.regression && dataset.xValues.length >= 2) {
            const y0Val = st.regression.slope * dataset.xValues[0] + st.regression.intercept;
            const y1Val = st.regression.slope * dataset.xValues[dataset.xValues.length - 1] + st.regression.intercept;
            ctx.strokeStyle = hexToRgba(color, 0.8);
            ctx.lineWidth = 1.4;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(layout.xCoords[0], layout.valueToY(y0Val));
            ctx.lineTo(layout.xCoords[layout.xCoords.length - 1], layout.valueToY(y1Val));
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.restore();
    });
    ctx.restore();
    drawCrosshairAndTooltip(ctx, renderState);
    ctx.restore();
}
