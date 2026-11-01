import { predict } from "./linear-model.js";

export function createLinearCanvas(canvas) {
    const ctx = canvas.getContext("2d");

    let bounds = {
        minX: 0,
        maxX: 10,
        minY: 0,
        maxY: 120
    };

    function updateBounds(points) {
        if (!points || points.length === 0) {
            bounds = { minX: 0, maxX: 10, minY: 0, maxY: 120 };
            return;
        }

        let maxPx = 10;
        let maxPy = 100;
        for (let i = 0; i < points.length; i++) {
            if (points[i].x > maxPx) maxPx = points[i].x;
            if (points[i].y > maxPy) maxPy = points[i].y;
        }

        bounds.maxX = Math.ceil(maxPx * 1.15);
        bounds.maxY = Math.ceil(maxPy * 1.15);
    }

    const pad = {
        left: 48,
        right: 24,
        top: 24,
        bottom: 38
    };

    function toScreen(x, y) {
        const w = canvas.width;
        const h = canvas.height;
        const plotW = w - pad.left - pad.right;
        const plotH = h - pad.top - pad.bottom;
        const sx = pad.left + ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
        const sy = pad.top + plotH - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;
        return { sx, sy };
    }

    function toMath(sx, sy) {
        const w = canvas.width;
        const h = canvas.height;
        const plotW = w - pad.left - pad.right;
        const plotH = h - pad.top - pad.bottom;
        const x = bounds.minX + ((sx - pad.left) / plotW) * (bounds.maxX - bounds.minX);
        const y = bounds.minY + ((pad.top + plotH - sy) / plotH) * (bounds.maxY - bounds.minY);
        return {
            x: Math.max(0, Math.round(x * 10) / 10),
            y: Math.max(0, Math.round(y * 10) / 10)
        };
    }

    function drawGrid() {
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = "#05070a";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "#131b2e";
        ctx.lineWidth = 1;

        const xStep = bounds.maxX <= 15 ? 1 : bounds.maxX <= 30 ? 2 : 5;
        for (let x = 0; x <= bounds.maxX; x += xStep) {
            const { sx } = toScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(sx, pad.top);
            ctx.lineTo(sx, h - pad.bottom);
            ctx.stroke();

            ctx.fillStyle = "#64748b";
            ctx.font = "11px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(`${x}`, sx, h - pad.bottom + 6);
        }

        const yStep = bounds.maxY <= 100 ? 20 : bounds.maxY <= 200 ? 25 : 50;
        for (let y = 0; y <= bounds.maxY; y += yStep) {
            const { sy } = toScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(pad.left, sy);
            ctx.lineTo(w - pad.right, sy);
            ctx.stroke();

            ctx.fillStyle = "#64748b";
            ctx.font = "11px monospace";
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillText(`${y}`, pad.left - 8, sy);
        }

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top);
        ctx.lineTo(pad.left, h - pad.bottom);
        ctx.lineTo(w - pad.right, h - pad.bottom);
        ctx.stroke();
    }

    function drawSquares(points, wVal, bVal) {
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const yHat = predict(p.x, wVal, bVal);
            const { sx: xScreen, sy: yScreen } = toScreen(p.x, p.y);
            const { sy: yHatScreen } = toScreen(p.x, yHat);

            const side = Math.abs(yHatScreen - yScreen);
            if (side < 1) continue;

            const topY = Math.min(yScreen, yHatScreen);

            ctx.fillStyle = "rgba(244, 63, 94, 0.12)";
            ctx.fillRect(xScreen, topY, side, side);

            ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
            ctx.lineWidth = 1;
            ctx.strokeRect(xScreen, topY, side, side);
        }
    }

    function drawResiduals(points, wVal, bVal) {
        ctx.setLineDash([3, 3]);
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const yHat = predict(p.x, wVal, bVal);
            const { sx: xScreen, sy: yScreen } = toScreen(p.x, p.y);
            const { sy: yHatScreen } = toScreen(p.x, yHat);

            const diff = Math.abs(p.y - yHat);
            if (diff < 5) {
                ctx.strokeStyle = "#4ade80";
            } else if (diff < 15) {
                ctx.strokeStyle = "#fbbf24";
            } else {
                ctx.strokeStyle = "#f87171";
            }

            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(xScreen, yScreen);
            ctx.lineTo(xScreen, yHatScreen);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    function drawLine(wVal, bVal, mode) {
        const x1 = bounds.minX;
        const y1 = predict(x1, wVal, bVal);
        const x2 = bounds.maxX;
        const y2 = predict(x2, wVal, bVal);

        const { sx: sx1, sy: sy1 } = toScreen(x1, y1);
        const { sx: sx2, sy: sy2 } = toScreen(x2, y2);

        let color = "#38bdf8";
        if (mode === "manual") color = "#f59e0b";
        if (mode === "gd") color = "#818cf8";

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
    }

    function drawPoints(points, hoveredIdx, draggedIdx) {
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const { sx, sy } = toScreen(p.x, p.y);

            const isHovered = hoveredIdx === i;
            const isDragged = draggedIdx === i;

            if (isHovered || isDragged) {
                ctx.beginPath();
                ctx.arc(sx, sy, 11, 0, Math.PI * 2);
                ctx.fillStyle = isDragged ? "rgba(245, 158, 11, 0.35)" : "rgba(56, 189, 248, 0.3)";
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
            ctx.fillStyle = isDragged ? "#fbbf24" : "#38bdf8";
            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    function render(state) {
        const { points, w, b, mode, showResiduals, showSquares, hoveredIdx, draggedIdx } = state;
        updateBounds(points);
        drawGrid();

        if (showSquares && points.length > 0) {
            drawSquares(points, w, b);
        }

        if (showResiduals && points.length > 0) {
            drawResiduals(points, w, b);
        }

        drawLine(w, b, mode);
        drawPoints(points, hoveredIdx, draggedIdx);
    }

    function findPointAt(sx, sy, points, threshold = 12) {
        if (!points) return -1;
        for (let i = points.length - 1; i >= 0; i--) {
            const { sx: px, sy: py } = toScreen(points[i].x, points[i].y);
            const dist = Math.hypot(sx - px, sy - py);
            if (dist <= threshold) return i;
        }
        return -1;
    }

    return {
        render,
        toScreen,
        toMath,
        findPointAt
    };
}
