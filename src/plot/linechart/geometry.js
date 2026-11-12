function niceNum(range, round) {
    const exponent = Math.floor(Math.log10(range));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction = 10;
    if (round) {
        if (fraction < 1.5) {
            niceFraction = 1;
        } else if (fraction < 3) {
            niceFraction = 2;
        } else if (fraction < 7) {
            niceFraction = 5;
        }
    } else if (fraction <= 1) {
        niceFraction = 1;
    } else if (fraction <= 2) {
        niceFraction = 2;
    } else if (fraction <= 5) {
        niceFraction = 5;
    }
    return niceFraction * Math.pow(10, exponent);
}

export function calculateScale({ min = 0, max = 100, beginAtZero = false, targetTickCount = 5 } = {}) {
    let effMin = beginAtZero ? Math.min(0, min) : min;
    let effMax = beginAtZero ? Math.max(0, max) : max;
    if (effMin === effMax) {
        const delta = Math.abs(effMin) > 0 ? Math.abs(effMin) * 0.2 : 1;
        effMin -= delta;
        effMax += delta;
        if (beginAtZero) {
            effMin = Math.min(0, min);
            effMax = Math.max(0, max);
            if (effMin === effMax) {
                effMax = 10;
            }
        }
    }
    const range = niceNum(effMax - effMin, false);
    const step = niceNum(range / Math.max(1, targetTickCount - 1), true);
    const safeMin = parseFloat((Math.floor(effMin / step) * step).toPrecision(12));
    const safeMax = parseFloat((Math.ceil(effMax / step) * step).toPrecision(12));
    const safeStep = parseFloat(step.toPrecision(12));
    const ticks = [];
    for (let t = safeMin; t <= safeMax + safeStep * 0.001; t += safeStep) {
        ticks.push(parseFloat(t.toPrecision(10)));
    }
    return { min: effMin, max: effMax, niceMin: safeMin, niceMax: safeMax, step: safeStep, ticks };
}

export function computeMonotoneTangents(points) {
    const n = points.length;
    if (n === 0) {
        return [];
    }
    if (n === 1) {
        return [0];
    }
    if (n === 2) {
        const dx0 = points[1].x - points[0].x;
        const slope = Math.abs(dx0) > 1e-6 ? (points[1].y - points[0].y) / dx0 : 0;
        return [slope, slope];
    }
    const dx = new Array(n - 1);
    const delta = new Array(n - 1);
    for (let k = 0; k < n - 1; k += 1) {
        dx[k] = points[k + 1].x - points[k].x;
        delta[k] = Math.abs(dx[k]) > 1e-6 ? (points[k + 1].y - points[k].y) / dx[k] : 0;
    }
    const d = new Array(n).fill(0);
    d[0] = delta[0];
    d[n - 1] = delta[n - 2];
    for (let k = 1; k < n - 1; k += 1) {
        if (delta[k - 1] * delta[k] <= 0) {
            d[k] = 0;
        } else {
            const w1 = 2 * dx[k] + dx[k - 1];
            const w2 = dx[k] + 2 * dx[k - 1];
            d[k] = (w1 + w2) / (w1 / delta[k - 1] + w2 / delta[k]);
        }
    }
    for (let k = 0; k < n - 1; k += 1) {
        if (Math.abs(delta[k]) <= 1e-9) {
            d[k] = 0;
            d[k + 1] = 0;
        } else {
            const alpha = d[k] / delta[k];
            const beta = d[k + 1] / delta[k];
            const sq = alpha * alpha + beta * beta;
            if (sq > 9) {
                const tau = 3 / Math.sqrt(sq);
                d[k] = tau * alpha * delta[k];
                d[k + 1] = tau * beta * delta[k];
            }
        }
    }
    return d;
}

export function buildRunSegments(runPoints, mode = "monotone") {
    const n = runPoints.length;
    if (n < 2) {
        return [];
    }
    const segments = [];
    if (mode === "step") {
        for (let k = 0; k < n - 1; k += 1) {
            segments.push({ type: "step", x0: runPoints[k].x, y0: runPoints[k].y, x1: runPoints[k + 1].x, y1: runPoints[k + 1].y });
        }
        return segments;
    }
    if (mode === "monotone" && n >= 3) {
        const slopes = computeMonotoneTangents(runPoints);
        for (let k = 0; k < n - 1; k += 1) {
            const p0 = runPoints[k];
            const p1 = runPoints[k + 1];
            const h = (p1.x - p0.x) / 3;
            segments.push({
                type: "cubic",
                x0: p0.x,
                y0: p0.y,
                cx1: p0.x + h,
                cy1: p0.y + h * slopes[k],
                cx2: p1.x - h,
                cy2: p1.y - h * slopes[k + 1],
                x1: p1.x,
                y1: p1.y
            });
        }
        return segments;
    }
    for (let k = 0; k < n - 1; k += 1) {
        segments.push({ type: "line", x0: runPoints[k].x, y0: runPoints[k].y, x1: runPoints[k + 1].x, y1: runPoints[k + 1].y });
    }
    return segments;
}

