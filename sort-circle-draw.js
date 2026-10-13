export function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const width = 800;
    const height = 450;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
}

export function drawDisparityCircle(ctx, width, height, arr) {
    ctx.clearRect(0, 0, width, height);

    const n = arr ? arr.length : 0;
    if (n === 0) return;

    const cx = width / 2;
    const cy = height / 2;
    const rx = width * 0.44;
    const ry = height * 0.38;

    const dotRadius = 1.8;
    for (let i = 0; i < n; i++) {
        const val = arr[i];
        const disp = Math.abs(i - val) / n;
        const r = 1 - disp;
        const angle = -Math.PI / 2 + (i / n) * 2 * Math.PI;
        const x = cx + r * rx * Math.cos(angle);
        const y = cy + r * ry * Math.sin(angle);
        const hue = (val / n) * 360;

        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fill();
    }
}
