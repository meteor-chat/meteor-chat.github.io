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

export function drawAcMeter(direct, indirect, ac) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(direct) || isNaN(indirect) || isNaN(ac) || direct < 0 || indirect < 0) return;

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

    const directRatio = ac > 0 ? direct / ac : 0.5;

    if (directRatio > 0.005) {
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI, Math.PI + directRatio * Math.PI, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = "#38bdf8";
        ctx.lineCap = "butt";
        ctx.stroke();
    }

    if (directRatio < 0.995) {
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI + directRatio * Math.PI, 2 * Math.PI, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = "#a855f7";
        ctx.lineCap = "butt";
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Direct / Indirect Ratio", cx, cy - outerR - 8);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("0%", cx - outerR, cy + 15);
    ctx.fillText("100%", cx + outerR, cy + 15);

    const acDisplay = formatCurrency(ac);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = acDisplay.length > 9 ? "bold 20px sans-serif" : "bold 24px sans-serif";
    ctx.fillText(acDisplay, cx, cy - 14);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Actual Cost (ACWP)", cx, cy + 4);

    const dirPct = Math.round(directRatio * 100);
    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`${dirPct}% Langsung • ${100 - dirPct}% Tdk Langsung`, cx, cy + 34);

    const barX = 24;
    const barW = W - 48;
    const barH = 12;

    const directY = 202;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Biaya Langsung (Direct Cost)", barX, directY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`${formatCurrency(direct)} (${dirPct}%)`, barX + barW, directY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, directY, barW, barH, 6);
    ctx.fill();

    const directFillW = directRatio * barW;
    if (directFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, directY, directFillW, barH, 6);
        ctx.fill();
    }

    const indirectY = 250;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Biaya Tidak Langsung (Indirect Cost)", barX, indirectY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = "#a855f7";
    ctx.fillText(`${formatCurrency(indirect)} (${100 - dirPct}%)`, barX + barW, indirectY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, indirectY, barW, barH, 6);
    ctx.fill();

    const indirectFillW = (1 - directRatio) * barW;
    if (indirectFillW > 0) {
        ctx.fillStyle = "#a855f7";
        roundRect(ctx, barX, indirectY, indirectFillW, barH, 6);
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

    const badgeText = `TOTAL ACTUAL COST: ${formatCurrency(ac)}`;
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