export function buildSeriesRuns(points, { mode = "monotone", connectNull = false } = {}) {
    if (connectNull) {
        const clean = points.filter((p) => p.value !== null && Number.isFinite(p.y));
        return clean.length === 0 ? [] : [{ points: clean, segments: buildRunSegments(clean, mode) }];
    }
    const runs = [];
    let current = [];
    for (let i = 0; i < points.length; i += 1) {
        const pt = points[i];
        if (pt.value !== null && Number.isFinite(pt.y)) {
            current.push(pt);
        } else if (current.length > 0) {
            runs.push({ points: current, segments: buildRunSegments(current, mode) });
            current = [];
        }
    }
    if (current.length > 0) {
        runs.push({ points: current, segments: buildRunSegments(current, mode) });
    }
    return runs;
}

export function calculateLineLayout({
    dataset,
    hiddenSeries = new Set(),
    width = 960,
    height = 520,
    padding = { top: 64, right: 32, bottom: 56, left: 68 },
    beginAtZero = false
}) {
    const plotX = padding.left;
    const plotY = padding.top;
    const plotWidth = Math.max(120, width - padding.left - padding.right);
    const plotHeight = Math.max(120, height - padding.top - padding.bottom);
    const activeSeries = dataset.series.filter((s) => !hiddenSeries.has(s.id));
    let minY = Infinity;
    let maxY = -Infinity;
    for (let s = 0; s < activeSeries.length; s += 1) {
        const vals = activeSeries[s].values;
        for (let i = 0; i < vals.length; i += 1) {
            const v = vals[i];
            if (v !== null && Number.isFinite(v)) {
                minY = Math.min(minY, v);
                maxY = Math.max(maxY, v);
            }
        }
    }
    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
        minY = 0;
        maxY = 100;
    }
    const yScale = calculateScale({ min: minY, max: maxY, beginAtZero, targetTickCount: 5 });
    const ySpan = yScale.niceMax - yScale.niceMin || 1;
    const valueToY = (v) => plotY + plotHeight - ((v - yScale.niceMin) / ySpan) * plotHeight;
    const n = dataset.rowCount;
    const xCoords = new Array(n);
    if (n === 1) {
        xCoords[0] = plotX + plotWidth * 0.5;
    } else if (n > 1) {
        const xMin = dataset.xValues[0];
        const xSpan = dataset.xValues[n - 1] - xMin;
        for (let i = 0; i < n; i += 1) {
            const ratio = xSpan > 0 ? (dataset.xValues[i] - xMin) / xSpan : i / (n - 1);
            xCoords[i] = plotX + ratio * plotWidth;
        }
    }
    const pointSpacing = n > 1 ? plotWidth / (n - 1) : plotWidth;
    const maxLabels = Math.max(2, Math.floor(plotWidth / 76));
    const step = n > maxLabels ? Math.ceil((n - 1) / (maxLabels - 1)) : 1;
    const xTicks = [];
    for (let i = 0; i < n; i += step) {
        xTicks.push({ index: i, x: xCoords[i], label: dataset.xLabels[i] });
    }
    if (n > 1 && xTicks[xTicks.length - 1].index !== n - 1 && xCoords[n - 1] - xTicks[xTicks.length - 1].x >= 46) {
        xTicks.push({ index: n - 1, x: xCoords[n - 1], label: dataset.xLabels[n - 1] });
    }
    const seriesPoints = dataset.series.map((s) =>
        s.values.map((v, i) => ({
            index: i,
            xLabel: dataset.xLabels[i],
            xValue: dataset.xValues[i],
            value: v,
            x: xCoords[i],
            y: v !== null && Number.isFinite(v) ? valueToY(v) : null
        }))
    );
    return {
        width,
        height,
        plotBox: { x: plotX, y: plotY, width: plotWidth, height: plotHeight },
        yScale,
        valueToY,
        baselineY: valueToY(Math.max(yScale.niceMin, Math.min(yScale.niceMax, 0))),
        xCoords,
        xTicks,
        pointSpacing,
        seriesPoints
    };
}

export function hitTestNearestX(mouseX, mouseY, layout) {
    const { plotBox, xCoords } = layout;
    if (!xCoords || xCoords.length === 0 || mouseX < plotBox.x - 14 || mouseX > plotBox.x + plotBox.width + 14 || mouseY < plotBox.y - 14 || mouseY > plotBox.y + plotBox.height + 14) {
        return null;
    }
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < xCoords.length; i += 1) {
        const dist = Math.abs(mouseX - xCoords[i]);
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
        }
    }
    return { index: bestIdx, x: xCoords[bestIdx] };
}
