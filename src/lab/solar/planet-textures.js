import { SUN_DEF, PLANET_CATALOG } from "./solar-catalog.js";

const textureCache = new Map();
const ringCache = new Map();

function hash3(ix, iy, iz, seed) {
    let n = (ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1597334677) | 0;
    n = (n ^ (n >>> 13)) | 0;
    n = Math.imul(n, 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function clampByte(v) {
    return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function noise3(x, y, z, seed) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    const fx = smoothstep(x - ix);
    const fy = smoothstep(y - iy);
    const fz = smoothstep(z - iz);
    const nx00 = lerp(hash3(ix, iy, iz, seed), hash3(ix + 1, iy, iz, seed), fx);
    const nx10 = lerp(hash3(ix, iy + 1, iz, seed), hash3(ix + 1, iy + 1, iz, seed), fx);
    const nx01 = lerp(hash3(ix, iy, iz + 1, seed), hash3(ix + 1, iy, iz + 1, seed), fx);
    const nx11 = lerp(hash3(ix, iy + 1, iz + 1, seed), hash3(ix + 1, iy + 1, iz + 1, seed), fx);
    return lerp(lerp(nx00, nx10, fy), lerp(nx01, nx11, fy), fz);
}

function fbm3(x, y, z, seed, octaves = 4) {
    let total = 0;
    let amp = 0.5;
    let freq = 1;
    let norm = 0;
    for (let i = 0; i < octaves; i += 1) {
        total += amp * noise3(x * freq, y * freq, z * freq, seed + i * 97);
        norm += amp;
        amp *= 0.5;
        freq *= 2.03;
    }
    return total / norm;
}

function samplePlanetPixel(bodyId, nx, ny, nz) {
    if (bodyId === "sun") {
        const g1 = fbm3(nx * 5.2, ny * 5.2, nz * 5.2, 101, 4);
        const g2 = fbm3(nx * 11, ny * 11, nz * 11, 202, 3);
        const hot = Math.min(1, g1 * 0.72 + g2 * 0.35);
        return [clampByte(lerp(245, 255, hot)), clampByte(lerp(132, 245, hot)), clampByte(lerp(24, 178, Math.pow(hot, 1.5)))];
    }
    if (bodyId === "mercury" || bodyId === "moon") {
        const maria = fbm3(nx * 2.4, ny * 2.4, nz * 2.4, bodyId === "moon" ? 331 : 307, 4);
        const ridge = 1 - Math.abs(fbm3(nx * 9.8, ny * 9.8, nz * 9.8, 313, 3) - 0.5) * 2;
        const fine = fbm3(nx * 19, ny * 19, nz * 19, 317, 2);
        const basin = maria < 0.46 ? 0.58 + (maria / 0.46) * 0.22 : 0.78 + (maria - 0.46) * 0.42;
        const v = Math.max(0.24, Math.min(1, basin * 0.72 + ridge * 0.24 + fine * 0.14));
        return [clampByte(v * 224), clampByte(v * 222), clampByte(v * 226)];
    }
    if (bodyId === "venus") {
        const warp = fbm3(nx * 3.1, ny * 4.8, nz * 3.1, 401, 3) * 1.4;
        const chevron = fbm3(nx * 2.6 + warp, ny * 7.2, nz * 2.6 - warp, 409, 4);
        const band = 0.5 + 0.5 * Math.sin(ny * 10 + chevron * 4.6);
        const t = Math.min(1, band * 0.55 + chevron * 0.52);
        return [clampByte(lerp(168, 246, t)), clampByte(lerp(106, 204, t)), clampByte(lerp(46, 124, t))];
    }
    if (bodyId === "earth") {
        const warp = fbm3(nx * 2.2, ny * 2.2, nz * 2.2, 499, 3) * 0.55;
        const cont = fbm3(nx * 2.8 + warp, ny * 2.8, nz * 2.8 - warp, 503, 5);
        const cloud = fbm3(nx * 5.2 + warp * 2.4, ny * 7.4, nz * 5.2, 521, 4);
        const ice = Math.abs(ny) + (cont - 0.5) * 0.18 > 0.85;
        let [r, g, b] = [12, 58, 138];
        if (ice) {
            [r, g, b] = [238, 246, 255];
        } else if (cont > 0.495) {
            const elev = Math.min(1, (cont - 0.495) * 4.8);
            const arid = Math.max(0, 1 - Math.abs(ny) * 2.15) * (0.42 + 0.58 * elev);
            [r, g, b] = [lerp(36, 184, arid), lerp(118, 152, arid * 0.78), lerp(48, 88, elev)];
            if (elev > 0.76) [r, g, b] = [lerp(r, 224, elev - 0.7), lerp(g, 224, elev - 0.7), lerp(b, 228, elev - 0.7)];
        } else {
            const shelf = Math.max(0, (cont - 0.34) * 5.2);
            [r, g, b] = [lerp(9, 32, shelf), lerp(42, 138, shelf), lerp(116, 212, shelf)];
        }
        const cA = cloud > 0.55 ? Math.min(0.9, (cloud - 0.55) * 3.4) : 0;
        return [clampByte(lerp(r, 250, cA)), clampByte(lerp(g, 252, cA)), clampByte(lerp(b, 255, cA))];
    }
    if (bodyId === "mars") {
        const warp = fbm3(nx * 2.8, ny * 2.8, nz * 2.8, 607, 3);
        const dust = fbm3(nx * 3.8 + warp * 0.4, ny * 3.8, nz * 3.8, 613, 4);
        const basalt = fbm3(nx * 6.5, ny * 6.5, nz * 6.5, 631, 3);
        if (Math.abs(ny) + (basalt - 0.5) * 0.08 > 0.9) return [242, 232, 226];
        const tone = Math.max(0, Math.min(1, dust * 0.68 + basalt * 0.38 - 0.05));
        return [clampByte(lerp(96, 224, tone)), clampByte(lerp(36, 114, tone)), clampByte(lerp(20, 62, tone))];
    }
    if (bodyId === "jupiter") {
        const turb = fbm3(nx * 5.8, ny * 9.5, nz * 5.8, 709, 4);
        const eddy = fbm3(nx * 11, ny * 14, nz * 11, 719, 3);
        const lat = ny + (turb - 0.5) * 0.14 + (eddy - 0.5) * 0.05;
        const zone = Math.sin(lat * 26 + turb * 3.2);
        const belt = 0.5 + 0.5 * Math.cos(lat * 13);
        const spotDist = Math.hypot((nx - 0.72) * 1.4, (ny + 0.28) * 3.0, nz - 0.62);
        if (spotDist < 0.23) {
            const core = 1 - spotDist / 0.23;
            return [clampByte(lerp(214, 218, core)), clampByte(lerp(132, 74, core)), clampByte(lerp(88, 52, core))];
        }
        const w = Math.max(0, Math.min(1, 0.52 + zone * 0.34 + (belt - 0.5) * 0.28));
        return [clampByte(lerp(132, 245, w)), clampByte(lerp(76, 228, w)), clampByte(lerp(46, 198, w))];
    }
    if (bodyId === "saturn") {
        const wisp = fbm3(nx * 4.2, ny * 8.0, nz * 4.2, 809, 3);
        const band = 0.5 + 0.5 * Math.sin((ny + (wisp - 0.5) * 0.05) * 22);
        if (Math.abs(ny) > 0.85) return [152, 168, 174];
        return [clampByte(lerp(176, 244, band)), clampByte(lerp(144, 224, band)), clampByte(lerp(96, 178, band))];
    }
    if (bodyId === "uranus") {
        const haze = fbm3(nx * 3.6, ny * 6.0, nz * 3.6, 907, 3);
        const band = 0.5 + 0.5 * Math.cos(ny * 7.5 + haze * 1.1);
        return [clampByte(lerp(94, 178, band)), clampByte(lerp(204, 242, band)), clampByte(lerp(218, 246, band))];
    }
    const swirl = fbm3(nx * 4.5, ny * 7.8, nz * 4.5, 991, 4);
    const streak = swirl > 0.61 ? Math.min(1, (swirl - 0.61) * 3.8) : 0;
    const base = 0.5 + 0.5 * Math.sin(ny * 10 + swirl * 2.5);
    return [
        clampByte(lerp(lerp(20, 48, base), 205, streak)),
        clampByte(lerp(lerp(72, 138, base), 234, streak)),
        clampByte(lerp(lerp(184, 244, base), 255, streak))
    ];
}

export function generatePlanetTextureData(bodyId, width = 256, height = 128) {
    const key = `${bodyId}:${width}x${height}`;
    if (textureCache.has(key)) return textureCache.get(key);
    const data = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y += 1) {
        const v = (y + 0.5) / height;
        const theta = v * Math.PI;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);
        for (let x = 0; x < width; x += 1) {
            const u = (x + 0.5) / width;
            const phi = u * Math.PI * 2;
            const nx = Math.cos(phi) * sinT;
            const ny = cosT;
            const nz = Math.sin(phi) * sinT;
            const [r, g, b] = samplePlanetPixel(bodyId, nx, ny, nz);
            const idx = (y * width + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
        }
    }
    const tex = { width, height, data };
    textureCache.set(key, tex);
    return tex;
}

export function generateRingTextureData(bodyId = "saturn", width = 256) {
    const key = `${bodyId}:ring:${width}`;
    if (ringCache.has(key)) return ringCache.get(key);
    const data = new Uint8Array(width * 4);
    for (let x = 0; x < width; x += 1) {
        const t = x / (width - 1);
        const idx = x * 4;
        if (bodyId === "saturn") {
            const edgeFade = Math.sin(Math.min(1, t * 7) * Math.PI * 0.5) * Math.sin(Math.min(1, (1 - t) * 7) * Math.PI * 0.5);
            const cassini = t > 0.56 && t < 0.64 ? 0.12 : 1;
            const encke = t > 0.87 && t < 0.895 ? 0.35 : 1;
            const wave = 0.65 + 0.35 * Math.sin(t * 74) * Math.cos(t * 29);
            const alpha = Math.max(0, Math.min(1, edgeFade * cassini * encke * (0.48 + 0.42 * wave)));
            data[idx] = clampByte(lerp(182, 240, wave));
            data[idx + 1] = clampByte(lerp(164, 224, wave));
            data[idx + 2] = clampByte(lerp(136, 194, wave));
            data[idx + 3] = clampByte(alpha * 238);
        } else {
            const band = (t > 0.32 && t < 0.37) || (t > 0.62 && t < 0.72) ? 0.55 : 0.08;
            data[idx] = 165;
            data[idx + 1] = 232;
            data[idx + 2] = 248;
            data[idx + 3] = clampByte(band * 170);
        }
    }
    const tex = { width, height: 1, data };
    ringCache.set(key, tex);
    return tex;
}

function drawSaturnRingArc(ctx, cx, cy, rx, ry, rotRad, startAng, endAng) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRad);
    ctx.lineCap = "butt";
    const bands = [
        { s: 1.0, w: 0.24, c: "rgba(218, 200, 170, 0.9)" },
        { s: 0.82, w: 0.12, c: "rgba(182, 162, 134, 0.72)" },
        { s: 0.7, w: 0.08, c: "rgba(130, 114, 96, 0.42)" }
    ];
    for (const band of bands) {
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * band.s, ry * band.s, 0, startAng, endAng);
        ctx.strokeStyle = band.c;
        ctx.lineWidth = Math.max(1.5, rx * band.w * 0.36);
        ctx.stroke();
    }
    ctx.restore();
}

