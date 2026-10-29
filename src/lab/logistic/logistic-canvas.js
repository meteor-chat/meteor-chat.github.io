import { sigmoid, logit, predictProb, computeBoundaryEndpoints, clamp } from "./logistic-model.js";

const BOUNDS = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
const OFFSCREEN_RES = 50;

export function createLogisticCanvas(canvasElement) {
    const ctx = canvasElement.getContext("2d");
    const offscreen = document.createElement("canvas");
    offscreen.width = OFFSCREEN_RES;
    offscreen.height = OFFSCREEN_RES;
    const offCtx = offscreen.getContext("2d");
    const offImg = offCtx.createImageData(OFFSCREEN_RES, OFFSCREEN_RES);

    let viewMode = "2d";

    function toPixelX(x, w) {
        return ((x - BOUNDS.xMin) / (BOUNDS.xMax - BOUNDS.xMin)) * w;
    }

    function toPixelY(y, h) {
        return h - ((y - BOUNDS.yMin) / (BOUNDS.yMax - BOUNDS.yMin)) * h;
    }

    function toMapX(px, w) {
        return BOUNDS.xMin + (px / w) * (BOUNDS.xMax - BOUNDS.xMin);
    }

    function toMapY(py, h) {
        return BOUNDS.yMin + ((h - py) / h) * (BOUNDS.yMax - BOUNDS.yMin);
    }

    function renderHeatmap(w1, w2, b) {
        const data = offImg.data;
        let idx = 0;
        for (let gy = 0; gy < OFFSCREEN_RES; gy++) {
            const py = (gy + 0.5) / OFFSCREEN_RES;
            const y = BOUNDS.yMax - py * (BOUNDS.yMax - BOUNDS.yMin);
            for (let gx = 0; gx < OFFSCREEN_RES; gx++) {
                const px = (gx + 0.5) / OFFSCREEN_RES;
                const x = BOUNDS.xMin + px * (BOUNDS.xMax - BOUNDS.xMin);
                const prob = sigmoid(w1 * x + w2 * y + b);
                const r = Math.round((1 - prob) * 225 + prob * 14);
                const g = Math.round((1 - prob) * 29 + prob * 165);
                const bl = Math.round((1 - prob) * 72 + prob * 233);
                const a = Math.round((0.18 + 0.22 * Math.abs(2 * prob - 1)) * 255);
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = bl;
                data[idx + 3] = a;
                idx += 4;
            }
        }
        offCtx.putImageData(offImg, 0, 0);
    }

    function drawGrid(w, h) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let x = -4; x <= 4; x += 2) {
            const px = toPixelX(x, w);
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
            ctx.stroke();
        }
        for (let y = -4; y <= 4; y += 2) {
            const py = toPixelY(y, h);
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
            ctx.stroke();
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1.5;
        const cx = toPixelX(0, w);
        const cy = toPixelY(0, h);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.stroke();
    }

    function render2D(state, points, hover) {
        const w = canvasElement.width;
        const h = canvasElement.height;
        ctx.clearRect(0, 0, w, h);
        renderHeatmap(state.w1, state.w2, state.b);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(offscreen, 0, 0, w, h);
        drawGrid(w, h);

        const endpoints = computeBoundaryEndpoints(state.w1, state.w2, state.b, state.threshold, BOUNDS);
        if (endpoints) {
            const x1 = toPixelX(endpoints.p1.x, w);
            const y1 = toPixelY(endpoints.p1.y, h);
            const x2 = toPixelX(endpoints.p2.x, w);
            const y2 = toPixelY(endpoints.p2.y, h);
            ctx.save();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        }

        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            const px = toPixelX(pt.x1, w);
            const py = toPixelY(pt.x2, h);
            const prob = predictProb(pt.x1, pt.x2, state.w1, state.w2, state.b);
            const pred = prob >= state.threshold ? 1 : 0;
            const isWrong = pred !== pt.y;

            ctx.beginPath();
            ctx.arc(px, py, 5.5, 0, Math.PI * 2);
            ctx.fillStyle = pt.y === 1 ? "#38bdf8" : "#f43f5e";
            ctx.fill();
            ctx.lineWidth = isWrong ? 2 : 1.2;
            ctx.strokeStyle = isWrong ? "#fbbf24" : "#ffffff";
            ctx.stroke();
        }

        if (hover && hover.x != null && hover.y != null) {
            const mx = toMapX(hover.x, w);
            const my = toMapY(hover.y, h);
            const prob = predictProb(mx, my, state.w1, state.w2, state.b);
            const z = state.w1 * mx + state.w2 * my + state.b;

            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(hover.x, hover.y, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            const label = `(${mx.toFixed(1)}, ${my.toFixed(1)}) | z:${z.toFixed(2)} | p:${prob.toFixed(2)}`;
            ctx.font = "11px 'Roboto Mono', monospace";
            const textW = ctx.measureText(label).width;
            const boxX = clamp(hover.x + 12, 6, w - textW - 18);
            const boxY = clamp(hover.y - 14, 22, h - 8);

            ctx.fillStyle = "rgba(12, 15, 20, 0.9)";
            ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
            ctx.lineWidth = 1;
            ctx.fillRect(boxX - 4, boxY - 14, textW + 8, 20);
            ctx.strokeRect(boxX - 4, boxY - 14, textW + 8, 20);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(label, boxX, boxY);
        }
    }

    function render1D(state, points) {
        const w = canvasElement.width;
        const h = canvasElement.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#05070a";
        ctx.fillRect(0, 0, w, h);

        const padX = 40;
        const padY = 40;
        const plotW = w - padX * 2;
        const plotH = h - padY * 2;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padX, padY + plotH);
        ctx.lineTo(padX + plotW, padY + plotH);
        ctx.lineTo(padX + plotW, padY);
        ctx.lineTo(padX, padY);
        ctx.closePath();
        ctx.stroke();

        const tauY = padY + plotH - state.threshold * plotH;
        ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padX, tauY);
        ctx.lineTo(padX + plotW, tauY);
        ctx.stroke();
        ctx.setLineDash([]);

        const zCut = logit(state.threshold);
        const zMin = -6;
        const zMax = 6;
        const cutX = padX + ((zCut - zMin) / (zMax - zMin)) * plotW;
        if (cutX >= padX && cutX <= padX + plotW) {
            ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(cutX, padY);
            ctx.lineTo(cutX, padY + plotH);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= plotW; i += 2) {
            const frac = i / plotW;
            const z = zMin + frac * (zMax - zMin);
            const p = sigmoid(z);
            const py = padY + plotH - p * plotH;
            if (i === 0) ctx.moveTo(padX + i, py);
            else ctx.lineTo(padX + i, py);
        }
        ctx.stroke();

        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            const z = state.w1 * pt.x1 + state.w2 * pt.x2 + state.b;
            const px = padX + ((clamp(z, zMin, zMax) - zMin) / (zMax - zMin)) * plotW;
            const p = sigmoid(z);
            const py = padY + plotH - p * plotH;

            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = pt.y === 1 ? "#38bdf8" : "#f43f5e";
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
        }

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px 'Roboto Mono', monospace";
        ctx.fillText("z = w1·x1 + w2·x2 + b", padX + plotW / 2 - 60, h - 14);
        ctx.fillText("p̂ = 1.0", 4, padY + 4);
        ctx.fillText("p̂ = 0.0", 4, padY + plotH);
    }

    return {
        render(state, points, hover) {
            if (viewMode === "1d") {
                render1D(state, points);
            } else {
                render2D(state, points, hover);
            }
        },
        setViewMode(mode) {
            viewMode = mode;
        },
        getViewMode() {
            return viewMode;
        },
        pixelToMap(px, py) {
            const w = canvasElement.width;
            const h = canvasElement.height;
            return {
                x1: Math.round(toMapX(px, w) * 100) / 100,
                x2: Math.round(toMapY(py, h) * 100) / 100
            };
        }
    };
}
