import { formatMax3 } from "../math-format.js";
import { sampleColormap } from "./math-visual-colormap.js";
import { evaluateGradient } from "../calculators/math-calc-2-critical.js";
import { drawSliceProfiles } from "./math-visual-2-slices.js";

let currentMode = "contour";
let currentColormap = "viridis";

export function evaluateH(x1, x2) {
    return Math.pow(x1, 3) + Math.pow(x2, 2) / 3;
}

export function setObjectiveVisualMode(mode) {
    currentMode = mode === "slices" ? "slices" : "contour";
}

export function setObjectiveColormap(cmap) {
    currentColormap = ["viridis", "cividis", "rdbu"].includes(cmap) ? cmap : "viridis";
}

export function getObjectiveVisualState() {
    return { mode: currentMode, colormap: currentColormap };
}

export function drawObjectiveLandscape(x1, x2) {
    const canvas = document.getElementById("math2-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (isNaN(x1) || isNaN(x2)) return;

    if (currentMode === "slices") {
        drawSliceProfiles(ctx, W, H, x1, x2);
    } else {
        drawContourLandscape(ctx, W, H, x1, x2);
    }
}

function drawContourLandscape(ctx, W, H, x1, x2) {
    const span = Math.max(Math.max(Math.abs(x1), Math.abs(x2)) * 1.45, 4.5);
    const minX = -span;
    const maxX = span;
    const minY = -span;
    const maxY = span;

    const cbarW = 14;
    const padRight = 44;
    const plotW = W - padRight;

    const gridSteps = 38;
    const stepW = plotW / gridSteps;
    const stepH = H / gridSteps;

    const values = [];
    let minH = Infinity;
    let maxH = -Infinity;

    for (let gy = 0; gy < gridSteps; gy++) {
        for (let gx = 0; gx < gridSteps; gx++) {
            const wx = minX + (gx / gridSteps) * (maxX - minX);
            const wy = maxY - (gy / gridSteps) * (maxY - minY);
            const val = evaluateH(wx, wy);
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
            const norm = (val - minH) / rangeH;
            ctx.fillStyle = sampleColormap(currentColormap, norm).css;
            ctx.fillRect(gx * stepW, gy * stepH, stepW + 1, stepH + 1);
        }
    }

    const toPx = (wx) => ((wx - minX) / (maxX - minX)) * plotW;
    const toPy = (wy) => H - ((wy - minY) / (maxY - minY)) * H;

    const numContours = 6;
    for (let c = 1; c <= numContours; c++) {
        const cVal = minH + (c / (numContours + 1)) * rangeH;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let pxStep = 0; pxStep <= 30; pxStep++) {
            const wx = minX + (pxStep / 30) * (maxX - minX);
            const rem = cVal - Math.pow(wx, 3);
            if (rem >= 0) {
                const wyPos = Math.sqrt(rem * 3);
                const wyNeg = -wyPos;
                const px = toPx(wx);
                if (pxStep === 0) ctx.moveTo(px, toPy(wyPos));
                else ctx.lineTo(px, toPy(wyPos));
                if (wyNeg >= minY && wyNeg <= maxY) {
                    ctx.lineTo(px, toPy(wyNeg));
                }
            }
        }
        ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    const ox = toPx(0);
    const oy = toPy(0);
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(plotW, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, H);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("x₁", plotW - 6, oy - 6);
    ctx.textAlign = "left";
    ctx.fillText("x₂", ox + 6, 14);

    ctx.fillStyle = "#cc79a7";
    ctx.beginPath();
    ctx.arc(ox, oy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "9px sans-serif";
    ctx.fillText("Sadel (0,0)", ox + 6, oy + 12);

    const ptX = toPx(x1);
    const ptY = toPy(x2);
    const grad = evaluateGradient(x1, x2);
    const arrowLen = Math.min(Math.max(grad.mag * 2.5, 12), 48);
    const arrowAngle = Math.atan2(-grad.dh_dx2, grad.dh_dx1);
    const arrowEndPx = ptX + Math.cos(arrowAngle) * arrowLen;
    const arrowEndPy = ptY + Math.sin(arrowAngle) * arrowLen;

    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ptX, ptY);
    ctx.lineTo(arrowEndPx, arrowEndPy);
    ctx.stroke();

    const headAngle = Math.PI / 6;
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(arrowEndPx, arrowEndPy);
    ctx.lineTo(
        arrowEndPx - 7 * Math.cos(arrowAngle - headAngle),
        arrowEndPy - 7 * Math.sin(arrowAngle - headAngle)
    );
    ctx.lineTo(
        arrowEndPx - 7 * Math.cos(arrowAngle + headAngle),
        arrowEndPy - 7 * Math.sin(arrowAngle + headAngle)
    );
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 9px monospace";
    ctx.fillText("+∇h", arrowEndPx + 4, arrowEndPy - 2);

    ctx.beginPath();
    ctx.arc(ptX, ptY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#0072b2";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    const currH = evaluateH(x1, x2);
    const tag = `(x₁:${formatMax3(x1)}, x₂:${formatMax3(x2)}) ➔ h=${formatMax3(currH)}`;
    ctx.font = "10px monospace";
    const tw = ctx.measureText ? ctx.measureText(tag).width : 120;
    const tagX = Math.min(Math.max(ptX - tw / 2, 4), plotW - tw - 8);
    const tagY = ptY > 30 ? ptY - 12 : ptY + 22;

    ctx.fillStyle = "rgba(12, 13, 18, 0.9)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.fillRect(tagX - 4, tagY - 11, tw + 8, 16);
    ctx.strokeRect(tagX - 4, tagY - 11, tw + 8, 16);
    ctx.fillStyle = "#e0f2fe";
    ctx.fillText(tag, tagX, tagY);

    const cbarX = W - padRight + 10;
    const cbarY = 16;
    const cbarH = H - 32;
    for (let y = 0; y < cbarH; y++) {
        const norm = 1 - y / cbarH;
        ctx.fillStyle = sampleColormap(currentColormap, norm).css;
        ctx.fillRect(cbarX, cbarY + y, cbarW, 1);
    }
    ctx.strokeStyle = "#52525b";
    ctx.lineWidth = 1;
    ctx.strokeRect(cbarX, cbarY, cbarW, cbarH);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    ctx.fillText(formatMax3(maxH), cbarX + cbarW + 3, cbarY + 8);
    ctx.fillText(formatMax3((maxH + minH) / 2), cbarX + cbarW + 3, cbarY + cbarH / 2);
    ctx.fillText(formatMax3(minH), cbarX + cbarW + 3, cbarY + cbarH);
}

export function clearObjectiveLandscape() {
    const canvas = document.getElementById("math2-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
