import { hash2 } from "./voxel-noise.js";

const smooth = (t) => t * t * (3 - 2 * t);
const mixValue = (a, b, t) => a + (b - a) * t;
const wrap = (i, n) => ((i % n) + n) % n;

export function tileNoise(u, v, cells, seed) {
    const fx = u * cells;
    const fy = v * cells;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = smooth(fx - ix);
    const ty = smooth(fy - iy);
    const a = hash2(wrap(ix, cells), wrap(iy, cells), seed);
    const b = hash2(wrap(ix + 1, cells), wrap(iy, cells), seed);
    const c = hash2(wrap(ix, cells), wrap(iy + 1, cells), seed);
    const d = hash2(wrap(ix + 1, cells), wrap(iy + 1, cells), seed);
    return mixValue(mixValue(a, b, tx), mixValue(c, d, tx), ty);
}

export function tileFbm(u, v, baseCells, octaves, seed) {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    let cells = baseCells;
    for (let i = 0; i < octaves; i += 1) {
        sum += tileNoise(u, v, cells, seed + i * 131) * amp;
        norm += amp;
        amp *= 0.5;
        cells *= 2;
    }
    return sum / norm;
}

export function ridge(value) {
    return 1 - Math.abs(value * 2 - 1);
}

export function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
