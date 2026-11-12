export function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function hash2(ix, iz, seed = 1337) {
    let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 1442695041);
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function hash3(ix, iy, iz, seed = 1337) {
    let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 2147483647) + Math.imul(seed, 1442695041);
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function fade(t) {
    return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function noise2(x, z, seed = 1337) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = fade(x - ix);
    const fz = fade(z - iz);
    const a = hash2(ix, iz, seed);
    const b = hash2(ix + 1, iz, seed);
    const c = hash2(ix, iz + 1, seed);
    const d = hash2(ix + 1, iz + 1, seed);
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
}

export function noise3(x, y, z, seed = 1337) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    const fx = fade(x - ix);
    const fy = fade(y - iy);
    const fz = fade(z - iz);
    const c000 = hash3(ix, iy, iz, seed);
    const c100 = hash3(ix + 1, iy, iz, seed);
    const c010 = hash3(ix, iy + 1, iz, seed);
    const c110 = hash3(ix + 1, iy + 1, iz, seed);
    const c001 = hash3(ix, iy, iz + 1, seed);
    const c101 = hash3(ix + 1, iy, iz + 1, seed);
    const c011 = hash3(ix, iy + 1, iz + 1, seed);
    const c111 = hash3(ix + 1, iy + 1, iz + 1, seed);
    const x00 = lerp(c000, c100, fx);
    const x10 = lerp(c010, c110, fx);
    const x01 = lerp(c001, c101, fx);
    const x11 = lerp(c011, c111, fx);
    return lerp(lerp(x00, x10, fy), lerp(x01, x11, fy), fz);
}

export function fbm2(x, z, octaves = 4, seed = 1337) {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    let freq = 1;
    for (let i = 0; i < octaves; i += 1) {
        sum += noise2(x * freq, z * freq, seed + i * 71) * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2.02;
    }
    return sum / norm;
}

export function ridged2(x, z, octaves = 3, seed = 4099) {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    let freq = 1;
    for (let i = 0; i < octaves; i += 1) {
        const n = noise2(x * freq, z * freq, seed + i * 97);
        const r = 1 - Math.abs(n * 2 - 1);
        sum += r * r * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2.08;
    }
    return sum / norm;
}

export function fbm3(x, y, z, octaves = 3, seed = 7919) {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    let freq = 1;
    for (let i = 0; i < octaves; i += 1) {
        sum += noise3(x * freq, y * freq, z * freq, seed + i * 53) * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2.03;
    }
    return sum / norm;
}
