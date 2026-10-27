function getCanvasContext() {
    const canvas = document.getElementById("math27-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual27() {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function roundRect(ctx, x, y, width, height, radius) {
    if (radius * 2 > width) radius = width / 2;
    if (radius * 2 > height) radius = height / 2;
    if (radius < 0) radius = 0;
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

function formatMax3(n) {
    return Number(n.toFixed(3)).toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

export function drawEvMeter(bac, actual, ev) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(bac) || isNaN(actual) || isNaN(ev) || bac < 0 || actual < 0) return;

    let themeColor = "#38bdf8";
    let bgBadge = "rgba(56, 189, 248, 0.15)";
    let borderBadge = "#38bdf8";

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

    const actualFraction = actual / 100;
    const clampedFraction = Math.min(Math.max(actualFraction, 0), 1);

    if (clampedFraction > 0.005) {
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI, Math.PI + clampedFraction * Math.PI, false);
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
    ctx.fillText("50%", cx, cy - outerR - 8);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("0%", cx - outerR, cy + 15);
    ctx.fillText("100%+", cx + outerR, cy + 15);

    const evDisplay = formatCurrency(ev);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = evDisplay.length > 9 ? "bold 20px sans-serif" : "bold 24px sans-serif";
    ctx.fillText(evDisplay, cx, cy - 14);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Earned Value (EV)", cx, cy + 4);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`Realisasi: ${formatMax3(actual)}% dari BAC`, cx, cy + 34);

    const barX = 24;
    const barW = W - 48;
    const barH = 12;

    const bacY = 202;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Budget at Completion (BAC)", barX, bacY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(formatCurrency(bac), barX + barW, bacY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, bacY, barW, barH, 6);
    ctx.fill();

    ctx.fillStyle = "#38bdf8";
    roundRect(ctx, barX, bacY, barW, barH, 6);
    ctx.fill();

    const evY = 250;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Earned Value (EV)", barX, evY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = themeColor;
    ctx.fillText(formatCurrency(ev), barX + barW, evY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, evY, barW, barH, 6);
    ctx.fill();

    const evFillW = Math.max(0, Math.min(actualFraction, 1)) * barW;
    if (evFillW > 0) {
        ctx.fillStyle = themeColor;
        roundRect(ctx, barX, evY, evFillW, barH, 6);
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

    const badgeText = `EARNED VALUE: ${formatCurrency(ev)} (${formatMax3(actual)}% HASIL KERJA)`;
    ctx.textAlign = "center";
    let fSize = 12;
    ctx.font = `bold ${fSize}px sans-serif`;
    while (ctx.measureText(badgeText).width > badgeW - 24 && fSize > 8) {
        fSize -= 0.5;
        ctx.font = `bold ${fSize}px sans-serif`;
    }
    ctx.fillStyle = themeColor;
    ctx.fillText(badgeText, cx, badgeY + 23);
}
