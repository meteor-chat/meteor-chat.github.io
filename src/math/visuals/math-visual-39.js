function setupDpi(canvas, fallbackW, fallbackH) {
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: 0, height: 0 };
    const w = Math.max(rect.width || fallbackW, 280);
    const h = rect.height || fallbackH;
    const targetW = Math.floor(w * dpr);
    const targetH = Math.floor(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { ctx, w, h };
}

function niceStep(span, targetTicks = 5) {
    if (!Number.isFinite(span) || span <= 0) return 1;
    const rough = span / targetTicks;
    const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
    const frac = rough / pow10;
    let nice = 1;
    if (frac <= 1.2) nice = 1;
    else if (frac <= 2.5) nice = 2;
    else if (frac <= 5.5) nice = 5;
    else nice = 10;
    return nice * pow10;
}

function fmtAxis(val) {
    if (Math.abs(val) < 1e-9) return "0";
    if (Math.abs(val) >= 100 || Number.isInteger(val)) return String(Math.round(val * 100) / 100);
    return String(Number(val.toFixed(2)));
}

function computeBounds(points, lineW0, lineW1, queryPoint) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    if (queryPoint && Number.isFinite(queryPoint.x)) {
        xs.push(queryPoint.x);
        if (Number.isFinite(queryPoint.yHat)) ys.push(queryPoint.yHat);
    }
    let minX = xs.length ? Math.min(...xs) : 0;
    let maxX = xs.length ? Math.max(...xs) : 10;
    let minY = ys.length ? Math.min(...ys) : 0;
    let maxY = ys.length ? Math.max(...ys) : 10;

    if (Number.isFinite(lineW0) && Number.isFinite(lineW1)) {
        const yAtMin = lineW0 + lineW1 * minX;
        const yAtMax = lineW0 + lineW1 * maxX;
        if (Number.isFinite(yAtMin)) {
            minY = Math.min(minY, yAtMin);
            maxY = Math.max(maxY, yAtMin);
        }
        if (Number.isFinite(yAtMax)) {
            minY = Math.min(minY, yAtMax);
            maxY = Math.max(maxY, yAtMax);
        }
    }

    const spanX = Math.max(maxX - minX, 2);
    const spanY = Math.max(maxY - minY, 4);
    const padX = spanX * 0.16;
    const padY = spanY * 0.18;

    return {
        minX: minX - padX,
        maxX: maxX + padX,
        minY: minY - padY,
        maxY: maxY + padY
    };
}

function drawStar(ctx, cx, cy, outerR, innerR) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

function drawDiamond(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
}

export function createScatterGeometry(canvas, ols, activeLine, queryPoint, fallbackW = 480, fallbackH = 320) {
    const setup = setupDpi(canvas, fallbackW, fallbackH);
    if (!setup) return null;
    const { ctx, w, h } = setup;
    const pad = { left: 48, right: 20, top: 24, bottom: 38 };
    const plotW = Math.max(w - pad.left - pad.right, 60);
    const plotH = Math.max(h - pad.top - pad.bottom, 60);
    const points = ols?.points || [];
    const bounds = computeBounds(points, activeLine?.w0, activeLine?.w1, queryPoint);

    const toPx = (x) => pad.left + ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
    const toPy = (y) => pad.top + plotH - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;
    const toMath = (sx, sy) => ({
        x: Math.round((bounds.minX + ((sx - pad.left) / plotW) * (bounds.maxX - bounds.minX)) * 10) / 10,
        y: Math.round((bounds.minY + ((pad.top + plotH - sy) / plotH) * (bounds.maxY - bounds.minY)) * 10) / 10
    });

    return { ctx, w, h, pad, plotW, plotH, bounds, toPx, toPy, toMath };
}

export function hitTestScatterPoint(geom, sx, sy, points, threshold = 16) {
    if (!geom || !Array.isArray(points)) return -1;
    for (let i = points.length - 1; i >= 0; i--) {
        const px = geom.toPx(points[i].x);
        const py = geom.toPy(points[i].y);
        if (Math.hypot(sx - px, sy - py) <= threshold) return i;
    }
    return -1;
}

