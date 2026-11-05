import { LANDSCAPES, getTempStatus } from "../calculators/math-calc-38-engine.js";

let lCanvas = null;
let lCtx = null;
let tCanvas = null;
let tCtx = null;

function setupDpi(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width || 360, 320);
    const h = rect.height || (canvas === lCanvas ? 240 : 130);
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { w, h };
}

export function initSaVisual(landscapeCanvasEl, telemetryCanvasEl) {
    lCanvas = landscapeCanvasEl;
    tCanvas = telemetryCanvasEl;
    if (lCanvas) lCtx = lCanvas.getContext("2d");
    if (tCanvas) tCtx = tCanvas.getContext("2d");
}

export function renderSaVisual(state, params) {
    if (lCanvas && lCtx) renderLandscape(state, params);
    if (tCanvas && tCtx) renderTelemetry(state, params);
}

function renderLandscape(state, params) {
    const { w, h } = setupDpi(lCanvas, lCtx);
    const fn = LANDSCAPES[params.landscape] || LANDSCAPES.doubleWell;
    const [minX, maxX] = fn.domain;
    const [minY, maxY] = fn.yRange;
    const padX = 36;
    const padY = 28;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;
    const toPx = (x) => padX + ((x - minX) / (maxX - minX)) * plotW;
    const toPy = (y) => padY + plotH - ((y - minY) / (maxY - minY)) * plotH;

    lCtx.fillStyle = "#0c0d12";
    lCtx.fillRect(0, 0, w, h);

    lCtx.strokeStyle = "#1e2230";
    lCtx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const yVal = minY + (i / 4) * (maxY - minY);
        const py = toPy(yVal);
        lCtx.beginPath();
        lCtx.moveTo(padX, py);
        lCtx.lineTo(w - padX, py);
        lCtx.stroke();
    }

    const steps = 120;
    lCtx.beginPath();
    for (let i = 0; i <= steps; i++) {
        const x = minX + (i / steps) * (maxX - minX);
        const y = Math.max(minY, Math.min(maxY, fn.eval(x)));
        const px = toPx(x);
        const py = toPy(y);
        if (i === 0) lCtx.moveTo(px, py);
        else lCtx.lineTo(px, py);
    }
    lCtx.lineTo(toPx(maxX), toPy(minY));
    lCtx.lineTo(toPx(minX), toPy(minY));
    lCtx.closePath();
    const grad = lCtx.createLinearGradient(0, padY, 0, h - padY);
    grad.addColorStop(0, "rgba(56, 189, 248, 0.16)");
    grad.addColorStop(1, "rgba(56, 189, 248, 0.01)");
    lCtx.fillStyle = grad;
    lCtx.fill();

    lCtx.beginPath();
    for (let i = 0; i <= steps; i++) {
        const x = minX + (i / steps) * (maxX - minX);
        const y = Math.max(minY, Math.min(maxY, fn.eval(x)));
        const px = toPx(x);
        const py = toPy(y);
        if (i === 0) lCtx.moveTo(px, py);
        else lCtx.lineTo(px, py);
    }
    lCtx.strokeStyle = "#38bdf8";
    lCtx.lineWidth = 2.5;
    lCtx.stroke();

    const bestPx = toPx(state.bestX);
    const bestPy = toPy(state.bestE);
    lCtx.strokeStyle = "rgba(245, 158, 11, 0.5)";
    lCtx.setLineDash([3, 3]);
    lCtx.beginPath();
    lCtx.moveTo(bestPx, h - padY);
    lCtx.lineTo(bestPx, bestPy);
    lCtx.stroke();
    lCtx.setLineDash([]);
    lCtx.fillStyle = "#fbbf24";
    lCtx.beginPath();
    lCtx.arc(bestPx, bestPy, 6, 0, Math.PI * 2);
    lCtx.fill();
    lCtx.strokeStyle = "#ffffff";
    lCtx.lineWidth = 1.5;
    lCtx.stroke();
    lCtx.fillStyle = "#fbbf24";
    lCtx.font = "bold 10px sans-serif";
    lCtx.textAlign = "center";
    lCtx.fillText("Best", bestPx, Math.max(14, bestPy - 10));

    if (state.candX !== state.currX) {
        const candPx = toPx(state.candX);
        const candPy = toPy(state.candE);
        lCtx.strokeStyle = state.accepted ? "rgba(16, 185, 129, 0.6)" : "rgba(244, 63, 94, 0.6)";
        lCtx.setLineDash([2, 2]);
        lCtx.beginPath();
        lCtx.moveTo(toPx(state.currX), toPy(state.currE));
        lCtx.lineTo(candPx, candPy);
        lCtx.stroke();
        lCtx.setLineDash([]);
        lCtx.fillStyle = state.accepted ? "#10b981" : "#f43f5e";
        lCtx.beginPath();
        lCtx.arc(candPx, candPy, 4.5, 0, Math.PI * 2);
        lCtx.fill();
    }

    const currPx = toPx(state.currX);
    const currPy = toPy(state.currE);
    const tempStatus = getTempStatus(state.temp, params.t0);
    const glow = lCtx.createRadialGradient(currPx, currPy, 2, currPx, currPy, 18);
    glow.addColorStop(0, tempStatus.color);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    lCtx.fillStyle = glow;
    lCtx.beginPath();
    lCtx.arc(currPx, currPy, 18, 0, Math.PI * 2);
    lCtx.fill();

    lCtx.fillStyle = "#ffffff";
    lCtx.beginPath();
    lCtx.arc(currPx, currPy, 5.5, 0, Math.PI * 2);
    lCtx.fill();
    lCtx.strokeStyle = tempStatus.color;
    lCtx.lineWidth = 2.5;
    lCtx.stroke();

    lCtx.fillStyle = "#a1a1aa";
    lCtx.font = "9px monospace";
    lCtx.textAlign = "center";
    lCtx.fillText(minX.toFixed(1), padX, h - 8);
    lCtx.fillText(maxX.toFixed(1), w - padX, h - 8);
    lCtx.fillText(`x=${state.currX.toFixed(2)}`, currPx, Math.min(h - 18, currPy + 16));
}

