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

function formatDuration(n) {
    return Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " bulan";
}

export function drawEtcMeter(ote, spi, etc) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(ote) || isNaN(spi) || isNaN(etc) || ote < 0 || spi <= 0) return;

    const diff = etc - ote;
    let themeColor = "#38bdf8";
    let bgBadge = "rgba(56, 189, 248, 0.15)";
    let borderBadge = "#38bdf8";
    let statusText = "ON SCHEDULE (100% TEPAT JADWAL)";
    let badgeText = `TEPAT WAKTU: PROYEKSI SELESAI SESUAI RENCANA (${formatDuration(ote)})`;

    if (spi < 0.85) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        statusText = "BEHIND SCHEDULE (TERLAMBAT DARI JADWAL)";
        badgeText = `TERLAMBAT: PROYEKSI DURASI BERTAMBAH (+${formatDuration(Math.abs(diff))})`;
    } else if (spi < 0.999) {
        themeColor = "#f59e0b";
        bgBadge = "rgba(245, 158, 11, 0.15)";
        borderBadge = "#f59e0b";
        statusText = "BEHIND SCHEDULE (PERINGATAN JADWAL)";
        badgeText = `PERINGATAN: PROYEKSI DURASI BERTAMBAH (+${formatDuration(Math.abs(diff))})`;
    } else if (spi > 1.001) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        statusText = "AHEAD OF SCHEDULE (LEBIH CEPAT SELESAI)";
        badgeText = `LEBIH CEPAT: PROYEKSI SELESAI LEBIH AWAL (-${formatDuration(Math.abs(diff))})`;
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

    const expansionRatio = ote > 0 ? etc / ote : 1;
    const gaugeFraction = Math.max(0, Math.min(expansionRatio / 2, 1));
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
    ctx.fillText("100% Durasi", cx, cy - outerR - 10);
    ctx.fillText("0%", cx - outerR, cy + 18);
    ctx.fillText("200%+", cx + outerR, cy + 18);

    const spiFormatted = spi.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(formatDuration(etc), cx, cy - 15);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Estimated Time to Complete", cx, cy + 6);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`SPI: ${spiFormatted} • ${statusText}`, cx, cy + 24);

    const barX = 30;
    const barW = W - 60;
    const barH = 14;
    const maxBase = Math.max(ote, etc, 1);

    const oteY = 205;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Original Time Estimate (Durasi Awal)", barX, oteY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(formatDuration(ote), barX + barW, oteY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, oteY, barW, barH, 7);
    ctx.fill();

    const oteFillW = (ote / maxBase) * barW;
    if (oteFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, oteY, Math.min(oteFillW, barW), barH, 7);
        ctx.fill();
    }

    const etcY = 252;
    const etcColor = etc > ote ? "#f87171" : (etc < ote ? "#4ade80" : "#38bdf8");
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Estimated Time to Complete (Proyeksi)", barX, etcY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = etcColor;
    ctx.fillText(formatDuration(etc), barX + barW, etcY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, etcY, barW, barH, 7);
    ctx.fill();

    const etcFillW = (etc / maxBase) * barW;
    if (etcFillW > 0) {
        ctx.fillStyle = etcColor;
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
