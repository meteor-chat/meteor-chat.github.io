import { formatMax3 } from "../math-format.js";

export function drawSliceProfiles(ctx, W, H, x1, x2) {
    ctx.fillStyle = "#0c0d12";
    ctx.fillRect(0, 0, W, H);

    const halfH = Math.floor(H / 2);
    const padX = 36;
    const plotW = W - padX - 20;

    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, halfH);
    ctx.lineTo(W, halfH);
    ctx.stroke();

    const span = Math.max(Math.max(Math.abs(x1), Math.abs(x2)) * 1.5, 4.0);
    const minX = -span;
    const maxX = span;

    const term2 = Math.pow(x2, 2) / 3;
    const slice1Pts = [];
    let s1Min = Infinity;
    let s1Max = -Infinity;
    for (let i = 0; i <= 60; i++) {
        const wx = minX + (i / 60) * (maxX - minX);
        const y = Math.pow(wx, 3) + term2;
        slice1Pts.push({ x: wx, y });
        if (y < s1Min) s1Min = y;
        if (y > s1Max) s1Max = y;
    }
    const s1Range = Math.max(s1Max - s1Min, 0.001);
    const toS1Px = (x) => padX + ((x - minX) / (maxX - minX)) * plotW;
    const toS1Py = (y) => 16 + (halfH - 28) - ((y - s1Min) / s1Range) * (halfH - 32);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    slice1Pts.forEach((p, i) => {
        const px = toS1Px(p.x);
        const py = toS1Py(p.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();

    const curr1Px = toS1Px(x1);
    const curr1Py = toS1Py(Math.pow(x1, 3) + term2);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(curr1Px, curr1Py, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e0f2fe";
    ctx.font = "10px sans-serif";
    ctx.fillText(`Irisan x₁ (x₂=${formatMax3(x2)}): h = x₁³ + C [Monoton Kubik]`, padX, 14);

    const term1 = Math.pow(x1, 3);
    const slice2Pts = [];
    let s2Min = Infinity;
    let s2Max = -Infinity;
    for (let i = 0; i <= 60; i++) {
        const wy = minX + (i / 60) * (maxX - minX);
        const y = term1 + Math.pow(wy, 2) / 3;
        slice2Pts.push({ x: wy, y });
        if (y < s2Min) s2Min = y;
        if (y > s2Max) s2Max = y;
    }
    const s2Range = Math.max(s2Max - s2Min, 0.001);
    const toS2Px = (x) => padX + ((x - minX) / (maxX - minX)) * plotW;
    const toS2Py = (y) => halfH + 16 + (halfH - 28) - ((y - s2Min) / s2Range) * (halfH - 32);

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    slice2Pts.forEach((p, i) => {
        const px = toS2Px(p.x);
        const py = toS2Py(p.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();

    const curr2Px = toS2Px(x2);
    const curr2Py = toS2Py(term1 + Math.pow(x2, 2) / 3);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(curr2Px, curr2Py, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fef3c7";
    ctx.font = "10px sans-serif";
    ctx.fillText(`Irisan x₂ (x₁=${formatMax3(x1)}): h = C + ⅓x₂² [Parabola Simetris]`, padX, halfH + 14);
}
