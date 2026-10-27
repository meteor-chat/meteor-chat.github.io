function getCanvasContext() {
    const canvas = document.getElementById("math35-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual35() {
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
    return "$" + Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function drawEtcCostMeter(eac, ac, etc) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(eac) || isNaN(ac) || isNaN(etc) || eac <= 0 || ac < 0) return;

    const spentPct = Math.min(Math.max((ac / eac) * 100, 0), 100);
    const remainPct = Math.min(Math.max((etc / eac) * 100, 0), 100);

    let themeColor = "#4ade80";
    let bgBadge = "rgba(74, 222, 128, 0.15)";
    let borderBadge = "#4ade80";
    let statusText = `SISA ANGGARAN AMAN (${remainPct.toFixed(1)}%)`;
    let badgeText = `SISA BIAYA: ${formatCurrency(etc)} DIBUTUHKAN UNTUK SELESAI`;

    if (etc < 0) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        statusText = "BIAYA TERPAKAI MELEBIHI PROYEKSI AKHIR";
        badgeText = "PERINGATAN: PENGELUARAN TELAH MELEBIHI ESTIMASI TOTAL";
    } else if (spentPct > 80) {
        themeColor = "#f59e0b";
        bgBadge = "rgba(245, 158, 11, 0.15)";
        borderBadge = "#f59e0b";
        statusText = `SISA ANGGARAN MENIPIS (${remainPct.toFixed(1)}%)`;
        badgeText = `PERINGATAN: ANGGARAN MENIPIS, SISA BIAYA: ${formatCurrency(etc)}`;
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

    const gaugeFraction = Math.max(0, Math.min(ac / eac, 1));
    const currentAngle = Math.PI + gaugeFraction * Math.PI;

    if (gaugeFraction > 0.005) {
        ctx.beginPath();
        ctx.arc(cx, cy, (outerR + innerR) / 2, Math.PI, currentAngle, false);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = "#38bdf8";
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
    ctx.fillText("50%", cx, cy - outerR - 10);
    ctx.fillText("0%", cx - outerR, cy + 18);
    ctx.fillText("100%", cx + outerR, cy + 18);

    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(formatCurrency(etc), cx, cy - 15);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Estimate to Complete", cx, cy + 6);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`Terpakai: ${spentPct.toFixed(1)}% • Sisa: ${remainPct.toFixed(1)}%`, cx, cy + 24);

    const barX = 30;
    const barW = W - 60;
    const barH = 14;
    const maxBase = Math.max(eac, ac, etc, 1);

    const acY = 205;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Actual Cost (Biaya Terpakai)", barX, acY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(formatCurrency(ac), barX + barW, acY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, acY, barW, barH, 7);
    ctx.fill();

    const acFillW = (ac / maxBase) * barW;
    if (acFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, acY, Math.min(acFillW, barW), barH, 7);
        ctx.fill();
    }

    const etcY = 252;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Estimate to Complete (Sisa Biaya)", barX, etcY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = themeColor;
    ctx.fillText(formatCurrency(etc), barX + barW, etcY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, etcY, barW, barH, 7);
    ctx.fill();

    const etcFillW = (Math.max(etc, 0) / maxBase) * barW;
    if (etcFillW > 0) {
        ctx.fillStyle = themeColor;
        roundRect(ctx, barX, etcY, Math.min(etcFillW, barW), barH, 7);
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
    ctx.fillText(badgeText, cx, badgeY + 22);
}
