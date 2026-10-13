import {
    NODE_EMPTY,
    NODE_WALL,
    NODE_START,
    NODE_TARGET,
    NODE_VISITED,
    NODE_PATH
} from "./search-grid-state.js";

export function setupArenaCanvas(canvas, width = 800, height = 450) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
}

export function drawArena(ctx, width, height, state) {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#0c0d10";
    ctx.fillRect(0, 0, width, height);

    const rows = state.rows;
    const cols = state.cols;
    const cellW = width / cols;
    const cellH = height / rows;

    ctx.strokeStyle = "#171a20";
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
        const x = Math.round(c * cellW) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let r = 0; r <= rows; r++) {
        const y = Math.round(r * cellH) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = state.grid[r][c];
            if (val === NODE_EMPTY) continue;

            const x = c * cellW;
            const y = r * cellH;

            if (val === NODE_WALL) {
                ctx.fillStyle = "#27303f";
                ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
                ctx.strokeStyle = "#38455b";
                ctx.strokeRect(x + 1.5, y + 1.5, cellW - 3, cellH - 3);
            } else if (val === NODE_VISITED) {
                ctx.fillStyle = "rgba(14, 165, 233, 0.4)";
                ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
                ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
                ctx.strokeRect(x + 1.5, y + 1.5, cellW - 3, cellH - 3);
            } else if (val === NODE_PATH) {
                ctx.fillStyle = "#fbbf24";
                ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
                ctx.strokeStyle = "#fef08a";
                ctx.strokeRect(x + 1.5, y + 1.5, cellW - 3, cellH - 3);
            }
        }
    }

    const startX = state.start.c * cellW + cellW / 2;
    const startY = state.start.r * cellH + cellH / 2;
    const startRadius = Math.min(cellW, cellH) * 0.38;

    ctx.beginPath();
    ctx.arc(startX, startY, startRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(startX - startRadius * 0.3, startY - startRadius * 0.45);
    ctx.lineTo(startX + startRadius * 0.45, startY);
    ctx.lineTo(startX - startRadius * 0.3, startY + startRadius * 0.45);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    const targetX = state.target.c * cellW + cellW / 2;
    const targetY = state.target.r * cellH + cellH / 2;
    const targetRadius = Math.min(cellW, cellH) * 0.38;

    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
}
