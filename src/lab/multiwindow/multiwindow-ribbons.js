import { getWindowColors } from "./multiwindow-math.js";

export function getWindowCenter(win, sceneOffset = { x: 0, y: 0 }) {
    const s = win.shape;
    const baseX = typeof s.cx === "number" ? s.cx : s.x + s.w * 0.5;
    const baseY = typeof s.cy === "number" ? s.cy : s.y + s.h * 0.5;
    return {
        x: baseX + sceneOffset.x,
        y: baseY + sceneOffset.y
    };
}

export function appendSmoothRibbon(out, pts, halfWidth, colA, colB, alphaScale = 1.0, fadeEnds = true) {
    const n = pts.length;
    if (n < 2) return;
    let prevLx = 0;
    let prevLy = 0;
    let prevRx = 0;
    let prevRy = 0;
    let prevZ = 0;
    let prevCr = 0;
    let prevCg = 0;
    let prevCb = 0;

    for (let i = 0; i < n; i += 1) {
        const u = i / (n - 1);
        const cur = pts[i];
        const prev = pts[i > 0 ? i - 1 : i];
        const next = pts[i < n - 1 ? i + 1 : i];
        let tx = next[0] - prev[0];
        let ty = next[1] - prev[1];
        const tLen = Math.hypot(tx, ty) || 1;
        tx /= tLen;
        ty /= tLen;
        const px = -ty;
        const py = tx;

        const endTaper = fadeEnds ? Math.sin(u * Math.PI) : 1.0;
        const taper = fadeEnds ? (0.32 + 0.68 * Math.pow(endTaper, 0.45)) : 1.0;
        const w = halfWidth * taper;
        const lx = cur[0] + px * w;
        const ly = cur[1] + py * w;
        const rx = cur[0] - px * w;
        const ry = cur[1] - py * w;
        const cz = cur[2];

        const fade = (fadeEnds ? Math.pow(endTaper, 0.5) : 1.0) * alphaScale;
        const cr = (colA[0] * (1 - u) + colB[0] * u) * fade;
        const cg = (colA[1] * (1 - u) + colB[1] * u) * fade;
        const cb = (colA[2] * (1 - u) + colB[2] * u) * fade;

        if (i > 0) {
            out.push(
                prevLx, prevLy, prevZ, prevCr, prevCg, prevCb, -1.0,
                prevRx, prevRy, prevZ, prevCr, prevCg, prevCb, 1.0,
                lx, ly, cz, cr, cg, cb, -1.0,
                prevRx, prevRy, prevZ, prevCr, prevCg, prevCb, 1.0,
                rx, ry, cz, cr, cg, cb, 1.0,
                lx, ly, cz, cr, cg, cb, -1.0
            );
        }

        prevLx = lx;
        prevLy = ly;
        prevRx = rx;
        prevRy = ry;
        prevZ = cz;
        prevCr = cr;
        prevCg = cg;
        prevCb = cb;
    }
}

export function buildWireframeRibbons(lineVerts, modelMat, col, halfWidth = 2.6, alphaScale = 0.85) {
    const out = [];
    const m = modelMat;
    const xform = (x, y, z) => [
        m[0] * x + m[4] * y + m[8] * z + m[12],
        m[1] * x + m[5] * y + m[9] * z + m[13],
        m[2] * x + m[6] * y + m[10] * z + m[14]
    ];
    for (let i = 0; i < lineVerts.length; i += 6) {
        const a = xform(lineVerts[i], lineVerts[i + 1], lineVerts[i + 2]);
        const b = xform(lineVerts[i + 3], lineVerts[i + 4], lineVerts[i + 5]);
        appendSmoothRibbon(out, [a, b], halfWidth, col, col, alphaScale, false);
    }
    return new Float32Array(out);
}

export function generateBridgeRibbons(windows, sceneOffset, time, theme = "staal", dense = true) {
    const out = [];
    if (!Array.isArray(windows) || windows.length < 2) return new Float32Array(0);
    const sorted = [...windows].sort((a, b) => a.id - b.id);
    const strandCount = dense ? 24 : 8;
    const segs = dense ? 96 : 64;

    for (let i = 0; i < sorted.length; i += 1) {
        for (let j = i + 1; j < sorted.length; j += 1) {
            const ca = getWindowCenter(sorted[i], sceneOffset);
            const cb = getWindowCenter(sorted[j], sceneOffset);
            const dx = cb.x - ca.x;
            const dy = cb.y - ca.y;
            const len = Math.hypot(dx, dy);
            if (len < 12) continue;
            const nx = -dy / len;
            const ny = dx / len;
            const colA = getWindowColors(i, theme).outer;
            const colB = getWindowColors(j, theme).outer;
            const radius = dense ? 132 : 44;

            for (let s = 0; s < strandCount; s += 1) {
                const dir = s % 2 === 0 ? 1 : -1;
                const phase = (s * Math.PI * 2) / strandCount;
                const radialTier = 0.24 + 0.76 * Math.sqrt(((s * 0.6180339887) % 1));
                const twistTurns = 0.24 + (s % 3) * 0.14;
                const pts = [];

                for (let k = 0; k <= segs; k += 1) {
                    const u = k / segs;
                    const bx = ca.x + dx * u;
                    const by = ca.y + dy * u;
                    const dCenter = (u - 0.5) * 2.0;
                    const neck = 0.24 + 0.76 * (dCenter * dCenter);
                    const breathe = 1.0 + 0.035 * Math.sin(u * Math.PI * 2.0 - time * 1.1 * dir + phase);
                    const r = radius * neck * radialTier * breathe;
                    const ang = phase + u * Math.PI * 2.0 * twistTurns * dir + time * 0.34 * dir;
                    const off = Math.cos(ang) * r;
                    const z = Math.sin(ang) * r;
                    pts.push([bx + nx * off, by + ny * off, z]);
                }

                const width = dense ? (3.6 + (1.0 - radialTier) * 2.4) : 3.4;
                const alpha = dense ? (0.3 + 0.24 * (1.0 - radialTier * 0.55)) : 0.46;
                appendSmoothRibbon(out, pts, width, colA, colB, alpha, true);
            }

            const spinePts = [];
            for (let k = 0; k <= segs; k += 1) {
                const u = k / segs;
                const sway = Math.sin(u * Math.PI * 2.0 - time * 0.75) * Math.sin(u * Math.PI) * (dense ? 5.0 : 3.0);
                spinePts.push([ca.x + dx * u + nx * sway, ca.y + dy * u + ny * sway, 0]);
            }
            appendSmoothRibbon(out, spinePts, dense ? 26.0 : 12.0, colA, colB, dense ? 0.16 : 0.24, true);
            appendSmoothRibbon(out, spinePts, dense ? 6.5 : 3.6, colA, colB, dense ? 0.36 : 0.5, true);
        }
    }
    return new Float32Array(out);
}
