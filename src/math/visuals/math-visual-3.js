import { formatMax3 } from "../math-format.js";

function formatFit(val) {
    if (!isFinite(val)) return String(val);
    const parsed = parseFloat(val.toFixed(4));
    return Object.is(parsed, -0) || parsed === 0 ? "0" : parsed.toString();
}

export function drawFitnessLandscape(h, a) {
    const canvas = document.getElementById("math3-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (isNaN(h) || isNaN(a)) return;

    const asymptote = -a;
    const spanH = Math.max(Math.abs(h - asymptote) * 1.8, 6);
    const minH = asymptote - spanH;
    const maxH = asymptote + spanH;

    const currDenom = h + a;
    const currFit = Math.abs(currDenom) > 1e-12 ? 1 / currDenom : 10;
    const maxFitMag = Math.max(Math.abs(currFit) * 1.6, 2.5);
    const minF = -maxFitMag * 0.3;
    const maxF = maxFitMag;

    const toPx = (valH) => ((valH - minH) / (maxH - minH)) * W;
    const toPy = (valF) => H - ((valF - minF) / (maxF - minF)) * H;

    ctx.fillStyle = "#0c0f17";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    const gridStepH = spanH / 3;
    for (let gh = minH; gh <= maxH; gh += gridStepH) {
        const x = toPx(gh);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }

    const originX = toPx(0);
    const originY = toPy(0);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    if (originY >= 0 && originY <= H) {
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(W, originY);
        ctx.stroke();
    }
    if (originX >= 0 && originX <= W) {
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, H);
        ctx.stroke();
    }

    const asympX = toPx(asymptote);
    if (asympX >= 0 && asympX <= W) {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
        ctx.lineWidth = 1.2;
        if (ctx.setLineDash) ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(asympX, 0);
        ctx.lineTo(asympX, H);
        ctx.stroke();
        if (ctx.setLineDash) ctx.setLineDash([]);

        ctx.fillStyle = "#ef4444";
        ctx.font = "10px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`h = -a`, asympX, H - 8);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "11px 'Roboto Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText("h", W - 8, Math.min(Math.max(originY - 6, 16), H - 6));
    ctx.textAlign = "left";
    ctx.fillText("F", Math.min(Math.max(originX + 8, 8), W - 20), 16);

    const steps = 180;
    const branches = [
        { start: minH, end: asymptote - 0.08 },
        { start: asymptote + 0.08, end: maxH }
    ];

    branches.forEach((b) => {
        if (b.end <= b.start) return;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= steps; i++) {
            const valH = b.start + (b.end - b.start) * (i / steps);
            const valF = 1 / (valH + a);
            const px = toPx(valH);
            const py = toPy(valF);
            if (py >= -H && py <= H * 2) {
                if (!started) {
                    ctx.moveTo(px, py);
                    started = true;
                } else {
                    ctx.lineTo(px, py);
                }
            } else {
                started = false;
            }
        }
        ctx.strokeStyle = b.start > asymptote ? "#38bdf8" : "#94a3b8";
        ctx.lineWidth = 2.2;
        ctx.stroke();
    });

    if (Math.abs(currDenom) > 1e-12) {
        const ptX = toPx(h);
        const ptY = toPy(currFit);

        ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
        ctx.lineWidth = 1;
        if (ctx.setLineDash) ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ptX, Math.min(Math.max(originY, 0), H));
        ctx.lineTo(ptX, ptY);
        ctx.lineTo(Math.min(Math.max(originX, 0), W), ptY);
        ctx.stroke();
        if (ctx.setLineDash) ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(ptX, ptY, 13, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(251, 191, 36, 0.22)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ptX, ptY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        const badgeText = `h: ${formatMax3(h)} ➔ F ≈ ${formatFit(currFit)}`;
        ctx.font = "11px 'Roboto Mono', monospace";
        const textW = ctx.measureText ? ctx.measureText(badgeText).width : 120;
        let bx = Math.min(Math.max(ptX - textW / 2, 8), W - textW - 12);
        let by = ptY - 22;
        if (by < 22) by = ptY + 28;

        ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
        ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(bx - 4, by - 14, textW + 8, 20, 4);
        } else {
            ctx.rect(bx - 4, by - 14, textW + 8, 20);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fde68a";
        ctx.textAlign = "left";
        ctx.fillText(badgeText, bx, by);
    }
}

export function clearFitnessLandscape() {
    const canvas = document.getElementById("math3-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
