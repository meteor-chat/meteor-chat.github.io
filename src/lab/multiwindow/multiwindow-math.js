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
            out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
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

export function getWindowColors(index, theme = "staal") {
    const palettes = {
        staal: [
            { outer: [0.0, 0.95, 0.46], core: [1.0, 0.09, 0.28] },
            { outer: [1.0, 0.09, 0.28], core: [0.0, 0.95, 0.46] },
            { outer: [0.08, 0.85, 1.0], core: [1.0, 0.55, 0.0] },
            { outer: [1.0, 0.55, 0.0], core: [0.08, 0.85, 1.0] }
        ],
        cyberpunk: [
            { outer: [0.1, 0.88, 1.0], core: [0.95, 0.15, 0.85] },
            { outer: [0.95, 0.15, 0.85], core: [0.1, 0.88, 1.0] },
            { outer: [1.0, 0.85, 0.1], core: [0.2, 0.4, 1.0] },
            { outer: [0.2, 0.4, 1.0], core: [1.0, 0.85, 0.1] }
        ],
        solar: [
            { outer: [1.0, 0.72, 0.12], core: [1.0, 0.18, 0.1] },
            { outer: [1.0, 0.18, 0.1], core: [1.0, 0.72, 0.12] }
        ],
        emerald: [
            { outer: [0.0, 0.98, 0.6], core: [0.2, 0.6, 1.0] },
            { outer: [0.2, 0.6, 1.0], core: [0.0, 0.98, 0.6] }
        ]
    };
    const list = palettes[theme] || palettes.staal;
    return list[index % list.length];
}

export function getWindowColor(index, theme = "staal") {
    return getWindowColors(index, theme).outer;
}

export function buildCubeVertices(s = 100) {
    const h = s * 0.5;
    const v = [
        [-h, -h, -h], [h, -h, -h], [h, -h, -h], [h, h, -h], [h, h, -h], [-h, h, -h], [-h, h, -h], [-h, -h, -h],
        [-h, -h, h], [h, -h, h], [h, -h, h], [h, h, h], [h, h, h], [-h, h, h], [-h, h, h], [-h, -h, h],
        [-h, -h, -h], [-h, -h, h], [h, -h, -h], [h, -h, h], [h, h, -h], [h, h, h], [-h, h, -h], [-h, h, h]
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
        [0, 11], [0, 5], [0, 1], [0, 7], [0, 10], [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
        [3, 9], [3, 4], [3, 2], [3, 6], [3, 8], [4, 9], [9, 8], [8, 6], [6, 2], [2, 4],
        [1, 9], [5, 4], [11, 2], [10, 6], [7, 8], [1, 8], [5, 9], [11, 4], [10, 2], [7, 6]
    ];
    const out = [];
    for (const [a, b] of edges) out.push(...normPts[a], ...normPts[b]);
    return new Float32Array(out);
}

export function buildTorusKnotVertices(r = 65, tube = 22, p = 2, q = 3, seg = 120) {
    const pts = [];
    for (let i = 0; i < seg; i += 1) {
        const phi = (i / seg) * Math.PI * 2;
        const r_ = r + tube * Math.cos(q * phi);
        pts.push([r_ * Math.cos(p * phi), r_ * Math.sin(p * phi), tube * Math.sin(q * phi)]);
    }
    const out = [];
    for (let i = 0; i < seg; i += 1) out.push(...pts[i], ...pts[(i + 1) % seg]);
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
            out.push(rad * Math.cos(th1), y, rad * Math.sin(th1), rad * Math.cos(th2), y, rad * Math.sin(th2));
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
        out.push(r * Math.cos(th1), -hh, r * Math.sin(th1), r * Math.cos(th2), -hh, r * Math.sin(th2));
        out.push(r * Math.cos(th1), 0, r * Math.sin(th1), r * Math.cos(th2), 0, r * Math.sin(th2));
        out.push(r * Math.cos(th1), hh, r * Math.sin(th1), r * Math.cos(th2), hh, r * Math.sin(th2));
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

export function appendOrbParticles(out, cx, cy, radius, count, time, colOuter, colCore) {
    const phiGold = Math.PI * (3 - Math.sqrt(5));
    const outerCount = Math.floor(count * 0.7);
    for (let i = 0; i < outerCount; i += 1) {
        const y = 1 - (i / (outerCount - 1)) * 2;
        const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = phiGold * i + time * 0.4;
        const volFrac = 0.55 + 0.45 * Math.sqrt(((i * 1.3247) % 1));
        const noise = 1 + 0.15 * Math.sin(3 * theta + time * 1.5) * Math.cos(4 * y - time);
        const r = radius * volFrac * noise;
        const sz = 5.0 + 3.0 * Math.sin(i * 1.7 + time * 2);
        out.push(cx + Math.cos(theta) * radiusAtY * r, cy + y * r, Math.sin(theta) * radiusAtY * r, colOuter[0], colOuter[1], colOuter[2], sz);
    }
    const coreCount = count - outerCount;
    const coreR = radius * 0.44;
    for (let i = 0; i < coreCount; i += 1) {
        const y = 1 - (i / (coreCount - 1)) * 2;
        const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = phiGold * i - time * 0.7;
        const volFrac = 0.3 + 0.7 * Math.sqrt(((i * 1.4142) % 1));
        const noise = 1 + 0.12 * Math.sin(5 * theta - time * 2);
        const r = coreR * volFrac * noise;
        const sz = 5.5 + 3.0 * Math.cos(i * 2.3 + time * 3);
        out.push(cx + Math.cos(theta) * radiusAtY * r, cy + y * r, Math.sin(theta) * radiusAtY * r, colCore[0], colCore[1], colCore[2], sz);
    }
}

export function appendBridgeParticles(out, ax, ay, bx, by, count, time, colA, colB, radius = 140) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 10) return;
    const nx = -dy / len;
    const ny = dx / len;
    for (let i = 0; i < count; i += 1) {
        const isForward = i % 2 === 0;
        const speed = isForward ? 0.16 : -0.16;
        const uRaw = (i / count + time * speed) % 1.0;
        const u = uRaw < 0 ? uRaw + 1.0 : uRaw;
        const pxBase = ax + dx * u;
        const pyBase = ay + dy * u;
        const dCenter = Math.abs(u - 0.5) * 2.0;
        const neckFactor = 0.35 + 0.65 * (dCenter * dCenter);
        const fracR = Math.sqrt(((i * 1.618033) % 1));
        const r = radius * neckFactor * fracR * (1.0 + 0.08 * Math.sin(u * Math.PI * 4.0 - time * 2.0));
        const angle = u * Math.PI * 4.0 + (i * 2.399963) + time * (isForward ? 1.5 : -1.5);
        const rx = Math.cos(angle) * nx * r;
        const ry = Math.cos(angle) * ny * r;
        const rz = Math.sin(angle) * r;
        const baseCol = isForward ? colA : colB;
        const blendCol = isForward ? colB : colA;
        const blendRatio = isForward ? u : (1.0 - u);
        const cr = baseCol[0] * (1.0 - blendRatio) + blendCol[0] * blendRatio;
        const cg = baseCol[1] * (1.0 - blendRatio) + blendCol[1] * blendRatio;
        const cb = baseCol[2] * (1.0 - blendRatio) + blendCol[2] * blendRatio;
        const sz = (fracR < 0.35 ? 6.5 : 4.5) + 2.5 * Math.sin(u * Math.PI);
        out.push(pxBase + rx, pyBase + ry, rz, cr, cg, cb, sz);
    }
}

