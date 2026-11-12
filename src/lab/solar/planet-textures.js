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
    if (bodyId === "mercury") {
        const base = fbm3(nx * 3.5, ny * 3.5, nz * 3.5, 307, 4);
        const crater = Math.abs(fbm3(nx * 9.5, ny * 9.5, nz * 9.5, 311, 3) - 0.5) * 2;
        const v = Math.max(0.18, Math.min(1, base * 0.78 + crater * 0.32));
        return [clampByte(v * 218), clampByte(v * 216), clampByte(v * 220)];
    }
    if (bodyId === "venus") {
        const swirl = fbm3(nx * 2.8 + ny * 1.1, ny * 5.5, nz * 2.8, 409, 4);
        const band = 0.5 + 0.5 * Math.sin(ny * 7 + swirl * 4.2);
        const t = Math.min(1, band * 0.6 + swirl * 0.5);
        return [clampByte(lerp(148, 240, t)), clampByte(lerp(86, 188, t)), clampByte(lerp(34, 102, t))];
    }
    if (bodyId === "earth") {
        const cont = fbm3(nx * 2.6, ny * 2.6, nz * 2.6, 503, 5);
        const cloud = fbm3(nx * 4.4 + 1.8, ny * 6.2, nz * 4.4, 521, 4);
        const ice = Math.abs(ny) + (cont - 0.5) * 0.14 > 0.86;
        let [r, g, b] = [24, 104, 216];
        if (ice) {
            [r, g, b] = [240, 247, 255];
        } else if (cont > 0.505) {
            const elev = Math.min(1, (cont - 0.505) * 4.5);
            const arid = Math.max(0, 1 - Math.abs(ny) * 2.2) * (0.45 + 0.55 * elev);
            [r, g, b] = [lerp(52, 188, arid), lerp(148, 166, arid * 0.8), lerp(64, 96, elev)];
        } else {
            const shelf = Math.max(0, (cont - 0.36) * 5);
            [r, g, b] = [lerp(18, 48, shelf), lerp(68, 168, shelf), lerp(188, 238, shelf)];
        }
        const cA = cloud > 0.57 ? Math.min(0.85, (cloud - 0.57) * 3.1) : 0;
        return [clampByte(lerp(r, 252, cA)), clampByte(lerp(g, 254, cA)), clampByte(lerp(b, 255, cA))];
    }
    if (bodyId === "mars") {
        const dust = fbm3(nx * 3.2, ny * 3.2, nz * 3.2, 613, 4);
        const basalt = fbm3(nx * 5.8, ny * 5.8, nz * 5.8, 631, 3);
        const ice = Math.abs(ny) > 0.91;
        if (ice) return [242, 232, 224];
        const tone = Math.min(1, dust * 0.72 + basalt * 0.28);
        return [clampByte(lerp(132, 226, tone)), clampByte(lerp(54, 128, tone)), clampByte(lerp(28, 76, tone))];
    }
    if (bodyId === "jupiter") {
        const eddy = fbm3(nx * 4.8, ny * 7.2, nz * 4.8, 709, 4);
        const lat = ny + (eddy - 0.5) * 0.14;
        const stripe = 0.5 + 0.5 * Math.sin(lat * 20 + eddy * 2.6);
        const spotDist = Math.hypot((nx - 0.72) * 1.4, (ny + 0.28) * 3.1, nz - 0.62);
        if (spotDist < 0.24) {
            const core = 1 - spotDist / 0.24;
            return [clampByte(lerp(205, 226, core)), clampByte(lerp(116, 78, core)), clampByte(lerp(72, 54, core))];
        }
        return [clampByte(lerp(156, 240, stripe)), clampByte(lerp(96, 224, stripe)), clampByte(lerp(58, 198, stripe))];
    }
    if (bodyId === "saturn") {
        const wisp = fbm3(nx * 3.4, ny * 6.5, nz * 3.4, 809, 3);
        const band = 0.5 + 0.5 * Math.sin((ny + (wisp - 0.5) * 0.06) * 18);
        return [clampByte(lerp(182, 238, band)), clampByte(lerp(154, 218, band)), clampByte(lerp(106, 174, band))];
    }
    if (bodyId === "uranus") {
        const haze = fbm3(nx * 3.1, ny * 5.2, nz * 3.1, 907, 3);
        const band = 0.5 + 0.5 * Math.cos(ny * 5.5 + haze * 0.9);
        return [clampByte(lerp(82, 168, band)), clampByte(lerp(194, 238, band)), clampByte(lerp(218, 248, band))];
    }
    const swirl = fbm3(nx * 3.8, ny * 6.4, nz * 3.8, 991, 4);
    const streak = swirl > 0.63 ? Math.min(1, (swirl - 0.63) * 3.5) : 0;
    const base = 0.5 + 0.5 * Math.sin(ny * 8 + swirl * 2.1);
    return [
        clampByte(lerp(lerp(24, 54, base), 192, streak)),
        clampByte(lerp(lerp(88, 152, base), 228, streak)),
        clampByte(lerp(lerp(196, 248, base), 255, streak))
    ];
}

export function generatePlanetTextureData(bodyId, width = 160, height = 80) {
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
            const lx = -0.52;
            const ly = -0.36;
            const lz = 0.77;
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
                    const ndotl = Math.max(0.18, dx * lx + dy * ly + dz * lz);
                    const fresnel = bodyDef.hasAtmosphere ? Math.pow(1 - dz, 2.5) * 0.4 : 0;
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

    if (bodyDef.hasRing) {
        drawSaturnRingArc(ctx, cx, cy, ringR * 1.44, ringR * 0.38, -0.42, 0, Math.PI);
    }
}

export function prewarmSolarTextures() {
    generatePlanetTextureData(SUN_DEF.id, 160, 80);
    for (const p of PLANET_CATALOG) {
        generatePlanetTextureData(p.id, 160, 80);
        if (p.hasRing) generateRingTextureData(p.id, 256);
    }
}