export function renderScatterCanvas(canvas, state) {
    const {
        ols,
        mode = "ols",
        gdState = null,
        showResiduals = true,
        showSquares = false,
        hoveredIdx = -1,
        draggedIdx = -1,
        queryLabel = "F",
        xName = "x",
        yName = "y"
    } = state;

    const activeLine = mode === "gd" && gdState
        ? { w0: gdState.w0, w1: gdState.w1 }
        : ols?.valid ? { w0: ols.w0, w1: ols.w1 } : null;

    const queryPt = ols?.valid
        ? {
            x: ols.query.x,
            yHat: activeLine ? activeLine.w0 + activeLine.w1 * ols.query.x : ols.query.yHat,
            isExtrapolation: ols.query.isExtrapolation
        }
        : null;

    const geom = createScatterGeometry(canvas, ols, activeLine, queryPt);
    if (!geom) return null;

    const { ctx, w, h, pad, plotW, plotH, bounds, toPx, toPy } = geom;
    const points = ols?.points || [];

    ctx.fillStyle = "#080a10";
    ctx.fillRect(0, 0, w, h);

    if (ols?.valid && queryPt?.isExtrapolation) {
        const minDomainPx = Math.max(pad.left, Math.min(w - pad.right, toPx(ols.minX)));
        const maxDomainPx = Math.max(pad.left, Math.min(w - pad.right, toPx(ols.maxX)));
        ctx.fillStyle = "rgba(245, 158, 11, 0.05)";
        if (minDomainPx > pad.left) {
            ctx.fillRect(pad.left, pad.top, minDomainPx - pad.left, plotH);
        }
        if (maxDomainPx < w - pad.right) {
            ctx.fillRect(maxDomainPx, pad.top, w - pad.right - maxDomainPx, plotH);
        }
    }

    const xStep = niceStep(bounds.maxX - bounds.minX, 5);
    const xStart = Math.ceil(bounds.minX / xStep) * xStep;
    ctx.lineWidth = 1;
    for (let x = xStart; x <= bounds.maxX + xStep * 0.01; x += xStep) {
        const px = toPx(x);
        if (px < pad.left - 1 || px > w - pad.right + 1) continue;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
        ctx.beginPath();
        ctx.moveTo(px, pad.top);
        ctx.lineTo(px, h - pad.bottom);
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "400 10px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(fmtAxis(x), px, h - pad.bottom + 6);
    }

    const yStep = niceStep(bounds.maxY - bounds.minY, 5);
    const yStart = Math.ceil(bounds.minY / yStep) * yStep;
    for (let y = yStart; y <= bounds.maxY + yStep * 0.01; y += yStep) {
        const py = toPy(y);
        if (py < pad.top - 1 || py > h - pad.bottom + 1) continue;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
        ctx.beginPath();
        ctx.moveTo(pad.left, py);
        ctx.lineTo(w - pad.right, py);
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "400 10px 'Roboto Mono', monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(fmtAxis(y), pad.left - 6, py);
    }

    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 10px 'Google Sans', sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(xName, w - pad.right, h - 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(yName, pad.left + 6, 4);

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.left, pad.top, plotW, plotH);
    ctx.clip();

    if (activeLine && Number.isFinite(activeLine.w0) && Number.isFinite(activeLine.w1)) {
        if (showSquares) {
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const yHat = activeLine.w0 + activeLine.w1 * p.x;
                const px = toPx(p.x);
                const py = toPy(p.y);
                const pyHat = toPy(yHat);
                const side = Math.abs(pyHat - py);
                if (side < 1) continue;
                const topY = Math.min(py, pyHat);
                ctx.fillStyle = "rgba(244, 63, 94, 0.14)";
                ctx.fillRect(px, topY, side, side);
                ctx.strokeStyle = "rgba(244, 63, 94, 0.5)";
                ctx.lineWidth = 1;
                ctx.strokeRect(px, topY, side, side);
            }
        }

        if (showResiduals) {
            ctx.setLineDash([4, 3]);
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const yHat = activeLine.w0 + activeLine.w1 * p.x;
                const res = p.y - yHat;
                const px = toPx(p.x);
                const py = toPy(p.y);
                const pyHat = toPy(yHat);
                ctx.strokeStyle = "#f43f5e";
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px, pyHat);
                ctx.stroke();

                if (Math.abs(py - pyHat) > 8) {
                    const sign = res >= 0 ? "+" : "";
                    ctx.fillStyle = "#fda4af";
                    ctx.font = "500 9px 'Roboto Mono', monospace";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    ctx.fillText(`${sign}${fmtAxis(res)}`, px + 4, (py + pyHat) / 2);
                }
            }
            ctx.setLineDash([]);
        }
    }

    if (mode === "gd" && ols?.valid) {
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(toPx(bounds.minX), toPy(ols.w0 + ols.w1 * bounds.minX));
        ctx.lineTo(toPx(bounds.maxX), toPy(ols.w0 + ols.w1 * bounds.maxX));
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (activeLine && Number.isFinite(activeLine.w0) && Number.isFinite(activeLine.w1)) {
        ctx.strokeStyle = mode === "gd" ? "#a78bfa" : "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(toPx(bounds.minX), toPy(activeLine.w0 + activeLine.w1 * bounds.minX));
        ctx.lineTo(toPx(bounds.maxX), toPy(activeLine.w0 + activeLine.w1 * bounds.maxX));
        ctx.stroke();
    }

    if (ols?.valid && mode !== "gd") {
        const cx = toPx(ols.meanX);
        const cy = toPy(ols.meanY);
        drawStar(ctx, cx, cy, 8, 3.6);
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
        ctx.strokeStyle = "#080a10";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#fde68a";
        ctx.font = "500 10px 'Roboto Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`(x\u0304,y\u0304)=(${fmtAxis(ols.meanX)},${fmtAxis(ols.meanY)})`, cx + 8, cy + 6);
    }

    if (queryPt && Number.isFinite(queryPt.x) && Number.isFinite(queryPt.yHat)) {
        const qpx = toPx(queryPt.x);
        const qpy = toPy(queryPt.yHat);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(16, 185, 129, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(qpx, h - pad.bottom);
        ctx.lineTo(qpx, qpy);
        ctx.lineTo(pad.left, qpy);
        ctx.stroke();
        ctx.setLineDash([]);

        drawDiamond(ctx, qpx, qpy, 6.5);
        ctx.fillStyle = "#10b981";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const qText = `${queryLabel}(${fmtAxis(queryPt.x)},${fmtAxis(queryPt.yHat)})`;
        ctx.fillStyle = "#6ee7b7";
        ctx.font = "600 10px 'Roboto Mono', monospace";
        const qWidth = ctx.measureText(qText).width || 48;
        const hitsAboveRight = points.some((pt) => {
            const dpx = toPx(pt.x);
            const dpy = toPy(pt.y);
            return dpx >= qpx - 6 && dpx <= qpx + qWidth + 18 && dpy >= qpy - 28 && dpy <= qpy + 6;
        });
        const alignRightEdge = qpx + qWidth + 14 > w - pad.right;
        ctx.textAlign = alignRightEdge ? "right" : "left";
        ctx.textBaseline = hitsAboveRight && qpy + 24 < h - pad.bottom ? "top" : "bottom";
        const lx = alignRightEdge ? qpx - 8 : qpx + 8;
        const ly = hitsAboveRight && qpy + 24 < h - pad.bottom ? qpy + 10 : Math.max(pad.top + 14, qpy - 6);
        ctx.fillText(qText, lx, ly);
    }

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const px = toPx(p.x);
        const py = toPy(p.y);
        const isHot = hoveredIdx === i || draggedIdx === i;

        if (isHot) {
            ctx.beginPath();
            ctx.arc(px, py, 11, 0, Math.PI * 2);
            ctx.fillStyle = draggedIdx === i ? "rgba(251, 191, 36, 0.35)" : "rgba(56, 189, 248, 0.3)";
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = draggedIdx === i ? "#fbbf24" : "#38bdf8";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "600 10px 'Google Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(p.label, px, py - 8);
    }

    if (hoveredIdx >= 0 && hoveredIdx < points.length && activeLine) {
        const hp = points[hoveredIdx];
        const px = toPx(hp.x);
        const py = toPy(hp.y);
        const yHat = activeLine.w0 + activeLine.w1 * hp.x;
        const res = hp.y - yHat;
        const tip = `${hp.label}(${fmtAxis(hp.x)},${fmtAxis(hp.y)}) y\u0302=${fmtAxis(yHat)} e=${res >= 0 ? "+" : ""}${fmtAxis(res)}`;
        ctx.font = "500 10px 'Roboto Mono', monospace";
        const tw = ctx.measureText ? ctx.measureText(tip).width : 140;
        const boxX = Math.min(Math.max(px - tw / 2, pad.left + 4), w - pad.right - tw - 12);
        const boxY = py > pad.top + 32 ? py - 30 : py + 14;
        ctx.fillStyle = "rgba(8, 12, 24, 0.92)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1;
        ctx.fillRect(boxX - 4, boxY - 2, tw + 8, 18);
        ctx.strokeRect(boxX - 4, boxY - 2, tw + 8, 18);
        ctx.fillStyle = "#f8fafc";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(tip, boxX, boxY + 2);
    }

    ctx.restore();
    return geom;
}

export function renderLossCanvas(canvas, gdState, olsMse) {
    const setup = setupDpi(canvas, 480, 140);
    if (!setup) return;
    const { ctx, w, h } = setup;

    ctx.fillStyle = "#080a10";
    ctx.fillRect(0, 0, w, h);

    const history = gdState?.history || [];
    if (history.length === 0) {
        ctx.fillStyle = "#64748b";
        ctx.font = "400 11px 'Google Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Jalankan Gradient Descent untuk melihat grafik MSE", w / 2, h / 2);
        return;
    }

    const padL = 48;
    const padR = 16;
    const padT = 22;
    const padB = 24;
    const plotW = Math.max(w - padL - padR, 40);
    const plotH = Math.max(h - padT - padB, 30);

    let minL = Number.isFinite(olsMse) ? olsMse : Infinity;
    let maxL = -Infinity;
    for (let i = 0; i < history.length; i++) {
        const val = history[i].mse;
        if (!Number.isFinite(val)) continue;
        if (val < minL) minL = val;
        if (val > maxL) maxL = val;
    }
    if (!Number.isFinite(minL) || !Number.isFinite(maxL)) {
        minL = 0;
        maxL = 10;
    }
    if (Math.abs(maxL - minL) < 1e-6) {
        maxL += 1;
        minL = Math.max(0, minL - 1);
    }
    const rangeL = maxL - minL;

    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, h - padB);
    ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    if (Number.isFinite(olsMse)) {
        const optY = padT + plotH - ((olsMse - minL) / rangeL) * plotH;
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(padL, optY);
        ctx.lineTo(w - padR, optY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#6ee7b7";
        ctx.font = "500 9px 'Roboto Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(`Target MSE*=${fmtAxis(olsMse)}`, padL + 4, Math.max(padT + 10, optY - 2));
    }

    ctx.strokeStyle = gdState?.diverged ? "#f43f5e" : "#a78bfa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const denom = Math.max(1, history.length - 1);
    for (let i = 0; i < history.length; i++) {
        const val = Number.isFinite(history[i].mse) ? history[i].mse : maxL;
        const px = padL + (i / denom) * plotW;
        const py = padT + plotH - ((val - minL) / rangeL) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "400 9px 'Roboto Mono', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(fmtAxis(maxL), padL - 5, padT);
    ctx.fillText(fmtAxis(minL), padL - 5, h - padB);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("iter 0", padL + 10, h - padB + 5);
    ctx.fillText(`iter ${gdState.iter}`, w - padR - 18, h - padB + 5);

    ctx.fillStyle = gdState?.diverged ? "#fda4af" : "#c4b5fd";
    ctx.font = "500 10px 'Roboto Mono', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    const statusText = gdState?.diverged
        ? "DIVERGEN! Turunkan LR atau aktifkan Standardisasi"
        : `MSE=${fmtAxis(gdState.mse)}`;
    ctx.fillText(statusText, w - padR, 5);
}
