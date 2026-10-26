import { formatMax3 } from "./math-format.js";

function getCanvasContext() {
    const canvas = document.getElementById("math28-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual28() {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function formatCurrency(n) {
    return "$" + Number(n).toLocaleString("id-ID");
}

export function drawAcMeter(direct, indirect, ac, directRatio, indirectRatio) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(direct) || isNaN(indirect) || isNaN(ac) || direct < 0 || indirect < 0 || ac <= 0) return;

    const directColor = "#38bdf8";
    const indirectColor = "#a855f7";

    const cx = W / 2;
    const cy = 120;
    const outerR = 85;
    const innerR = 67;

    ctx.beginPath();
    ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = outerR - innerR;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineCap = "round";
    ctx.stroke();

    const dFrac = Math.max(0, Math.min(directRatio, 1));
    const iFrac = Math.max(0, Math.min(indirectRatio, 1));

    const splitAngle = Math.PI + dFrac * Math.PI;

    if (dFrac > 0.005) {
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI, splitAngle, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = directColor;
        ctx.lineCap = iFrac > 0.005 ? "butt" : "round";
        ctx.stroke();
    }

    if (iFrac > 0.005) {
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, splitAngle, 2 * Math.PI, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = indirectColor;
        ctx.lineCap = dFrac > 0.005 ? "butt" : "round";
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Direct / Indirect Ratio", cx, cy - outerR - 10);
    ctx.fillText("0%", cx - outerR, cy + 18);
    ctx.fillText("100%", cx + outerR, cy + 18);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(formatCurrency(ac), cx, cy - 15);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Actual Cost (ACWP)", cx, cy + 6);

    ctx.font = "11px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(`${Math.round(directRatio * 100)}% Direct | ${Math.round(indirectRatio * 100)}% Indirect`, cx, cy + 24);

    const barX = 30;
    const barW = W - 60;
    const barH = 14;

    const directY = 205;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Biaya Langsung (Direct Cost)", barX, directY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = directColor;
    ctx.fillText(`${formatCurrency(direct)} (${formatMax3(directRatio * 100)}%)`, barX + barW, directY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, directY, barW, barH, 7);
    ctx.fill();

    const directFillW = dFrac * barW;
    if (directFillW > 0) {
        ctx.fillStyle = directColor;
        roundRect(ctx, barX, directY, directFillW, barH, 7);
        ctx.fill();
    }

    const indirectY = 252;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Biaya Tidak Langsung (Indirect Cost)", barX, indirectY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = indirectColor;
    ctx.fillText(`${formatCurrency(indirect)} (${formatMax3(indirectRatio * 100)}%)`, barX + barW, indirectY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, indirectY, barW, barH, 7);
    ctx.fill();

    const indirectFillW = iFrac * barW;
    if (indirectFillW > 0) {
        ctx.fillStyle = indirectColor;
        roundRect(ctx, barX, indirectY, indirectFillW, barH, 7);
        ctx.fill();
    }

    const badgeY = 300;
    const badgeH = 34;
    const badgeW = barW;
    roundRect(ctx, barX, badgeY, badgeW, badgeH, 8);
    ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`TOTAL ACTUAL COST: ${formatCurrency(ac)} (ACWP)`, cx, badgeY + 22);
}
