import { getSliceColor, hexToRgba } from "./presets.js";
import { formatNumber } from "./parser.js";
import { formatSliceLabel, getContrastTextColor, getCenterKpiContent } from "./exporter.js";

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

function drawPolarGrid(ctx, layout) {
    const { cx, cy, polarTicks } = layout;
    if (!polarTicks || polarTicks.length === 0) {
        return;
    }
    ctx.save();
    ctx.font = "400 10px Roboto Mono, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (let i = 0; i < polarTicks.length; i += 1) {
        const t = polarTicks[i];
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, t.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#64748b";
        ctx.fillText(formatNumber(t.value, 1), cx + 4, cy - t.r + 3);
    }
    ctx.restore();
}

function traceWedgeArc(ctx, cx, cy, innerR, outerR, startAngle, endAngle) {
    const span = endAngle - startAngle;
    if (span <= 1e-6) {
        return;
    }
    ctx.beginPath();
    if (innerR <= 0.5) {
        if (span >= Math.PI * 2 - 1e-4) {
            ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        } else {
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, outerR, startAngle, endAngle, false);
            ctx.closePath();
        }
        return;
    }
    ctx.arc(cx, cy, outerR, startAngle, endAngle, false);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
}

function drawCenterKpi(ctx, layout, kpi) {
    const { cx, cy, baseInnerR } = layout;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxW = baseInnerR * 1.75;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 11px Google Sans, sans-serif";
    ctx.fillText(kpi.overline, cx, cy - 16, maxW);

    ctx.fillStyle = "#f8fafc";
    ctx.font = `700 ${baseInnerR > 65 ? 20 : 16}px Roboto Mono, monospace`;
    ctx.fillText(kpi.valueText, cx, cy + 4, maxW);

    ctx.fillStyle = kpi.accentColor;
    ctx.font = "600 11px Google Sans, sans-serif";
    ctx.fillText(kpi.subText, cx, cy + 23, maxW);
    ctx.restore();
}