export function generateWormholeSceneData(windows, sceneOffset, time, theme = "staal") {
    const out = [];
    if (!Array.isArray(windows) || windows.length === 0) return new Float32Array(0);
    const sorted = [...windows].sort((a, b) => a.id - b.id);
    for (let i = 0; i < sorted.length; i += 1) {
        const win = sorted[i];
        const cx = win.shape.x + win.shape.w * 0.5 + sceneOffset.x;
        const cy = win.shape.y + win.shape.h * 0.5 + sceneOffset.y;
        const cols = getWindowColors(i, theme);
        appendOrbParticles(out, cx, cy, 140, 1400, time + i * 2, cols.outer, cols.core);
    }
    if (sorted.length > 1) {
        for (let i = 0; i < sorted.length; i += 1) {
            for (let j = i + 1; j < sorted.length; j += 1) {
                const wa = sorted[i].shape;
                const wb = sorted[j].shape;
                const ax = wa.x + wa.w * 0.5 + sceneOffset.x;
                const ay = wa.y + wa.h * 0.5 + sceneOffset.y;
                const bx = wb.x + wb.w * 0.5 + sceneOffset.x;
                const by = wb.y + wb.h * 0.5 + sceneOffset.y;
                const colA = getWindowColors(i, theme).outer;
                const colB = getWindowColors(j, theme).outer;
                appendBridgeParticles(out, ax, ay, bx, by, 4000, time, colA, colB, 140);
            }
        }
    }
    return new Float32Array(out);
}

export function createParticleSwarm(count = 64) {
    const out = new Float32Array(count * 6);
    for (let i = 0; i < count; i += 1) {
        out[i * 6] = (Math.random() - 0.5) * 800;
        out[i * 6 + 1] = (Math.random() - 0.5) * 600;
        out[i * 6 + 2] = (Math.random() - 0.5) * 200;
        out[i * 6 + 3] = (Math.random() - 0.5) * 40;
        out[i * 6 + 4] = (Math.random() - 0.5) * 40;
        out[i * 6 + 5] = (Math.random() - 0.5) * 20;
    }
    return out;
}

export function updateParticleSwarm(particles, windows, time) {
    if (!particles) return;
    const count = particles.length / 6;
    for (let i = 0; i < count; i += 1) {
        particles[i * 6] += Math.sin(time + i) * 0.6;
        particles[i * 6 + 1] += Math.cos(time + i * 1.3) * 0.6;
    }
}