export function drawPlanetThumbnail(canvas, bodyDef) {
    if (!canvas || typeof canvas.getContext !== "function") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width || 96;
    const h = canvas.height || 96;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const ringR = Math.min(w, h) * 0.36;
    const sphereR = ringR * 0.76;

    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.fillStyle = "#111a1e";
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.stroke();

    if (bodyDef.hasRing) {
        drawSaturnRingArc(ctx, cx, cy, ringR * 1.44, ringR * 0.38, -0.42, Math.PI, Math.PI * 2);
    }

    const tex = generatePlanetTextureData(bodyDef.id, 128, 64);
    const size = Math.max(20, Math.round(sphereR * 2));
    const off = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null;
    if (off && typeof off.getContext === "function") {
        off.width = size;
        off.height = size;
        const octx = off.getContext("2d");
        if (octx && typeof octx.createImageData === "function") {
            const img = octx.createImageData(size, size);
            const rPx = size * 0.5;
            const [lx, ly, lz] = [-0.52, -0.36, 0.77];
            for (let py = 0; py < size; py += 1) {
                const dy = (py + 0.5 - rPx) / rPx;
                for (let px = 0; px < size; px += 1) {
                    const dx = (px + 0.5 - rPx) / rPx;
                    const rr = dx * dx + dy * dy;
                    if (rr > 1) continue;
                    const dz = Math.sqrt(1 - rr);
                    const u = (Math.atan2(dx, dz) / (Math.PI * 2) + 1.12) % 1;
                    const v = Math.acos(Math.max(-1, Math.min(1, -dy))) / Math.PI;
                    const tx = Math.min(tex.width - 1, Math.floor(u * tex.width));
                    const ty = Math.min(tex.height - 1, Math.floor(v * tex.height));
                    const ti = (ty * tex.width + tx) * 4;
                    const rawLit = Math.max(0, Math.min(1, (dx * lx + dy * ly + dz * lz + 0.22) / 1.12));
                    const ndotl = 0.16 + 0.94 * smoothstep(rawLit);
                    const fresnel = bodyDef.hasAtmosphere ? Math.pow(1 - dz, 2.6) * 0.45 * (0.3 + 0.7 * rawLit) : 0;
                    const di = (py * size + px) * 4;
                    img.data[di] = clampByte(tex.data[ti] * ndotl + fresnel * 95);
                    img.data[di + 1] = clampByte(tex.data[ti + 1] * ndotl + fresnel * 165);
                    img.data[di + 2] = clampByte(tex.data[ti + 2] * ndotl + fresnel * 245);
                    img.data[di + 3] = 255;
                }
            }
            octx.putImageData(img, 0, 0);
            ctx.drawImage(off, cx - sphereR, cy - sphereR, sphereR * 2, sphereR * 2);
        }
    } else {
        ctx.beginPath();
        ctx.arc(cx, cy, sphereR, 0, Math.PI * 2);
        ctx.fillStyle = bodyDef.color || "#93c5fd";
        ctx.fill();
    }
    if (bodyDef.hasRing) drawSaturnRingArc(ctx, cx, cy, ringR * 1.44, ringR * 0.38, -0.42, 0, Math.PI);
}

export function prewarmSolarTextures() {
    generatePlanetTextureData(SUN_DEF.id, 256, 128);
    generatePlanetTextureData("moon", 128, 64);
    for (const p of PLANET_CATALOG) {
        generatePlanetTextureData(p.id, 256, 128);
        if (p.hasRing) generateRingTextureData(p.id, 256);
    }
}
