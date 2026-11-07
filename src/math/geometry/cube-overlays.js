export function projectPoint(v, cx, cy, cubeSize, isOrtho) {
    const D = 400;
    const F = 360;
    const x = v.x * cubeSize;
    const y = v.y * cubeSize;
    const z = v.z * cubeSize;
    if (isOrtho) {
        return { x: cx + x, y: cy + y, z };
    }
    const scale = F / (D - z);
    return { x: cx + x * scale, y: cy + y * scale, z };
}

export function computeFaceNormal(p0, p1, p2) {
    const ax = p1.x - p0.x;
    const ay = p1.y - p0.y;
    const az = p1.z - p0.z;
    const bx = p2.x - p0.x;
    const by = p2.y - p0.y;
    const bz = p2.z - p0.z;
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz) || 1;
    return { x: nx / len, y: ny / len, z: nz / len };
}

export function computeFaceShading(normal) {
    const lx = -0.577;
    const ly = 0.577;
    const lz = 0.577;
    const dot = normal.x * lx + normal.y * ly + normal.z * lz;
    const diffuse = Math.max(0, dot);
    return 0.28 + 0.72 * diffuse;
}

export function drawFaceDiagonal(ctx, projVerts, sisiText) {
    const p1 = projVerts[4];
    const p2 = projVerts[6];
    if (!p1 || !p2) return;

    ctx.save();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    ctx.fillStyle = "rgba(12, 13, 18, 0.9)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.2;
    ctx.fillRect(mx - 38, my - 12, 76, 20);
    ctx.strokeRect(mx - 38, my - 12, 76, 20);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`ds = s√2`, mx, my - 1);
    ctx.restore();
}

export function drawSpaceDiagonal(ctx, projVerts, sisiText) {
    const p0 = projVerts[0];
    const p6 = projVerts[6];
    if (!p0 || !p6) return;

    ctx.save();
    ctx.strokeStyle = "#cc79a7";
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p6.x, p6.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const mx = (p0.x + p6.x) / 2;
    const my = (p0.y + p6.y) / 2;
    ctx.fillStyle = "rgba(12, 13, 18, 0.9)";
    ctx.strokeStyle = "#cc79a7";
    ctx.lineWidth = 1.2;
    ctx.fillRect(mx - 38, my - 12, 76, 20);
    ctx.strokeRect(mx - 38, my - 12, 76, 20);
    ctx.fillStyle = "#f472b6";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`dr = s√3`, mx, my - 1);
    ctx.restore();
}

export function drawDiagonalPlane(ctx, projVerts) {
    const p0 = projVerts[0];
    const p3 = projVerts[3];
    const p6 = projVerts[6];
    const p5 = projVerts[5];
    if (!p0 || !p3 || !p6 || !p5) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p6.x, p6.y);
    ctx.lineTo(p5.x, p5.y);
    ctx.closePath();
    ctx.fillStyle = "rgba(245, 158, 11, 0.32)";
    ctx.fill();

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    const cx = (p0.x + p3.x + p6.x + p5.x) / 4;
    const cy = (p0.y + p3.y + p6.y + p5.y) / 4;
    ctx.fillStyle = "rgba(12, 13, 18, 0.9)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.2;
    ctx.fillRect(cx - 40, cy - 12, 80, 20);
    ctx.strokeRect(cx - 40, cy - 12, 80, 20);
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Bd = s²√2`, cx, cy - 1);
    ctx.restore();
}
