import { TEX } from "./voxel-blocks.js";
import { mulberry32 } from "./voxel-noise.js";

const TILE = 16;
const LAYER_COUNT = 18;

function putPx(buf, layer, x, y, r, g, b, a = 255) {
    const i = ((layer * TILE + y) * TILE + x) * 4;
    buf[i] = Math.max(0, Math.min(255, Math.round(r)));
    buf[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    buf[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    buf[i + 3] = Math.max(0, Math.min(255, Math.round(a)));
}

function buildLayerPixels(buf, layer, seed, fn) {
    const rng = mulberry32(seed + layer * 4999);
    for (let y = 0; y < TILE; y += 1) {
        for (let x = 0; x < TILE; x += 1) {
            const c = fn(x, y, rng());
            putPx(buf, layer, x, y, c[0], c[1], c[2], c[3] ?? 255);
        }
    }
}

export function generateVoxelAtlasData() {
    const buf = new Uint8Array(TILE * TILE * 4 * LAYER_COUNT);

    buildLayerPixels(buf, TEX.GRASS_TOP, 101, (x, y, n) => {
        const checker = ((x + y) & 1) * 6;
        return [84 + n * 34 + checker, 152 + n * 38, 62 + n * 24, 255];
    });
    buildLayerPixels(buf, TEX.DIRT, 102, (x, y, n) => {
        const speck = ((x * 5 + y * 3) % 7 === 0) ? -14 : 0;
        return [122 + n * 30 + speck, 86 + n * 22 + speck, 56 + n * 16, 255];
    });
    buildLayerPixels(buf, TEX.GRASS_SIDE, 103, (x, y, n) => {
        const overhang = 11 + ((x * 7) % 3);
        if (y >= overhang) return [86 + n * 34, 156 + n * 38, 64 + n * 24, 255];
        return [120 + n * 30, 84 + n * 22, 54 + n * 16, 255];
    });
    buildLayerPixels(buf, TEX.STONE, 104, (x, y, n) => {
        const crack = (y === 4 && x > 3 && x < 11) || (y === 11 && x > 6) ? -22 : 0;
        const base = 118 + n * 34 + crack;
        return [base, base + 2, base + 6, 255];
    });
    buildLayerPixels(buf, TEX.SAND, 105, (x, y, n) => {
        const wave = Math.sin(x * 0.6 + y * 0.3) * 8;
        return [218 + n * 22 + wave, 198 + n * 20 + wave, 142 + n * 18, 255];
    });
    buildLayerPixels(buf, TEX.WATER, 106, (x, y, n) => {
        const glint = Math.sin((x + y) * 0.7) > 0.75 ? 26 : 0;
        return [42 + n * 18 + glint, 118 + n * 24 + glint, 206 + n * 24, 196];
    });
    buildLayerPixels(buf, TEX.WOOD_SIDE, 107, (x, y, n) => {
        const bark = (x % 3 === 0 ? -18 : 8) + Math.sin(y * 0.4) * 6;
        return [102 + bark + n * 18, 72 + bark * 0.7 + n * 14, 44 + bark * 0.5 + n * 10, 255];
    });
    buildLayerPixels(buf, TEX.WOOD_TOP, 108, (x, y, n) => {
        const d = Math.hypot(x - 7.5, y - 7.5);
        const ring = Math.sin(d * 2.1) > 0 ? 18 : -8;
        return [154 + ring + n * 16, 118 + ring + n * 12, 76 + ring * 0.6 + n * 10, 255];
    });
    buildLayerPixels(buf, TEX.LEAVES, 109, (x, y, n) => {
        const hole = ((x * 13 + y * 7) % 11 === 0) && n < 0.45;
        if (hole) return [32, 72, 26, 255];
        return [58 + n * 36, 128 + n * 44, 46 + n * 26, 255];
    });
    buildLayerPixels(buf, TEX.GLASS, 110, (x, y, n) => {
        const rim = x === 0 || y === 0 || x === 15 || y === 15;
        const streak = x + y === 19 || x + y === 11;
        if (rim) return [214, 238, 252, 225];
        if (streak) return [236, 250, 255, 160];
        return [160 + n * 18, 214 + n * 16, 242 + n * 12, 76];
    });
    buildLayerPixels(buf, TEX.LAVA, 111, (x, y, n) => {
        const vein = Math.sin(x * 0.55) + Math.cos(y * 0.65);
        if (vein > 0.7) return [255, 224 + n * 30, 88 + n * 42, 255];
        if (vein > -0.2) return [246, 116 + n * 40, 22 + n * 20, 255];
        return [184 + n * 32, 42 + n * 18, 12, 255];
    });
    buildLayerPixels(buf, TEX.TORCH, 112, (x, y, n) => {
        const glow = y >= 10 && x >= 4 && x <= 11;
        if (glow) return [255, 230 + n * 25, 120 + n * 40, 255];
        return [138 + n * 22, 92 + n * 18, 52 + n * 12, 255];
    });
    buildLayerPixels(buf, TEX.SNOW, 113, (x, y, n) => {
        const tint = (x + y) % 5 === 0 ? -10 : 0;
        return [234 + n * 18 + tint, 242 + n * 12 + tint, 250 + n * 5, 255];
    });
    buildLayerPixels(buf, TEX.SNOW_SIDE, 114, (x, y, n) => {
        const overhang = 10 + ((x * 5) % 3);
        if (y >= overhang) return [234 + n * 16, 242 + n * 12, 250 + n * 5, 255];
        return [120 + n * 28, 86 + n * 20, 56 + n * 16, 255];
    });
    buildLayerPixels(buf, TEX.COAL_ORE, 115, (x, y, n) => {
        const spot = (x >= 4 && x <= 6 && y >= 5 && y <= 7) || (x >= 10 && x <= 12 && y >= 10 && y <= 12);
        if (spot) return [28 + n * 16, 30 + n * 16, 34 + n * 16, 255];
        const s = 118 + n * 32;
        return [s, s + 2, s + 6, 255];
    });
    buildLayerPixels(buf, TEX.GOLD_ORE, 116, (x, y, n) => {
        const spot = (x >= 3 && x <= 5 && y >= 4 && y <= 6) || (x >= 9 && x <= 11 && y >= 9 && y <= 11);
        if (spot) return [246, 206 + n * 34, 54 + n * 24, 255];
        const s = 118 + n * 32;
        return [s, s + 2, s + 6, 255];
    });
    buildLayerPixels(buf, TEX.BEDROCK, 117, (x, y, n) => {
        const v = 32 + ((x * 3 + y * 5) & 3) * 14 + n * 26;
        return [v, v, v + 4, 255];
    });
    buildLayerPixels(buf, TEX.CACTUS, 118, (x, y, n) => {
        const rib = x % 4 === 0 ? -24 : 10;
        const spine = (x % 4 === 1 && y % 5 === 2) ? 60 : 0;
        return [68 + rib + n * 16 + spine, 136 + rib + n * 24 + spine * 0.7, 52 + rib * 0.6 + spine * 0.5, 255];
    });

    return { data: buf, tileSize: TILE, layerCount: LAYER_COUNT };
}

export function createVoxelTextureArray(gl, atlas) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        gl.RGBA8,
        atlas.tileSize,
        atlas.tileSize,
        atlas.layerCount,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        atlas.data
    );
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return tex;
}

export function drawHotbarBlockIcon(canvas, atlas, texLayer) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = atlas.tileSize;
    const img = ctx.createImageData(s, s);
    const layerOffset = texLayer * s * s * 4;
    for (let y = 0; y < s; y += 1) {
        const srcY = s - 1 - y;
        for (let x = 0; x < s; x += 1) {
            const src = layerOffset + (srcY * s + x) * 4;
            const dst = (y * s + x) * 4;
            img.data[dst] = atlas.data[src];
            img.data[dst + 1] = atlas.data[src + 1];
            img.data[dst + 2] = atlas.data[src + 2];
            img.data[dst + 3] = Math.max(175, atlas.data[src + 3]);
        }
    }
    const off = document.createElement("canvas");
    off.width = s;
    off.height = s;
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
}
