import { formatMax3 } from "./math-format.js";

function getCanvasContext() {
    const canvas = document.getElementById("math25-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual25() {
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

export function drawPerformanceMeter(actual, planned, rpPercent, ratio, devPercent, status) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(actual) || isNaN(planned) || isNaN(rpPercent) || planned <= 0) return;

    let themeColor = "#4ade80";
    let bgBadge = "rgba(74, 222, 128, 0.15)";
    let borderBadge = "#4ade80";
    let statusText = `AHEAD OF SCHEDULE (+${formatMax3(devPercent)}%)`;

    if (status === "on-track") {
        themeColor = "#38bdf8";
        bgBadge = "rgba(56, 189, 248, 0.15)";
        borderBadge = "#38bdf8";
        statusText = "ON SCHEDULE (100%)";
    } else if (status === "behind") {
        if (rpPercent >= 85) {
            themeColor = "#f59e0b";
            bgBadge = "rgba(245, 158, 11, 0.15)";
            borderBadge = "#f59e0b";
        } else {
            themeColor = "#f87171";
            bgBadge = "rgba(248, 113, 113, 0.15)";
            borderBadge = "#f87171";
        }
        statusText = `BEHIND SCHEDULE (${formatMax3(devPercent)}%)`;
    }

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

    const gaugeFraction = Math.max(0, Math.min(rpPercent / 200, 1));
    const currentAngle = Math.PI + gaugeFraction * Math.PI;

    if (gaugeFraction > 0.005) {
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI, currentAngle, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = themeColor;
        ctx.lineCap = "round";
        ctx.stroke();
    }

    const markAngle = 1.5 * Math.PI;
    const mx1 = cx + (innerR - 6) * Math.cos(markAngle);
    const my1 = cy + (innerR - 6) * Math.sin(markAngle);
    const mx2 = cx + (outerR + 6) * Math.cos(markAngle);
    const my2 = cy + (outerR + 6) * Math.sin(markAngle);
    ctx.beginPath();
    ctx.moveTo(mx1, my1);
    ctx.lineTo(mx2, my2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("100%", cx, cy - outerR - 10);
    ctx.fillText("0%", cx - outerR, cy + 18);
    ctx.fillText("200%+", cx + outerR, cy + 18);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(`${formatMax3(rpPercent)}%`, cx, cy - 15);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Rate of Performance", cx, cy + 6);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`Nilai Rasio = ${formatMax3(ratio)}`, cx, cy + 24);

    const barX = 30;
    const barW = W - 60;
    const barH = 14;

    const plannedY = 205;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Planned Work Completed", barX, plannedY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`${formatMax3(planned)}%`, barX + barW, plannedY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, plannedY, barW, barH, 7);
    ctx.fill();

    const plannedFillW = Math.max(0, Math.min(planned / 100, 1)) * barW;
    if (plannedFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, plannedY, plannedFillW, barH, 7);
        ctx.fill();
    }

    const actualY = 252;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Actual Work Completed", barX, actualY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = themeColor;
    ctx.fillText(`${formatMax3(actual)}%`, barX + barW, actualY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, actualY, barW, barH, 7);
    ctx.fill();

    const actualFillW = Math.max(0, Math.min(actual / 100, 1)) * barW;
    if (actualFillW > 0) {
        ctx.fillStyle = themeColor;
        roundRect(ctx, barX, actualY, actualFillW, barH, 7);
        ctx.fill();
    }

    const badgeY = 300;
    const badgeH = 34;
    const badgeW = barW;
    roundRect(ctx, barX, badgeY, badgeW, badgeH, 8);
    ctx.fillStyle = bgBadge;
    ctx.fill();
    ctx.strokeStyle = borderBadge;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(statusText, cx, badgeY + 22);
}
