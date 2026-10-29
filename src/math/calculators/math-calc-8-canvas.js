let activeDrag = null;
let canvasEl = null;
let currentA = [3, 29];
let currentB = [4, 44];
let onMoveCallback = null;

const PAD_LEFT = 48;
const PAD_RIGHT = 24;
const PAD_TOP = 28;
const PAD_BOTTOM = 38;

function getBounds(vecA, vecB) {
    const max1 = Math.max(vecA[0], vecB[0], 6);
    const max2 = Math.max(vecA[1], vecB[1], 50);
    return {
        minX: 0,
        maxX: Math.ceil(max1 * 1.25),
        minY: 0,
        maxY: Math.ceil(max2 * 1.2)
    };
}

function toCanvasCoords(x, y, bounds, width, height) {
    const plotW = width - PAD_LEFT - PAD_RIGHT;
    const plotH = height - PAD_TOP - PAD_BOTTOM;
    const px = PAD_LEFT + ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
    const py = PAD_TOP + plotH - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;
    return [px, py];
}

function fromCanvasCoords(px, py, bounds, width, height) {
    const plotW = width - PAD_LEFT - PAD_RIGHT;
    const plotH = height - PAD_TOP - PAD_BOTTOM;
    const clampedPx = Math.max(PAD_LEFT, Math.min(width - PAD_RIGHT, px));
    const clampedPy = Math.max(PAD_TOP, Math.min(height - PAD_BOTTOM, py));
    const x = bounds.minX + ((clampedPx - PAD_LEFT) / plotW) * (bounds.maxX - bounds.minX);
    const y = bounds.minY + ((PAD_TOP + plotH - clampedPy) / plotH) * (bounds.maxY - bounds.minY);
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

export function drawParetoCanvas(canvas, vecA, vecB, directions = ["min", "min"]) {
    if (!canvas) return;
    canvasEl = canvas;
    currentA = [...vecA];
    currentB = [...vecB];
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#0c0d0e";
    ctx.fillRect(0, 0, width, height);

    const bounds = getBounds(currentA, currentB);
    const plotW = width - PAD_LEFT - PAD_RIGHT;
    const plotH = height - PAD_TOP - PAD_BOTTOM;

    ctx.strokeStyle = "#1f242c";
    ctx.lineWidth = 1;
    const xStep = Math.max(1, Math.round((bounds.maxX - bounds.minX) / 5));
    for (let x = bounds.minX; x <= bounds.maxX; x += xStep) {
        const [cx] = toCanvasCoords(x, 0, bounds, width, height);
        ctx.beginPath();
        ctx.moveTo(cx, PAD_TOP);
        ctx.lineTo(cx, height - PAD_BOTTOM);
        ctx.stroke();
    }
    const yStep = Math.max(5, Math.round((bounds.maxY - bounds.minY) / 5));
    for (let y = bounds.minY; y <= bounds.maxY; y += yStep) {
        const [, cy] = toCanvasCoords(0, y, bounds, width, height);
        ctx.beginPath();
        ctx.moveTo(PAD_LEFT, cy);
        ctx.lineTo(width - PAD_RIGHT, cy);
        ctx.stroke();
    }

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD_LEFT, PAD_TOP);
    ctx.lineTo(PAD_LEFT, height - PAD_BOTTOM);
    ctx.lineTo(width - PAD_RIGHT, height - PAD_BOTTOM);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px 'Google Sans', monospace";
    ctx.textAlign = "center";
    for (let x = bounds.minX; x <= bounds.maxX; x += xStep) {
        const [cx] = toCanvasCoords(x, 0, bounds, width, height);
        ctx.fillText(String(x), cx, height - PAD_BOTTOM + 15);
    }
    ctx.textAlign = "right";
    for (let y = bounds.minY; y <= bounds.maxY; y += yStep) {
        const [, cy] = toCanvasCoords(0, y, bounds, width, height);
        ctx.fillText(String(y), PAD_LEFT - 6, cy + 4);
    }

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px 'Google Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("f1 (Objektif 1)", PAD_LEFT + plotW / 2, height - 6);

    ctx.save();
    ctx.translate(14, PAD_TOP + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("f2 (Objektif 2)", 0, 0);
    ctx.restore();

    const [ax, ay] = toCanvasCoords(currentA[0], currentA[1], bounds, width, height);
    const [bx, by] = toCanvasCoords(currentB[0], currentB[1], bounds, width, height);

    if (directions[0] === "min" && directions[1] === "min") {
        ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
        ctx.fillRect(ax, PAD_TOP, width - PAD_RIGHT - ax, ay - PAD_TOP);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(ax, PAD_TOP, width - PAD_RIGHT - ax, ay - PAD_TOP);

        ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
        ctx.fillRect(bx, PAD_TOP, width - PAD_RIGHT - bx, by - PAD_TOP);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
        ctx.strokeRect(bx, PAD_TOP, width - PAD_RIGHT - bx, by - PAD_TOP);
        ctx.setLineDash([]);
    }

    const [ix, iy] = toCanvasCoords(0, 0, bounds, width, height);
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(ix, iy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "10px monospace";
    ctx.fillStyle = "#34d399";
    ctx.textAlign = "left";
    ctx.fillText("Ideal (0,0)", ix + 6, iy - 6);

    ctx.beginPath();
    ctx.arc(ax, ay, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`A (${currentA[0]}, ${currentA[1]})`, ax + 9, ay - 6);

    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`B (${currentB[0]}, ${currentB[1]})`, bx + 9, by + 14);
}

function getPointerPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [(clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY];
}

export function initParetoCanvasInteraction(canvas, onMove) {
    onMoveCallback = onMove;
    if (!canvas) return;

    function handleStart(e) {
        const [px, py] = getPointerPos(canvas, e);
        const bounds = getBounds(currentA, currentB);
        const [ax, ay] = toCanvasCoords(currentA[0], currentA[1], bounds, canvas.width, canvas.height);
        const [bx, by] = toCanvasCoords(currentB[0], currentB[1], bounds, canvas.width, canvas.height);
        const distA = Math.hypot(px - ax, py - ay);
        const distB = Math.hypot(px - bx, py - by);

        if (distA <= 18) {
            activeDrag = "A";
            e.preventDefault();
        } else if (distB <= 18) {
            activeDrag = "B";
            e.preventDefault();
        }
    }

    function handleMove(e) {
        if (!activeDrag) return;
        e.preventDefault();
        const [px, py] = getPointerPos(canvas, e);
        const bounds = getBounds(currentA, currentB);
        const [nx, ny] = fromCanvasCoords(px, py, bounds, canvas.width, canvas.height);
        if (typeof onMoveCallback === "function") {
            onMoveCallback(activeDrag, nx, ny);
        }
    }

    function handleEnd() {
        activeDrag = null;
    }

    canvas.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    canvas.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
}
