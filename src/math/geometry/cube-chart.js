import { formatMax3 } from "../math-format.js";

export function drawCubeScalingChart(currentS) {
    const canvas = document.getElementById("cube-chart-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#0c0d12";
    ctx.fillRect(0, 0, W, H);

    const padLeft = 56;
    const padRight = 24;
    const padTop = 28;
    const padBottom = 34;

    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBottom;

    const sMax = Math.max(Math.min(Math.max(currentS * 1.3, 10), 20), 12);
    const yMax = Math.max(Math.pow(sMax, 3), 6 * Math.pow(sMax, 2), 500);

    const toPx = (s) => padLeft + (s / sMax) * plotW;
    const toPy = (y) => padTop + plotH - (y / yMax) * plotH;

    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const yVal = (i / 4) * yMax;
        const py = toPy(yVal);
        ctx.beginPath();
        ctx.moveTo(padLeft, py);
        ctx.lineTo(padLeft + plotW, py);
        ctx.stroke();

        ctx.fillStyle = "#71717a";
        ctx.font = "9px monospace";
        ctx.textAlign = "right";
        ctx.fillText(Math.round(yVal).toLocaleString(), padLeft - 6, py + 3);
    }

    for (let s = 2; s <= sMax; s += 2) {
        const px = toPx(s);
        ctx.beginPath();
        ctx.moveTo(px, padTop);
        ctx.lineTo(px, padTop + plotH);
        ctx.stroke();

        ctx.fillStyle = "#71717a";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(s), px, padTop + plotH + 16);
    }

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Panjang Rusuk (s)", padLeft + plotW / 2, H - 6);

    ctx.save();
    ctx.translate(14, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Besaran Nilai", 0, 0);
    ctx.restore();

    const steps = 60;
    const drawCurve = (color, lw, fn) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const s = (i / steps) * sMax;
            const y = fn(s);
            const px = toPx(s);
            const py = toPy(y);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    };

    drawCurve("#10b981", 1.8, (s) => 12 * s);
    drawCurve("#f59e0b", 2.2, (s) => 6 * Math.pow(s, 2));
    drawCurve("#38bdf8", 2.5, (s) => Math.pow(s, 3));

    if (sMax >= 6) {
        const crossPx = toPx(6);
        const crossPy = toPy(216);
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(crossPx, crossPy, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fda4af";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText("Titik Silang (s=6, Lp=V=216)", crossPx + 8, crossPy - 4);
    }

    if (currentS > 0 && currentS <= sMax) {
        const curPx = toPx(currentS);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(curPx, padTop);
        ctx.lineTo(curPx, padTop + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        const curV = Math.pow(currentS, 3);
        const curLp = 6 * Math.pow(currentS, 2);
        const curPr = 12 * currentS;

        [
            { y: curV, color: "#38bdf8" },
            { y: curLp, color: "#f59e0b" },
            { y: curPr, color: "#10b981" }
        ].forEach((pt) => {
            const py = toPy(pt.y);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(curPx, py, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`s=${formatMax3(currentS)}`, curPx, padTop - 8);
    }

    const legX = padLeft + 12;
    const legY = padTop + 14;
    const legendItems = [
        { label: "V = s³ (Volume)", color: "#38bdf8" },
        { label: "Lp = 6s² (Luas)", color: "#f59e0b" },
        { label: "Pr = 12s (Rusuk)", color: "#10b981" }
    ];

    legendItems.forEach((item, idx) => {
        const lx = legX + idx * 115;
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, legY, 12, 4);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(item.label, lx + 16, legY + 5);
    });
}
