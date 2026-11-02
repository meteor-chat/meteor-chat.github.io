function getCanvasContext() {
    const canvas = document.getElementById("math37-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual37() {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function formatCurrency(n) {
    return "$" + Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

export function drawNpvMeter(c0, ct, r, pv, npv) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(c0) || isNaN(r) || isNaN(pv) || isNaN(npv)) return;

    let themeColor = "#f59e0b";
    let bgBadge = "rgba(245, 158, 11, 0.15)";
    let borderBadge = "#f59e0b";
    let statusText = "NETRAL (IMPAS)";
    let npvDisplay = "$0";
    let badgeText = "KEPUTUSAN: NETRAL (NPV = 0)";

    if (npv > 0.005) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        statusText = "DITERIMA (ADD VALUE)";
        npvDisplay = `+${formatCurrency(npv)}`;
        badgeText = "KEPUTUSAN: DITERIMA (MENAMBAH NILAI PERUSAHAAN)";
    } else if (npv < -0.005) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        statusText = "DITOLAK (SUBTRACT VALUE)";
        npvDisplay = `-${formatCurrency(Math.abs(npv))}`;
        badgeText = "KEPUTUSAN: DITOLAK (MENGURANGI NILAI PERUSAHAAN)";
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

    const maxBase = Math.max(c0, pv, 1);
    const fraction = Math.min(Math.abs(npv) / maxBase, 1);

    if (npv < -0.005 && fraction > 0.005) {
        const startA = 1.5 * Math.PI - fraction * 0.5 * Math.PI;
        const endA = 1.5 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, startA, endA, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = themeColor;
        ctx.lineCap = "butt";
        ctx.stroke();
    } else if (npv > 0.005 && fraction > 0.005) {
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
    ctx.fillText("Ditolak (NPV < 0)", cx - outerR, cy + 15);
    ctx.fillText("Diterima (NPV > 0)", cx + outerR, cy + 15);

    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = npvDisplay.length > 9 ? "bold 20px sans-serif" : "bold 24px sans-serif";
    ctx.fillText(npvDisplay, cx, cy - 14);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Net Present Value (NPV)", cx, cy + 4);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(statusText, cx, cy + 34);

    const barX = 24;
    const barW = W - 48;
    const barH = 12;

    const pvY = 202;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Present Value (PV = Ct / (1 + r))", barX, pvY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(formatCurrency(pv), barX + barW, pvY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, pvY, barW, barH, 6);
    ctx.fill();

    const pvFillW = (pv / maxBase) * barW;
    if (pvFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, pvY, Math.min(pvFillW, barW), barH, 6);
        ctx.fill();
    }

    const c0Y = 250;
    const c0Color = c0 > pv ? "#f87171" : "#4ade80";
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Investasi Awal (C0)", barX, c0Y - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = c0Color;
    ctx.fillText(formatCurrency(c0), barX + barW, c0Y - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, c0Y, barW, barH, 6);
    ctx.fill();

    const c0FillW = (c0 / maxBase) * barW;
    if (c0FillW > 0) {
        ctx.fillStyle = c0Color;
        roundRect(ctx, barX, c0Y, Math.min(c0FillW, barW), barH, 6);
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