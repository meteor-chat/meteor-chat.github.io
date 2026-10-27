function getCanvasContext() {
    const canvas = document.getElementById("math31-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual31() {
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

export function drawCpiMeter(ev, ac, cpi) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (isNaN(ev) || isNaN(ac) || isNaN(cpi) || ev < 0 || ac <= 0) return;

    let themeColor = "#38bdf8";
    let bgBadge = "rgba(56, 189, 248, 0.15)";
    let borderBadge = "#38bdf8";
    let statusText = "ON BUDGET (100% SESUAI ANGGARAN)";
    let badgeText = "ON BUDGET: PENGELUARAN SESUAI ANGGARAN";

    if (cpi < 0.85) {
        themeColor = "#f87171";
        bgBadge = "rgba(248, 113, 113, 0.15)";
        borderBadge = "#f87171";
        statusText = "OVER BUDGET (BIAYA TIDAK EFISIEN)";
        badgeText = "OVER BUDGET: PENGELUARAN MELEBIHI HASIL KERJA";
    } else if (cpi < 0.999) {
        themeColor = "#f59e0b";
        bgBadge = "rgba(245, 158, 11, 0.15)";
        borderBadge = "#f59e0b";
        statusText = "OVER BUDGET (PERINGATAN ANGGARAN)";
        badgeText = "OVER BUDGET: PENGELUARAN CENDERUNG MELEBIHI ANGGARAN";
    } else if (cpi > 1.001) {
        themeColor = "#4ade80";
        bgBadge = "rgba(74, 222, 128, 0.15)";
        borderBadge = "#4ade80";
        statusText = "UNDER BUDGET (HEMAT & EFISIEN)";
        badgeText = "UNDER BUDGET: PENGELUARAN LEBIH HEMAT DARI ANGGARAN";
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

    const gaugeFraction = Math.max(0, Math.min(cpi / 2, 1));
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

    const cpiStr = Number(cpi.toFixed(4)).toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    const pctStr = (cpi * 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

    ctx.textAlign = "center";
    ctx.fillStyle = themeColor;
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(cpiStr, cx, cy - 15);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Cost Performance Index", cx, cy + 6);

    ctx.font = "11px monospace";
    ctx.fillStyle = themeColor;
    ctx.fillText(`Efisiensi: ${pctStr} • ${statusText}`, cx, cy + 24);

    const barX = 30;
    const barW = W - 60;
    const barH = 14;
    const maxBase = Math.max(ev, ac, 1);

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
    const acColor = ac > ev ? "#f87171" : (ac < ev ? "#4ade80" : "#38bdf8");
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
    ctx.fillText(badgeText, cx, badgeY + 22);
}
