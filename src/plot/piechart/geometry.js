const TAU = Math.PI * 2;

export function normalizeAngle(rad) {
    const a = rad % TAU;
    return a < 0 ? a + TAU : a;
}

export function isAngleInArc(angle, startAngle, spanAngle) {
    if (spanAngle >= TAU - 1e-6) {
        return true;
    }
    if (spanAngle <= 0) {
        return false;
    }
    const rel = normalizeAngle(angle - startAngle);
    return rel <= spanAngle + 1e-6;
}

function resolveOutsideLabelsSide(items, minY, maxY, cx, cy, labelOrbitR, minGap) {
    if (items.length === 0) {
        return;
    }
    items.sort((a, b) => a.targetY - b.targetY);
    items[0].resolvedY = Math.max(minY, Math.min(maxY, items[0].targetY));
    for (let i = 1; i < items.length; i += 1) {
        items[i].resolvedY = Math.max(items[i].targetY, items[i - 1].resolvedY + minGap);
    }
    if (items[items.length - 1].resolvedY > maxY) {
        items[items.length - 1].resolvedY = maxY;
        for (let i = items.length - 2; i >= 0; i -= 1) {
            items[i].resolvedY = Math.min(items[i].resolvedY, items[i + 1].resolvedY - minGap);
        }
        if (items[0].resolvedY < minY) {
            const avail = Math.max(minGap, (maxY - minY) / Math.max(1, items.length - 1));
            for (let i = 0; i < items.length; i += 1) {
                items[i].resolvedY = minY + i * avail;
            }
        }
    }
    for (let i = 0; i < items.length; i += 1) {
        const it = items[i];
        const dy = it.resolvedY - cy;
        const r = labelOrbitR + 10;
        const dx = Math.sqrt(Math.max(16, r * r - Math.min(r * r - 16, dy * dy)));
        const dir = it.side === "right" ? 1 : -1;
        it.slice.elbowX = cx + dir * Math.max(Math.abs(it.slice.anchorX - cx) + 8, dx);
        it.slice.elbowY = it.resolvedY;
        it.slice.labelX = it.slice.elbowX + dir * 12;
        it.slice.labelY = it.resolvedY;
    }
}

export function describeWedgePath(cx, cy, innerR, outerR, startAngle, endAngle) {
    const span = endAngle - startAngle;
    if (span <= 1e-6) {
        return "";
    }
    if (span >= TAU - 1e-4) {
        const mid = startAngle + Math.PI;
        const x0 = cx + outerR * Math.cos(startAngle);
        const y0 = cy + outerR * Math.sin(startAngle);
        const xm = cx + outerR * Math.cos(mid);
        const ym = cy + outerR * Math.sin(mid);
        let d = `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 1 1 ${xm.toFixed(2)} ${ym.toFixed(2)} A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 1 1 ${x0.toFixed(2)} ${y0.toFixed(2)} Z`;
        if (innerR > 0.5) {
            const ix0 = cx + innerR * Math.cos(startAngle);
            const iy0 = cy + innerR * Math.sin(startAngle);
            const ixm = cx + innerR * Math.cos(mid);
            const iym = cy + innerR * Math.sin(mid);
            d += ` M ${ix0.toFixed(2)} ${iy0.toFixed(2)} A ${innerR.toFixed(2)} ${innerR.toFixed(2)} 0 1 0 ${ixm.toFixed(2)} ${iym.toFixed(2)} A ${innerR.toFixed(2)} ${innerR.toFixed(2)} 0 1 0 ${ix0.toFixed(2)} ${iy0.toFixed(2)} Z`;
        }
        return d;
    }
    const largeArc = span > Math.PI ? 1 : 0;
    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    if (innerR <= 0.5) {
        return `M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    }
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    return [
        `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        `L ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
        `A ${innerR.toFixed(2)} ${innerR.toFixed(2)} 0 ${largeArc} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
        "Z"
    ].join(" ");
}

