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

export function drawSpiMeter(ev, pv, spi) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(ev) || isNaN(pv) || isNaN(spi) || ev < 0 || pv <= 0) return;

    let themeColor = "#38bdf8";
    let bgBadge = "rgba(56, 189, 248, 0.15)";
    let borderBadge = "#38bdf8";
    let statusText = "ON SCHEDULE (100% SESUAI JADWAL)";
    let badgeText = "ON SCHEDULE: PROGRES TEPAT SESUAI JADWAL";

    if (spi < 0.85) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        statusText = "BEHIND SCHEDULE (TERLAMBAT DARI JADWAL)";
        badgeText = "BEHIND SCHEDULE: PROGRES LEBIH LAMBAT DARI RENCANA";
    } else if (spi < 0.999) {
        themeColor = "#f59e0b";
        bgBadge = "rgba(245, 158, 11, 0.15)";
        borderBadge = "#f59e0b";
        statusText = "BEHIND SCHEDULE (PERINGATAN JADWAL)";
        badgeText = "BEHIND SCHEDULE: PROGRES CENDERUNG TERLAMBAT";
    } else if (spi > 1.001) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        statusText = "AHEAD OF SCHEDULE (LEBIH CEPAT DARI JADWAL)";
        badgeText = "AHEAD OF SCHEDULE: PROGRES LEBIH CEPAT DARI RENCANA";
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

    const gaugeFraction = Math.max(0, Math.min(spi / 2, 1));
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
    ctx.fillText("1.0 (Target)", cx, cy - outerR - 10);
    ctx.fillText("0.0", cx - outerR, cy + 18);
    ctx.fillText("2.0+", cx + outerR, cy + 18);

    const spiStr = Number(spi.toFixed(4)).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    const pctStr = (spi * 100).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + "%";

    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(spiStr, cx, cy - 15);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Schedule Performance Index", cx, cy + 6);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`Efisiensi: ${pctStr} • ${statusText}`, cx, cy + 24);

    const barX = 30;
    const barW = W - 60;
    const barH = 14;
    const maxBase = Math.max(ev, pv, 1);

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

    const pvY = 252;
    const pvColor = pv > ev ? "#f87171" : (pv < ev ? "#4ade80" : "#38bdf8");
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Planned Value (PV)", barX, pvY - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = pvColor;
    ctx.fillText(formatCurrency(pv), barX + barW, pvY - 6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, pvY, barW, barH, 7);
    ctx.fill();

    const pvFillW = (pv / maxBase) * barW;
    if (pvFillW > 0) {
        ctx.fillStyle = pvColor;
        roundRect(ctx, barX, pvY, Math.min(pvFillW, barW), barH, 7);
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
