let canvas = null;
let ctx = null;
let currentShift = 0;
let targetAngle = 0;
let currentAngle = 0;
let animFrameId = null;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const TOTAL_LETTERS = 26;
const ANGLE_STEP = (Math.PI * 2) / TOTAL_LETTERS;

export function initCipherWheel(canvasEl) {
    canvas = canvasEl;
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    currentShift = 0;
    currentAngle = 0;
    targetAngle = 0;
    setupCanvasDPI();
    drawWheel();
    window.addEventListener("resize", () => {
        setupCanvasDPI();
        drawWheel();
    });
}

function setupCanvasDPI() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width || 340, 360);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}

export function setWheelShift(shift, animate = true) {
    currentShift = ((Number(shift) % 26) + 26) % 26;
    targetAngle = -currentShift * ANGLE_STEP;
    if (!animate) {
        currentAngle = targetAngle;
        drawWheel();
        return;
    }
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animateRotation();
}

function animateRotation() {
    const diff = targetAngle - currentAngle;
    if (Math.abs(diff) < 0.002) {
        currentAngle = targetAngle;
        drawWheel();
        return;
    }
    currentAngle += diff * 0.22;
    drawWheel();
    animFrameId = requestAnimationFrame(animateRotation);
}

export function drawWheel() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width || 340, 360);
    const cx = size / 2;
    const cy = size / 2;
    const outerR = cx - 14;
    const midR = outerR - 44;
    const innerR = midR - 44;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = "#0c131f";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1e293b";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, midR, 0, Math.PI * 2);
    ctx.fillStyle = "#080c14";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#334155";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = "#020408";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#1e293b";
    ctx.stroke();

    ctx.font = "600 12px 'Google Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < TOTAL_LETTERS; i++) {
        const letter = ALPHABET[i];
        const angle = i * ANGLE_STEP - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (outerR - 22);
        const ly = cy + Math.sin(angle) * (outerR - 22);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = i === 0 ? "#4ade80" : "#94a3b8";
        ctx.fillText(letter, 0, 0);
        ctx.restore();
    }

    for (let i = 0; i < TOTAL_LETTERS; i++) {
        const letter = ALPHABET[i];
        const angle = i * ANGLE_STEP + currentAngle - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (midR - 22);
        const ly = cy + Math.sin(angle) * (midR - 22);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = i === currentShift ? "#38bdf8" : "#cbd5e1";
        ctx.fillText(letter, 0, 0);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR - 4);
    ctx.lineTo(cx - 6, cy - outerR + 6);
    ctx.lineTo(cx + 6, cy - outerR + 6);
    ctx.closePath();
    ctx.fillStyle = "#eab308";
    ctx.fill();

    ctx.font = "700 14px 'Google Sans', sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`+${currentShift}`, cx, cy - 4);
    ctx.font = "500 10px 'Google Sans', sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("SHIFT", cx, cy + 12);
}
