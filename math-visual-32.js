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
    let statusText = "ON SCHEDULE";
    let badgeText = "SPI 1,0000: TEPAT WAKTU (ON SCHEDULE)";

    const spiStr = Number(spi.toFixed(4)).toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    const pctStr = (spi * 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

    if (spi < 0.999) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        statusText = "BEHIND SCHEDULE";
        badgeText = `SPI ${spiStr}: TERLAMBAT DARI JADWAL (BEHIND)`;
    } else if (spi > 1.001) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        statusText = "AHEAD OF SCHEDULE";
        badgeText = `SPI ${spiStr}: LEBIH CEPAT DARI JADWAL (AHEAD)`;
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

    const clampedRatio = Math.min(Math.max(spi, 0), 2);
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
    ctx.fillText("1.0 (Target)", cx, cy - outerR - 8);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("0.0", cx - outerR, cy + 15);
    ctx.fillText("2.0+", cx + outerR, cy + 15);

    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = spiStr.length > 8 ? "bold 20px sans-serif" : "bold 24px sans-serif";
    ctx.fillText(spiStr, cx, cy - 14);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Schedule Performance Index", cx, cy + 4);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`Efisiensi: ${pctStr} • ${statusText}`, cx, cy + 34);

    const barX = 24;
    const barW = W - 48;
    const barH = 12;
    const maxBase = Math.max(ev, pv, 1);

    const evY = 202;
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Earned Value (EV)", barX, evY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(formatCurrency(ev), barX + barW, evY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, evY, barW, barH, 6);
    ctx.fill();

    const evFillW = (ev / maxBase) * barW;
    if (evFillW > 0) {
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, barX, evY, Math.min(evFillW, barW), barH, 6);
        ctx.fill();
    }

    const pvY = 250;
    const pvColor = pv > ev ? "#f87171" : (pv < ev ? "#4ade80" : "#38bdf8");
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Planned Value (PV)", barX, pvY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = pvColor;
    ctx.fillText(formatCurrency(pv), barX + barW, pvY - 8);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, pvY, barW, barH, 6);
    ctx.fill();

    const pvFillW = (pv / maxBase) * barW;
    if (pvFillW > 0) {
        ctx.fillStyle = pvColor;
        roundRect(ctx, barX, pvY, Math.min(pvFillW, barW), barH, 6);
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
