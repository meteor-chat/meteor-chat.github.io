export function renderLossCanvas(canvas, history) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, w, h);

    if (!history || history.length === 0) {
        ctx.fillStyle = "#64748b";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Kurva konvergensi MSE akan muncul saat pelatihan", w / 2, h / 2);
        return;
    }

    const padLeft = 46;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 26;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    let maxLoss = -Infinity;
    let minLoss = Infinity;

    for (let i = 0; i < history.length; i++) {
        const val = history[i];
        if (val > maxLoss) maxLoss = val;
        if (val < minLoss) minLoss = val;
    }

    if (maxLoss === minLoss) {
        maxLoss += 1;
        minLoss = Math.max(0, minLoss - 1);
    }

    const lossRange = maxLoss - minLoss;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, h - padBottom);
    ctx.lineTo(w - padRight, h - padBottom);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(maxLoss.toFixed(1), padLeft - 6, padTop);
    ctx.fillText(minLoss.toFixed(1), padLeft - 6, h - padBottom);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("0", padLeft, h - padBottom + 6);
    ctx.fillText(`${history.length}`, w - padRight, h - padBottom + 6);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < history.length; i++) {
        const px = padLeft + (i / Math.max(1, history.length - 1)) * plotW;
        const py = padTop + plotH - ((history[i] - minLoss) / lossRange) * plotH;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();

    const lastLoss = history[history.length - 1];
    ctx.fillStyle = "#38bdf8";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`MSE Saat Ini: ${lastLoss.toFixed(2)}`, w - padRight, 6);
}