function drawSliceLabels(ctx, layout, focusCategoryId, options) {
    const { palette, contrastOrder, labelFormat, expandOnHover, hoveredSlice } = options;
    ctx.save();
    for (let r = 0; r < layout.rings.length; r += 1) {
        const ring = layout.rings[r];
        for (let s = 0; s < ring.slices.length; s += 1) {
            const slice = ring.slices[s];
            if (!slice.showLabel) {
                continue;
            }
            const isDimmed = focusCategoryId && slice.categoryId !== focusCategoryId;
            ctx.globalAlpha = isDimmed ? 0.25 : 1;
            const color = getSliceColor(palette, slice.colorIndex, {
                contrastOrder,
                isGrouped: slice.isGrouped
            });
            const isExpanded = expandOnHover && (hoveredSlice?.id === slice.id || (!hoveredSlice && focusCategoryId === slice.categoryId));
            const shift = isExpanded ? 9 : 0;
            const dx = Math.cos(slice.midAngle) * shift;
            const dy = Math.sin(slice.midAngle) * shift;
            const text = formatSliceLabel(slice, labelFormat);
            if (slice.placeOutside) {
                const tickX = slice.elbowX + (slice.side === "right" ? 8 : -8);
                ctx.strokeStyle = hexToRgba(color, 0.78);
                ctx.lineWidth = 1.25;
                ctx.beginPath();
                ctx.moveTo(slice.anchorX + dx, slice.anchorY + dy);
                ctx.lineTo(slice.elbowX + dx * 0.4, slice.elbowY);
                ctx.lineTo(tickX, slice.labelY);
                ctx.stroke();

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(slice.anchorX + dx, slice.anchorY + dy, 2.3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#e2e8f0";
                ctx.font = "500 11.5px Google Sans, sans-serif";
                ctx.textAlign = slice.side === "right" ? "left" : "right";
                ctx.textBaseline = "middle";
                ctx.fillText(text, slice.labelX, slice.labelY);
            } else {
                ctx.fillStyle = getContrastTextColor(color);
                ctx.font = "600 11px Roboto Mono, monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(text, slice.centroidX + dx, slice.centroidY + dy);
            }
        }
    }
    ctx.restore();
}

function drawSliceTooltip(ctx, layout, slice, options) {
    const color = getSliceColor(options.palette, slice.colorIndex, {
        contrastOrder: options.contrastOrder,
        isGrouped: slice.isGrouped
    });
    const head = layout.ringCount > 1 ? `${slice.label} (${slice.seriesName})` : slice.label;
    const valLine = `Nilai: ${formatNumber(slice.value)}  |  Porsi: ${slice.pct.toFixed(2)}%`;
    const subLine = slice.isGrouped && slice.groupedItems.length > 0
        ? `Gabungan ${slice.groupedItems.length} kategori kecil`
        : null;
    ctx.save();
    ctx.font = "600 12px Google Sans, sans-serif";
    let w = ctx.measureText(head).width + 32;
    ctx.font = "500 11px Roboto Mono, monospace";
    w = Math.max(w, ctx.measureText(valLine).width + 24);
    if (subLine) {
        w = Math.max(w, ctx.measureText(subLine).width + 24);
    }
    const boxW = Math.min(280, Math.max(160, w));
    const boxH = subLine ? 66 : 48;
    let tx = slice.centroidX + 16;
    if (tx + boxW > layout.width - 12) {
        tx = slice.centroidX - boxW - 16;
    }
    tx = Math.max(12, Math.min(layout.width - boxW - 12, tx));
    let ty = slice.centroidY - boxH / 2;
    ty = Math.max(12, Math.min(layout.height - boxH - 12, ty));

    drawRoundedRect(ctx, tx, ty, boxW, boxH, 9);
    ctx.fillStyle = "rgba(7, 10, 16, 0.94)";
    ctx.fill();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(tx + 14, ty + 15, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 12px Google Sans, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(head, tx + 24, ty + 16, boxW - 32);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 11px Roboto Mono, monospace";
    ctx.fillText(valLine, tx + 12, ty + 35, boxW - 20);

    if (subLine) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "400 10.5px Google Sans, sans-serif";
        ctx.fillText(subLine, tx + 12, ty + 52, boxW - 20);
    }
    ctx.restore();
}

export function renderPieCanvas(ctx, renderState) {
    const { prepared, layout, stats, hoveredSlice, focusedCategoryId, options } = renderState;
    if (!ctx || !layout) {
        return;
    }
    const { palette = "okabe_ito", contrastOrder = true, gapWidth = 2, expandOnHover = true, showCenterKpi = true, title = "" } = options;
    const { width, height, cx, cy, rings, baseInnerR, ringCount } = layout;

    ctx.clearRect(0, 0, width, height);
    drawRoundedRect(ctx, 0, 0, width, height, 14);
    ctx.fillStyle = "#0b0e14";
    ctx.fill();

    if (title) {
        ctx.save();
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "600 15px Google Sans, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(title, 22, 16);
        ctx.restore();
    }

    if (!prepared || prepared.activeRows.length === 0 || rings.length === 0) {
        ctx.save();
        ctx.fillStyle = "#64748b";
        ctx.font = "500 13px Google Sans, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Masukkan minimal satu kategori dengan nilai positif", width / 2, height / 2);
        ctx.restore();
        return;
    }

    if (layout.mode === "polar") {
        drawPolarGrid(ctx, layout);
    }

    const focusCategoryId = hoveredSlice ? hoveredSlice.categoryId : focusedCategoryId;

    for (const ring of rings) {
        for (const slice of ring.slices) {
            const color = getSliceColor(palette, slice.colorIndex, { contrastOrder, isGrouped: slice.isGrouped });
            const isDimmed = focusCategoryId && slice.categoryId !== focusCategoryId;
            const isExpanded = expandOnHover && (hoveredSlice?.id === slice.id || (!hoveredSlice && focusCategoryId === slice.categoryId));
            const expandOffset = isExpanded ? 9 : 0;
            const scx = cx + Math.cos(slice.midAngle) * expandOffset;
            const scy = cy + Math.sin(slice.midAngle) * expandOffset;

            ctx.save();
            ctx.globalAlpha = isDimmed ? 0.26 : layout.mode === "polar" ? 0.86 : 1;
            traceWedgeArc(ctx, scx, scy, slice.innerR, slice.outerR, slice.startAngle, slice.endAngle);
            ctx.fillStyle = color;
            ctx.fill();
            if (gapWidth > 0) {
                ctx.strokeStyle = "#0b0e14";
                ctx.lineWidth = gapWidth;
                ctx.lineJoin = "round";
                ctx.stroke();
            }
            if (isExpanded) {
                ctx.strokeStyle = "rgba(248, 250, 252, 0.55)";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.restore();
        }
        if (ringCount > 1) {
            const labelR = (ring.innerR + ring.outerR) / 2;
            ctx.save();
            ctx.font = "600 10px Roboto Mono, monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = "#0b0e14";
            ctx.strokeText(ring.seriesName, cx, cy - labelR);
            ctx.fillStyle = "#e2e8f0";
            ctx.fillText(ring.seriesName, cx, cy - labelR);
            ctx.restore();
        }
    }

    if (showCenterKpi && baseInnerR >= 36 && layout.mode !== "polar") {
        drawCenterKpi(ctx, layout, getCenterKpiContent({ stats, prepared, hoveredSlice, focusedCategoryId, palette, contrastOrder }));
    }
    drawSliceLabels(ctx, layout, focusCategoryId, options);
    if (hoveredSlice) {
        drawSliceTooltip(ctx, layout, hoveredSlice, options);
    }
}