function renderTelemetry(state, params) {
    const { w, h } = setupDpi(tCanvas, tCtx);
    tCtx.fillStyle = "#0c0d12";
    tCtx.fillRect(0, 0, w, h);

    const padLeft = 14;
    const padTop = 14;
    const splitX = Math.floor(w * 0.44);

    tCtx.fillStyle = "#a1a1aa";
    tCtx.font = "10px sans-serif";
    tCtx.textAlign = "left";
    tCtx.fillText("Probabilitas Metropolis (P):", padLeft, padTop + 2);

    const barW = splitX - padLeft - 18;
    const barH = 16;
    const barY = padTop + 10;
    tCtx.fillStyle = "#18181b";
    tCtx.fillRect(padLeft, barY, barW, barH);
    tCtx.strokeStyle = "#27272a";
    tCtx.strokeRect(padLeft, barY, barW, barH);

    const pFill = Math.max(0, Math.min(1, state.prob)) * barW;
    const pGrad = tCtx.createLinearGradient(padLeft, 0, padLeft + barW, 0);
    pGrad.addColorStop(0, "#06b6d4");
    pGrad.addColorStop(1, "#38bdf8");
    tCtx.fillStyle = pGrad;
    tCtx.fillRect(padLeft, barY, pFill, barH);

    const rollPx = padLeft + Math.max(0, Math.min(1, state.roll)) * barW;
    tCtx.fillStyle = state.accepted ? "#10b981" : "#f43f5e";
    tCtx.fillRect(rollPx - 2, barY - 2, 4, barH + 4);

    tCtx.fillStyle = "#ffffff";
    tCtx.font = "bold 9px monospace";
    tCtx.fillText(`P=${(state.prob * 100).toFixed(1)}%`, padLeft + 4, barY + 11);
    tCtx.fillStyle = "#e4e4e7";
    tCtx.fillText(`r=${state.roll.toFixed(3)}`, padLeft, barY + barH + 14);

    const badgeText = state.accepted ? "✓ DITERIMA" : "✗ DITOLAK";
    const badgeColor = state.accepted ? "#10b981" : "#f43f5e";
    tCtx.fillStyle = badgeColor;
    tCtx.font = "bold 10px sans-serif";
    tCtx.fillText(badgeText, padLeft + 72, barY + barH + 14);

    const thermY = barY + barH + 28;
    tCtx.fillStyle = "#a1a1aa";
    tCtx.font = "10px sans-serif";
    tCtx.fillText(`Suhu: ${state.temp.toFixed(2)}`, padLeft, thermY);
    const thermW = barW;
    const thermH = 8;
    const tRatio = params.t0 > 0 ? Math.max(0, Math.min(1, state.temp / params.t0)) : 0;
    tCtx.fillStyle = "#18181b";
    tCtx.fillRect(padLeft, thermY + 4, thermW, thermH);
    const tStatus = getTempStatus(state.temp, params.t0);
    tCtx.fillStyle = tStatus.color;
    tCtx.fillRect(padLeft, thermY + 4, thermW * tRatio, thermH);

    const chartX = splitX + 8;
    const chartY = padTop;
    const chartW = w - chartX - 14;
    const chartH = h - padTop - 20;

    tCtx.fillStyle = "#18181b";
    tCtx.fillRect(chartX, chartY, chartW, chartH);
    tCtx.strokeStyle = "#27272a";
    tCtx.strokeRect(chartX, chartY, chartW, chartH);

    tCtx.fillStyle = "#a1a1aa";
    tCtx.font = "9px sans-serif";
    tCtx.textAlign = "left";
    tCtx.fillText("Riwayat Energi", chartX + 4, chartY - 3);

    const hist = state.history || [];
    if (hist.length >= 2) {
        let minE = Infinity;
        let maxE = -Infinity;
        hist.forEach((pt) => {
            if (pt.currE < minE) minE = pt.currE;
            if (pt.currE > maxE) maxE = pt.currE;
            if (pt.bestE < minE) minE = pt.bestE;
            if (pt.bestE > maxE) maxE = pt.bestE;
        });
        if (maxE === minE) {
            maxE += 1;
            minE -= 1;
        }
        const toCx = (i) => chartX + (i / (hist.length - 1)) * chartW;
        const toCy = (e) => chartY + chartH - ((e - minE) / (maxE - minE)) * (chartH - 8) - 4;

        tCtx.beginPath();
        hist.forEach((pt, i) => {
            const cx = toCx(i);
            const cy = toCy(pt.currE);
            if (i === 0) tCtx.moveTo(cx, cy);
            else tCtx.lineTo(cx, cy);
        });
        tCtx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        tCtx.lineWidth = 1.5;
        tCtx.stroke();

        tCtx.beginPath();
        hist.forEach((pt, i) => {
            const cx = toCx(i);
            const cy = toCy(pt.bestE);
            if (i === 0) tCtx.moveTo(cx, cy);
            else tCtx.lineTo(cx, cy);
        });
        tCtx.strokeStyle = "#fbbf24";
        tCtx.lineWidth = 2;
        tCtx.stroke();

        tCtx.fillStyle = "#fbbf24";
        tCtx.font = "bold 9px monospace";
        tCtx.textAlign = "right";
        tCtx.fillText(`E*=${state.bestE.toFixed(3)}`, w - 16, chartY + 12);
    }
}
