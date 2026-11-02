export function drawNpvCanvas(canvas, data) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, w, h);

    const { initial, periods, npv, paybackYear } = data;
    const n = periods.length;
    if (n === 0) return;

    const pad = { top: 28, right: 20, bottom: 38, left: 54 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const allValues = [-initial];
    let cum = -initial;
    const cumPoints = [{ t: 0, val: cum }];

    for (let i = 0; i < n; i++) {
        const discNet = periods[i].discountedNet;
        allValues.push(discNet);
        cum += discNet;
        cumPoints.push({ t: i + 1, val: cum });
        allValues.push(cum);
    }

    let minVal = Math.min(0, ...allValues);
    let maxVal = Math.max(0, ...allValues);
    const range = (maxVal - minVal) * 1.15 || 1;
    minVal -= (maxVal - minVal) * 0.08;
    maxVal += (maxVal - minVal) * 0.08;

    function getY(val) {
        return pad.top + plotH * (1 - (val - minVal) / range);
    }

    function getX(t) {
        return pad.left + (t / n) * plotW;
    }

    const yZero = getY(0);

    ctx.strokeStyle = "#131b2e";
    ctx.lineWidth = 1;
    for (let step = 0; step <= 4; step++) {
        const yVal = minVal + (range / 4) * step;
        const yPx = getY(yVal);
        ctx.beginPath();
        ctx.moveTo(pad.left, yPx);
        ctx.lineTo(w - pad.right, yPx);
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "10px Roboto Mono, monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const fmt = Math.abs(yVal) >= 1000 ? `${(yVal / 1000).toFixed(0)}k` : yVal.toFixed(0);
        ctx.fillText(fmt, pad.left - 6, yPx);
    }

    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, yZero);
    ctx.lineTo(w - pad.right, yZero);
    ctx.stroke();
    ctx.setLineDash([]);

    const barW = Math.min(28, (plotW / (n + 1)) * 0.5);

    const x0 = getX(0) + barW * 0.5;
    const yInit = getY(-initial);
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(x0 - barW / 2, yZero, barW, yInit - yZero);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Google Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Thn 0", x0, h - pad.bottom + 14);

    for (let i = 0; i < n; i++) {
        const t = i + 1;
        const xPos = getX(t);
        const p = periods[i];
        const yNom = getY(p.net);
        const yDisc = getY(p.discountedNet);

        ctx.strokeStyle = "rgba(74, 222, 128, 0.25)";
        ctx.lineWidth = 1;
        ctx.strokeRect(xPos - barW / 2, yZero, barW, yNom - yZero);

        ctx.fillStyle = p.discountedNet >= 0 ? "rgba(34, 197, 94, 0.75)" : "rgba(244, 63, 94, 0.75)";
        ctx.fillRect(xPos - barW / 2, yZero, barW, yDisc - yZero);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px Google Sans, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Thn ${t}`, xPos, h - pad.bottom + 14);
    }

    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < cumPoints.length; i++) {
        const pt = cumPoints[i];
        const px = i === 0 ? x0 : getX(pt.t);
        const py = getY(pt.val);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    for (let i = 0; i < cumPoints.length; i++) {
        const pt = cumPoints[i];
        const px = i === 0 ? x0 : getX(pt.t);
        const py = getY(pt.val);
        ctx.fillStyle = pt.val >= 0 ? "#4ade80" : "#f43f5e";
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    const lastPt = cumPoints[cumPoints.length - 1];
    const lastX = getX(lastPt.t);
    const lastY = getY(lastPt.val);
    ctx.fillStyle = npv >= 0 ? "#4ade80" : "#f43f5e";
    ctx.font = "bold 11px Roboto Mono, monospace";
    ctx.textAlign = "right";
    const npvLabel = `NPV: ${npv >= 0 ? "+" : ""}${Math.round(npv).toLocaleString("id-ID")}`;
    ctx.fillText(npvLabel, Math.min(w - pad.right, lastX), Math.max(pad.top + 8, lastY - 8));

    if (paybackYear !== null && paybackYear > 0 && paybackYear <= n) {
        ctx.fillStyle = "#facc15";
        ctx.font = "10px Google Sans, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Titik Impas (Payback): Thn ${paybackYear.toFixed(1)}`, pad.left, pad.top - 10);
    }
}

export function clearVisual37(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
