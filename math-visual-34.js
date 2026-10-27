function getCanvasContext() {
    const canvas = document.getElementById("math34-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual34() {
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

export function drawEtcCostMeter(eac, ac, etc) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(eac) || isNaN(ac) || isNaN(etc) || eac < 0 || ac < 0) return;

    let themeColor = "#38bdf8";
    let bgBadge = "rgba(56, 189, 248, 0.15)";
    let borderBadge = "#38bdf8";
    let badgeText = `SISA BIAYA (ETC): ${formatCurrency(etc)}`;

    if (etc < -0.01) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        badgeText = "PERINGATAN: BIAYA MELEBIHI ESTIMASI TOTAL";
    } else if (etc > 0.01) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        badgeText = `SISA BIAYA (ETC): ${formatCurrency(etc)}`;
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

    const spentRatio = eac > 0 ? Math.min(Math.max(ac / eac, 0), 1) : 0;
    const remainRatio = eac > 0 ? Math.min(Math.max(etc / eac, 0), 1) : 0;

    if (remainRatio > 0.005) {
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI, Math.PI + remainRatio * Math.PI, false);
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
    ctx.fillText("50%", cx, cy - outerR - 8);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("0%", cx - outerR, cy + 15);
    ctx.fillText("100%", cx + outerR, cy + 15);

    const etcDisplay = formatCurrency(etc);
    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = etcDisplay.length > 9 ? "bold 20px sans-serif" : "bold 24px sans-serif";
    ctx.fillText(etcDisplay, cx, cy - 14);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Estimate to Complete (ETC)", cx, cy + 4);

    const spentPct = eac > 0 ? (ac / eac) * 100 : 0;
    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`Terpakai: ${spentPct.toFixed(1)}% dari EAC`, cx, cy + 34);

    const barX = 24;
    const barW = W - 48;
    const barH = 12;
    const maxBase = Math.max(eac, ac + Math.max(etc, 0), 1);

    const acY = 202;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Actual Cost (Biaya Terpakai)", barX, acY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(formatCurrency(ac), barX + barW, acY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, acY, barW, barH, 6);
    ctx.fill();

    const acFillW = (ac / maxBase) * barW;
    if (acFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, acY, Math.min(acFillW, barW), barH, 6);
        ctx.fill();
    }

    const etcY = 250;
    const etcColor = etc >= 0 ? "#4ade80" : "#f87171";
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Estimate to Complete (Sisa Biaya)", barX, etcY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = etcColor;
    ctx.fillText(formatCurrency(etc), barX + barW, etcY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, etcY, barW, barH, 6);
    ctx.fill();

    const etcFillW = Math.max(etc, 0) / maxBase * barW;
    if (etcFillW > 0) {
        ctx.fillStyle = etcColor;
        roundRect(ctx, barX, etcY, Math.min(etcFillW, barW), barH, 6);
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
