const PALETTE = ["#38bdf8", "#fbbf24", "#34d399", "#f43f5e", "#a78bfa", "#fb923c"];
let boundCanvas = null;
let hoverCallback = null;
let currentValues = [];
let currentActive = -1;

export function getPaletteColor(i) {
    return PALETTE[i % PALETTE.length];
}

function handlePointerMove(e) {
    if (!boundCanvas || !currentValues.length || !hoverCallback) return;
    const rect = boundCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    const dist = Math.hypot(x, y);
    const radius = Math.min(rect.width, rect.height) / 2;
    if (dist < 42 || dist > radius) {
        if (currentActive !== -1) {
            currentActive = -1;
            hoverCallback(-1);
        }
        return;
    }
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    const sum = currentValues.reduce((a, b) => a + Math.max(0, b), 0);
    if (sum <= 0) return;
    let accumulated = 0;
    let found = -1;
    for (let i = 0; i < currentValues.length; i++) {
        const span = (Math.max(0, currentValues[i]) / sum) * Math.PI * 2;
        if (angle >= accumulated && angle < accumulated + span) {
            found = i;
            break;
        }
        accumulated += span;
    }
    if (found !== currentActive) {
        currentActive = found;
        hoverCallback(found);
    }
}

function handlePointerLeave() {
    if (currentActive !== -1 && hoverCallback) {
        currentActive = -1;
        hoverCallback(-1);
    }
}

export function initRouletteWheel4(onHover) {
    const canvas = document.getElementById("math4-canvas");
    if (!canvas) return;
    boundCanvas = canvas;
    hoverCallback = onHover;
    canvas.addEventListener("mousemove", handlePointerMove);
    canvas.addEventListener("mouseleave", handlePointerLeave);
    canvas.addEventListener("touchmove", handlePointerMove, { passive: true });
    canvas.addEventListener("touchend", handlePointerLeave);
}

export function destroyRouletteWheel4() {
    if (!boundCanvas) return;
    boundCanvas.removeEventListener("mousemove", handlePointerMove);
    boundCanvas.removeEventListener("mouseleave", handlePointerLeave);
    boundCanvas.removeEventListener("touchmove", handlePointerMove);
    boundCanvas.removeEventListener("touchend", handlePointerLeave);
    boundCanvas = null;
    hoverCallback = null;
    currentActive = -1;
}

export function drawRouletteWheel4(fitnessValues, activeIndex = -1) {
    const canvas = document.getElementById("math4-canvas");
    if (!canvas) return;
    currentValues = fitnessValues || [];
    currentActive = activeIndex;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1;
    const size = 340;
    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const baseR = 142;
    const sum = currentValues.reduce((a, b) => a + Math.max(0, b), 0);

    if (sum <= 0 || currentValues.length === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
        ctx.fillStyle = "#18181b";
        ctx.fill();
        ctx.strokeStyle = "#27272a";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#71717a";
        ctx.font = "500 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Masukkan fitness individu", cx, cy);
        ctx.restore();
        return;
    }

    let startAngle = -Math.PI / 2;
    currentValues.forEach((val, i) => {
        const positiveVal = Math.max(0, val);
        const sliceAngle = (positiveVal / sum) * Math.PI * 2;
        const endAngle = startAngle + sliceAngle;
        const isActive = i === activeIndex;
        const r = isActive ? baseR + 5 : baseR;
        const color = getPaletteColor(i);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = activeIndex >= 0 && !isActive ? 0.45 : 1;
        if (isActive) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 14;
        }
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();
        ctx.lineWidth = isActive ? 3 : 1.5;
        ctx.strokeStyle = isActive ? "#ffffff" : "#121214";
        ctx.stroke();

        if (sliceAngle > 0.22) {
            const mid = startAngle + sliceAngle / 2;
            const textDist = r * 0.64;
            const tx = cx + Math.cos(mid) * textDist;
            const ty = cy + Math.sin(mid) * textDist;
            const pct = ((positiveVal / sum) * 100).toFixed(1);
            ctx.save();
            ctx.translate(tx, ty);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#09090b";
            ctx.font = "bold 12px system-ui, sans-serif";
            ctx.fillText(`I${i + 1}`, 0, -6);
            ctx.font = "600 10px monospace";
            ctx.fillText(`${pct}%`, 0, 7);
            ctx.restore();
        }
        startAngle = endAngle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fillStyle = "#121214";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = activeIndex >= 0 ? getPaletteColor(activeIndex) : "#27272a";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (activeIndex >= 0 && activeIndex < currentValues.length) {
        const actVal = Math.max(0, currentValues[activeIndex]);
        const pVal = (actVal / sum).toFixed(4);
        ctx.fillStyle = getPaletteColor(activeIndex);
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText(`Individu ${activeIndex + 1}`, cx, cy - 8);
        ctx.fillStyle = "#ffffff";
        ctx.font = "600 12px monospace";
        ctx.fillText(`P = ${pVal}`, cx, cy + 9);
    } else {
        ctx.fillStyle = "#a1a1aa";
        ctx.font = "500 11px system-ui, sans-serif";
        ctx.fillText("\u03A3 Kebugaran", cx, cy - 8);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px monospace";
        ctx.fillText(sum.toFixed(2), cx, cy + 9);
    }
    ctx.restore();
}
