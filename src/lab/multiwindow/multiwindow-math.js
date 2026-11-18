export function getProceduralTime() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return (now.getTime() - midnight) / 1000.0;
}

export function createOrthoMatrix(w, h, near = -2000, far = 2000) {
    const width = Math.max(1, w);
    const height = Math.max(1, h);
    const out = new Float32Array(16);
    out[0] = 2 / width;
    out[5] = -2 / height;
    out[10] = -2 / (far - near);
    out[12] = -1;
    out[13] = 1;
    out[14] = -(far + near) / (far - near);
    out[15] = 1;
    return out;
}

export function multiplyMatrix(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c += 1) {
        for (let r = 0; r < 4; r += 1) {
            out[c * 4 + r] = a[r] * b[c * 4]
                + a[4 + r] * b[c * 4 + 1]
                + a[8 + r] * b[c * 4 + 2]
                + a[12 + r] * b[c * 4 + 3];
        }
    }
    return out;
}

export function createTransformMatrix(tx, ty, tz, rx, ry, rz, sx = 1, sy = 1, sz = 1) {
    const cx = Math.cos(rx);
    const sx_ = Math.sin(rx);
    const cy = Math.cos(ry);
    const sy_ = Math.sin(ry);
    const cz = Math.cos(rz);
    const sz_ = Math.sin(rz);

    const m = new Float32Array(16);
    m[0] = (cy * cz) * sx;
    m[1] = (cy * sz_) * sx;
    m[2] = (-sy_) * sx;

    m[4] = (sx_ * sy_ * cz - cx * sz_) * sy;
    m[5] = (sx_ * sy_ * sz_ + cx * cz) * sy;
    m[6] = (sx_ * cy) * sy;

    m[8] = (cx * sy_ * cz + sx_ * sz_) * sz;
    m[9] = (cx * sy_ * sz_ - sx_ * cz) * sz;
    m[10] = (cx * cy) * sz;

    m[12] = tx;
    m[13] = ty;
    m[14] = tz;
    m[15] = 1;
    return m;
}

export function buildCubeVertices(s = 100) {
    const h = s * 0.5;
    const v = [
        [-h, -h, -h], [h, -h, -h], [h, -h, -h], [h, h, -h],
        [h, h, -h], [-h, h, -h], [-h, h, -h], [-h, -h, -h],
        [-h, -h, h], [h, -h, h], [h, -h, h], [h, h, h],
        [h, h, h], [-h, h, h], [-h, h, h], [-h, -h, h],
        [-h, -h, -h], [-h, -h, h], [h, -h, -h], [h, -h, h],
        [h, h, -h], [h, h, h], [-h, h, -h], [-h, h, h]
    ];
    return new Float32Array(v.flat());
}

