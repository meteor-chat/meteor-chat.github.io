function getCanvasContext() {
    const canvas = document.getElementById("math29-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual29() {
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

export function drawCvMeter(ev, ac, cv) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(ev) || isNaN(ac) || isNaN(cv) || ev < 0 || ac < 0) return;

    let themeColor = "#38bdf8";
    let bgBadge = "rgba(56, 189, 248, 0.15)";
    let borderBadge = "#38bdf8";
    let statusText = "ON BUDGET";
    let cvDisplay = "$0";

    if (cv < 0) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        const absVal = Math.abs(cv);
        statusText = "OVER BUDGET";
        cvDisplay = `-${formatCurrency(absVal)}`;
    } else if (cv > 0) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        statusText = "UNDER BUDGET";
        cvDisplay = `+${formatCurrency(cv)}`;
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

    const maxBase = Math.max(ev, ac, 1);
    const fraction = Math.min(Math.abs(cv) / maxBase, 1);

    if (cv < 0 && fraction > 0.005) {
        const startA = 1.5 * Math.PI - fraction * 0.5 * Math.PI;
        const endA = 1.5 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, startA, endA, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = themeColor;
        ctx.lineCap = "butt";
        ctx.stroke();
    } else if (cv > 0 && fraction > 0.005) {
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
    ctx.fillText("0", cx, cy - outerR - 10);
    ctx.fillText("Over Budget", cx - outerR, cy + 18);
    ctx.fillText("Under Budget", cx + outerR, cy + 18);

    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(cvDisplay, cx, cy - 15);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Cost Variance (CV)", cx, cy + 6);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(statusText, cx, cy + 24);

    const barX = 30;
    const barW = W - 60;
    const barH = 14;

    const evY = 205;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Earned Value (EV)", barX, evY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(formatCurrency(ev), barX + barW, evY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, evY, barW, barH, 7);
    ctx.fill();

    const evFillW = (ev / maxBase) * barW;
    if (evFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, evY, Math.min(evFillW, barW), barH, 7);
        ctx.fill();
    }

    const acY = 252;
    const acColor = ac > ev ? "#f87171" : "#4ade80";
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Actual Cost (AC)", barX, acY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = acColor;
    ctx.fillText(formatCurrency(ac), barX + barW, acY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, acY, barW, barH, 7);
    ctx.fill();

    const acFillW = (ac / maxBase) * barW;
    if (acFillW > 0) {
        ctx.fillStyle = acColor;
        roundRect(ctx, barX, acY, Math.min(acFillW, barW), barH, 7);
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
    if (cv < 0) {
        ctx.fillText(`VARIANS BIAYA: -${formatCurrency(Math.abs(cv))} (OVER BUDGET)`, cx, badgeY + 22);
    } else if (cv > 0) {
        ctx.fillText(`VARIANS BIAYA: +${formatCurrency(cv)} (UNDER BUDGET)`, cx, badgeY + 22);
    } else {
        ctx.fillText("VARIANS BIAYA: $0 (SESUAI ANGGARAN)", cx, badgeY + 22);
    }
}