export function calculatePieLayout({
    prepared,
    mode = "donut",
    width = 860,
    height = 500,
    title = "",
    cutoutPct = 52,
    startAngleDeg = -90,
    labelMode = "auto",
    labelThresholdPct = 4
}) {
    const padTop = title ? 56 : 26;
    const padBottom = 26;
    const labelMarginX = labelMode === "outside" || labelMode === "auto"
        ? Math.min(136, Math.max(58, Math.round(width * 0.22)))
        : 30;
    const availW = Math.max(120, width - labelMarginX * 2);
    const availH = Math.max(120, height - padTop - padBottom);
    const maxRadius = Math.max(54, Math.min(availW, availH) * 0.48);
    const cx = width / 2;
    const cy = padTop + availH / 2;
    const startRad = (startAngleDeg * Math.PI) / 180;
    const seriesCount = prepared ? prepared.seriesCount : 1;
    const rows = prepared ? prepared.activeRows : [];

    let ringCount = 1;
    if (mode === "multi" && seriesCount > 1) {
        ringCount = seriesCount;
    }

    const clampedCutout = mode === "pie"
        ? 0
        : mode === "polar"
            ? Math.min(28, Math.max(0, cutoutPct)) / 100
            : Math.min(78, Math.max(20, cutoutPct)) / 100;
    const baseInnerR = maxRadius * clampedCutout;
    const ringGap = ringCount > 1 ? 5 : 0;
    const totalBandWidth = Math.max(18, maxRadius - baseInnerR - ringGap * (ringCount - 1));
    const singleRingWidth = totalBandWidth / ringCount;
    const polarMaxVal = mode === "polar"
        ? Math.max(1e-9, ...rows.map((r) => r.values[0] || 0))
        : 1;

    const rings = [];
    const outsideLeft = [];
    const outsideRight = [];

    for (let sIdx = 0; sIdx < ringCount; sIdx += 1) {
        const innerR = ringCount === 1
            ? baseInnerR
            : baseInnerR + sIdx * (singleRingWidth + ringGap);
        const nominalOuterR = ringCount === 1
            ? maxRadius
            : innerR + singleRingWidth;
        const seriesName = prepared?.seriesNames?.[sIdx] || `Seri ${sIdx + 1}`;
        const ringTotal = prepared?.ringTotals?.[sIdx] || 0;
        const slices = [];
        let cursorAngle = startRad;
        const equalSpan = rows.length > 0 ? TAU / rows.length : TAU;

        for (let rIdx = 0; rIdx < rows.length; rIdx += 1) {
            const row = rows[rIdx];
            const val = row.values[sIdx] || 0;
            const fraction = ringTotal > 0 ? val / ringTotal : 0;
            const pct = fraction * 100;
            const spanAngle = mode === "polar" ? equalSpan : fraction * TAU;
            const outerR = mode === "polar"
                ? innerR + (nominalOuterR - innerR) * (val / polarMaxVal)
                : nominalOuterR;
            const sAngle = cursorAngle;
            const eAngle = cursorAngle + spanAngle;
            const midAngle = sAngle + spanAngle / 2;
            cursorAngle = eAngle;

            const isOutermostRing = sIdx === ringCount - 1;
            const thickness = outerR - innerR;
            const chordAtMid = 2 * ((innerR + outerR) / 2) * Math.sin(Math.min(Math.PI / 2, spanAngle / 2));
            const fitsInside = thickness >= 28 && chordAtMid >= 42 && pct >= labelThresholdPct;
            let showLabel = false;
            let placeOutside = false;
            if (isOutermostRing && labelMode !== "none" && val > 0 && pct >= labelThresholdPct) {
                showLabel = true;
                if (labelMode === "outside") {
                    placeOutside = true;
                } else if (labelMode === "auto") {
                    placeOutside = !fitsInside;
                }
            } else if (!isOutermostRing && labelMode === "inside" && thickness >= 24 && pct >= Math.max(labelThresholdPct, 8)) {
                showLabel = true;
            }

            const midR = innerR === 0 ? outerR * 0.63 : (innerR + outerR) / 2;
            const anchorR = outerR + 3;
            const cosA = Math.cos(midAngle);
            const sinA = Math.sin(midAngle);
            const side = cosA >= 0 ? "right" : "left";
            const slice = {
                id: `${row.id}-s${sIdx}`,
                categoryId: row.id,
                label: row.label,
                colorIndex: row.colorIndex,
                isGrouped: Boolean(row.isGrouped),
                groupedItems: row.groupedItems || [],
                seriesIndex: sIdx,
                seriesName,
                value: val,
                fraction,
                pct,
                startAngle: sAngle,
                endAngle: eAngle,
                spanAngle,
                midAngle,
                innerR,
                outerR,
                midR,
                centroidX: cx + midR * cosA,
                centroidY: cy + midR * sinA,
                anchorX: cx + anchorR * cosA,
                anchorY: cy + anchorR * sinA,
                elbowX: cx + (outerR + 18) * cosA,
                elbowY: cy + (outerR + 18) * sinA,
                labelX: cx + (outerR + 30) * cosA,
                labelY: cy + (outerR + 30) * sinA,
                side,
                showLabel,
                placeOutside
            };
            slices.push(slice);
            if (showLabel && placeOutside) {
                const targetY = cy + (outerR + 16) * sinA;
                (side === "right" ? outsideRight : outsideLeft).push({ slice, targetY, resolvedY: targetY, side });
            }
        }
        rings.push({ seriesIndex: sIdx, seriesName, innerR, outerR: nominalOuterR, total: ringTotal, slices });
    }

    const labelMinY = padTop + 10;
    const labelMaxY = height - padBottom - 10;
    resolveOutsideLabelsSide(outsideLeft, labelMinY, labelMaxY, cx, cy, maxRadius + 14, 19);
    resolveOutsideLabelsSide(outsideRight, labelMinY, labelMaxY, cx, cy, maxRadius + 14, 19);

    const polarTicks = [];
    if (mode === "polar" && polarMaxVal > 0) {
        const steps = 4;
        for (let i = 1; i <= steps; i += 1) {
            const frac = i / steps;
            polarTicks.push({
                value: polarMaxVal * frac,
                r: baseInnerR + (maxRadius - baseInnerR) * frac
            });
        }
    }

    return {
        width,
        height,
        cx,
        cy,
        mode,
        effectiveMode: ringCount > 1 ? "multi" : mode,
        maxRadius,
        baseInnerR,
        ringCount,
        rings,
        polarTicks
    };
}

export function hitTestPie(x, y, layout, options = {}) {
    if (!layout || !layout.rings || layout.rings.length === 0) {
        return null;
    }
    const expandTolerance = options.expandTolerance ?? 12;
    const dx = x - layout.cx;
    const dy = y - layout.cy;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    for (let r = layout.rings.length - 1; r >= 0; r -= 1) {
        const ring = layout.rings[r];
        for (let s = 0; s < ring.slices.length; s += 1) {
            const slice = ring.slices[s];
            if (slice.value <= 0 || slice.spanAngle <= 0) {
                continue;
            }
            if (dist < Math.max(0, slice.innerR - 2) || dist > slice.outerR + expandTolerance) {
                continue;
            }
            if (isAngleInArc(angle, slice.startAngle, slice.spanAngle)) {
                return slice;
            }
        }
    }
    return null;
}