export function buildIcosahedronVertices(r = 75) {
    const t = (1.0 + Math.sqrt(5.0)) / 2.0;
    const pts = [
        [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
        [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
        [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    const len = Math.hypot(1, t);
    const normPts = pts.map(([x, y, z]) => [(x / len) * r, (y / len) * r, (z / len) * r]);
    const edges = [
        [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
        [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
        [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
        [4, 9], [9, 8], [8, 6], [6, 2], [2, 4],
        [1, 9], [5, 4], [11, 2], [10, 6], [7, 8],
        [1, 8], [5, 9], [11, 4], [10, 2], [7, 6]
    ];
    const out = [];
    for (const [a, b] of edges) {
        out.push(...normPts[a], ...normPts[b]);
    }
    return new Float32Array(out);
}

export function buildTorusKnotVertices(r = 65, tube = 22, p = 2, q = 3, seg = 120) {
    const pts = [];
    for (let i = 0; i < seg; i += 1) {
        const phi = (i / seg) * Math.PI * 2;
        const r_ = r + tube * Math.cos(q * phi);
        const x = r_ * Math.cos(p * phi);
        const y = r_ * Math.sin(p * phi);
        const z = tube * Math.sin(q * phi);
        pts.push([x, y, z]);
    }
    const out = [];
    for (let i = 0; i < seg; i += 1) {
        const a = pts[i];
        const b = pts[(i + 1) % seg];
        out.push(...a, ...b);
    }
    return new Float32Array(out);
}

export function buildSphereVertices(r = 75, latCount = 8, lonCount = 12) {
    const out = [];
    for (let i = 1; i < latCount; i += 1) {
        const phi = (i / latCount) * Math.PI;
        const rad = r * Math.sin(phi);
        const y = r * Math.cos(phi);
        for (let j = 0; j < lonCount; j += 1) {
            const th1 = (j / lonCount) * Math.PI * 2;
            const th2 = ((j + 1) / lonCount) * Math.PI * 2;
            out.push(rad * Math.cos(th1), y, rad * Math.sin(th1));
            out.push(rad * Math.cos(th2), y, rad * Math.sin(th2));
        }
    }
    for (let i = 0; i < lonCount; i += 1) {
        const theta = (i / lonCount) * Math.PI * 2;
        for (let j = 0; j < latCount; j += 1) {
            const p1 = (j / latCount) * Math.PI;
            const p2 = ((j + 1) / latCount) * Math.PI;
            out.push(r * Math.sin(p1) * Math.cos(theta), r * Math.cos(p1), r * Math.sin(p1) * Math.sin(theta));
            out.push(r * Math.sin(p2) * Math.cos(theta), r * Math.cos(p2), r * Math.sin(p2) * Math.sin(theta));
        }
    }
    return new Float32Array(out);
}

export function buildCoreVertices(r = 55, h = 110, seg = 16) {
    const out = [];
    const hh = h * 0.5;
    for (let i = 0; i < seg; i += 1) {
        const th1 = (i / seg) * Math.PI * 2;
        const th2 = ((i + 1) / seg) * Math.PI * 2;
        const x1 = r * Math.cos(th1);
        const z1 = r * Math.sin(th1);
        const x2 = r * Math.cos(th2);
        const z2 = r * Math.sin(th2);
        out.push(x1, -hh, z1, x2, -hh, z2);
        out.push(x1, 0, z1, x2, 0, z2);
        out.push(x1, hh, z1, x2, hh, z2);
        if (i % 2 === 0) {
            out.push(x1, -hh, z1, x1, hh, z1);
        }
    }
    return new Float32Array(out);
}

export function getGeometryVertices(type, size = 110) {
    switch (type) {
    case "icosahedron": return buildIcosahedronVertices(size * 0.72);
    case "torusknot": return buildTorusKnotVertices(size * 0.65, size * 0.22);
    case "sphere": return buildSphereVertices(size * 0.72);
    case "core": return buildCoreVertices(size * 0.55, size * 1.1);
    case "box":
    default:
        return buildCubeVertices(size);
    }
}

export function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (h % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;
    if (hp >= 0 && hp < 1) { r = c; g = x; }
    else if (hp >= 1 && hp < 2) { r = x; g = c; }
    else if (hp >= 2 && hp < 3) { g = c; b = x; }
    else if (hp >= 3 && hp < 4) { g = x; b = c; }
    else if (hp >= 4 && hp < 5) { r = x; b = c; }
    else if (hp >= 5 && hp < 6) { r = c; b = x; }
    const m = l - c * 0.5;
    return [r + m, g + m, b + m];
}

export function getWindowColor(index, theme = "cyberpunk") {
    if (theme === "solar") {
        return hslToRgb(30 + (index * 25) % 45, 0.95, 0.55);
    }
    if (theme === "emerald") {
        return hslToRgb(140 + (index * 30) % 50, 0.90, 0.52);
    }
    if (theme === "violet") {
        return hslToRgb(270 + (index * 35) % 60, 0.90, 0.58);
    }
    return hslToRgb((index * 65 + 180) % 360, 0.95, 0.56);
}

export function createParticleSwarm(count = 72) {
    const data = new Float32Array(count * 6);
    for (let i = 0; i < count; i += 1) {
        data[i * 6] = (Math.random() - 0.5) * 600;
        data[i * 6 + 1] = (Math.random() - 0.5) * 600;
        data[i * 6 + 2] = (Math.random() - 0.5) * 200;
        data[i * 6 + 3] = (Math.random() - 0.5) * 40;
        data[i * 6 + 4] = (Math.random() - 0.5) * 40;
        data[i * 6 + 5] = Math.random();
    }
    return data;
}

export function updateParticleSwarm(data, windows, time) {
    if (!windows.length) return;
    const count = data.length / 6;
    for (let i = 0; i < count; i += 1) {
        const off = i * 6;
        const targetWin = windows[i % windows.length];
        const tx = targetWin.shape.x + targetWin.shape.w * 0.5;
        const ty = targetWin.shape.y + targetWin.shape.h * 0.5;
        const phase = time * 1.5 + data[off + 5] * Math.PI * 2;
        const orbitR = 120 + 30 * Math.sin(phase * 0.7);

        const goalX = tx + Math.cos(phase) * orbitR;
        const goalY = ty + Math.sin(phase) * orbitR;
        const goalZ = Math.sin(phase * 1.3) * 60;

        data[off] += (goalX - data[off]) * 0.04;
        data[off + 1] += (goalY - data[off + 1]) * 0.04;
        data[off + 2] += (goalZ - data[off + 2]) * 0.04;
    }
}
