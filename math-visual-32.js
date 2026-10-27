function getCanvasContext() {
    const canvas = document.getElementById("math32-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual32() {
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
    return "$" + Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function drawEacMeter(bac, cpi, eac) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(bac) || isNaN(cpi) || isNaN(eac) || bac < 0 || cpi <= 0) return;

    let themeColor = "#38bdf8";
    let bgBadge = "rgba(56, 189, 248, 0.15)";
    let borderBadge = "#38bdf8";
    let statusText = "ON BUDGET";
    let badgeText = "BIAYA AKHIR: ON BUDGET (SESUAI BAC)";

    const cpiFormatted = Number(cpi.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    if (eac > bac + 0.01) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        statusText = "OVER BUDGET";
        badgeText = `BIAYA AKHIR: OVER BUDGET (+${formatCurrency(eac - bac)})`;
    } else if (eac < bac - 0.01) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        statusText = "UNDER BUDGET";
        badgeText = `BIAYA AKHIR: UNDER BUDGET (-${formatCurrency(bac - eac)})`;
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

    const ratio = bac > 0 ? eac / bac : 1;
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

    const targetAngle = 1.5 * Math.PI;
    const mx1 = cx + (innerR - 6) * Math.cos(targetAngle);
    const my1 = cy + (innerR - 6) * Math.sin(targetAngle);
    const mx2 = cx + (outerR + 6) * Math.cos(targetAngle);
    const my2 = cy + (outerR + 6) * Math.sin(targetAngle);
    ctx.beginPath();
    ctx.moveTo(mx1, my1);
    ctx.lineTo(mx2, my2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("100% BAC", cx, cy - outerR - 8);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("0%", cx - outerR, cy + 15);
    ctx.fillText("200%+", cx + outerR, cy + 15);

    const eacDisplay = formatCurrency(eac);
    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = eacDisplay.length > 9 ? "bold 20px sans-serif" : "bold 24px sans-serif";
    ctx.fillText(eacDisplay, cx, cy - 14);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Estimate at Completion (EAC)", cx, cy + 4);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`CPI: ${cpiFormatted} • ${statusText}`, cx, cy + 34);

    const barX = 24;
    const barW = W - 48;
    const barH = 12;
    const maxBase = Math.max(bac, eac, 1);

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

    const bacFillW = (bac / maxBase) * barW;
    if (bacFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, bacY, Math.min(bacFillW, barW), barH, 6);
        ctx.fill();
    }

    const eacY = 250;
    const eacColor = eac > bac ? "#f87171" : "#4ade80";
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Estimate at Completion (EAC)", barX, eacY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = eacColor;
    ctx.fillText(formatCurrency(eac), barX + barW, eacY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, eacY, barW, barH, 6);
    ctx.fill();

    const eacFillW = (eac / maxBase) * barW;
    if (eacFillW > 0) {
        ctx.fillStyle = eacColor;
        roundRect(ctx, barX, eacY, Math.min(eacFillW, barW), barH, 6);
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
    while (ctx.measureText(badgeText).width > badgeW - 24 && fSize > 8) {
        fSize -= 0.5;
        ctx.font = `bold ${fSize}px sans-serif`;
    }
    ctx.fillStyle = themeColor;
    ctx.fillText(badgeText, cx, badgeY + 23);
}
