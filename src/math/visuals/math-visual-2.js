import { formatMax3 } from "../math-format.js";

function evaluateH(x1, x2, preset = "default") {
    if (preset === "sphere") {
        return Math.pow(x1, 2) + Math.pow(x2, 2);
    }
    if (preset === "saddle") {
        return Math.pow(x1, 2) - Math.pow(x2, 2);
    }
    if (preset === "rosenbrock") {
        return 100 * Math.pow(x2 - Math.pow(x1, 2), 2) + Math.pow(1 - x1, 2);
    }
    return Math.pow(x1, 3) + Math.pow(x2, 2) / 3;
}

export function drawObjectiveLandscape(x1, x2, preset = "default") {
    const canvas = document.getElementById("math2-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (isNaN(x1) || isNaN(x2)) return;

    const span = Math.max(Math.max(Math.abs(x1), Math.abs(x2)) * 1.4, 4.5);
    const minX = -span;
    const maxX = span;
    const minY = -span;
    const maxY = span;

    const gridSteps = 34;
    const stepW = W / gridSteps;
    const stepH = H / gridSteps;

    const values = [];
    let minH = Infinity;
    let maxH = -Infinity;

    for (let gy = 0; gy < gridSteps; gy++) {
        for (let gx = 0; gx < gridSteps; gx++) {
            const worldX = minX + (gx / gridSteps) * (maxX - minX);
            const worldY = maxY - (gy / gridSteps) * (maxY - minY);
            const val = evaluateH(worldX, worldY, preset);
            values.push(val);
            if (val < minH) minH = val;
            if (val > maxH) maxH = val;
        }
    }

    const rangeH = Math.max(maxH - minH, 0.001);
    let idx = 0;
    for (let gy = 0; gy < gridSteps; gy++) {
        for (let gx = 0; gx < gridSteps; gx++) {
            const val = values[idx++];
            const norm = Math.min(Math.max((val - minH) / rangeH, 0), 1);
            const hue = 220 - norm * 180;
            const lightness = 10 + norm * 26;
            ctx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;
            ctx.fillRect(gx * stepW, gy * stepH, stepW + 1, stepH + 1);
        }
    }

    const toPx = (wx) => ((wx - minX) / (maxX - minX)) * W;
    const toPy = (wy) => H - ((wy - minY) / (maxY - minY)) * H;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    const originX = toPx(0);
    const originY = toPy(0);

    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(W, originY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, H);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "11px 'Roboto Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText("x₁", W - 6, originY - 6);
    ctx.textAlign = "left";
    ctx.fillText("x₂", originX + 6, 14);

    const ptX = toPx(x1);
    const ptY = toPy(x2);
    const currH = evaluateH(x1, x2, preset);

    ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
    ctx.lineWidth = 1;
    if (ctx.setLineDash) ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(ptX, originY);
    ctx.lineTo(ptX, ptY);
    ctx.lineTo(originX, ptY);
    ctx.stroke();
    if (ctx.setLineDash) ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(ptX, ptY, 14, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ptX, ptY, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    const tagText = `(x₁: ${formatMax3(x1)}, x₂: ${formatMax3(x2)}) ➔ h ≈ ${formatMax3(currH)}`;
    ctx.font = "11px 'Roboto Mono', monospace";
    const textW = ctx.measureText ? ctx.measureText(tagText).width : 120;
    let tagX = Math.min(Math.max(ptX - textW / 2, 10), W - textW - 14);
    let tagY = ptY - 24;
    if (tagY < 20) tagY = ptY + 28;

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(tagX - 4, tagY - 14, textW + 8, 20, 4);
    } else {
        ctx.rect(tagX - 4, tagY - 14, textW + 8, 20);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fde68a";
    ctx.textAlign = "left";
    ctx.fillText(tagText, tagX, tagY);
}

export function clearObjectiveLandscape() {
    const canvas = document.getElementById("math2-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
