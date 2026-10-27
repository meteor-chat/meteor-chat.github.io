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

function formatMax3(n) {
    return Number(n.toFixed(3)).toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

export function drawRpMeter(actual, planned, rpPercent) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(actual) || isNaN(planned) || isNaN(rpPercent) || actual < 0 || planned <= 0) return;

    let themeColor = "#38bdf8";
    let bgBadge = "rgba(56, 189, 248, 0.15)";
    let borderBadge = "#38bdf8";
    let statusText = "KINERJA SESUAI TARGET";

    if (rpPercent >= 100) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        statusText = "KINERJA BAIK: PROGRES MELEBIHI / SESUAI RENCANA";
    } else {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        statusText = "KINERJA RENDAH: PROGRES DI BAWAH TARGET";
    }

    const cx = W / 2;
    const cy = 115;
    const outerR = 80;
    const innerR = 64;

    ctx.beginPath();
    ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = outerR - innerR;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineCap = "round";
    ctx.stroke();

    const ratio = planned > 0 ? actual / planned : 0;
    const clampedRatio = Math.min(Math.max(ratio, 0), 2);
    const fraction = clampedRatio / 2;

    if (fraction > 0.005) {
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI, Math.PI + fraction * Math.PI, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = themeColor;
        ctx.lineCap = "butt";
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
    ctx.fillText("100%", cx, cy - outerR - 8);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("0%", cx - outerR, cy + 15);
    ctx.fillText("200%+", cx + outerR, cy + 15);

    const rpDisplay = `${formatMax3(rpPercent)}%`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = rpDisplay.length > 8 ? "bold 20px sans-serif" : "bold 24px sans-serif";
    ctx.fillText(rpDisplay, cx, cy - 14);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Rate of Performance", cx, cy + 4);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`Nilai Rasio = ${formatMax3(ratio)}`, cx, cy + 34);

    const barX = 24;
    const barW = W - 48;
    const barH = 12;

    const plannedY = 202;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Planned Work Completed", barX, plannedY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`${formatMax3(planned)}%`, barX + barW, plannedY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, plannedY, barW, barH, 6);
    ctx.fill();

    const plannedFillW = Math.max(0, Math.min(planned / 100, 1)) * barW;
    if (plannedFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, plannedY, plannedFillW, barH, 6);
        ctx.fill();
    }

    const actualY = 250;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Actual Work Completed", barX, actualY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = themeColor;
    ctx.fillText(`${formatMax3(actual)}%`, barX + barW, actualY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, actualY, barW, barH, 6);
    ctx.fill();

    const actualFillW = Math.max(0, Math.min(actual / 100, 1)) * barW;
    if (actualFillW > 0) {
        ctx.fillStyle = themeColor;
        roundRect(ctx, barX, actualY, actualFillW, barH, 6);
        ctx.fill();
    }

    const badgeY = 296;
    const badgeH = 36;
    const badgeW = barW;
    roundRect(ctx, barX, badgeY, badgeW, badgeH, 10);
    ctx.fillStyle = bgBadge;
    ctx.fill();
    ctx.strokeStyle = borderBadge;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = "center";
    let fSize = 12;
    ctx.font = `bold ${fSize}px sans-serif`;
    while (ctx.measureText(statusText).width > badgeW - 24 && fSize > 8) {
        fSize -= 0.5;
        ctx.font = `bold ${fSize}px sans-serif`;
    }
    ctx.fillStyle = themeColor;
    ctx.fillText(statusText, cx, badgeY + 23);
}
