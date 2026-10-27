function getCanvasContext() {
    const canvas = document.getElementById("math36-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual36() {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
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

export function drawVacMeter(bac, eac, vac) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(bac) || isNaN(eac) || isNaN(vac) || bac < 0 || eac < 0) return;

    let themeColor = "#38bdf8";
    let bgBadge = "rgba(56, 189, 248, 0.15)";
    let borderBadge = "#38bdf8";
    let statusText = "SESUAI ANGGARAN";
    let vacDisplay = "$0";
    let badgeText = "VARIANS: TEPAT ANGGARAN $0";

    if (vac < -0.001) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        const absVal = Math.abs(vac);
        statusText = "DEFISIT / OVER BUDGET";
        vacDisplay = `-${formatCurrency(absVal)}`;
        badgeText = `VARIANS: DEFISIT ANGGARAN -${formatCurrency(absVal)}`;
    } else if (vac > 0.001) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        statusText = "SURPLUS / UNDER BUDGET";
        vacDisplay = `+${formatCurrency(vac)}`;
        badgeText = `VARIANS: SURPLUS ANGGARAN +${formatCurrency(vac)}`;
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

    const maxBase = Math.max(bac, eac, 1);
    const fraction = Math.min(Math.abs(vac) / maxBase, 1);

    if (vac < -0.001 && fraction > 0.005) {
        const startA = 1.5 * Math.PI - fraction * 0.5 * Math.PI;
        const endA = 1.5 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, startA, endA, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = themeColor;
        ctx.lineCap = "butt";
        ctx.stroke();
    } else if (vac > 0.001 && fraction > 0.005) {
        const startA = 1.5 * Math.PI;
        const endA = 1.5 * Math.PI + fraction * 0.5 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, startA, endA, false);
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
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("0", cx, cy - outerR - 8);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("Defisit", cx - outerR, cy + 15);
    ctx.fillText("Surplus", cx + outerR, cy + 15);

    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = vacDisplay.length > 9 ? "bold 20px sans-serif" : "bold 24px sans-serif";
    ctx.fillText(vacDisplay, cx, cy - 14);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Variance at Completion (VAC)", cx, cy + 4);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(statusText, cx, cy + 34);

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
